# Implementing `indexedDB()` and Asynchronous JTLT

To fulfill the proposal, we must introduce asynchronous capabilities to JTLT without breaking the existing synchronous API. This is a delicate architectural change because `idb` operations return Promises, but standard DOM tools (and current users of JTLT) rely heavily on synchronous execution.

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

#### [NEW] `src/indexedDB.js`
- Create a helper module wrapping the `idb` package to provide the `queryIndexedDB(dbName, storeName)` logic.

#### [MODIFY] `src/JSONPathTransformerContext.js`
- In `_evaluateJSONPath` (or where paths are evaluated), if a path string matches `/^indexedDB\\((.*)\\)(.*)$/`, intercept it.
- Asynchronously import and call `queryIndexedDB` to fetch the data.
- If there's a trailing JSONPath (like `.*.name`), dynamically evaluate `jsonpath-plus` on the resolved data and append it to the `results` string.
- If `config.async` is false, throw an Error preventing synchronous users from calling `indexedDB()`.

## Verification Plan
### Automated Tests
- Create `test.indexeddb.js` testing IDB operations using `indexeddbshim` (to support Node environments).
- Set `async: true` in the JTLT config for the test, and verify `jtlt.transform()` accurately awaits the IndexedDB data without returning `[object Promise]`.
