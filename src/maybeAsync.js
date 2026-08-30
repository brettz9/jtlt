/**
 * Synchronous/Asynchronous looping utility.
 * @template T
 * @param {T[]} array
 * @param {(item: T, index: number, array: T[]) => any} body
 * @returns {Promise<void>|void}
 */
export function maybeAsyncLoop (array, body) {
  let i = 0;
  /**
   * @returns {Promise<void>|void}
   */
  function next () {
    while (i < array.length) {
      const result = body(array[i], i, array);
      if (result && typeof result.then === 'function') {
        // eslint-disable-next-line @stylistic/max-len -- Long
        // eslint-disable-next-line promise/prefer-await-to-then -- intentional dynamic sync/async
        return result.then(() => {
          i++;
          return next();
        });
      }
      i++;
    }
    return undefined;
  }
  return next();
}
