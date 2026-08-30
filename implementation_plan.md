# Implementing `indexedDB()` and Asynchronous JTLT

To fulfill the proposal, we must introduce asynchronous capabilities to JTLT without breaking the existing synchronous API. This is a delicate architectural change because `idb` operations return Promises, but standard DOM tools (and current users of JTLT) rely heavily on synchronous execution.

## Status

**Both engines implemented.** `src/index.js`, `src/JSONPathTransformer.js`, `src/XPathTransformer.js`, `src/JSONPathTransformerContext.js`, `src/XPathTransformerContext.js`, `src/maybeAsync.js`, and `src/indexedDB.js` support async templates, plus a direct `this.indexedDB(dbName, storeName, options?)` helper on both contexts.

- **JSONPath**: `valueOf()` intercepts the non-JSONPath string form `indexedDB('db', 'store').*.name`; the segment after `)` is JSONPath evaluated against the fetched records (`resolveIndexedDBQuery`).
- **XPath**: `indexedDB()` is a real XPath function registered with `fontoxpath.registerCustomXPathFunction` under the predefined `jtlt` prefix (`urn:jtlt`), e.g. `string-join(jtlt:indexedDB('db', 'store') ! ?name, ',')`; options are an XPath map. fontoxpath 3.x is synchronous, so `evaluateXPathWithIndexedDB` does a collect pass (function records its args, returns `()`), awaits the queries, then a resolve pass (function returns cached records).

Covered by `test/test.indexeddb.js`; `npm test` (mocha + `c8` at 100% thresholds), `npm run tsc`, and `npm run lint` all pass.

## Goal
Implement the `indexedDB()` API for XPath and JSONPath by:
1. Allowing templates to conditionally return `Promises` (supporting `await this.indexedDB(...)` and `await this.valueOf(...)`).
2. Supporting asynchronous pre-evaluation of `indexedDB(...)` inside a `valueOf()` selector for both engines.
3. Keeping the core engine perfectly synchronous when `async` features aren't used.

## Proposed Changes

### 1. Conditional Async Engine (`JTLT.transform`)

#### [MODIFY] `src/index.js`
- **DO NOT** make `transform(mode)` an `async` function.
- Instead, inspect the return value of `engine(config)`. If it is a Promise (via `typeof result.then === 'function'`) and `this.config.async === true`, then return `result.then(...)` and trigger `this.config.success` asynchronously.
- Otherwise, execute `this.config.success` synchronously and return the synchronous result.

#### [MODIFY] `src/JSONPathTransformer.js` & `src/XPathTransformer.js`
- **DO NOT** convert `transform(mode)` to `async transform(mode)`.
- Synchronously call `templateObj.template.call(...)`.
- Inspect the return value (`ret`). If it is a Promise, return a new Promise that waits for it to resolve before calling `joiner.append()`.

### 2. Async Looping Context (`maybeAsyncLoop`)

#### [NEW] `src/maybeAsync.js`
- Create a `maybeAsyncLoop` utility function that iterates over an array. If a callback returns a Promise, it chains `.then()` and becomes asynchronous. If the callback returns synchronously, the loop continues synchronously without ever spawning microtasks.

#### [MODIFY] `src/JSONPathTransformerContext.js` & `src/XPathTransformerContext.js`
- Replace `matches.forEach(...)` with `maybeAsyncLoop` in `applyTemplates` and `valueOf`.
- This ensures that if a nested template performs an async `indexedDB` fetch, the loop waits for it. But if standard templates run, it executes in a pure synchronous while-loop to avoid breaking DOM constraints.

### 3. Implement `indexedDB` Sandbox Function

#### [NEW] `src/indexedDB.js` — done
- `queryIndexedDB(dbName, storeName, options?)` wraps `idb`, lazily loading it (and `indexeddbshim` under Node) via a memoized loader. `options` supports `index`, `range` (`IDBKeyRange.bound`), `query` (`IDBKeyRange.only`), `direction`, and `count` (the `prev*` directions walk a cursor).
- `options.resultType` (mirrors `jsonpath-plus`) selects what each matched entry contributes. JSDoc `@overload`s discriminate the resolved element type on the `resultType` literal:
  - `'value'` (default) — the stored record (`getAll` / cursor); resolves `Promise<unknown[]>`.
  - `'primaryKey'` — the object store's primary key (`getAllKeys` / key cursor); resolves `Promise<IDBValidKey[]>`.
  - `'key'` — the query key: same as the primary key for a store query, or the indexed field's value when `index` is set (`getAllKeys` for a store; a key cursor for an index); resolves `Promise<IDBValidKey[]>`.
  - `'all'` — an `IdbRecord` (`{key: IDBValidKey, primaryKey: IDBValidKey, value: unknown}`), via `getAllRecords()` when available, otherwise a cursor; resolves `Promise<IdbRecord[]>`.
- `parseIndexedDBExpression(expr)` returns `{dbName, storeName, options, trailing}` or `null`. It matches `/^\s*indexedDB\((?<args>.*)\)(?<trailing>.*)$/v`, splits the argument list at top level (quote/bracket aware), and coerces each argument (quoted string, number, `true`/`false`/`null`, or JSON object/array literal).

- `resolveIndexedDBQuery(parsed, {preventEval})` (exported from `src/indexedDB.js`) fetches via `queryIndexedDB` and, when a trailing segment is present (e.g. `.*.name` or `[0].name`), evaluates `'$' + trailing` with `jsonpath-plus` against the fetched records. Because IndexedDB yields plain JSON, the trailing query is JSONPath for **both** engines.

#### [MODIFY] `src/JSONPathTransformerContext.js` — done
- `valueOf(select)` calls `parseIndexedDBExpression` on the selector string. On a match it throws synchronously when `config.async` is false, otherwise returns `_appendIndexedDBValue(...)` (a Promise) so templates can `await this.valueOf(...)`.
- `indexedDB(dbName, storeName, options?)` is exposed on the context for direct `await this.indexedDB(...)` use; it also throws synchronously unless `config.async`.

#### [MODIFY] `src/XPathTransformerContext.js` — done
- `valueOf(select)` detects a `jtlt:indexedDB(...)` call in the selector (`xpathExpressionUsesIndexedDB`). It throws synchronously when `config.async` is false, otherwise defers to `evaluateXPathWithIndexedDB` (see above) and appends the string result — returning a Promise so templates can `await this.valueOf(...)`.
- `indexedDB(dbName, storeName, options?)` direct helper, same as the JSONPath context.
- `applyTemplates` now iterates with `maybeAsyncLoop`; when a template returns a Promise (and `config.async`), the per-node body chains it and `applyTemplates` returns a Promise. `XPathTransformer.transform` mirrors `JSONPathTransformer.transform`'s async return handling.

#### [MODIFY] `src/indexedDB.js` — done (XPath additions)
- `registerCustomXPathFunction` for `jtlt:indexedDB` arity 2 and 3 (`map(*)` options), backed by a module-level collect/resolve state object.
- `evaluateXPathWithIndexedDB(selectStr, contextNode)` runs the collect → fetch → resolve passes and returns the string result.
- `xpathExpressionUsesIndexedDB(expr)` and `JTLT_XPATH_NAMESPACE` are also exported.

## Verification Plan
### Automated Tests
- `test/test.indexeddb.js` uses `indexeddbshim` for Node. JSONPath: `valueOf()` with/without a trailing path, bracketed trailing paths. XPath: `jtlt:indexedDB(...)` in `valueOf()`, options-as-map, and de-duplication of repeated calls in one expression. Both engines: the direct `this.indexedDB()` helper, async root and non-root template returns, and the sync-mode guards. It also covers every `queryIndexedDB` option and `parseIndexedDBExpression`/`maybeAsyncLoop` directly.
- `npm test` (mocha + `c8` at 100% thresholds), `npm run tsc`, and `npm run lint` all pass.
