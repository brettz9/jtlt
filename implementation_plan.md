# Implementing `indexedDB()` and Asynchronous JTLT

To fulfill the proposal, we must introduce asynchronous capabilities to JTLT without breaking the existing synchronous API. This is a delicate architectural change because `idb` operations return Promises, but standard DOM tools (and current users of JTLT) rely heavily on synchronous execution.

## Status

- **JSONPath engine: implemented.** `src/index.js`, `src/JSONPathTransformer.js`, `src/JSONPathTransformerContext.js`, `src/maybeAsync.js`, and `src/indexedDB.js` support async templates and `indexedDB(...)` interception in `valueOf()`, plus a direct `this.indexedDB(dbName, storeName, options?)` helper. Covered by `test/test.indexeddb.js` (`tsc`, `eslint`, and 100% coverage all pass).
- **XPath engine: not started.** The earlier partial edits to `src/XPathTransformer.js` and `src/XPathTransformerContext.js` were incomplete (broken scope references, `continue` → `return` in a real `for` loop) and have been reverted to a clean baseline. Redo them deliberately following section 1/2 below, mirroring the JSONPath implementation.

## Goal
Implement the `indexedDB()` API for XPath and JSONPath by:
1. Allowing templates to conditionally return `Promises` (supporting `await this.indexedDB(...)`).
2. Supporting asynchronous pre-evaluation of `indexedDB(...)` at the root of JSONPath expressions.
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
- `parseIndexedDBExpression(expr)` returns `{dbName, storeName, options, trailing}` or `null`. It matches `/^\s*indexedDB\((?<args>.*)\)(?<trailing>.*)$/v`, splits the argument list at top level (quote/bracket aware), and coerces each argument (quoted string, number, `true`/`false`/`null`, or JSON object/array literal).

#### [MODIFY] `src/JSONPathTransformerContext.js` — done
- `valueOf(select)` calls `parseIndexedDBExpression` on the selector string. On a match it throws synchronously when `config.async` is false, otherwise returns `_appendIndexedDBValue(...)` (a Promise) so templates can `await this.valueOf(...)`.
- `_resolveIndexedDBExpression` fetches via `queryIndexedDB` and, when a trailing segment is present (e.g. `.*.name` or `[0].name`), evaluates `'$' + trailing` with `jsonpath-plus` against the fetched records.
- `indexedDB(dbName, storeName, options?)` is exposed on the context for direct `await this.indexedDB(...)` use; it also throws synchronously unless `config.async`.

#### [TODO] XPath equivalent (`src/XPathTransformerContext.js`)
- Mirror the above: intercept `indexedDB(...)` in the XPath `valueOf`/function path, reuse `parseIndexedDBExpression` (its `trailing` may be an XPath step like `/name`), and add a direct `this.indexedDB(...)` helper.

## Verification Plan
### Automated Tests
- `test/test.indexeddb.js` uses `indexeddbshim` for Node and exercises: `valueOf()` with and without a trailing path, bracketed trailing paths, the direct `this.indexedDB()` helper, async root and non-root template returns, the sync-mode guards, every `queryIndexedDB` option, and `parseIndexedDBExpression`/`maybeAsyncLoop` directly.
- `npm test` (mocha + `c8` at 100% thresholds), `npm run tsc`, and `npm run lint` all pass.
