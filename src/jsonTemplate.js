import {isValidJamilih} from 'jamilih';

/**
 * Compiles and runs the declarative (jamilih-shaped) node format used by
 * idb-manager route overrides — see `~/idb-manager/ROUTE-OVERRIDES-PLAN.md`
 * §3 and `~/idb-manager/JTLT-JSON-TEMPLATES-PROPOSAL.md`.
 *
 * A node is one of:
 * - a string — a text node;
 * - `[name, attrs?, children?]` — a jamilih-shaped element node (`attrs` is
 *   omitted when there are no attributes, in which case the second item is
 *   the children array directly);
 * - `[{$op: ...}, ...]` — an operation node (an object as the first item).
 *
 * Every operation-node key is `$`-prefixed (jamilih's own validator requires
 * this of any first-position plain object). See the vocabulary table in
 * ROUTE-OVERRIDES-PLAN.md §3.2 for the full mapping to jtlt context calls,
 * including the `$text`/`$jtltText` and `$mode`/`$jtltMode` namespacing
 * rules and `$indexedDB`'s optional `$as`.
 *
 * `$indexedDB`/`$renderDefault` (the only async operations) may appear
 * anywhere a node is allowed — nested inside an element's children, or a
 * `$if`/`$forEach` body, included — because every node here is run through
 * an `async` callback, and `element()`/`if()`/`choose()`/`forEach()` (in
 * every joining transformer and `JSONPathTransformerContext`) duck-type
 * their callback's return value: a synchronous callback keeps them
 * synchronous, but one returning a `Promise` (an async function that
 * awaited something) makes the call itself return a `Promise` that settles
 * once the callback's work is done, keeping output correctly ordered
 * either way.
 */

/**
 * @param {unknown} x
 * @returns {x is Record<string, unknown>}
 */
function isPlainObject (x) {
  return Boolean(x) && typeof x === 'object' && !Array.isArray(x);
}

/**
 * @typedef {'text'|'element'|'operation'} NodeKind
 */

/**
 * @param {unknown} node
 * @returns {NodeKind|null} `null` for a structurally unrecognizable node.
 */
function classify (node) {
  if (typeof node === 'string') {
    return 'text';
  }
  if (!Array.isArray(node) || node.length === 0) {
    return null;
  }
  const head = node[0];
  if (typeof head === 'string') {
    return 'element';
  }
  if (isPlainObject(head)) {
    return 'operation';
  }
  return null;
}

/**
 * Split an element node's trailing items into `{atts, children}`. The
 * second item is an attributes object, or (when there are no attributes)
 * the children array directly; the optional third item is the children
 * array when the second was attributes.
 * @param {unknown[]} rest - Everything after the element name
 * @returns {{atts: Record<string, unknown>, children: unknown[]}}
 */
function splitElementRest (rest) {
  const [second, third] = rest;
  if (Array.isArray(second)) {
    return {atts: {}, children: second};
  }
  if (isPlainObject(second)) {
    return {atts: second, children: Array.isArray(third) ? third : []};
  }
  return {atts: {}, children: []};
}

/**
 * Operation keys recognized on an operation node's leading object. `$mode`
 * is never valid bare (jamilih hard-reserves it); `$text` is valid bare
 * (jamilih's own text-node form) but not combined with `$select` (jamilih
 * rejects the unrecognized companion) — that combination needs `$jtltText`.
 * @type {ReadonlySet<string>}
 */
const RECOGNIZED_OP_KEYS = new Set([
  '$text', '$jtltText', '$string', '$valueOf', '$applyTemplates', '$if',
  '$forEach', '$variable', '$indexedDB', '$renderDefault'
]);

/**
 * Validate one operation node's leading object against the vocabulary
 * rules that don't require a live jtlt context (safe to run non-executing).
 * @param {Record<string, unknown>} head
 * @returns {string|null} An error message, or `null` if valid.
 */
function validateOperationHead (head) {
  const keys = Object.keys(head);
  if (Object.hasOwn(head, '$mode')) {
    return '`$mode` is reserved by jamilih and is never valid here; use ' +
      '`$jtltMode` instead.';
  }
  const opKeys = keys.filter((k) => RECOGNIZED_OP_KEYS.has(k));
  if (opKeys.length === 0) {
    const badKey = keys.find((k) => !k.startsWith('$')) ?? keys[0];
    return `Unrecognized operation-node key \`${badKey}\`.`;
  }
  if (Object.hasOwn(head, '$text') && keys.length > 1) {
    return '`$text` combined with any other key (e.g. `$select`) is not ' +
      'valid jamilih (jamilih rejects the unrecognized companion alongside ' +
      'its own reserved `$text`); use `$jtltText` for the combined form.';
  }
  return null;
}

/**
 * Recursively validate a node (and its descendants), collecting every
 * problem found rather than stopping at the first.
 * @param {unknown} node
 * @param {'json'|'javascript'} format
 * @param {string[]} errors - Populated in place
 * @returns {void}
 */
function validateNode (node, format, errors) {
  const kind = classify(node);
  if (kind === 'text') {
    return;
  }
  if (kind === null) {
    errors.push(`Not a valid declarative node: ${JSON.stringify(node)}`);
    return;
  }
  const arr = /** @type {unknown[]} */ (node);
  if (kind === 'element') {
    // Only the element's own name+attributes are checked against jamilih:
    // jamilih validates a structure's *whole* nested tree at once, and its
    // tolerance for unrecognized `$`-prefixed keys (branch 4 of its own
    // `struct[0]`-is-a-plain-object rule) applies only to a structure
    // passed to it as a complete top-level call — not to something nested
    // inside real children — so an operation node (which uses jtlt-only
    // keys jamilih doesn't recognize) would wrongly fail jamilih's own
    // validation if it were included here. Children are validated by our
    // own node-kind dispatch below instead, recursively, each as its own
    // notional top level.
    const [name, ...rest] = /** @type {[string, ...unknown[]]} */ (arr);
    const {atts, children} = splitElementRest(rest);
    if (!isValidJamilih([name, atts], {format})) {
      errors.push(
        `Not valid jamilih (format: "${format}"): ` +
        JSON.stringify([name, atts])
      );
      return;
    }
    for (const child of children) {
      validateNode(child, format, errors);
    }
    return;
  }
  // kind === 'operation'
  const head = /** @type {Record<string, unknown>} */ (arr[0]);
  const headError = validateOperationHead(head);
  if (headError) {
    errors.push(headError);
    return;
  }
  if (Object.hasOwn(head, '$if')) {
    const [, thenNodes, elseNodes] = arr;
    if (!Array.isArray(thenNodes)) {
      errors.push(
        '`$if` requires a then-branch node array as its second item.'
      );
      return;
    }
    for (const child of thenNodes) {
      validateNode(child, format, errors);
    }
    if (elseNodes !== undefined) {
      if (!Array.isArray(elseNodes)) {
        errors.push(
          "`$if`'s else-branch, when given, must be a node array."
        );
        return;
      }
      for (const child of elseNodes) {
        validateNode(child, format, errors);
      }
    }
    return;
  }
  if (Object.hasOwn(head, '$forEach')) {
    const [, childNodes] = arr;
    if (!Array.isArray(childNodes)) {
      errors.push(
        '`$forEach` requires a children node array as its second item.'
      );
      return;
    }
    for (const child of childNodes) {
      validateNode(child, format, errors);
    }
    return;
  }
  if (Object.hasOwn(head, '$indexedDB')) {
    // Unlike `$if`/`$forEach`, `$indexedDB`'s children are optional — a
    // bare prefetch (binding via `$as` for later use, or discarding the
    // rows entirely) with no immediate consumer is a legitimate leaf use.
    const [, childNodes] = arr;
    if (childNodes !== undefined && !Array.isArray(childNodes)) {
      errors.push(
        "`$indexedDB`'s children, when given, must be a node array."
      );
      return;
    }
    const idbChildren = childNodes || [];
    for (const child of idbChildren) {
      validateNode(child, format, errors);
    }
  }
}

/**
 * @typedef {{db: string, store: string}} ReadTarget
 */

/**
 * Recursively collect the `{db, store}` targets under one node's
 * `$indexedDB` operations (if any), walking every position a node can
 * appear — element children, `$if` then/else, `$forEach` children, and
 * another `$indexedDB` node's own children — not just the top level. Uses
 * `classify()` defensively, so a structurally-invalid node (already
 * reported by `validateNode`) simply contributes nothing here rather than
 * throwing a second time.
 * @param {unknown} node
 * @param {ReadTarget[]} targets - Populated in place
 * @param {string[]} errors - Populated in place
 * @returns {void}
 */
function collectReads (node, targets, errors) {
  const kind = classify(node);
  if (kind !== 'element' && kind !== 'operation') {
    return;
  }
  const arr = /** @type {unknown[]} */ (node);
  if (kind === 'element') {
    const [, ...rest] = /** @type {[string, ...unknown[]]} */ (arr);
    const {children} = splitElementRest(rest);
    for (const child of children) {
      collectReads(child, targets, errors);
    }
    return;
  }
  // kind === 'operation'
  const head = /** @type {Record<string, unknown>} */ (arr[0]);
  if (Object.hasOwn(head, '$if')) {
    const [, thenNodes, elseNodes] = arr;
    const thenChildren = /** @type {unknown[]} */ (thenNodes ?? []);
    for (const child of thenChildren) {
      collectReads(child, targets, errors);
    }
    const elseChildren = /** @type {unknown[]} */ (elseNodes ?? []);
    for (const child of elseChildren) {
      collectReads(child, targets, errors);
    }
    return;
  }
  if (Object.hasOwn(head, '$forEach')) {
    const [, childNodes] = arr;
    const forEachChildren = /** @type {unknown[]} */ (childNodes ?? []);
    for (const child of forEachChildren) {
      collectReads(child, targets, errors);
    }
    return;
  }
  if (Object.hasOwn(head, '$indexedDB')) {
    const spec = /** @type {any} */ (head.$indexedDB);
    if (
      !isPlainObject(spec) ||
      typeof spec.db !== 'string' || spec.db.length === 0 ||
      typeof spec.store !== 'string' || spec.store.length === 0
    ) {
      errors.push(
        '`$indexedDB` target could not be resolved statically — `db` and ' +
        '`store` must both be non-empty string literals: ' +
        JSON.stringify(head)
      );
    } else {
      targets.push({db: spec.db, store: spec.store});
    }
    const [, childNodes] = arr;
    const idbChildren = /** @type {unknown[]} */ (childNodes ?? []);
    for (const child of idbChildren) {
      collectReads(child, targets, errors);
    }
  }
}

/**
 * Statically derive the `{db, store}` targets a declarative template's
 * `$indexedDB` nodes touch (ROUTE-OVERRIDES-PLAN.md §3.4, §13 decision 4)
 * — for a route override's data-access checks and its `reads` field. Total:
 * an `$indexedDB` node whose `db`/`store` isn't a literal string is
 * reported as an error rather than silently omitted from `reads` — the
 * whole point is to drive a data-access allowlist, so an unresolvable
 * target must never be mistaken for "no read happens here". Duplicate
 * targets are deduplicated.
 * @param {unknown[]} nodes
 * @returns {{reads: ReadTarget[], errors: string[]}}
 */
export function extractReads (nodes) {
  if (!Array.isArray(nodes)) {
    return {
      reads: [],
      errors: ['A declarative template must be an array of nodes.']
    };
  }
  /** @type {ReadTarget[]} */
  const targets = [];
  /** @type {string[]} */
  const errors = [];
  for (const node of nodes) {
    collectReads(node, targets, errors);
  }
  const seen = new Set();
  const reads = targets.filter(({db, store}) => {
    const key = `${db} ${store}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
  return {reads, errors};
}

/**
 * Non-executing structural check for a declarative template. Unlike
 * `compileJSONTemplate`, this never throws — it reports every problem it
 * finds, for a "validate before save" editor workflow. Includes the
 * `extractReads()` check (an unresolvable `$indexedDB` target is a
 * validation error, not just a `reads` omission).
 * @param {unknown[]} nodes
 * @param {{format?: 'json'|'javascript'}} [options]
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateJSONTemplate (nodes, {format = 'json'} = {}) {
  if (!Array.isArray(nodes)) {
    return {
      valid: false,
      errors: ['A declarative template must be an array of nodes.']
    };
  }
  /** @type {string[]} */
  const errors = [];
  for (const node of nodes) {
    validateNode(node, format, errors);
  }
  errors.push(...extractReads(nodes).errors);
  return {valid: errors.length === 0, errors};
}

/**
 * @param {unknown} x
 * @returns {x is unknown[]}
 */
export function isJSONTemplateNodeArray (x) {
  return Array.isArray(x);
}

/**
 * Run one node against a live jtlt context.
 * @param {unknown} node
 * @param {any} ctx - The bound `this` inside the compiled template
 * @returns {Promise<void>}
 */
async function runNode (node, ctx) {
  const kind = classify(node);
  if (kind === 'text') {
    ctx.text(node);
    return;
  }
  const arr = /** @type {unknown[]} */ (node);
  if (kind === 'element') {
    const [name, ...rest] = /** @type {[string, ...unknown[]]} */ (arr);
    const {atts, children} = splitElementRest(rest);
    await ctx.element(name, atts, [], async () => {
      await runNodes(children, ctx);
    });
    return;
  }
  const head = /** @type {Record<string, unknown>} */ (arr[0]);
  await runOperation(head, arr.slice(1), ctx);
}

/**
 * @param {unknown[]} nodes
 * @param {any} ctx
 * @returns {Promise<void>}
 */
async function runNodes (nodes, ctx) {
  for (const node of nodes) {
    // eslint-disable-next-line no-await-in-loop -- Sequential output order
    await runNode(node, ctx);
  }
}

/**
 * @param {Record<string, unknown>} head
 * @param {unknown[]} rest
 * @param {any} ctx
 * @returns {Promise<void>}
 */
async function runOperation (head, rest, ctx) {
  if (Object.hasOwn(head, '$text')) {
    ctx.text(head.$text);
    return;
  }
  if (Object.hasOwn(head, '$jtltText')) {
    if (Object.hasOwn(head, '$select')) {
      ctx.valueOf(/** @type {string} */ (head.$select));
    } else {
      ctx.text(head.$jtltText);
    }
    return;
  }
  if (Object.hasOwn(head, '$string')) {
    if (Object.hasOwn(head, '$select')) {
      ctx.string(String(ctx.get(head.$select, false)));
    } else {
      ctx.string(head.$string);
    }
    return;
  }
  if (Object.hasOwn(head, '$valueOf')) {
    ctx.valueOf(head.$valueOf);
    return;
  }
  if (Object.hasOwn(head, '$applyTemplates')) {
    await ctx.applyTemplates(head.$applyTemplates, head.$jtltMode, head.$sort);
    return;
  }
  if (Object.hasOwn(head, '$variable')) {
    ctx.variable(head.$variable, {select: head.$select});
    return;
  }
  if (Object.hasOwn(head, '$if')) {
    const [thenNodes, elseNodes] = rest;
    if (elseNodes) {
      await ctx.choose(
        head.$if,
        async () => {
          await runNodes(/** @type {unknown[]} */ (thenNodes), ctx);
        },
        async () => {
          await runNodes(/** @type {unknown[]} */ (elseNodes), ctx);
        }
      );
    } else {
      await ctx.if(head.$if, async () => {
        await runNodes(/** @type {unknown[]} */ (thenNodes), ctx);
      });
    }
    return;
  }
  if (Object.hasOwn(head, '$forEach')) {
    const [childNodes] = rest;
    await ctx.forEach(
      head.$forEach,
      async () => {
        await runNodes(/** @type {unknown[]} */ (childNodes), ctx);
      },
      head.$sort
    );
    return;
  }
  if (Object.hasOwn(head, '$renderDefault')) {
    await ctx.renderDefault();
    return;
  }
  // Only $indexedDB is left (validateOperationHead already rejects
  // anything else, and every other recognized key returned above).
  const idb = /** @type {{db: string, store: string, options?: unknown}} */
    (head.$indexedDB);
  const rows = await ctx.indexedDB(idb.db, idb.store, idb.options);
  // Validation already confirmed this is an array, when given at all.
  const childNodes = /** @type {unknown[]} */ (rest[0] ?? []);
  if (Object.hasOwn(head, '$as')) {
    ctx.variable(head.$as, {value: rows});
    await runNodes(childNodes, ctx);
  } else {
    const prevContext = ctx._contextObj;
    ctx._contextObj = rows;
    try {
      await runNodes(childNodes, ctx);
    } finally {
      ctx._contextObj = prevContext;
    }
  }
}

/**
 * Compile a declarative (jamilih-shaped) node array into a jtlt
 * `TemplateFunction`. Validates the whole tree up front (see
 * `validateJSONTemplate`) and throws on the first problem, rather than
 * failing partway through execution.
 * @param {unknown[]} nodes
 * @param {{format?: 'json'|'javascript'}} [options]
 * @returns {(
 *   this: any, value: unknown, cfg?: {mode?: string}
 * ) => Promise<void>}
 */
export function compileJSONTemplate (nodes, {format = 'json'} = {}) {
  const {valid, errors} = validateJSONTemplate(nodes, {format});
  if (!valid) {
    throw new TypeError(
      `Invalid declarative template:\n${errors.join('\n')}`
    );
  }
  return async function () {
    await runNodes(nodes, this);
  };
}
