/**
 * Iterate over an array, staying fully synchronous while `body` returns
 * synchronously and only chaining Promises once `body` returns a thenable.
 *
 * This lets a nested asynchronous operation (e.g. an
 * `await this.indexedDB(...)` fetch inside a template) suspend the loop,
 * without forcing the common synchronous case through microtasks or
 * breaking DOM-bound consumers.
 * @template T
 * @param {T[]} array
 * @param {(item: T, index: number, arr: T[]) => any} body
 * @returns {Promise<void>|void}
 */
export declare function maybeAsyncLoop<T>(array: T[], body: (item: T, index: number, arr: T[]) => any): Promise<void> | void;
//# sourceMappingURL=maybeAsync.d.ts.map