/**
 * @typedef {typeof import("idb").openDB} OpenDBFunction
 */

/** @type {OpenDBFunction | undefined} */
let openDB;

/**
 * @returns {Promise<void>}
 */
async function initIDB () {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    const {default: setGlobalVars} = await import('indexeddbshim');
    setGlobalVars(globalThis, {
      checkOrigin: false, memoryDatabase: ''
    });
  }
  const idb = await import('idb');
  ({openDB} = idb);
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
  if (!openDB) {
    await initIDB();
  }
  const db = await /** @type {OpenDBFunction} */ (openDB)(dbName);
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
      cursor = await cursor.continue();
    }
    return results;
  }

  return target.getAll(range, options.count);
}
