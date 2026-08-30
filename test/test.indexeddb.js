import {expect} from 'chai';
import JTLT from '../src/index.js';
import {maybeAsyncLoop} from '../src/maybeAsync.js';
import {
  parseIndexedDBExpression, queryIndexedDB
} from '../src/indexedDB.js';

/**
 * @typedef {import('../src/index.js').JSONPathTemplateObject<any>[]} Templates
 */

/**
 * Build a JSONPath JTLT instance and run it, resolving to the `success` result.
 * @param {{
 *   templates: Templates,
 *   async?: boolean,
 *   outputType?: "json"|"string"|"dom",
 *   data?: any
 * }} cfg - Extra config merged over the defaults
 * @returns {Promise<any>}
 */
async function runJSONPath (cfg) {
  let result;
  const jtlt = JTLT.create(/** @type {any} */ ({
    autostart: false,
    engineType: 'jsonpath',
    outputType: 'string',
    data: {},
    success (/** @type {any} */ res) {
      result = res;
    },
    ...cfg
  }));
  await jtlt.transform();
  return result;
}

/**
 * Map an array of records to one of their property values.
 * @param {any[]} rows
 * @param {string} key
 * @returns {any[]}
 */
function pluck (rows, key) {
  return rows.map((row) => row[key]);
}

describe('IndexedDB tests', () => {
  before(async () => {
    if (typeof window === 'undefined') {
      const {default: setGlobalVars} = await import('indexeddbshim');
      setGlobalVars(globalThis, {checkOrigin: false, memoryDatabase: ''});
    }
    const idb = await import('idb');
    const db = await idb.openDB('testDB', 1, {
      upgrade (dbs) {
        const store = dbs.createObjectStore('users', {keyPath: 'id'});
        store.createIndex('byAge', 'age');
        store.put({id: 1, name: 'Alice', age: 30});
        store.put({id: 2, name: 'Bob', age: 40});
        store.put({id: 3, name: 'Charlie', age: 50});
      }
    });
    db.close();
  });

  describe('JSONPath integration', () => {
    it('fetches data asynchronously via valueOf() with a trailing path',
      async () => {
        const result = await runJSONPath({
          async: true,
          templates: [
            {
              path: '$',
              async template () {
                await this.valueOf({
                  select: "indexedDB('testDB', 'users').*.name"
                });
              }
            }
          ]
        });
        expect(result).to.equal('Alice,Bob,Charlie');
      });

    it('fetches the whole store when no trailing path is given',
      async () => {
        const result = await runJSONPath({
          async: true,
          templates: [
            {
              path: '$',
              async template () {
                await this.valueOf({
                  select: "indexedDB('testDB', 'users')"
                });
              }
            }
          ]
        });
        // Three records stringified via Array#toString
        expect(result).to.be.a('string');
        expect(result.split(',')).to.have.lengthOf(3);
      });

    it('applies a bracketed trailing path to the fetched records',
      async () => {
        const result = await runJSONPath({
          async: true,
          templates: [
            {
              path: '$',
              async template () {
                await this.valueOf({
                  select: "indexedDB('testDB', 'users')[0].name"
                });
              }
            }
          ]
        });
        expect(result).to.equal('Alice');
      });

    it('exposes a direct this.indexedDB() helper', async () => {
      const result = await runJSONPath({
        async: true,
        templates: [
          {
            path: '$',
            async template () {
              const users = await this.indexedDB('testDB', 'users');
              return pluck(users, 'name').join('|');
            }
          }
        ]
      });
      expect(result).to.equal('Alice|Bob|Charlie');
    });

    it('resolves an async string return value from the root template',
      async () => {
        const result = await runJSONPath({
          async: true,
          templates: [
            {
              path: '$',
              async template () {
                await Promise.resolve();
                return 'HELLO';
              }
            }
          ]
        });
        expect(result).to.equal('HELLO');
      });

    it('resolves an async object return value (json output)', async () => {
      const result = await runJSONPath({
        outputType: 'json',
        async: true,
        templates: [
          {
            path: '$',
            async template () {
              await Promise.resolve();
              return {greeting: 'hi'};
            }
          }
        ]
      });
      expect(result).to.deep.equal([{greeting: 'hi'}]);
    });

    it('awaits async non-root templates applied in a loop', async () => {
      const result = await runJSONPath({
        async: true,
        data: {items: ['a', 'b', 'c']},
        templates: [
          {
            path: '$',
            async template () {
              await this.applyTemplates({select: '$.items.*'});
            }
          },
          {
            path: '$.items.*',
            async template (value) {
              await Promise.resolve();
              return String(value).toUpperCase();
            }
          }
        ]
      });
      expect(result).to.equal('ABC');
    });

    it('throws for indexedDB() in valueOf() when async is not enabled',
      async () => {
        let error;
        try {
          await runJSONPath({
            templates: [
              {
                path: '$',
                template () {
                  this.valueOf({select: "indexedDB('testDB', 'users')"});
                }
              }
            ]
          });
        } catch (err) {
          error = err;
        }
        expect(error).to.be.an('error');
        expect(/** @type {Error} */ (error).message).to.match(/async/v);
      });

    it('throws for this.indexedDB() when async is not enabled', async () => {
      let error;
      try {
        await runJSONPath({
          templates: [
            {
              path: '$',
              template () {
                this.indexedDB('testDB', 'users');
              }
            }
          ]
        });
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an('error');
      expect(/** @type {Error} */ (error).message).to.match(/async/v);
    });
  });

  describe('queryIndexedDB()', () => {
    it('reads every record by default', async () => {
      const rows = await queryIndexedDB('testDB', 'users');
      expect(pluck(rows, 'name')).to.deep.equal(['Alice', 'Bob', 'Charlie']);
    });

    it('reads through a named index', async () => {
      const rows = await queryIndexedDB('testDB', 'users', {index: 'byAge'});
      expect(pluck(rows, 'age')).to.deep.equal([30, 40, 50]);
    });

    it('restricts results with a bound key range', async () => {
      const rows = await queryIndexedDB('testDB', 'users', {
        range: {lower: 2, upper: 3}
      });
      expect(pluck(rows, 'name')).to.deep.equal(['Bob', 'Charlie']);
    });

    it('restricts results with an exact key query', async () => {
      const rows = await queryIndexedDB('testDB', 'users', {query: 1});
      expect(pluck(rows, 'name')).to.deep.equal(['Alice']);
    });

    it('walks a cursor backwards, honoring count', async () => {
      const rows = await queryIndexedDB('testDB', 'users', {
        direction: 'prev', count: 2
      });
      expect(pluck(rows, 'name')).to.deep.equal(['Charlie', 'Bob']);
    });

    it('walks a cursor backwards over a range', async () => {
      const rows = await queryIndexedDB('testDB', 'users', {
        direction: 'prevunique', range: {lower: 1, upper: 2}
      });
      expect(pluck(rows, 'name')).to.deep.equal(['Bob', 'Alice']);
    });
  });

  describe('parseIndexedDBExpression()', () => {
    it('returns null when the expression is not an indexedDB() call', () => {
      expect(parseIndexedDBExpression('$.store.*')).to.be.null;
    });

    it('parses the database name, store name and trailing path', () => {
      const parsed = parseIndexedDBExpression(
        "indexedDB('myDB', 'myStore').*.name"
      );
      expect(parsed).to.deep.equal({
        dbName: 'myDB',
        storeName: 'myStore',
        options: undefined,
        trailing: '.*.name'
      });
    });

    it('parses a JSON options object as the third argument', () => {
      const parsed = parseIndexedDBExpression(
        'indexedDB("myDB", "myStore", {"index": "byAge", "count": 2})'
      );
      expect(parsed?.options).to.deep.equal({index: 'byAge', count: 2});
    });

    it('coerces a boolean argument literal (and drops the non-object)', () => {
      expect(
        parseIndexedDBExpression("indexedDB('d', 's', true)")?.options
      ).to.be.undefined;
      expect(
        parseIndexedDBExpression("indexedDB('d', 's', false)")?.options
      ).to.be.undefined;
    });

    it('coerces null and numeric argument literals', () => {
      expect(
        parseIndexedDBExpression("indexedDB('d', 's', null)")?.options
      ).to.be.undefined;
      expect(
        parseIndexedDBExpression("indexedDB('d', 's', 42)")?.options
      ).to.be.undefined;
    });

    it('falls back to a raw string for an unparseable object literal', () => {
      expect(
        parseIndexedDBExpression("indexedDB('d', 's', {oops)")?.options
      ).to.be.undefined;
    });

    it('parses a JSON array literal as the third argument', () => {
      expect(
        parseIndexedDBExpression("indexedDB('d', 's', [1, 2])")?.options
      ).to.deep.equal([1, 2]);
    });

    it('ignores commas inside quotes and nested brackets', () => {
      const parsed = parseIndexedDBExpression(
        'indexedDB("a,b", "s", {"range": {"lower": 1, "upper": 2}})'
      );
      expect(parsed?.dbName).to.equal('a,b');
      expect(parsed?.options).to.deep.equal({range: {lower: 1, upper: 2}});
    });

    it('handles an escaped quote within a string argument', () => {
      const parsed = parseIndexedDBExpression(
        String.raw`indexedDB('a\'b', 'store')`
      );
      expect(parsed?.dbName).to.equal(String.raw`a\'b`);
    });

    it('tolerates a trailing empty argument', () => {
      const parsed = parseIndexedDBExpression("indexedDB('d', 's', )");
      expect(parsed?.storeName).to.equal('s');
    });
  });
});

describe('maybeAsyncLoop()', () => {
  it('runs synchronously when the body returns synchronously', () => {
    /** @type {number[]} */
    const seen = [];
    const ret = maybeAsyncLoop([1, 2, 3], (item) => {
      seen.push(item * 2);
    });
    expect(ret).to.be.undefined;
    expect(seen).to.deep.equal([2, 4, 6]);
  });

  it('does nothing for an empty array', () => {
    expect(maybeAsyncLoop([], () => {
      throw new Error('should not be called');
    })).to.be.undefined;
  });

  it('becomes asynchronous once the body returns a thenable', async () => {
    /** @type {(number|string)[]} */
    const seen = [];
    const ret = maybeAsyncLoop([1, 2, 3], (item) => {
      if (item === 2) {
        return (async () => {
          await Promise.resolve();
          seen.push('async-2');
        })();
      }
      seen.push(item);
      return undefined;
    });
    expect(ret).to.have.property('then').that.is.a('function');
    await ret;
    expect(seen).to.deep.equal([1, 'async-2', 3]);
  });
});
