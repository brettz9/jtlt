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
export function maybeAsyncLoop (array, body) {
  let i = 0;

  /**
   * Advance past the awaited item and continue looping. Declared once (not
   * inside the loop) so it can be reused as the `.then()` continuation.
   * @returns {Promise<void>|void}
   */
  function resume () {
    i++;
    return next();
  }

  /**
   * @returns {Promise<void>|void}
   */
  function next () {
    while (i < array.length) {
      const result = body(array[i], i, array);
      if (result && typeof result.then === 'function') {
        // eslint-disable-next-line @stylistic/max-len -- Long
        // eslint-disable-next-line promise/prefer-await-to-then -- intentional dynamic sync/async
        return result.then(resume);
      }
      i++;
    }
    return undefined;
  }

  return next();
}
