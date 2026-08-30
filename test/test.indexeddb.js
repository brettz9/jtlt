import {expect} from 'chai';
import JTLT from '../src/index.js';

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
        store.put({id: 1, name: 'Alice', age: 30});
        store.put({id: 2, name: 'Bob', age: 40});
        store.put({id: 3, name: 'Charlie', age: 50});
      }
    });
    db.close();
  });

  it(
    'should fetch data asynchronously from indexedDB in JSONPath',
    async () => {
      /** @type {import('../src/index.js').JSONPathTemplateArray<"string">[]} */
      let result;
      const templates = [
        {
          path: '$',
          async template () {
            await this.valueOf({select: "indexedDB('testDB', 'users').*.name"});
          }
        }
      ];

      const jtlt = JTLT.create({
        async: true,
        autostart: false,
        engineType: 'jsonpath',
        outputType: 'string',
        data: {}, // ignored since root is IDB
        templates,
        success: (res) => { result = res; }
      });
      await jtlt.transform();

      expect(result).to.equal('Alice,Bob,Charlie');
    }
  );
});
