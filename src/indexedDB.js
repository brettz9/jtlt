import {JSONPath as jsonpath} from 'jsonpath-plus';
import fontoxpath from 'fontoxpath';

/**
 * @typedef {typeof import("idb").openDB} OpenDBFunction
 */

/**
 * Memoized loader for the `idb` package's `openDB`, installing the
 * `indexeddbshim` polyfill first when running outside a browser (e.g. Node).
 * Held on an object so the memo write is a property assignment rather than a
 * reassignment of a module-level binding.
 * @type {{promise: Promise<OpenDBFunction> | undefined}}
 */
const openDBLoader = {promise: undefined};

/**
 * @returns {Promise<OpenDBFunction>}
 */
function getOpenDB () {
  openDBLoader.promise ||= (async () => {
    /* c8 ignore next -- browser vs. Node branch; one runs per environment */
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      const {default: setGlobalVars} = await import('indexeddbshim');
      setGlobalVars(globalThis, {
        checkOrigin: false, memoryDatabase: ''
      });
    }
    const idb = await import('idb');
    return idb.openDB;
  })();
  return openDBLoader.promise;
}

/**
 * What each matched record contributes to the returned array. Mirrors
 * `jsonpath-plus`'s `resultType`.
 * - `'value'` (default): the stored record.
 * - `'primaryKey'`: the object store's primary key.
 * - `'key'`: the query key — the same as the primary key for a store query,
 *   or the indexed field's value when `index` is set.
 * - `'all'`: a `{key, primaryKey, value}` object.
 * @typedef {'value' | 'key' | 'primaryKey' | 'all'} IndexedDBResultType
 */

/**
 * @typedef {object} QueryOptions
 * @property {string} [index]
 * @property {{
 *   lower?: IDBValidKey, upper?: IDBValidKey,
 *   lowerOpen?: boolean, upperOpen?: boolean
 * }} [range]
 * @property {NonNullable<object|string|number>} [query]
 * @property {'next' | 'nextunique' | 'prev' | 'prevunique'} [direction]
 * @property {number} [count]
 * @property {IndexedDBResultType} [resultType]
 */

/**
 * One entry of a cursor walk (as wrapped by `idb`, so `continue()` is async).
 * @typedef {object} IdbCursorLike
 * @property {IDBValidKey} key
 * @property {IDBValidKey} primaryKey
 * @property {unknown} value
 * @property {() => Promise<IdbCursorLike | null>} continue
 */

/**
 * A `{key, primaryKey, value}` triple for a single matched entry, as returned
 * by `queryIndexedDB(..., {resultType: 'all'})`.
 * @typedef {{
 *   key: IDBValidKey, primaryKey: IDBValidKey, value: unknown
 * }} IdbRecord
 */

/**
 * The subset of an IndexedDB object store / index (as wrapped by `idb`, so
 * the request methods resolve Promises) that {@link queryIndexedDB} calls.
 * @typedef {object} IdbQueryTarget
 * @property {(
 *   range?: IDBKeyRange | null, direction?: IDBCursorDirection
 * ) => Promise<IdbCursorLike | null>} openCursor
 * @property {(
 *   range?: IDBKeyRange | null, direction?: IDBCursorDirection
 * ) => Promise<IdbCursorLike | null>} openKeyCursor
 * @property {(
 *   range?: IDBKeyRange | null, count?: number
 * ) => Promise<unknown[]>} getAll
 * @property {(
 *   range?: IDBKeyRange | null, count?: number
 * ) => Promise<IDBValidKey[]>} getAllKeys
 * @property {((options?: {
 *   query?: IDBKeyRange | null,
 *   count?: number,
 *   direction?: IDBCursorDirection
 * }) => Promise<IdbRecord[]>)} [getAllRecords]
 */

/**
 * Walk a cursor over `target`, collecting `project(cursor)` for each entry.
 * @param {IdbQueryTarget} target - An object store or index
 * @param {IDBKeyRange|null} range
 * @param {IDBCursorDirection|undefined} direction
 * @param {number|undefined} count
 * @param {(cursor: IdbCursorLike) => unknown} project
 * @param {boolean} keyOnly - Open a key-only cursor (skips reading records)
 * @returns {Promise<unknown[]>}
 */
async function collectViaCursor (
  target, range, direction, count, project, keyOnly
) {
  const results = [];
  let cursor = await (keyOnly
    ? target.openKeyCursor(range, direction)
    : target.openCursor(range, direction));
  // eslint-disable-next-line @stylistic/max-len -- Long
  // eslint-disable-next-line no-unmodified-loop-condition -- `results` grows and `cursor` advances each iteration
  while (cursor && (!count || results.length < count)) {
    results.push(project(cursor));
    // eslint-disable-next-line no-await-in-loop -- sequential cursor walk
    cursor = await cursor.continue();
  }
  return results;
}

/**
 * Read every matched entry as an {@link IdbRecord}, preferring the newer bulk
 * `getAllRecords()` API and falling back to a cursor walk.
 * @param {IdbQueryTarget} target - An object store or index
 * @param {IDBKeyRange|null} range
 * @param {IDBCursorDirection|undefined} direction
 * @param {number|undefined} count
 * @returns {Promise<IdbRecord[]>}
 */
async function readAllRecords (target, range, direction, count) {
  if (typeof target.getAllRecords === 'function') {
    const records = await target.getAllRecords({
      query: range ?? undefined, count, direction
    });
    return records.map((record) => ({
      key: record.key, primaryKey: record.primaryKey, value: record.value
    }));
  }
  /* c8 ignore start -- cursor fallback only where getAllRecords is absent */
  return /** @type {Promise<IdbRecord[]>} */ (
    collectViaCursor(target, range, direction, count, (cursor) => ({
      key: cursor.key, primaryKey: cursor.primaryKey, value: cursor.value
    }), false)
  );
  /* c8 ignore stop */
}

/**
 * Read entries from an IndexedDB object store (or one of its indexes). The
 * element type of the resolved array is narrowed by `options.resultType`.
 * @overload
 * @param {string} dbName
 * @param {string} storeName
 * @param {QueryOptions & {resultType: 'all'}} options
 * @returns {Promise<IdbRecord[]>}
 */
/**
 * @overload
 * @param {string} dbName
 * @param {string} storeName
 * @param {QueryOptions & {resultType: 'key' | 'primaryKey'}} options
 * @returns {Promise<IDBValidKey[]>}
 */
/**
 * @overload
 * @param {string} dbName
 * @param {string} storeName
 * @param {QueryOptions} [options]
 * @returns {Promise<unknown[]>}
 */
/**
 * @param {string} dbName
 * @param {string} storeName
 * @param {QueryOptions} [options]
 * @returns {Promise<unknown[]>}
 */
export async function queryIndexedDB (dbName, storeName, options = {}) {
  const {resultType = 'value', count, direction} = options;
  const openDB = await getOpenDB();
  const db = await openDB(dbName);
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);

  const target = /** @type {IdbQueryTarget} */ (/** @type {unknown} */ (
    options.index ? store.index(options.index) : store
  ));

  let range = null;
  if (options.range) {
    range = IDBKeyRange.bound(
      options.range.lower,
      options.range.upper,
      options.range.lowerOpen || false,
      options.range.upperOpen || false
    );
  } else if ('query' in options) {
    range = IDBKeyRange.only(options.query);
  }

  const reversed = Boolean(direction && direction.startsWith('prev'));

  if (resultType === 'all') {
    return readAllRecords(target, range, direction, count);
  }

  // The index key is only available per-entry via a cursor.
  if (resultType === 'key' && options.index) {
    return collectViaCursor(
      target, range, direction, count, (cursor) => cursor.key, true
    );
  }

  if (reversed) {
    // At this point `resultType` is 'value', 'primaryKey', or 'key' without
    // an index; for a store cursor the key and primary key are the same.
    return collectViaCursor(
      target, range, direction, count,
      resultType === 'value'
        ? (cursor) => cursor.value
        : (cursor) => cursor.primaryKey,
      resultType !== 'value'
    );
  }

  // Forward iteration has bulk APIs. For a store query the primary key and
  // the query key are the same, so `getAllKeys` serves both.
  if (resultType === 'value') {
    return target.getAll(range, count);
  }
  return target.getAllKeys(range, count);
}

/**
 * Split a raw argument string (the text between the parentheses of an
 * `indexedDB(...)` call) into its top-level, comma-separated pieces, ignoring
 * commas that appear inside quotes, objects (`{}`), arrays (`[]`) or nested
 * parentheses.
 * @param {string} argStr
 * @returns {string[]}
 */
function splitTopLevelArgs (argStr) {
  const pieces = [];
  let current = '';
  let depth = 0;
  /** @type {string|null} */
  let quote = null;
  for (let i = 0; i < argStr.length; i++) {
    const ch = argStr[i];
    if (quote) {
      current += ch;
      if (ch === quote && argStr[i - 1] !== '\\') {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (['{', '[', '('].includes(ch)) {
      depth++;
    } else if (['}', ']', ')'].includes(ch)) {
      depth--;
    }
    if (ch === ',' && depth === 0) {
      pieces.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim() !== '') {
    pieces.push(current);
  }
  return pieces;
}

/**
 * Coerce a single raw argument token from an `indexedDB(...)` expression into a
 * JavaScript value. Supports single/double-quoted strings, numbers, the
 * literals `true`/`false`/`null`, and JSON object/array literals.
 * @param {string} raw
 * @returns {unknown}
 */
function parseArgValue (raw) {
  const s = raw.trim();
  if (
    (s.startsWith("'") && s.endsWith("'")) ||
    (s.startsWith('"') && s.endsWith('"'))
  ) {
    return s.slice(1, -1);
  }
  if (s === 'true') {
    return true;
  }
  if (s === 'false') {
    return false;
  }
  if (s === 'null') {
    return null;
  }
  if (s !== '' && !Number.isNaN(Number(s))) {
    return Number(s);
  }
  if (s.startsWith('{') || s.startsWith('[')) {
    try {
      return JSON.parse(s);
    } catch {
      // Fall through to returning the raw string for callers to handle.
    }
  }
  return s;
}

/**
 * @typedef {object} ParsedIndexedDBExpression
 * @property {string} dbName
 * @property {string} storeName
 * @property {QueryOptions|undefined} options
 * @property {string} trailing - A JSONPath segment applied to the fetched
 *   records (e.g. `.*.name` or `[0].name`), with surrounding whitespace
 *   trimmed. Used by the JSONPath engine only; the XPath engine exposes
 *   `indexedDB()` as a registered XPath function instead (see
 *   {@link evaluateXPathWithIndexedDB}).
 */

/**
 * Detect and parse an `indexedDB(...)` call at the start of a selector string.
 * @param {string} expr
 * @returns {ParsedIndexedDBExpression|null} `null` when `expr` is not an
 *   `indexedDB(...)` expression.
 */
export function parseIndexedDBExpression (expr) {
  const match = (/^\s*indexedDB\((?<args>.*)\)(?<trailing>.*)$/v).exec(expr);
  if (!match || !match.groups) {
    return null;
  }
  const args = splitTopLevelArgs(match.groups.args).map(
    (piece) => parseArgValue(piece)
  );
  const [dbName, storeName, options] = args;
  return {
    dbName: /** @type {string} */ (dbName),
    storeName: /** @type {string} */ (storeName),
    options: /** @type {QueryOptions|undefined} */ (
      options && typeof options === 'object' ? options : undefined
    ),
    trailing: match.groups.trailing.trim()
  };
}

/**
 * Fetch the records for a parsed `indexedDB(...)` expression and, when a
 * trailing JSONPath segment is present (e.g. `.*.name`), evaluate it against
 * the fetched records. Shared by the JSONPath and XPath engines.
 * @param {ParsedIndexedDBExpression} parsed
 * @param {{preventEval?: boolean}} [options]
 * @returns {Promise<unknown>}
 */
export async function resolveIndexedDBQuery (parsed, {preventEval} = {}) {
  const {dbName, storeName, options, trailing} = parsed;
  const data = await queryIndexedDB(dbName, storeName, options);
  if (!trailing) {
    return data;
  }
  // A JSONPath trailing segment always begins with a step (`.` or `[`).
  return /** @type {(config: object) => unknown} */ (jsonpath)({
    path: '$' + trailing,
    json: data,
    preventEval,
    wrap: false,
    returnType: 'value'
  });
}

/**
 * Namespace URI backing the predefined `jtlt` prefix under which the XPath
 * `indexedDB()` function is registered.
 */
export const JTLT_XPATH_NAMESPACE = 'urn:jtlt';

/**
 * State for the process-global `indexedDB()` XPath function: the current
 * collect/resolve mode, the pending request list, and the fetched-record
 * cache. Kept on one module-level object so updates are property writes, not
 * rebindings of a module binding.
 */
const xpathIndexedDB = {
  registered: false,
  /** @type {'collect'|'resolve'} */
  mode: 'resolve',
  /** @type {{dbName: string, storeName: string, options: unknown}[]} */
  requests: [],
  /** @type {Map<string, unknown[]>} */
  cache: new Map()
};

/**
 * @param {string} dbName
 * @param {string} storeName
 * @param {unknown} options
 * @returns {string}
 */
function xpathCacheKey (dbName, storeName, options) {
  return JSON.stringify([dbName, storeName, options ?? null]);
}

/**
 * Implementation shared by both arities of the `jtlt:indexedDB` XPath
 * function. In `collect` mode it records the requested query and returns an
 * empty sequence; in `resolve` mode it returns the pre-fetched records.
 * @param {unknown} _domFacade - fontoxpath dynamic context (unused)
 * @param {string} dbName
 * @param {string} storeName
 * @param {unknown} [options] - An XPath map, surfaced to JS as a plain object
 * @returns {unknown[]}
 */
function xpathIndexedDBFunction (_domFacade, dbName, storeName, options) {
  const opts = options ?? undefined;
  if (xpathIndexedDB.mode === 'collect') {
    xpathIndexedDB.requests.push({dbName, storeName, options: opts});
    return [];
  }
  return xpathIndexedDB.cache.get(
    xpathCacheKey(dbName, storeName, opts)
  /* c8 ignore next -- resolve mode always finds the record cached in phase 2 */
  ) ?? [];
}

/**
 * Register `jtlt:indexedDB(dbName, storeName)` and
 * `jtlt:indexedDB(dbName, storeName, options)` with fontoxpath. Idempotent.
 * @returns {void}
 */
function ensureXPathIndexedDBFunction () {
  if (xpathIndexedDB.registered) {
    return;
  }
  xpathIndexedDB.registered = true;
  fontoxpath.registerCustomXPathFunction(
    {namespaceURI: JTLT_XPATH_NAMESPACE, localName: 'indexedDB'},
    ['xs:string', 'xs:string'], 'item()*',
    xpathIndexedDBFunction
  );
  fontoxpath.registerCustomXPathFunction(
    {namespaceURI: JTLT_XPATH_NAMESPACE, localName: 'indexedDB'},
    ['xs:string', 'xs:string', 'map(*)'], 'item()*',
    xpathIndexedDBFunction
  );
}

/**
 * @param {string} prefix
 * @returns {string|null}
 */
const xpathNamespaceResolver = (prefix) => {
  /* c8 ignore next -- fontoxpath only resolves the explicit `jtlt` prefix */
  return prefix === 'jtlt' ? JTLT_XPATH_NAMESPACE : null;
};

/**
 * @param {unknown} expr
 * @returns {boolean} Whether `expr` calls the `indexedDB()` XPath function
 */
export function xpathExpressionUsesIndexedDB (expr) {
  return typeof expr === 'string' && (/\bindexedDB\s*\(/v).test(expr);
}

/**
 * Evaluate an XPath 3.1 expression that may call `jtlt:indexedDB(...)`,
 * to a string. Because fontoxpath is synchronous, this first evaluates the
 * expression in "collect" mode to discover every `indexedDB()` call, awaits
 * those queries, then evaluates again with the records available.
 * @param {string} selectStr
 * @param {Node} contextNode
 * @returns {Promise<string>}
 */
export async function evaluateXPathWithIndexedDB (selectStr, contextNode) {
  ensureXPathIndexedDBFunction();
  const evalOptions = {
    namespaceResolver: xpathNamespaceResolver,
    language: fontoxpath.Language.XPATH_3_1_LANGUAGE
  };

  // Phase 1: discover the queries (the string result is discarded). During
  // this pass `jtlt:indexedDB()` yields an empty sequence, so an otherwise
  // valid expression can still raise a type error here; that is harmless
  // because only the collected request list matters.
  xpathIndexedDB.mode = 'collect';
  xpathIndexedDB.requests = [];
  /* c8 ignore start -- defensive: swallow phase-1 evaluation errors */
  try {
    fontoxpath.evaluateXPathToString(
      selectStr, contextNode, null, null, evalOptions
    );
  } catch {
    // Ignore: only the collected request list matters from this pass.
  }
  /* c8 ignore stop */

  // Phase 2: fetch each distinct query and cache the records.
  const fetched = new Set();
  await Promise.all(xpathIndexedDB.requests.map(async (req) => {
    const key = xpathCacheKey(req.dbName, req.storeName, req.options);
    if (fetched.has(key)) {
      return;
    }
    fetched.add(key);
    xpathIndexedDB.cache.set(
      key,
      await queryIndexedDB(
        req.dbName,
        req.storeName,
        /** @type {QueryOptions|undefined} */ (req.options)
      )
    );
  }));

  // Phase 3: evaluate for real, now that the records are available.
  xpathIndexedDB.mode = 'resolve';
  return fontoxpath.evaluateXPathToString(
    selectStr, contextNode, null, null, evalOptions
  );
}
