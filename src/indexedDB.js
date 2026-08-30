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
 * @typedef {object} QueryOptions
 * @property {string} [index]
 * @property {{
 *   lower?: any, upper?: any,
 *   lowerOpen?: boolean, upperOpen?: boolean
 * }} [range]
 * @property {NonNullable<object|string|number>} [query]
 * @property {'next' | 'nextunique' | 'prev' | 'prevunique'} [direction]
 * @property {number} [count]
 */

/**
 * @param {string} dbName
 * @param {string} storeName
 * @param {QueryOptions} [options]
 * @returns {Promise<NonNullable<object>[]>}
 */
export async function queryIndexedDB (dbName, storeName, options = {}) {
  const openDB = await getOpenDB();
  const db = await openDB(dbName);
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);

  const target = options.index
    ? store.index(options.index)
    : store;

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

  if (options.direction && options.direction.startsWith('prev')) {
    const results = [];
    let cursor = await target.openCursor(range, options.direction);
    while (cursor && (!options.count || results.length < options.count)) {
      results.push(cursor.value);
      // eslint-disable-next-line no-await-in-loop -- sequential cursor walk
      cursor = await cursor.continue();
    }
    return results;
  }

  return target.getAll(range, options.count);
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
 * @returns {any}
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
 * @property {string} trailing - Any path expression following the closing
 *   parenthesis (e.g. `.*.name` for JSONPath or `/name` for XPath), with
 *   surrounding whitespace trimmed.
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
