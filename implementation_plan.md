# Implementing `indexedDB()` and Asynchronous JTLT

To fulfill the proposal (Path A + awaitable template rules), we must introduce asynchronous capabilities to JTLT, which is currently a purely synchronous engine. This is a major architectural change because `idb` operations return Promises.

## Goal
Implement the `indexedDB()` API for XPath and JSONPath by:
1. Allowing templates to be `async` functions (supporting `await this.indexedDB(...)`).
2. Supporting asynchronous pre-evaluation of `indexedDB(...)` at the root of JSONPath expressions.
3. Supporting `indexedDB` in `fontoxpath` via `evaluateXPathToAsync`.

## Proposed Changes

### 1. Make the Engine "Optionally" Async (Preserve Sync Default)

To keep JTLT's core class synchronous by default while supporting Promises where needed, we will introduce an execution mode config.

#### [MODIFY] `src/index.js`
- Introduce a `config.syncOnly` flag. If `true`, JTLT will explicitly throw an error if a Promise is detected during template evaluation (a strict sync mode).
- The main `jtlt()` wrapper function (which already returns a Promise) will assume `async` mode by default, meaning it handles Promises seamlessly.
- For the `JTLT` class directly, `transform()` will remain synchronous unless a Promise is detected (Maybe Async) or if `syncOnly` prevents it.

#### [MODIFY] `src/JSONPathTransformer.js` & `src/XPathTransformer.js`
- For JSONPath: Update loop iterators in `applyTemplates` and `transform` to check `if (result instanceof Promise)`. If found, and `syncOnly` is true, throw an error. If `syncOnly` is false, it chains `.then()` and propagates the Promise up the call stack.
- For XPath: `fontoxpath`'s synchronous `evaluateXPathToNodes` throws an error if an async custom function is executed. We will use `evaluateXPathToAsync` automatically if the main `jtlt()` function is used, or if a user specifically requests async execution.

### 2. Core Methods (`applyTemplates`, `valueOf`, etc.)

#### [MODIFY] `src/JSONPathTransformerContext.js` & `src/XPathTransformerContext.js`
- Core template execution methods (`applyTemplates`, `forEach`, `valueOf`) will **not** be strictly converted to `async` functions to preserve sync behavior.
- Instead, they will use a "Maybe Async" pattern: they will check if an evaluated template or path returns a `Promise`.
  - If a Promise is found and `syncOnly` is true: throw an error.
  - If a Promise is found and `syncOnly` is false: chain `.then()` and return a Promise to the caller, cascading the async behavior up the stack.
  - If NO Promise is found: continue synchronously and return the result immediately.

### 3. Implement `indexedDB` pre-evaluation

#### [NEW] `src/indexedDB.js`
- Create a helper module wrapping the `idb` package to provide the `indexedDB(dbName, storeName, options)` logic (fetching all, fetching by key, or fetching by range/index).

#### [MODIFY] `src/JSONPathTransformerContext.js`
- In `_evaluateJSONPath` (or wherever paths are evaluated), if a path string matches `/^indexedDB\((.*)\)(.*)$/`, intercept it.
- `await` the `indexedDB` fetch using the extracted arguments.
- Pass the resolved data as the root object into `jsonpath-plus` for the remainder of the path.
- Expose `async indexedDB(...)` on the context prototype so users can write `await this.indexedDB(...)` in templates.

#### [MODIFY] `src/XPathTransformerContext.js`
- In `_registerCustomFunctions`, register `indexedDB` returning a Promise using `fontoxpath.registerCustomXPathFunction`.
- Ensure `fontoxpath` evaluation uses `evaluateXPathToAsync` instead of `evaluateXPathToNodes`.

## Verification Plan
### Automated Tests
- Create `test.indexeddb.js` testing IDB operations (using `indexeddbshim` for the Node environment).
- Run existing Mocha test suite to ensure async conversions don't break existing synchronous functionality.
