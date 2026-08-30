import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {jtlt} from '../src/index.js';
import {maybeAsyncLoop} from '../src/maybeAsync.js';
import {parseIndexedDBExpression, queryIndexedDB} from '../src/indexedDB.js';

/**
 * A record stored in the test `users` object store.
 * @typedef {{id: number, name: string, age: number}} User
 */

/**
 * A `resultType: 'all'` row from the test `users` store.
 * @typedef {{key: number, primaryKey: number, value: User}} UserRecord
 */

/**
 * @typedef {import('../src/index.js').JSONPathTemplateObject<"string">
 * } JSONPathStringTemplate
 */

/**
 * @typedef {import('../src/index.js').XPathTemplateObject<"string">
 * } XPathStringTemplate
 */

/**
 * Run a string-producing JSONPath transform over the given templates. `jtlt()`
 * resolves to the result directly, so there is no `success` callback.
 * @param {{
 *   templates: JSONPathStringTemplate[],
 *   async?: boolean,
 *   data?: object
 * }} opts
 * @returns {Promise<string>}
 */
function runJSONPath ({templates, async: isAsync = false, data = {}}) {
  return jtlt({
    async: isAsync,
    engineType: 'jsonpath',
    outputType: 'string',
    data,
    templates
  });
}

/**
 * Run a string-producing XPath transform over a tiny XML document.
 * @param {{templates: XPathStringTemplate[], async?: boolean}} opts
 * @returns {Promise<string>}
 */
function runXPath ({templates, async: isAsync = false}) {
  const {window} = new JSDOM('<!doctype html><html><body></body></html>');
  const doc = new window.DOMParser().parseFromString(
    '<root><item>x</item></root>', 'text/xml'
  );
  return jtlt({
    async: isAsync,
    engineType: 'xpath',
    xpathVersion: 1,
    outputType: 'string',
    data: doc,
    templates
  });
}

/**
 * Project one property out of every row.
 * @template {object} T
 * @param {readonly T[]} rows
 * @param {keyof T} key
 * @returns {T[keyof T][]}
 */
function pluck (rows, key) {
  return rows.map((row) => row[key]);
}

/**
 * Await `promise`, expecting it to reject with an `Error` matching `pattern`.
 * `jtlt()` surfaces even synchronous engine errors as a rejected Promise.
 * @param {Promise<unknown>} promise
 * @param {RegExp} pattern
 * @returns {Promise<void>}
 */
async function expectRejection (promise, pattern) {
  let error;
  try {
    await promise;
  } catch (err) {
    error = err;
  }
  expect(error).to.be.an('error');
  expect(/** @type {Error} */ (error).message).to.match(pattern);
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

    it('honors a resultType option in the string form', async () => {
      const result = await runJSONPath({
        async: true,
        templates: [
          {
            path: '$',
            async template () {
              await this.valueOf({
                select: "indexedDB('testDB', 'users', " +
                  '{"resultType": "all"}).*.primaryKey'
              });
            }
          }
        ]
      });
      expect(result).to.equal('1,2,3');
    });

    it('exposes a direct this.indexedDB() helper', async () => {
      const result = await runJSONPath({
        async: true,
        templates: [
          {
            path: '$',
            async template () {
              const users = /** @type {readonly User[]} */ (
                await this.indexedDB('testDB', 'users')
              );
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
      const result = await jtlt({
        async: true,
        engineType: 'jsonpath',
        outputType: 'json',
        data: {},
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

    it('rejects for indexedDB() in valueOf() when async is not enabled',
      async () => {
        await expectRejection(runJSONPath({
          templates: [
            {
              path: '$',
              template () {
                this.valueOf({select: "indexedDB('testDB', 'users')"});
              }
            }
          ]
        }), /async/v);
      });

    it('rejects for this.indexedDB() when async is not enabled', async () => {
      await expectRejection(runJSONPath({
        templates: [
          {
            path: '$',
            template () {
              this.indexedDB('testDB', 'users');
            }
          }
        ]
      }), /async/v);
    });
  });

  describe('XPath integration', () => {
    it('resolves the jtlt:indexedDB() XPath function in valueOf()',
      async () => {
        const result = await runXPath({
          async: true,
          templates: [
            {
              path: '/',
              async template () {
                await this.valueOf({
                  select:
                    "string-join(jtlt:indexedDB('testDB', 'users') ! ?name" +
                    ", ',')"
                });
              }
            }
          ]
        });
        expect(result).to.equal('Alice,Bob,Charlie');
      });

    it('fetches each distinct query once when repeated in an expression',
      async () => {
        const result = await runXPath({
          async: true,
          templates: [
            {
              path: '/',
              async template () {
                await this.valueOf({
                  select:
                    "concat(string-join(jtlt:indexedDB('testDB', 'users') " +
                    "! ?name, ','), '/', " +
                    "string(count(jtlt:indexedDB('testDB', 'users'))))"
                });
              }
            }
          ]
        });
        expect(result).to.equal('Alice,Bob,Charlie/3');
      });

    it('passes an XPath map of options to jtlt:indexedDB()', async () => {
      const result = await runXPath({
        async: true,
        templates: [
          {
            path: '/',
            async template () {
              await this.valueOf({
                select:
                  "string-join(jtlt:indexedDB('testDB', 'users', " +
                  "map{'direction': 'prev', 'count': 2}) ! ?name, ',')"
              });
            }
          }
        ]
      });
      expect(result).to.equal('Charlie,Bob');
    });

    it("passes resultType 'all' through the options map", async () => {
      const result = await runXPath({
        async: true,
        templates: [
          {
            path: '/',
            async template () {
              await this.valueOf({
                select:
                  "string-join(jtlt:indexedDB('testDB', 'users', " +
                  "map{'resultType': 'all'}) ! string(?primaryKey), ',')"
              });
            }
          }
        ]
      });
      expect(result).to.equal('1,2,3');
    });

    it("passes resultType 'key' with an index through the options map",
      async () => {
        const result = await runXPath({
          async: true,
          templates: [
            {
              path: '/',
              async template () {
                await this.valueOf({
                  select:
                    "string-join(jtlt:indexedDB('testDB', 'users', " +
                    "map{'resultType': 'key', 'index': 'byAge'}) " +
                    "! string(.), ',')"
                });
              }
            }
          ]
        });
        expect(result).to.equal('30,40,50');
      });

    it('exposes a direct this.indexedDB() helper', async () => {
      const result = await runXPath({
        async: true,
        templates: [
          {
            path: '/',
            async template () {
              const users = /** @type {readonly User[]} */ (
                await this.indexedDB('testDB', 'users', {index: 'byAge'})
              );
              return pluck(users, 'name').join('|');
            }
          }
        ]
      });
      expect(result).to.equal('Alice|Bob|Charlie');
    });

    it('awaits an async non-root template applied in a loop', async () => {
      const result = await runXPath({
        async: true,
        templates: [
          {
            path: '/',
            async template () {
              await this.applyTemplates('//item');
            }
          },
          {
            path: '//item',
            async template (node) {
              const users = /** @type {readonly User[]} */ (
                await this.indexedDB('testDB', 'users')
              );
              return node.textContent + ':' + users.length;
            }
          }
        ]
      });
      expect(result).to.equal('x:3');
    });

    it('resolves an async return value from the root template', async () => {
      const result = await runXPath({
        async: true,
        templates: [
          {
            path: '/',
            async template () {
              await Promise.resolve();
              return 'DONE';
            }
          }
        ]
      });
      expect(result).to.equal('DONE');
    });

    it('rejects for jtlt:indexedDB() in valueOf() when async is not enabled',
      async () => {
        await expectRejection(runXPath({
          templates: [
            {
              path: '/',
              template () {
                this.valueOf({select: "jtlt:indexedDB('testDB', 'users')"});
              }
            }
          ]
        }), /async/v);
      });

    it('rejects for this.indexedDB() when async is not enabled', async () => {
      await expectRejection(runXPath({
        templates: [
          {
            path: '/',
            template () {
              this.indexedDB('testDB', 'users');
            }
          }
        ]
      }), /async/v);
    });
  });

  describe('queryIndexedDB()', () => {
    it('reads every record by default', async () => {
      const rows = /** @type {readonly User[]} */ (
        await queryIndexedDB('testDB', 'users')
      );
      expect(pluck(rows, 'name')).to.deep.equal(['Alice', 'Bob', 'Charlie']);
    });

    it('reads through a named index', async () => {
      const rows = /** @type {readonly User[]} */ (
        await queryIndexedDB('testDB', 'users', {index: 'byAge'})
      );
      expect(pluck(rows, 'age')).to.deep.equal([30, 40, 50]);
    });

    it('restricts results with a bound key range', async () => {
      const rows = /** @type {readonly User[]} */ (
        await queryIndexedDB('testDB', 'users', {range: {lower: 2, upper: 3}})
      );
      expect(pluck(rows, 'name')).to.deep.equal(['Bob', 'Charlie']);
    });

    it('restricts results with an exact key query', async () => {
      const rows = /** @type {readonly User[]} */ (
        await queryIndexedDB('testDB', 'users', {query: 1})
      );
      expect(pluck(rows, 'name')).to.deep.equal(['Alice']);
    });

    it('walks a cursor backwards, honoring count', async () => {
      const rows = /** @type {readonly User[]} */ (
        await queryIndexedDB('testDB', 'users', {direction: 'prev', count: 2})
      );
      expect(pluck(rows, 'name')).to.deep.equal(['Charlie', 'Bob']);
    });

    it('walks a cursor backwards over a range', async () => {
      const rows = /** @type {readonly User[]} */ (
        await queryIndexedDB('testDB', 'users', {
          direction: 'prevunique', range: {lower: 1, upper: 2}
        })
      );
      expect(pluck(rows, 'name')).to.deep.equal(['Bob', 'Alice']);
    });
  });

  describe('queryIndexedDB() resultType', () => {
    it("resultType 'primaryKey' returns the store keys", async () => {
      expect(await queryIndexedDB('testDB', 'users', {
        resultType: 'primaryKey'
      })).to.deep.equal([1, 2, 3]);
    });

    it("resultType 'primaryKey' on an index returns store keys in " +
      'index order', async () => {
      expect(await queryIndexedDB('testDB', 'users', {
        index: 'byAge', resultType: 'primaryKey'
      })).to.deep.equal([1, 2, 3]);
    });

    it("resultType 'key' on a store equals the primary keys", async () => {
      expect(await queryIndexedDB('testDB', 'users', {
        resultType: 'key'
      })).to.deep.equal([1, 2, 3]);
    });

    it("resultType 'key' on an index returns the indexed values",
      async () => {
        expect(await queryIndexedDB('testDB', 'users', {
          index: 'byAge', resultType: 'key'
        })).to.deep.equal([30, 40, 50]);
      });

    it("resultType 'key' on an index honors reverse direction", async () => {
      expect(await queryIndexedDB('testDB', 'users', {
        index: 'byAge', resultType: 'key', direction: 'prev'
      })).to.deep.equal([50, 40, 30]);
    });

    it("resultType 'primaryKey' honors reverse direction and count",
      async () => {
        expect(await queryIndexedDB('testDB', 'users', {
          resultType: 'primaryKey', direction: 'prev', count: 2
        })).to.deep.equal([3, 2]);
      });

    it("resultType 'all' returns {key, primaryKey, value} triples",
      async () => {
        const rows = /** @type {readonly UserRecord[]} */ (
          await queryIndexedDB('testDB', 'users', {resultType: 'all'})
        );
        expect(rows).to.deep.equal([
          {key: 1, primaryKey: 1, value: {id: 1, name: 'Alice', age: 30}},
          {key: 2, primaryKey: 2, value: {id: 2, name: 'Bob', age: 40}},
          {key: 3, primaryKey: 3, value: {id: 3, name: 'Charlie', age: 50}}
        ]);
      });

    it("resultType 'all' on an index reports index key vs primary key",
      async () => {
        const rows = /** @type {readonly UserRecord[]} */ (
          await queryIndexedDB('testDB', 'users', {
            index: 'byAge', resultType: 'all', count: 1
          })
        );
        expect(rows).to.deep.equal([
          {key: 30, primaryKey: 1, value: {id: 1, name: 'Alice', age: 30}}
        ]);
      });

    it("resultType 'all' honors reverse direction", async () => {
      const rows = /** @type {readonly UserRecord[]} */ (
        await queryIndexedDB('testDB', 'users', {
          resultType: 'all', direction: 'prev', count: 1
        })
      );
      expect(rows).to.deep.equal([
        {key: 3, primaryKey: 3, value: {id: 3, name: 'Charlie', age: 50}}
      ]);
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
