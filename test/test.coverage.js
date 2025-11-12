import {expect} from 'chai';
import JTLT from '../src/index.js';

describe('Coverage: uncovered functionality', () => {
  it('calls config() method on joiner', (done) => {
    // Test AbstractJoiningTransformer.config()
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'test'},
      outputType: 'string',
      templates: [{
        path: '$.x',
        template (val) {
          const jt = this._config.joiningTransformer;
          jt.config('testProp', 'testVal', function () {
            // Config is temporarily set
          });
          return /** @type {string} */ (val);
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('test');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('uses _requireSameChildren guard', () => {
    // Test StringJoiningTransformer with requireSameChildren config
    expect(() => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {},
        outputType: 'string',
        joiningConfig: {requireSameChildren: true},
        templates: [{
          path: '$',
          template () {
            this.object({});
          }
        }],
        success () { /* not reached */ }
      });
    }).to.throw(
      'Cannot embed object children for a string joining transformer.'
    );
  });

  it('handles variable() in context', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'stored'},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.variable('myVar', '$.x');
          expect(this.vars.myVar).to.equal('stored');
          done();
        }
      }],
      success () {
        // Empty success callback for testing
      }
    });
  });

  it('calls message() for logging', (done) => {
    let called = false;
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.message({test: 'log'});
          called = true;
          done();
        }
      }],
      success () {
        // Empty success callback for testing
      }
    });
    expect(called).to.equal(false); // Will be true after done()
  });

  it('uses propertySet and _usePropertySets', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.propertySet('set1', {a: 1});
          this.propertySet('set2', {b: 2}, ['set1']);
          expect(this.propertySets.set2.a).to.equal(1);
          expect(this.propertySets.set2.b).to.equal(2);
          done();
        }
      }],
      success () {
        // Empty success callback for testing
      }
    });
  });

  it('uses key() and getKey()', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {items: [{id: 1, name: 'A'}, {id: 2, name: 'B'}]},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.key('itemKey', '$.items[*]', 'id');
          const found = this.getKey('itemKey', 2);
          expect(found.name).to.equal('B');
          done();
        }
      }],
      success () {
        // Empty success callback for testing
      }
    });
  });

  it('handles callTemplate with withParam', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'val'},
      outputType: 'string',
      templates: [
        {path: '$', template () {
          this.callTemplate({
            name: 'named',
            withParam: [{select: '$.x'}]
          });
        }},
        {
          name: 'named',
          path: '$.x', // Todo: Remove need for `path` in named templates
          template (param) {
            return `param:${/** @type {[string]} */ (param)[0]}`;
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.include('param:val');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('throws on missing callTemplate', () => {
    expect(() => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.callTemplate('nonexistent');
          }
        }],
        success () { /* not reached */ }
      });
    }).to.throw(/cannot be called/v);
  });

  it('uses number(), boolean(), null() joiners', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          const jt = this._config.joiningTransformer;
          jt.number(42);
          jt.boolean(true);
          jt.null();
        }
      }],
      success (result) {
        try {
          expect(result).to.include('42');
          expect(result).to.include('true');
          expect(result).to.include('null');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('uses nonfiniteNumber() and function() in JS mode', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      joiningConfig: {mode: 'JavaScript'},
      templates: [{
        path: '$',
        template () {
          const jt = this._config.joiningTransformer;
          jt.nonfiniteNumber(Number.POSITIVE_INFINITY);
          jt.function(function testFn () {
            return 1;
          });
          jt.undefined();
        }
      }],
      success (result) {
        try {
          expect(result).to.include('Infinity');
          expect(result).to.include('function');
          expect(result).to.include('undefined');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('rejects nonfinite in non-JS mode', () => {
    expect(() => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            const jt = this._config.joiningTransformer;
            jt.nonfiniteNumber(Number.NaN);
          }
        }],
        success () { /* not reached */ }
      });
    }).to.throw(/not allowed/v);
  });

  it('uses rawAppend on string joiner', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          const jt = this._config.joiningTransformer;
          jt.rawAppend('raw');
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('raw');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('handles element with object elName', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'dom',
      templates: [{
        path: '$',
        template () {
          const doc = /** @type {Document} */ (
            this._config.joiningTransformer._cfg.document
          );
          const el = doc.createElement('span');
          el.setAttribute('class', 'test');
          return el;
        }
      }],
      success (frag) {
        try {
          expect(frag.querySelector('span')?.className).to.equal('test');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('uses DOMJoiningTransformer methods', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'dom',
      templates: [{
        path: '$',
        template () {
          const jt = this._config.joiningTransformer;
          jt.string('text');
          jt.number(123);
          jt.boolean(false);
          jt.null();
        }
      }],
      success (frag) {
        try {
          expect(frag.textContent).to.include('text');
          expect(frag.textContent).to.include('123');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('uses JSONJoiningTransformer methods', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'json',
      templates: [{
        path: '$',
        template () {
          const jt = this._config.joiningTransformer;
          jt.number(456);
          jt.boolean(true);
          jt.null();
        }
      }],
      success (result) {
        try {
          expect(result).to.be.an('array');
          expect(result).to.include(456);
          expect(result).to.include(true);
          expect(result).to.include(null);
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('uses XSLTStyleJSONPathResolver with complex paths', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {a: {b: 'val'}},
      outputType: 'string',
      templates: [
        {path: '$.a.b', priority: 0.5, template () {
          return 'specific';
        }},
        {path: '$.a.*', template () {
          return 'wildcard';
        }}
      ],
      success (result) {
        try {
          expect(result).to.equal('specific');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('handles applyTemplates with mode', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'test'},
      outputType: 'string',
      templates: [
        {path: '$', template () {
          this.applyTemplates({select: '$.x', mode: 'special'});
        }},
        {path: '$.x', mode: 'special', template (v) {
          return `mode:${v}`;
        }}
      ],
      success (result) {
        try {
          expect(result).to.equal('mode:test');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('uses default template for property names', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {prop: 'val'},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.applyTemplates('$~');
        }
      }],
      success (result) {
        try {
          expect(result).to.include('prop');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('uses default template for functions', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {fn () {
        return 'result';
      }},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.applyTemplates('$.fn');
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('result');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('handles index.js autostart false', (done) => {
    const inst = new JTLT({
      data: {x: 'test'},
      outputType: 'string',
      autostart: false,
      templates: [{path: '$', template () {
        this.applyTemplates('$.x');
      }}, {path: '$.x', template (v) {
        return /** @type {string} */ (v);
      }}],
      success (result) {
        try {
          expect(result).to.equal('test');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
    inst.transform('default');
  });

  it('uses ajaxData loading', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      ajaxData: import.meta.dirname + '/data/jsonpath-sample.json',
      outputType: 'string',
      templates: [{
        path: '$.store.book[0].author',
        template (author) {
          return /** @type {string} */ (author);
        }
      }],
      success (result) {
        try {
          expect(result).to.include('Nigel Rees');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });
});

describe('More coverage for missing branches', () => {
  it('uses propOnly on string joiner', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      joiningConfig: {mode: 'JavaScript'},
      templates: [{
        path: '$',
        template () {
          const jt = this._config.joiningTransformer;
          jt.object({}, function () {
            jt.propValue('a', 1);
            jt.propOnly('b', function () {
              jt.number(2);
            });
          });
        }
      }],
      success (result) {
        try {
          expect(result).to.include('"a"');
          expect(result).to.include('"b"');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('throws on propValue without object state', () => {
    // As execution is synchronous at construction, we can assert throw
    expect(() => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            const jt = this._config.joiningTransformer;
            jt.propValue('x', 1);
          }
        }],
        success () { /* not reached */ }
      });
    }).to.throw(/propValue\(\) can only be called after an object state has been set up/v);
  });

  it('uses stringifier with array', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.array([1, 2, 3]);
        }
      }],
      success (result) {
        try {
          expect(result).to.include('1');
          expect(result).to.include('2');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('uses valueOf with select string', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'value'},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.valueOf('$.x');
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('value');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('handles callTemplate with value param', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [
        {path: '$', template () {
          this.callTemplate({
            name: 'test',
            withParam: [{value: 'direct'}]
          });
        }},
        {name: 'test', path: '$', template (v) {
          return /** @type {[string]} */ (v)[0];
        }}
      ],
      success (result) {
        try {
          expect(result).to.equal('direct');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });
});
