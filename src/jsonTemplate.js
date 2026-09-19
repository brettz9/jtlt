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
 * `$indexedDB`/`$renderDefault`/an extension call (the only operations that
 * may be async — an extension call awaits whatever the named extension
 * itself is) may appear anywhere a node is allowed — nested inside an
 * element's children, or a `$if`/`$forEach` body, included — because every
 * node here is run through an `async` callback, and
 * `element()`/`if()`/`choose()`/`forEach()` (in every joining transformer
 * and `JSONPathTransformerContext`) duck-type their callback's return
 * value: a synchronous callback keeps them synchronous, but one returning a
 * `Promise` (an async function that awaited something) makes the call
 * itself return a `Promise` that settles once the callback's work is done,
 * keeping output correctly ordered either way.
 *
 * An extension call (`{$name: {...}}`, e.g. `{$greet: {select:
 * '$.user.name'}}`, or `{$generateJsoeEditUI: {select: '$.record', db:
 * 'x', store: 'y'}}` — the argument is an object, matching `$indexedDB`'s
 * own convention, rather than a bare value) calls a `this`-bound method of
 * that same name supplied via `config.extensions` (`this.name(argObject)`)
 * — restricted to names actually present in `config.extensions` (tracked
 * by `applyExtensions` in
 * `extendContext.js`), never an arbitrary/built-in context method, since a
 * declarative `behavior` using this format is typically untrusted,
 * admin-authored input (idb-manager's route overrides): any key not in
 * `RECOGNIZED_OP_KEYS` is treated as a candidate extension name rather than
 * a validation error, so whether it's actually callable can only be
 * confirmed once a live context (and its `config.extensions`) exists — see
 * `runOperation`, below. The interpreter does not interpret the argument
 * object's contents at all — no key (including `select`) is special-cased
 * — it's simply handed to the extension as-is, `this`-bound to the live
 * context, so the extension resolves whatever it needs itself (e.g.
 * `this.get(argObject.select, false)`) however suits it. Like
 * `$renderDefault`, inserting the extension's return value into the output
 * (if it has one worth inserting) is the extension's own job — e.g. via
 * `this.appendOutput(node)` — not something this interpreter does for it.
 * Because any not-otherwise-recognized
 * `$`-prefixed key becomes a live extension name, a future jtlt release
 * adding a new built-in operation could collide with an extension name a
 * consumer already uses — accepted as a known, documented risk in exchange
 * for the terser syntax (rather than the more defensive, explicitly
 * namespaced `{$extension: 'name', $select?: sel}` wrapper this replaced) —
 * consumers documenting their extension names (e.g. a project wiki page)
 * are encouraged to also list jtlt's own reserved op keys as names to
 * avoid.
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
 * Resolve every `${sel}` placeholder embedded in a string attribute value
 * against the live context, e.g. `'/words?key=${$.key}'` or (combined with
 * jamilih's own `innerHTML` magic attribute) `{innerHTML: '${$.definition}'}`
 * — no separate raw-HTML operation is needed since `innerHTML` is just
 * another string-valued attribute as far as this is concerned. `sel` is
 * resolved via `ctx.get(sel.trim(), false)`; a `null`/`undefined` result
 * becomes `''` rather than the literal string "null"/"undefined", matching
 * typical templating conventions (most useful for a still-missing value in
 * an `href`). A value with no `${` at all is returned unchanged, so the
 * common (fully static) case allocates nothing extra.
 * @param {string} value
 * @param {any} ctx
 * @returns {string}
 */
function interpolateString (value, ctx) {
  if (!value.includes('${')) {
    return value;
  }
  return value.replaceAll(/\$\{(?<sel>[^\}]+)\}/gv, (_match, sel) => {
    const resolved = ctx.get(sel.trim(), false);
    return resolved === null || resolved === undefined
      ? ''
      : String(resolved);
  });
}

/**
 * @typedef {{allow: string[]} | {deny: string[]}} InterpolateAttributesConfig
 */

/**
 * Validate an `interpolateAttributes` option's own shape, without building
 * anything from it — used by `validateJSONTemplate` to surface a bad
 * config's errors up front, before ever compiling (matching its own "report
 * every problem, don't throw" contract). Omitted entirely, there is nothing
 * to validate (every string-valued attribute is eligible, the default);
 * otherwise exactly one of `allow`/`deny` must be present — giving both, or
 * neither, is an error rather than silently picked between — each a
 * non-empty array of non-empty attribute-name strings.
 * @param {InterpolateAttributesConfig} [config]
 * @returns {string[]}
 */
function validateInterpolateAttributesConfig (config) {
  if (config === undefined) {
    return [];
  }
  if (!isPlainObject(config)) {
    return [
      '`interpolateAttributes`, when given, must be an object with ' +
      'exactly one of `allow` or `deny` (an array of attribute names).'
    ];
  }
  const hasAllow = Object.hasOwn(config, 'allow');
  const hasDeny = Object.hasOwn(config, 'deny');
  if (hasAllow === hasDeny) {
    return [
      '`interpolateAttributes`, when given, must have exactly one of ' +
      '`allow` or `deny` (an array of attribute names).'
    ];
  }
  const list = /** @type {Record<string, unknown>} */ (config)[
    hasAllow ? 'allow' : 'deny'
  ];
  if (
    !Array.isArray(list) ||
    list.some((n) => typeof n !== 'string' || n.length === 0)
  ) {
    return [
      `\`interpolateAttributes.${hasAllow ? 'allow' : 'deny'}\` must be ` +
      'an array of non-empty attribute-name strings.'
    ];
  }
  return [];
}

/**
 * Compile an `interpolateAttributes` option into a plain attribute-name-
 * matching predicate. Only ever called (by `compileJSONTemplate`) once
 * `validateInterpolateAttributesConfig` has already confirmed the config is
 * well-formed, so this never needs to handle a malformed one itself.
 * Omitted entirely, every string-valued attribute is eligible (the
 * default, backward-compatible behavior); `{allow: [...]}` restricts
 * eligibility to exactly those attribute names, uniformly across every
 * element in the template (this is a template-wide policy, not scoped per
 * element name — a `href`-vs-`src` distinction, say, isn't possible);
 * `{deny: [...]}` makes every attribute eligible *except* those named.
 * @param {InterpolateAttributesConfig} [config]
 * @returns {(name: string) => boolean}
 */
function compileInterpolateAttributesMatcher (config) {
  if (config === undefined) {
    return () => true;
  }
  const configObj = /** @type {Record<string, unknown>} */ (config);
  if (Object.hasOwn(configObj, 'allow')) {
    const set = new Set(/** @type {string[]} */ (configObj.allow));
    return (name) => set.has(name);
  }
  const set = new Set(/** @type {string[]} */ (configObj.deny));
  return (name) => !set.has(name);
}

/**
 * Apply `interpolateString` to every string-valued attribute of an
 * element's attributes object (including jamilih magic attributes like
 * `innerHTML`) that `ctx._interpolateAttributesMatcher` allows — always set
 * by `compileJSONTemplate` (from its `interpolateAttributes` option) before
 * `runNodes` ever runs, since this function is only ever reached through
 * the function `compileJSONTemplate` returns. Non-string attribute values
 * (e.g. a nested `style` object, or an array-valued attribute) are always
 * passed through unchanged — interpolation only ever applies to literal
 * string content; a data-driven nested attribute value is not yet
 * supported.
 * @param {Record<string, unknown>} atts
 * @param {any} ctx
 * @returns {Record<string, unknown>}
 */
function resolveElementAttributes (atts, ctx) {
  const matches = /** @type {(name: string) => boolean} */ (
    ctx._interpolateAttributesMatcher
  );
  /** @type {Record<string, unknown>} */
  const result = {};
  for (const [key, value] of Object.entries(atts)) {
    result[key] = typeof value === 'string' && matches(key)
      ? interpolateString(value, ctx)
      : value;
  }
  return result;
}

/**
 * Operation keys recognized on an operation node's leading object. `$mode`
 * is never valid bare (jamilih hard-reserves it); `$text` is valid bare
 * (jamilih's own text-node form) but not combined with `$select` (jamilih
 * rejects the unrecognized companion) — that combination needs `$jtltText`.
 * Any `$`-prefixed key *not* in this set is a candidate extension call
 * (see `runOperation`), not a validation error — see the module doc
 * comment above for the namespace-collision tradeoff this implies.
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
    const badKey = keys.find((k) => !k.startsWith('$'));
    if (badKey) {
      return `Unrecognized operation-node key \`${badKey}\`.`;
    }
    // Every key is `$`-prefixed but none is a built-in op: a single such
    // key is a candidate extension call. Whether it names a name actually
    // supplied via `config.extensions` can only be confirmed once a live
    // context exists (`runOperation`), so that check isn't done here.
    if (keys.length !== 1) {
      return `Unrecognized operation-node key \`${keys[0]}\`.`;
    }
    const [extKey] = keys;
    if (!isPlainObject(head[extKey])) {
      return `\`${extKey}\` (an extension call) requires an object value, ` +
        `e.g. \`{${extKey}: {select: '$.path'}}\` — matching ` +
        '`$indexedDB`\'s own convention. Its contents are entirely up to ' +
        'the extension itself (e.g. a `select` it resolves via `this.get' +
        '(...)`, literal fields like `db`/`store`, …) — not interpreted ' +
        'here.';
    }
    return null;
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
 * validation error, not just a `reads` omission) and, when
 * `interpolateAttributes` is given, its own config-shape check (a
 * `${...}`-shaped string sitting in an attribute `interpolateAttributes`
 * doesn't cover is *not* flagged — it may just as well be a coincidental
 * literal value, e.g. a currency template or CSS `calc()`-like string, so
 * treating it as a mistake would be presumptuous; it silently renders as
 * literal text instead, same as any other ineligible attribute).
 * @param {unknown[]} nodes
 * @param {{
 *   format?: 'json'|'javascript',
 *   interpolateAttributes?: InterpolateAttributesConfig
 * }} [options]
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateJSONTemplate (
  nodes, {format = 'json', interpolateAttributes} = {}
) {
  if (!Array.isArray(nodes)) {
    return {
      valid: false,
      errors: ['A declarative template must be an array of nodes.']
    };
  }
  const errors = validateInterpolateAttributesConfig(interpolateAttributes);
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
    const resolvedAtts = resolveElementAttributes(atts, ctx);
    await ctx.element(name, resolvedAtts, [], async () => {
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
    // `$value` (a literal, e.g. a collection list embedded directly in the
    // template) takes precedence over `$select` when both are given,
    // mirroring `variable()`'s own JS-API-level `_paramSpec` precedence —
    // this is a direct passthrough to that same mechanism, not a new rule.
    ctx.variable(
      head.$variable,
      Object.hasOwn(head, '$value')
        ? {value: head.$value}
        : {select: head.$select}
    );
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
      head.$sort,
      head.$key
    );
    return;
  }
  if (Object.hasOwn(head, '$renderDefault')) {
    await ctx.renderDefault();
    return;
  }
  if (Object.hasOwn(head, '$indexedDB')) {
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
    return;
  }
  // Only a single, not-otherwise-recognized `$`-prefixed key is left
  // (`validateOperationHead` already confirmed this shape) — a candidate
  // extension call. Only a name actually supplied via `config.extensions`
  // (tracked by `applyExtensions` in `extendContext.js`) may be called this
  // way — never an arbitrary/built-in context method (`element`,
  // `indexedDB`, …) by name, since an admin-authored declarative `behavior`
  // is untrusted input.
  const [key] = Object.keys(head);
  const name = key.slice(1);
  if (!ctx._extensionNames?.has(name)) {
    throw new Error(
      `"${name}" is not a registered extension (an extension-call key ` +
      'may only name one actually supplied via `config.extensions`).'
    );
  }
  // The argument object's contents are entirely up to the extension: the
  // interpreter neither resolves a `select` nor interprets any other key,
  // just hands the whole thing over (`this` is still the live context, so
  // the extension can call `this.get(...)`/`this.valueOf(...)` itself).
  await ctx[name](/** @type {Record<string, unknown>} */ (head[key]));
}

/**
 * Compile a declarative (jamilih-shaped) node array into a jtlt
 * `TemplateFunction`. Validates the whole tree up front (see
 * `validateJSONTemplate`, including `interpolateAttributes`'s own config
 * shape) and throws on the first problem, rather than failing partway
 * through execution. `interpolateAttributes`, when given, restricts which
 * element attributes `${sel}` interpolation applies to (see
 * `compileInterpolateAttributesMatcher`) — stashed on the live context as
 * `_interpolateAttributesMatcher` for `resolveElementAttributes` to consult
 * at runtime.
 * @param {unknown[]} nodes
 * @param {{
 *   format?: 'json'|'javascript',
 *   interpolateAttributes?: InterpolateAttributesConfig
 * }} [options]
 * @returns {(
 *   this: any, value: unknown, cfg?: {mode?: string}
 * ) => Promise<void>}
 */
export function compileJSONTemplate (
  nodes, {format = 'json', interpolateAttributes} = {}
) {
  const {valid, errors} = validateJSONTemplate(
    nodes, {format, interpolateAttributes}
  );
  if (!valid) {
    throw new TypeError(
      `Invalid declarative template:\n${errors.join('\n')}`
    );
  }
  const matches = compileInterpolateAttributesMatcher(interpolateAttributes);
  return async function () {
    /** @type {{_interpolateAttributesMatcher: (name: string) => boolean}} */ (
      this
    )._interpolateAttributesMatcher = matches;
    await runNodes(nodes, this);
  };
}
