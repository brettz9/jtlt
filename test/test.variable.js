import {expect} from 'chai';
import {jtlt} from '../src/index.js';

/**
 * `_lookupParam` (the resolver behind a bare `$name` reference in
 * `if()`/`choose()`/comparisons/the `$name` form of `valueOf()`) also
 * consults `this.vars`, not just `this._params` / `this._runtimeParams` —
 * so a `variable()`-set value is readable back through a selector, not only
 * via direct `this.vars.name` property access from inside a live template
 * function. `$.name` (dotted) remains a plain JSONPath query against the
 * data and is never treated as a var/param reference — only the bare `$name`
 * form is.
 */
describe('variable() readable back via a bare $name reference', function () {
  /**
   * @param {(
   *   this: import('../src/JSONPathTransformerContext.js').default<"string">
   * ) => void} tmpl
   * @param {object} [data]
   * @returns {Promise<string>}
   */
  const render = (tmpl, data = {}) => jtlt({
    data,
    outputType: 'string',
    templates: [{path: '$', template: tmpl}]
  });

  it('valueOf($name) resolves a variable()-set value', async function () {
    expect(await render(function () {
      this.variable('n', '$.name');
      this.valueOf('$n');
    }, {name: 'Ada'})).to.equal('Ada');
  });

  it('if($name) treats a variable()-set value as truthy/falsy',
    async function () {
      expect(await render(function () {
        this.variable('flag', '$.on');
        this.if('$flag', () => this.string('yes'));
      }, {on: true})).to.equal('yes');
      expect(await render(function () {
        this.variable('flag', '$.on');
        this.if('$flag', () => this.string('yes'));
      }, {on: false})).to.equal('');
    });

  it('a $name comparison can reference a variable()-set value',
    async function () {
      expect(await render(function () {
        this.variable('n', '$.name');
        this.if('$n === "Ada"', () => this.string('match'));
      }, {name: 'Ada'})).to.equal('match');
      expect(await render(function () {
        this.variable('n', '$.name');
        this.if('$n === "Ada"', () => this.string('match'));
      }, {name: 'Bob'})).to.equal('');
    });

  it('a dotted selector ($.name) is never a var/param reference — it always ' +
    'queries the data, even when a like-named variable exists',
  async function () {
    expect(await render(function () {
      this.variable('name', '$.other');
      this.valueOf('$.name');
    }, {name: 'FromData', other: 'FromVar'})).to.equal('FromData');
  });

  describe('variable(name, {value}) — a literal, not a selector', function () {
    it('binds an already-computed value directly, no selector round-trip',
      async function () {
        expect(await render(function () {
          this.variable('n', {value: 'literal'});
          this.valueOf('$n');
        })).to.equal('literal');
      });

    it('still accepts an explicit {select} form, equivalent to a bare string',
      async function () {
        expect(await render(function () {
          this.variable('n', {select: '$.name'});
          this.valueOf('$n');
        }, {name: 'Ada'})).to.equal('Ada');
      });

    it(
      'binds a this.indexedDB() result directly, then $forEach over it — ' +
      'the motivating case: a fetched value has no selector to bind it ' +
      'with, unlike a `variable(name, select)` value queried from the data',
      async function () {
        if (typeof window === 'undefined') {
          const {default: setGlobalVars} = await import('indexeddbshim');
          setGlobalVars(globalThis, {checkOrigin: false, memoryDatabase: ''});
        }
        const idb = await import('idb');
        const db = await idb.openDB('jtltVariableValueTestDB', 1, {
          upgrade (dbs) {
            const store = dbs.createObjectStore('users', {keyPath: 'id'});
            store.put({id: 1, name: 'Alice'});
            store.put({id: 2, name: 'Bob'});
          }
        });
        db.close();

        expect(await render(async function () {
          const rows = await this.indexedDB('jtltVariableValueTestDB', 'users');
          this.variable('records', {value: rows});
          this.forEach('$records', (row) => {
            this.string(/** @type {{name: string}} */ (row).name);
          });
        })).to.equal('AliceBob');
      }
    );
  });

  describe('forEach() over a bare $name reference', function () {
    it('iterates an array bound by variable({value}) directly (no [*])',
      async function () {
        expect(await render(function () {
          this.variable('items', {value: ['a', 'b', 'c']});
          this.forEach('$items', (item) => this.string(String(item)));
        })).to.equal('abc');
      });

    it(
      'treats a bound non-array value as a length-1 sequence, matching ' +
      "XPath's data model (a scalar is a one-item sequence)",
      async function () {
        expect(await render(function () {
          this.variable('n', {value: 'solo'});
          this.forEach('$n', (item) => this.string(String(item)));
        })).to.equal('solo');
      }
    );
  });
});
