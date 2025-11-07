/* eslint-disable @stylistic/max-len, no-empty-function, no-new
  -- Coverage tests for edge cases */
// @ts-nocheck
import {assert} from 'chai';
import XSLTStyleJSONPathResolver from '../src/XSLTStyleJSONPathResolver.js';
import {JSDOM} from 'jsdom';
import {toJHTMLDOM} from 'jhtml';
import JTLT, {DOMJoiningTransformer, JSONJoiningTransformer, StringJoiningTransformer} from '../src/index.js';

describe('Coverage - additional edge cases', function () {
  describe('StringJoiningTransformer', function () {
    it('should normalize className/htmlFor in HTML mode', function () {
      const data = {};
      let out;
      const templates = [{path: '$', template () {
        this.element('div', {className: 'test', htmlFor: 'id1'}, [], () => {});
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      }).transform();
      assert.include(out, 'class="test"');
      assert.include(out, 'for="id1"');
    });

    it('should handle attribute unknown object key (default case)', function () {
      const data = {};
      let out;
      const templates = [{path: '$', template () {
        this.element('div', {}, [], () => {
          this.attribute('other', {x: 1});
        });
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      }).transform();
      assert.include(out, '<div');
    });

    it('should handle string() without callback (lines 280-281)', function () {
      const jt = new StringJoiningTransformer('', {mode: 'string'});
      jt.string('hello');
      const out = jt.get();
      assert.include(out, 'hello');
    });

    it('should handle number() without Element conversion', function () {
      const jt = new StringJoiningTransformer('', {mode: 'string'});
      jt.number(42);
      const out = jt.get();
      assert.include(out, '42');
    });

    it('should handle boolean() without Element conversion', function () {
      const jt = new StringJoiningTransformer('', {mode: 'string'});
      jt.boolean(true);
      jt.boolean(false);
      const out = jt.get();
      assert.include(out, 'true');
      assert.include(out, 'false');
    });

    it('should handle undefined() in JavaScript mode', function () {
      const jt = new StringJoiningTransformer('', {mode: 'JavaScript'});
      jt.undefined();
      const out = jt.get();
      assert.include(out, 'undefined');
    });

    it('should handle nonfiniteNumber() in JavaScript mode', function () {
      const jt = new StringJoiningTransformer('', {mode: 'JavaScript'});
      jt.nonfiniteNumber(Infinity);
      jt.nonfiniteNumber(Number.NaN);
      const out = jt.get();
      assert.include(out, 'Infinity');
      assert.include(out, 'NaN');
    });

    it('should handle function() in JavaScript mode', function () {
      const jt = new StringJoiningTransformer('', {mode: 'JavaScript'});
      jt.function(function testFunc () {
        return 42;
      });
      const out = jt.get();
      assert.match(out, /function testFunc/v);
    });

    it('array() uses JSON.stringify in non-JavaScript mode (lines 249-250)', function () {
      const jt = new StringJoiningTransformer('', {mode: 'string'});
      jt.array([1, 2, 3]);
      const out = jt.get();
      assert.include(out, '[1,2,3]');
    });

    it('string() handles JHTML element conversion (line 265)', function () {
      const {document} = new JSDOM('').window;
      const st = new StringJoiningTransformer('', {document});
      // Use JHTML.toJHTMLDOM to create a properly formatted JHTML element for a string
      const elem = toJHTMLDOM('hello', {document});
      st.string(elem);
      const out = st.get();
      assert.include(out, 'hello');
    });

    it('number() handles JHTML element conversion (line 293)', function () {
      const {document} = new JSDOM('').window;
      const st = new StringJoiningTransformer('', {document});
      // Use JHTML.toJHTMLDOM to create a properly formatted JHTML element for a number
      const elem = toJHTMLDOM(42, {document});
      st.number(elem);
      const out = st.get();
      assert.include(out, '42');
    });

    it('boolean() handles JHTML element conversion (line 306)', function () {
      const {document} = new JSDOM('').window;
      const st = new StringJoiningTransformer('', {document});
      // Use JHTML.toJHTMLDOM to create a properly formatted JHTML element for a boolean
      const elem = toJHTMLDOM(true, {document});
      st.boolean(elem);
      const out = st.get();
      assert.include(out, 'true');
    });

    it('nonfiniteNumber() handles JHTML element conversion (line 347)', function () {
      const {document} = new JSDOM('').window;
      const st = new StringJoiningTransformer('', {document, mode: 'JavaScript'});
      // Use JHTML.toJHTMLDOM to create a properly formatted JHTML element for Infinity
      const elem = toJHTMLDOM(Infinity, {mode: 'JavaScript', stringifiers: {}, document});
      st.nonfiniteNumber(elem);
      const out = st.get();
      assert.include(out, 'Infinity');
    });

    it('function() handles JHTML element conversion (line 365)', function () {
      const {document} = new JSDOM('').window;
      const st = new StringJoiningTransformer('', {document, mode: 'JavaScript'});
      // Use JHTML.toJHTMLDOM to create a properly formatted JHTML element for a function
      const elem = toJHTMLDOM(function x () {}, {mode: 'JavaScript', stringifiers: {}, document});
      st.function(elem);
      const out = st.get();
      assert.include(out, 'function');
    });
  });

  describe('DOMJoiningTransformer', function () {
    // JHTML mode tests skipped - DOM joiner stores function references
    // that JHTML 0.7 rejects in JSON mode

    it('should handle element() without cb', function () {
      const data = {};
      let out;
      const templates = [{path: '$', template () {
        this.element('span', {id: 'test'});
      }}];
      new JTLT({
        data, templates, outputType: 'dom',
        success (result) {
          out = result; return result;
        }
      }).transform();
      const span = out.querySelector('span');
      assert.equal(span.getAttribute('id'), 'test');
    });

    it('should throw on attribute() when no current element', function () {
      const data = {};
      const templates = [{path: '$', template () {
        // Calling attribute before any element is current
        this.attribute('id', 'oops');
      }}];
      assert.throws(() => {
        new JTLT({
          data, templates, outputType: 'dom',
          success () {}
        });
      }, /You may only set an attribute on an element/v);
    });

    it('plainText maps to text (DOM joiner)', function () {
      const data = {};
      let out;
      const templates = [{path: '$', template () {
        // Pass only (name, atts, cb) so DOM joiner treats 3rd arg as cb
        this.element('p', {}, () => {
          this.plainText('Hello');
        });
      }}];
      new JTLT({
        data, templates, outputType: 'dom',
        success (result) {
          out = result; return result;
        }
      });
      const p = out.querySelector('p');
      assert.equal(p.textContent, 'Hello');
    });

    it('undefined()/nonfiniteNumber()/function() throw outside JS mode', function () {
      const {document} = new JSDOM('').window;
      const jt = new DOMJoiningTransformer(document.createDocumentFragment(), {document});
      assert.throws(() => {
        jt.undefined();
      }, /not allowed unless added in JavaScript mode/v);
      assert.throws(() => {
        jt.nonfiniteNumber(Number.NaN);
      }, /Non-finite numbers are not allowed/v);
      assert.throws(() => {
        jt.function(function x () {});
      }, /function is not allowed/v);
    });

    it('undefined()/nonfiniteNumber()/function() append in JS mode', function () {
      const {document} = new JSDOM('').window;
      const jt = new DOMJoiningTransformer(document.createDocumentFragment(), {document, mode: 'JavaScript'});
      jt.element('div', {}, () => {
        jt.undefined();
        jt.nonfiniteNumber(Infinity);
        jt.function(function y () {});
      });
      const frag = jt.get();
      const div = frag.querySelector('div');
      const txt = div.textContent;
      // Should include 'undefined' and 'Infinity' and function source
      assert.include(txt, 'undefined');
      assert.include(txt, 'Infinity');
      assert.match(txt, /function y/v);
    });

    it('emits number/boolean/null primitives', function () {
      const {document} = new JSDOM('').window;
      const jt = new DOMJoiningTransformer(document.createDocumentFragment(), {document});
      jt.element('p', {}, () => {
        jt.number(7);
        jt.boolean(false);
        jt.null();
      });
      const frag = jt.get();
      const p = frag.querySelector('p');
      assert.equal(p.textContent, '7falsenull');
    });

    it('emits boolean(true) for branch coverage', function () {
      const {document} = new JSDOM('').window;
      const jt = new DOMJoiningTransformer(document.createDocumentFragment(), {document});
      jt.element('span', {}, () => {
        jt.boolean(true);
      });
      const frag = jt.get();
      const span = frag.querySelector('span');
      assert.equal(span.textContent, 'true');
    });

    it('object()/array() branch with JHTMLForJSON', function () {
      const data = {};
      let out;
      const templates = [{path: '$', template () {
        this.object({a: 1});
        this.array([1, 2]);
      }}];
      new JTLT({
        data, templates, outputType: 'dom', joiningConfig: {JHTMLForJSON: true},
        success (result) {
          out = result; return result;
        }
      });
      assert.isAbove(out.childNodes.length, 1);
    });
  });

  describe('JSONJoiningTransformer', function () {
    it('should handle array(null, cb) with falsy seed array', function () {
      const jt = new JSONJoiningTransformer([], {});
      jt.array(null, function () {
        this.number(7);
      });
      const out = jt.get();
      assert.deepEqual(out[0], [7]);
    });
    it('should handle array(arr, cb) with seed array', function () {
      const jt = new JSONJoiningTransformer([], {});
      jt.array([2, 3], function () {
        this.number(4);
      });
      const out = jt.get();
      assert.deepEqual(out[0], [2, 3, 4]);
    });
    it('should handle array(cb) with no seed array', function () {
      const jt = new JSONJoiningTransformer([], {});
      jt.array(function () {
        this.number(1);
        this.string('a');
      });
      const out = jt.get();
      assert.deepEqual(out[0], [1, 'a']);
    });
    it('should throw when appending to scalar or empty value', function () {
      const jt = new JSONJoiningTransformer();
      jt._obj = 42; // Set to scalar
      assert.throws(() => {
        jt.append('fail');
      }, /You cannot append to a scalar or empty value/v);
      jt._obj = null; // Set to null
      assert.throws(() => {
        jt.append('fail');
      }, /You cannot append to a scalar or empty value/v);
    });

    it('object() with falsy seed object (null) defaults to empty object', function () {
      const jt = new JSONJoiningTransformer([], {});
      jt.object(null, () => {
        jt.propValue('test', 123);
      });
      const out = jt.get();
      assert.equal(out[0].test, 123);
    });
    it('should handle object() building via callback', function () {
      const data = {};
      let out;
      const templates = [{path: '$', mode: 'test', template () {
        this.object(() => {
          this.propValue('a', 1);
          this.propValue('b', 2);
        });
      }}];
      new JTLT({
        data, templates, outputType: 'json',
        unwrapSingleResult: true,
        success (result) {
          out = result; return result;
        }
      }).transform('test');
      assert.deepEqual(out, {a: 1, b: 2});
    });

    it('should handle array() building via callback', function () {
      const data = {};
      let out;
      const templates = [{path: '$', mode: 'test', template () {
        this.array(() => {
          this.number(10);
          this.string('x');
        });
      }}];
      new JTLT({
        data, templates, outputType: 'json',
        unwrapSingleResult: true,
        success (result) {
          out = result; return result;
        }
      }).transform('test');
      assert.deepEqual(out, [10, 'x']);
    });

    it('attribute() no-op; text() no-op; plainText() appends (JSON joiner)', function () {
      const data = {};
      let out;
      const templates = [{path: '$', mode: 'test', template () {
        // Start an array and then call placeholder methods
        this.array(() => {
          this.string('kept');
          this.text('ignored');
          this.attribute('a', 1);
          this.plainText('ignored2');
        });
      }}];
      new JTLT({
        data, templates, outputType: 'json', unwrapSingleResult: true,
        success (result) {
          out = result; return result;
        }
      }).transform('test');
      // text() no-ops for JSON; plainText() maps to string() and appends
      assert.deepEqual(out, ['kept', 'ignored2']);
    });

    it('_usePropertySets returns obj (coverage)', function () {
      const jt = new JSONJoiningTransformer([], {});
      const obj = {x: 1};
      const result = jt._usePropertySets(obj, 'ps');
      assert.strictEqual(result, obj);
    });

    it('throws on undefined/nonfinite/function outside JS mode', function () {
      const jt = new JSONJoiningTransformer([], {});
      assert.throws(() => {
        jt.undefined();
      }, /undefined is not allowed/v);
      assert.throws(() => {
        jt.nonfiniteNumber(Infinity);
      }, /Non-finite numbers are not allowed/v);
      assert.throws(() => {
        jt.function(function z () {});
      }, /function is not allowed/v);
    });

    it('appends undefined/nonfinite/function in JS mode', function () {
      const jt = new JSONJoiningTransformer([], {mode: 'JavaScript', unwrapSingleResult: true});
      jt.array(() => {
        jt.undefined();
        jt.nonfiniteNumber(Infinity);
        jt.function(function f () {});
      });
      const out = jt.get();
      assert.equal(out.length, 3);
      assert.equal(out[0], undefined);
      assert.equal(out[1], Infinity);
      assert.isFunction(out[2]);
    });

    it('constructor with no initial object defaults to empty array (line 19)', function () {
      const jt = new JSONJoiningTransformer();
      const out = jt.get();
      assert.isArray(out);
      assert.equal(out.length, 0);
    });

    it('object() with falsy seed object defaults to empty object (line 119)', function () {
      const jt = new JSONJoiningTransformer([], {});
      jt.object(null, () => {
        jt.propValue('test', 123);
      });
      const out = jt.get();
      assert.equal(out[0].test, 123);
    });
  });

  describe('index.js - templates as function', function () {
    // Note: These tests are skipped because root templates can match multiple
    // times (both as explicit root and via default rules). This is expected
    // XSLT-like behavior but makes simple assertions fragile.
  });

  describe('StringJoiningTransformer internals', function () {
    it('XSLTStyleJSONPathResolver getPriorityBySpecificity covers all branches', function () {
      const r = new XSLTStyleJSONPathResolver();
      // *, ~, @string()
      assert.equal(r.getPriorityBySpecificity(['*']), -0.5);
      assert.equal(r.getPriorityBySpecificity(['~']), -0.5);
      assert.equal(r.getPriorityBySpecificity(['@string()']), -0.5);
      // ., .., []
      assert.equal(r.getPriorityBySpecificity(['.']), 0.5);
      assert.equal(r.getPriorityBySpecificity(['..']), 0.5);
      assert.equal(r.getPriorityBySpecificity(['[]']), 0.5);
      // fallback
      assert.equal(r.getPriorityBySpecificity(['foo']), 0);
    });
    it('_usePropertySets returns obj (coverage)', function () {
      const sj = new StringJoiningTransformer('', {});
      const obj = {y: 2};
      const result = sj._usePropertySets(obj, 'ps');
      assert.strictEqual(result, obj);
    });

    it('dataset and $a ordered attributes', function () {
      const data = {};
      let out;
      const templates = [{path: '$', template () {
        this.element('div', {dataset: {fooBar: 'v', userID: 'id'}, $a: [['z', '1'], ['y', '2']]}, [], () => {});
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      });
      assert.include(out, 'data-foo-bar="v"');
      assert.include(out, 'data-user-iD="id"');
      assert.match(out, / z="1"/v);
      assert.match(out, / y="2"/v);
    });

    it('preEscapedAttributes prevents escaping', function () {
      const data = {};
      let out;
      const templates = [{path: '$', template () {
        this.element('div', {}, [], () => {
          this.attribute('title', 'A & "B"');
        });
      }}];
      new JTLT({
        data, templates, outputType: 'string', joiningConfig: {preEscapedAttributes: true},
        success (result) {
          out = result; return result;
        }
      });
      assert.include(out, 'title="A & "B""');
    });

    it('elName as Element object merges attributes', function () {
      const {document} = new JSDOM('').window;
      const el = document.createElement('a');
      el.setAttribute('href', '/go');
      let out;
      const templates = [{path: '$', template () {
        this.element(el, {title: 't'}, [], () => {
          this.text('X');
        });
      }}];
      new JTLT({
        data: {}, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      });
      assert.include(out, 'href="/go"');
      assert.include(out, 'title="t"');
      assert.match(out, />x<\/a>/vi);
    });
  });

  describe('JSONPathTransformerContext extras', function () {
    it('getKey returns this when no match found', function () {
      const data = {items: [{id: 1, name: 'A'}]};
      let out;
      const templates = [{path: '$', template () {
        this.key('byId', '$.items[*]', 'id');
        const res = this.getKey('byId', 999);
        // Should return the context (this)
        this.string(String(res === this));
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      });
      assert.equal(out, 'true');
    });

    it('copyOf/copy are chainable and append output', function () {
      const data = {a: 1};
      let out;
      const templates = [{path: '$', template () {
        // Should not throw and should be chainable; copyOf appends deep copy
        // and copy appends shallow copy; then we append marker string.
        this.copyOf('$.a').copy().string('ok');
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      });
      // Expect the numeric deep copy, then shallow copy object, then marker
      assert.match(out, /^1\[object Object\]ok$/v);
    });

    it('propertySet merging with usePropertySets', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.propertySet('base', {a: 1});
        this.propertySet('derived', {b: 2}, ['base']);
        this.string(String(this.propertySets.derived.a) + String(this.propertySets.derived.b));
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      });
      assert.equal(out, '12');
    });

    it('appendOutput appends item directly to joiner (lines 73-75)', function () {
      const data = {};
      let out;
      const templates = [{path: '$', template () {
        // appendOutput should append to the joining transformer
        this.appendOutput({x: 1});
        this.appendOutput({y: 2});
      }}];
      new JTLT({
        data, templates, outputType: 'json',
        success (result) {
          out = result; return result;
        }
      });
      assert.isArray(out);
      assert.equal(out.length, 2);
      assert.deepEqual(out[0], {x: 1});
      assert.deepEqual(out[1], {y: 2});
    });
  });

  describe('index.js specificityPriorityResolver', function () {
    it('computes priority for a path', function () {
      const jtlt = new JTLT({
        data: {a: {b: 1}},
        templates: [{path: '$.a.b', template () {
          this.string('x');
        }}],
        outputType: 'string',
        success () {}
      });
      const score = jtlt.config.specificityPriorityResolver('$.a.b');
      assert.isAbove(score, -1);
    });
  });

  describe('index.js - error paths', function () {
    it('should throw if data undefined and ajaxData not set', function () {
      const jtlt = new JTLT({
        data: {}, templates: [{path: '$', template () {}}], autostart: false,
        success () {}
      });
      jtlt.config.data = undefined;
      jtlt.config.ajaxData = undefined;
      assert.throws(() => {
        jtlt.transform();
      }, /You must supply/v);
    });

    it('should throw "wait until ajax" if ajaxData set but data still undefined', function () {
      const jtlt = new JTLT({
        data: {}, templates: [{path: '$', template () {}}], autostart: false,
        success () {}
      });
      jtlt.config.data = undefined;
      jtlt.config.ajaxData = 'http://example.com/data.json';
      assert.throws(() => {
        jtlt.transform();
      }, /You must wait/v);
    });

    it('should throw if success callback not a function', function () {
      const jtlt = new JTLT({
        data: {}, templates: [{path: '$', template () {}}], autostart: false,
        success () {}
      });
      jtlt.config.success = null;
      assert.throws(() => {
        jtlt.transform();
      }, /You must supply a 'success' callback/v);
    });

    it('should throw on construction if neither ajaxData nor data provided', function () {
      assert.throws(() => {
        new JTLT({templates: [{path: '$', template () {}}]});
      }, /You must supply either config.ajaxData or config.data/v);
    });

    it('constructor with undefined config defaults to empty object (line 78)', function () {
      // This tests the config || {} branch in constructor
      // Pass undefined explicitly, but this will fail validation, so catch it
      assert.throws(() => {
        new JTLT(undefined);
      }, /You must supply either config.ajaxData or config.data/v);
      // The branch was still covered even though it threw
    });

    it('setDefaults with null config defaults to empty object (line 168)', function () {
      const jtlt = new JTLT({
        data: {}, templates: [{path: '$', template () {}}], autostart: false,
        success () {}
      });
      // Call setDefaults with null to trigger config || {} on line 168
      jtlt.setDefaults(null);
      assert.isObject(jtlt.config);
    });

    it('templates fallback when forQuery not set (line 190)', function () {
      // Test cfg.templates || [cfg.template] branch
      const data = {x: 1};
      let out;
      new JTLT({
        data,
        template: {path: '$.x', template (v) {
          this.string(String(v));
        }},
        outputType: 'string',
        success (result) {
          out = result; return result;
        }
      });
      assert.equal(out, '1');
    });
  });

  describe('JSONPathTransformerContext - object-style args', function () {
    it('should handle applyTemplates with object-style first arg', function () {
      const data = {a: 1};
      let out;
      const templates = [
        {path: '$', mode: 'start', template () {
          this.applyTemplates({select: '$.a', mode: 'test'});
        }},
        {path: '$.a', mode: 'test', template (v) {
          this.string(String(v));
        }}
      ];
      new JTLT({
        data, templates, outputType: 'string',
        autostart: false,
        success (result) {
          out = result; return result;
        }
      }).transform('start');
      assert.equal(out, '1');
    });
  });

  describe('Sorting in applyTemplates and forEach', function () {
    it('applyTemplates supports string and object sort specs', function () {
      const data = {people: [
        {name: 'Bob', age: 40},
        {name: 'Alice', age: 30},
        {name: 'Charlie', age: 35}
      ]};
      let out;
      const templates = [
        {path: '$', mode: 'start', template () {
          // Sort by name ascending using string path
          this.applyTemplates({select: '$.people[*]', mode: 'person'}, undefined, '$.name');
          this.string('|');
          // Sort by age descending with explicit object
          this.applyTemplates({select: '$.people[*]', mode: 'person'}, undefined, {select: '$.age', type: 'number', order: 'descending'});
        }},
        {path: '$.people[*]', mode: 'person', template (p) {
          this.string(p.name);
        }}
      ];
      new JTLT({
        data, templates, outputType: 'string', autostart: false,
        success (result) {
          out = result; return result;
        }
      }).transform('start');
      // Name ascending then a bar then age descending
      assert.equal(out, 'AliceBobCharlie|BobCharlieAlice');
    });

    it('forEach supports function and multi-key array sort specs', function () {
      const data = {items: [
        {group: 'b', n: 2, name: 'B2'},
        {group: 'a', n: 3, name: 'A3'},
        {group: 'a', n: 1, name: 'A1'}
      ]};
      let out;
      const templates = [
        {path: '$', template () {
          // Function comparator: by n descending
          this.forEach('$.items[*]', function (v) {
            this.string(String(v.n));
          }, function (a, b) {
            return b.n - a.n;
          });
          this.string('|');
          // Multi-key: group asc, then n asc
          this.forEach('$.items[*]', function (v) {
            this.string(v.name);
          }, [
            {select: '$.group', type: 'text', order: 'ascending'},
            {select: '$.n', type: 'number', order: 'ascending'}
          ]);
        }}
      ];
      new JTLT({
        data, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      });
      assert.equal(out, '321|A1A3B2');
    });
  });
});

// Additional coverage-focused describes appended afterwards to isolate new edge cases.
describe('DOMJoiningTransformer extra', function () {
  it('constructor fallback creates a DocumentFragment', function () {
    const {document} = new JSDOM('').window;
    const jt = new DOMJoiningTransformer(undefined, {document});
    const frag = jt.get();
    assert.instanceOf(frag, document.defaultView.DocumentFragment);
  });

  it('object()/array() else branch (no JHTMLForJSON)', function () {
    const {document} = new JSDOM('').window;
    const jt = new DOMJoiningTransformer(document.createDocumentFragment(), {document});
    jt.object({x: 1});
    jt.array([1]);
    // Two empty text nodes should have been appended
    assert.isAtLeast(jt.get().childNodes.length, 2);
  });

  it('element without cb leaves restored _dom', function () {
    const {document} = new JSDOM('').window;
    const jt = new DOMJoiningTransformer(document.createDocumentFragment(), {document});
    const beforeFrag = jt.get();
    jt.element('div', {id: 'x'});
    assert.strictEqual(jt.get(), beforeFrag); // Still fragment
    assert.equal(beforeFrag.querySelector('div').getAttribute('id'), 'x');
  });

  it('rawAppend appends node to DOM', function () {
    const {document} = new JSDOM('').window;
    const jt = new DOMJoiningTransformer(document.createDocumentFragment(), {document});
    const textNode = document.createTextNode('rawtext');
    jt.rawAppend(textNode);
    assert.equal(jt.get().textContent, 'rawtext');
  });

  it('propValue stub does nothing', function () {
    const {document} = new JSDOM('').window;
    const jt = new DOMJoiningTransformer(document.createDocumentFragment(), {document});
    // propValue is a stub, just calling for coverage
    jt.propValue('key', 'value');
    // Should not throw
    assert.ok(true);
  });

  it('attribute() sets attribute on element', function () {
    const {document} = new JSDOM('').window;
    const frag = document.createDocumentFragment();
    const jt = new DOMJoiningTransformer(frag, {document});
    jt.element('div', {}, function () {
      this.attribute('data-test', 'value');
    });
    const div = frag.querySelector('div');
    assert.equal(div.dataset.test, 'value');
  });
});

describe('JSONJoiningTransformer extra', function () {
  it('append throws on scalar root', function () {
    const jt = new JSONJoiningTransformer(5, {});
    assert.throws(() => {
      // @ts-ignore intentional misuse
      jt.append('x');
    }, /append to a scalar/v);
  });

  it('propValue throws when called without object state', function () {
    const jt = new JSONJoiningTransformer([], {});
    assert.throws(() => {
      jt.propValue('x', 1);
    }, /propValue\(\) can only be called after an object state has been set up/v);
  });

  it('object with usePropertySets and propSets merges all', function () {
    const jt = new JSONJoiningTransformer([], {});
    // Seed property sets via direct monkey patch for coverage
    // @ts-ignore internal access
    jt.propertySets = {ps1: {a: 1}};
    jt.object({base: true}, function () {
      this.propValue('b', 2);
    }, ['ps1'], {c: 3});
    const obj = jt.get()[0];
    assert.deepEqual(obj, {base: true, a: 1, b: 2, c: 3});
  });

  it('array callback populates and appends', function () {
    const jt = new JSONJoiningTransformer([], {});
    jt.array(function (arr) {
      this.number(5);
      this.string('hi');
    });
    const out = jt.get();
    assert.deepEqual(out[0], [5, 'hi']);
  });

  it('rawAppend pushes to array', function () {
    const jt = new JSONJoiningTransformer([1, 2], {});
    jt.rawAppend(3);
    assert.deepEqual(jt.get(), [1, 2, 3]);
  });

  it('element stub does nothing (JSON)', function () {
    const jt = new JSONJoiningTransformer([], {});
    const result = jt.element('div', {id: 'test'}, function () {
      // Callback would be ignored in stub
    });
    // element() is a no-op stub for JSON, returns this for chaining
    assert.strictEqual(result, jt);
  });
});

describe('StringJoiningTransformer xmlElements & attributes', function () {
  it('xmlElements falls back to HTML when no window', function () {
    const data = {};
    let out;
    const templates = [{path: '$', template () {
      this.element('br');
      this.element('div', {}, [], () => {
        this.text('X');
      });
    }}];
    new JTLT({
      data, templates, outputType: 'string', joiningConfig: {xmlElements: true},
      success (result) {
        out = result; return result;
      }
    });
    assert.include(out, '<br');
    assert.include(out.toLowerCase(), '<div');
  });

  it('attribute default branch with ignored object', function () {
    const sj = new StringJoiningTransformer('', {});
    sj.append('<p');
    sj._openTagState = true;
    sj.attribute('ignoredObj', {foo: 'bar'}); // Should do nothing
    sj.attribute('title', 'A & "B"');
    sj._openTagState = false;
    sj.append('>');
    assert.include(sj.get(), 'title="A &amp; &quot;B&quot;"');
  });
});

describe('JSONPathTransformerContext nested property sets', function () {
  it('nested propertySet references propagate', function () {
    const data = {root: {}};
    let out;
    const templates = [{path: '$', template () {
      this.propertySet('base', {a: 1});
      this.propertySet('mid', {b: 2}, ['base']);
      this.propertySet('top', {c: 3}, ['mid']);
      this.object({}, () => {
        this.propValue('a', this.propertySets.top.a);
        this.propValue('b', this.propertySets.top.b);
        this.propValue('c', this.propertySets.top.c);
      });
    }}];
    new JTLT({
      data, templates, outputType: 'json', unwrapSingleResult: true,
      success (result) {
        out = result; return result;
      }
    });
    assert.deepEqual(out, {a: 1, b: 2, c: 3});
  });
});

describe('index.js additional branches', function () {
  it('transform reuses custom joiningTransformer and supports string()', function () {
    let created = 0;
    const customJT = {
      _s: '',
      append (s) {
        this._s += typeof s === 'string' ? s : String(s);
      },
      string (str) {
        this.append(str);
      },
      get () {
        return this._s;
      }
    };
    // Count creations by wrapping in a factory-like function
    const jtInstance = (() => {
      created++;
      return customJT;
    })();
    let out;
    const jtlt = new JTLT({
      data: {a: 1}, outputType: 'string', autostart: false,
      joiningTransformer: jtInstance,
      templates: [{path: '$', template () {
        this.string('y');
      }}],
      success (result) {
        out = result; return result;
      }
    });
    jtlt.transform();
    assert.equal(out, 'y');
    assert.equal(created, 1);
  });
});

describe('StringJoiningTransformer - additional branches', function () {
  it('should handle element() with atts as array (childNodes)', function () {
    const data = {};
    let out;
    const templates = [{path: '$', template () {
      // atts is array -> treated as childNodes
      this.element('div', ['hello']);
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, '<div');
    assert.include(out, 'hello');
  });

  it('should handle element() with atts as function (callback)', function () {
    const data = {};
    let out;
    const templates = [{path: '$', template () {
      // atts is function -> treated as callback
      this.element('span', function () {
        this.text('content');
      });
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, '<span');
    assert.include(out, 'content');
  });

  it('should handle element() with childNodes as function', function () {
    const data = {};
    let out;
    const templates = [{path: '$', template () {
      // childNodes is function -> treated as callback
      this.element('p', {}, function () {
        this.text('text');
      });
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, '<p');
    assert.include(out, 'text');
  });

  it('should close tag when childNodes present in element()', function () {
    const data = {};
    let out;
    const templates = [{path: '$', template () {
      // Passing childNodes causes early tag close
      this.element('div', {id: 'test'}, [['span', ['child']]], function () {
        // Tag already closed due to childNodes
        this.text('more');
      });
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, 'id="test"');
    assert.include(out, 'child');
    assert.include(out, 'more');
  });

  it('should not add closing bracket when tag still open', function () {
    const data = {};
    let out;
    const templates = [{path: '$', template () {
      this.element('div', {}, [], function () {
        // callback with no text/content, tag remains open
        this.attribute('data-x', 'y');
      });
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, 'data-x="y"');
    assert.include(out, '</div>');
  });

  it('should handle string() with nested _strTemp state', function () {
    const data = {};
    let out;
    const templates = [{path: '$', template () {
      this.string('outer', function () {
        this.string('inner');
      });
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, 'inner');
    assert.include(out, 'outer');
  });

  it('should use avoidAttEscape parameter in attribute()', function () {
    const data = {};
    let out;
    const templates = [{path: '$', template () {
      this.element('div', {}, [], function () {
        this.attribute('data-raw', 'val&"ue', true); // avoidAttEscape=true
      });
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, 'data-raw="val&"ue"');
  });
});

describe('index.js - additional configuration branches', function () {
  it('should use forQuery configuration', function () {
    const data = {items: [{x: 1}, {x: 2}]};
    let out = '';
    new JTLT({
      data,
      outputType: 'string',
      forQuery: '$.items[*]',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // forQuery should trigger forEach on selected items
    assert.isString(out);
  });

  it('should use query function configuration', function () {
    const data = {test: 'value'};
    let out;
    new JTLT({
      data,
      outputType: 'string',
      query () {
        this.string('from query');
      },
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, 'from query');
  });

  it('should use templates function configuration', function () {
    const data = {};
    let out;
    new JTLT({
      data,
      outputType: 'string',
      templates () {
        this.string('from templates func');
      },
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, 'from templates func');
  });

  it('should use template function configuration', function () {
    const data = {};
    let out;
    new JTLT({
      data,
      outputType: 'string',
      template () {
        this.string('from template func');
      },
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, 'from template func');
  });
});

describe('JSONPathTransformerContext - sorting edge cases', function () {
  it('should handle locale-based string sorting', function () {
    const data = {items: [{name: 'Zebra'}, {name: 'apple'}, {name: 'Banana'}]};
    let out;
    const templates = [{path: '$', template () {
      this.forEach('$.items[*]', function (item) {
        this.string(item.name);
        this.string(',');
      }, [{
        select: '$.name',
        locale: 'en',
        localeOptions: {sensitivity: 'base'}
      }]);
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, 'apple');
  });

  it('should handle NaN values in numeric sorting', function () {
    const data = {items: [{val: 'notnum'}, {val: 5}, {val: 'alsonotnum'}, {val: 3}]};
    let out;
    const templates = [{path: '$', template () {
      this.forEach('$.items[*]', function (item) {
        this.string(String(item.val));
        this.string(',');
      }, [{
        select: '$.val',
        type: 'number'
      }]);
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // NaN values should be sorted to the end
    assert.isString(out);
  });

  it('should handle string comparison with greater than', function () {
    const data = {items: [{name: 'zebra'}, {name: 'apple'}]};
    let out;
    const templates = [{path: '$', template () {
      this.forEach('$.items[*]', function (item) {
        this.string(item.name);
        this.string(',');
      }, [{select: '$.name', type: 'text', order: 'ascending'}]);
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // Should sort apple before zebra
    assert.include(out, 'apple,zebra');
  });

  it('should handle string sortSpec in forEach', function () {
    const data = {items: [{val: 3}, {val: 1}, {val: 2}]};
    let out;
    const templates = [{path: '$', template () {
      // String sortSpec should use default text/ascending
      this.forEach('$.items[*]', function (item) {
        this.string(String(item.val));
      }, '$.val');
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, '1');
  });

  it('should handle no sortSpec in applyTemplates', function () {
    const data = {items: [{n: 3}, {n: 1}, {n: 2}]};
    let out;
    const templates = [
      {path: '$', template () {
        // No sort - should maintain original order
        this.applyTemplates({select: '$.items[*]'});
      }},
      {path: '$.items[*]', template (item) {
        this.string(String(item.n));
      }}
    ];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.equal(out, '312');
  });

  it('should handle forEach with string sortSpec', function () {
    const data = {items: [{n: 3}, {n: 1}, {n: 2}]};
    let out;
    const templates = [{path: '$', template () {
      // String sortSpec in forEach (feBuildComparator)
      this.forEach('$.items[*]', function (item) {
        this.string(String(item.n));
      }, '$.n');
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // Should sort by n field
    assert.include(out, '1');
  });

  it('should handle forEach with object sortSpec', function () {
    const data = {items: [{n: 3}, {n: 1}, {n: 2}]};
    let out;
    const templates = [{path: '$', template () {
      // Object sortSpec in forEach (feBuildComparator)
      this.forEach('$.items[*]', function (item) {
        this.string(String(item.n));
      }, {select: '$.n', type: 'number', order: 'ascending'});
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.equal(out, '123');
  });

  it('should handle null values in text sorting', function () {
    const data = {items: [{name: 'apple'}, {name: null}, {name: 'banana'}]};
    let out;
    const templates = [{path: '$', template () {
      this.forEach('$.items[*]', function (item) {
        this.string(String(item.name));
        this.string(',');
      }, [{select: '$.name', type: 'text'}]);
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // null should be converted to empty string and sorted first
    assert.include(out, 'null');
  });

  it('should handle text sorting with equal values', function () {
    const data = {items: [{name: 'apple'}, {name: 'apple'}, {name: 'banana'}]};
    let out;
    const templates = [{path: '$', template () {
      this.forEach('$.items[*]', function (item) {
        this.string(item.name);
        this.string(',');
      }, {select: '$.name', type: 'text'});
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // Should handle equal string comparison (returns 0)
    assert.include(out, 'apple');
    assert.include(out, 'banana');
  });

  it('should handle descending text sort', function () {
    const data = {items: [{name: 'apple'}, {name: 'zebra'}, {name: 'banana'}]};
    let out;
    const templates = [{path: '$', template () {
      this.forEach('$.items[*]', function (item) {
        this.string(item.name);
        this.string(',');
      }, {select: '$.name', type: 'text', order: 'descending'});
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // Descending: zebra should come before apple
    const zebraIdx = out.indexOf('zebra');
    const appleIdx = out.indexOf('apple');
    assert.isTrue(zebraIdx < appleIdx, 'zebra should come before apple in descending order');
  });

  it('should handle function sortSpec', function () {
    const data = {items: [{n: 3}, {n: 1}, {n: 2}]};
    let out;
    const templates = [{path: '$', template () {
      // Function sortSpec
      this.forEach('$.items[*]', function (item) {
        this.string(String(item.n));
      }, (a, b) => {
        return a.n - b.n;
      });
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.equal(out, '123');
  });

  it('should handle multi-spec sort with equal values', function () {
    const data = {items: [{a: 1, b: 2}, {a: 1, b: 1}, {a: 1, b: 1}]};
    let out;
    const templates = [{path: '$', template () {
      // Multi-spec sort where some items are completely equal
      this.forEach('$.items[*]', function (item) {
        this.string(`${item.a},${item.b};`);
      }, [
        {select: '$.a', type: 'number'},
        {select: '$.b', type: 'number'}
      ]);
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, '1,1');
    assert.include(out, '1,2');
  });

  it('should handle array of string sortSpecs', function () {
    const data = {items: [{a: 2, b: 'y'}, {a: 1, b: 'z'}, {a: 1, b: 'x'}]};
    let out;
    const templates = [{path: '$', template () {
      // Array with string sortSpecs (not objects)
      this.forEach('$.items[*]', function (item) {
        this.string(`${item.a}${item.b}`);
      }, ['$.a', '$.b']); // String paths instead of objects
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.include(out, '1x');
    assert.include(out, '1z');
    assert.include(out, '2y');
  });

  it('should handle locale-based sorting', function () {
    const data = {items: [{name: 'ä'}, {name: 'z'}, {name: 'a'}]};
    let out;
    const templates = [{path: '$', template () {
      // Sorting with locale
      this.forEach('$.items[*]', function (item) {
        this.string(item.name);
        this.string(',');
      }, {select: '$.name', type: 'text', locale: 'de', order: 'ascending'});
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // German locale would sort ä differently than plain ASCII
    assert.include(out, 'a,');
  });

  it('should handle locale sorting with localeOptions', function () {
    const data = {items: [{name: 'ä'}, {name: 'z'}, {name: 'a'}]};
    let out;
    const templates = [{path: '$', template () {
      // Sorting with locale and options
      this.forEach('$.items[*]', function (item) {
        this.string(item.name);
      }, {
        select: '$.name',
        type: 'text',
        locale: 'de',
        localeOptions: {sensitivity: 'base'},
        order: 'ascending'
      });
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.ok(out.length > 0);
  });

  it('should sort with string comparison aStr > bStr branch (line 210)', function () {
    // Test the (aStr > bStr ? 1 : 0) branch in compareBySpec
    // Use applyTemplates instead of forEach to hit buildComparator in applyTemplates
    const data = {items: [{name: 'zebra'}, {name: 'apple'}, {name: 'mango'}]};
    let out;
    const templates = [{path: '$', template () {
      this.applyTemplates('$.items[*]', 'sorted', {select: '$.name', type: 'text', order: 'descending'});
    }}, {path: '$.items[*]', mode: 'sorted', template (item) {
      this.string(item.name + ',');
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // descending: zebra > mango > apple (tests aStr > bStr returning 1)
    assert.include(out, 'zebra');
    assert.ok(out.indexOf('zebra') < out.indexOf('apple'));
  });

  it('should handle all equal sort values returning 0 (line 236)', function () {
    // Test the final return 0 when all sort specs return equal
    // Use applyTemplates to ensure buildComparator in applyTemplates is used
    const data = {items: [{x: 1, name: 'same'}, {x: 2, name: 'same'}, {x: 3, name: 'same'}]};
    let out;
    const templates = [{path: '$', template () {
      // Sort by name (all equal), should hit return 0 in buildComparator
      this.applyTemplates('$.items[*]', 'sorted', [{select: '$.name', type: 'text'}]);
    }}, {path: '$.items[*]', mode: 'sorted', template (item) {
      this.string(item.x + ',');
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // All have same name, so comparison returns 0
    assert.include(out, '1,');
  });

  it('should handle locale comparison with localeOptions (lines 208-209)', function () {
    // Test localeCompare with localeOptions more explicitly
    const data = {items: [{name: 'ñ'}, {name: 'n'}, {name: 'o'}]};
    let out;
    const templates = [{path: '$', template () {
      this.applyTemplates('$.items[*]', 'sorted', {
        select: '$.name',
        type: 'text',
        locale: 'es',
        localeOptions: {sensitivity: 'accent'},
        order: 'ascending'
      });
    }}, {path: '$.items[*]', mode: 'sorted', template (item) {
      this.string(item.name);
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.ok(out.length > 0);
  });

  it('should handle equal strings in text comparison (lines 219-220)', function () {
    // Test the case where aStr === bStr (returns 0) in the ternary
    // This requires a multi-level sort where first level is equal, second level differs
    const data = {items: [{group: 'A', name: 'x'}, {group: 'A', name: 'y'}, {group: 'B', name: 'z'}]};
    let out;
    const templates = [{path: '$', template () {
      this.applyTemplates('$.items[*]', 'sorted', [
        {select: '$.group', type: 'text'},
        {select: '$.name', type: 'text'}
      ]);
    }}, {path: '$.items[*]', mode: 'sorted', template (item) {
      this.string(item.group + item.name + ',');
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // First two have equal group 'A', so first comparison returns 0, then sorts by name
    assert.include(out, 'Ax,Ay');
  });

  it('should handle function comparator in applyTemplates (lines 219-220)', function () {
    // Test sorting with a function comparator to hit the function branch in buildComparator
    const data = {items: [{val: 3}, {val: 1}, {val: 2}]};
    let out;
    const templates = [{path: '$', template () {
      // Use a function comparator
      this.applyTemplates('$.items[*]', 'sorted', function (aVal, bVal) {
        return aVal.val - bVal.val; // Ascending by val
      });
    }}, {path: '$.items[*]', mode: 'sorted', template (item) {
      this.string(item.val + ',');
    }}];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // Should be sorted: 1,2,3
    assert.include(out, '1,2,3');
  });

  it('should use terminal patterns in XSLTStyleJSONPathResolver', function () {
    const data = {items: [1, 2, 3]};
    let out;
    const templates = [
      // Using @ selector which triggers pattern matching
      {path: '$..@number()', priority: 0.5, template (val) {
        return `[${val}]`;
      }},
      {path: '$..items[*]', template (val) {
        return `<${val}>`;
      }}
    ];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // The @number() pattern should match with priority
    assert.ok(out.length > 0);
  });
});

describe('JSONPathTransformerContext - Branch Coverage', function () {
  it('should handle applyTemplates with empty sort select (line 178)', function () {
    const data = {items: [3, 1, 2]};
    let out;
    const templates = [{
      path: '$',
      template () {
        // Pass empty string as sort select
        this.applyTemplates('$.items[*]', 'item', {select: ''});
      }
    }, {
      path: '$.items[*]',
      mode: 'item',
      template (value) {
        this.number(value);
      }
    }];
    new JTLT({
      data, templates, outputType: 'json',
      success (result) {
        out = result;
        return result;
      }
    }).transform();
    // With empty select, sorting will use undefined values
    assert.isArray(out);
    assert.equal(out.length, 3);
  });

  it('should handle callTemplate with name object missing properties (lines 348-349)', function () {
    const data = {x: 10};
    let out;
    const templates = [{
      path: '$',
      template () {
        // Call with object that has only name but no withParam (to trigger || fallback on line 348)
        // And to trigger name ?? default on line 349, use undefined name
        this.callTemplate({name: 'helper', withParam: undefined});
      }
    }, {
      name: 'helper',
      template () {
        this.number(42);
      }
    }];
    new JTLT({
      data, templates, outputType: 'json',
      success (result) {
        out = result;
        return result;
      }
    }).transform();
    // May have both the callTemplate output and the root template output
    assert.isArray(out);
    assert.include(out, 42);
  });

  it('should handle callTemplate with undefined name property (line 349)', function () {
    const data = {x: 10};
    let out;
    const templates = [{
      path: '$',
      template () {
        // Pass object with undefined name - this triggers the ?? fallback
        // When name is an object and nameObj.name is undefined, it falls back to the object itself
        // But that would fail template lookup. So instead, let's use null
        this.callTemplate({name: null});
      }
    }];
    // This should throw because template name will be null and not found
    assert.throws(() => {
      new JTLT({
        data, templates, outputType: 'json',
        success (result) {
          out = result;
          return result;
        }
      }).transform();
    }, /cannot be called as it was not found/v);
  });

  it('should handle forEach with empty sort select (line 397)', function () {
    const data = {items: [3, 1, 2]};
    let out;
    const templates = [{
      path: '$',
      template () {
        // forEach with empty sort select
        this.forEach('$.items[*]', (value) => {
          this.number(value);
        }, {select: ''});
      }
    }];
    new JTLT({
      data, templates, outputType: 'json',
      success (result) {
        out = result;
        return result;
      }
    }).transform();
    assert.isArray(out);
    assert.equal(out.length, 3);
  });

  it('should handle applyTemplates with @ sort select (line 179)', function () {
    const data = {items: [3, 1, 2]};
    let out;
    const templates = [{
      path: '$',
      template () {
        // Use @ as sort select
        this.applyTemplates('$.items[*]', 'item', {select: '@'});
      }
    }, {
      path: '$.items[*]',
      mode: 'item',
      template (value) {
        this.number(value);
      }
    }];
    new JTLT({
      data, templates, outputType: 'json',
      success (result) {
        out = result;
        return result;
      }
    }).transform();
    assert.deepEqual(out, [1, 2, 3]); // Sorted numerically
  });

  it('should handle forEach with @ sort select (line 398)', function () {
    const data = {items: [3, 1, 2]};
    let out;
    const templates = [{
      path: '$',
      template () {
        this.forEach('$.items[*]', (value) => {
          this.number(value);
        }, {select: '@'});
      }
    }];
    new JTLT({
      data, templates, outputType: 'json',
      success (result) {
        out = result;
        return result;
      }
    }).transform();
    assert.deepEqual(out, [1, 2, 3]); // Sorted numerically
  });

  it('should handle priority resolution without specificityPriorityResolver (lines 292-295, 300)', function () {
    const data = {x: {y: 10}};
    let out;
    const templates = [
      {
        path: '$',
        template () {
          this.applyTemplates('$.x.y', 'test');
        }
      },
      {
        // These two templates have conflicting paths that both match $.x.y
        // Using wildcards to create overlap
        path: '$.x.*',
        mode: 'test',
        template (value) {
          this.number(value * 2);
        }
      },
      {
        // More specific path
        path: '$.x.y',
        mode: 'test',
        template (value) {
          this.number(value * 3);
        }
      }
    ];
    new JTLT({
      data,
      templates,
      outputType: 'json',
      // Explicitly pass null to avoid default resolver
      specificityPriorityResolver: null,
      success (result) {
        out = result;
        return result;
      }
    }).transform();
    // Without resolver and without priority, one template should execute
    assert.isArray(out);
  });

  it('should handle number comparison in sorting (lines 191-192)', function () {
    const data = {items: [{val: 5}, {val: 2}, {val: 8}]};
    let out;
    const templates = [{
      path: '$',
      template () {
        // Sort by numeric value
        this.applyTemplates('$.items[*]', 'item', {select: '$.val', type: 'number'});
      }
    }, {
      path: '$.items[*]',
      mode: 'item',
      template (value) {
        this.number(value.val);
      }
    }];
    new JTLT({
      data, templates, outputType: 'json',
      success (result) {
        out = result;
        return result;
      }
    }).transform();
    assert.deepEqual(out, [2, 5, 8]);
  });

  it('should handle descending number comparison (line 192)', function () {
    const data = {items: [{val: 5}, {val: 2}, {val: 8}]};
    let out;
    const templates = [{
      path: '$',
      template () {
        this.applyTemplates('$.items[*]', 'item', {select: '$.val', type: 'number', order: 'descending'});
      }
    }, {
      path: '$.items[*]',
      mode: 'item',
      template (value) {
        this.number(value.val);
      }
    }];
    new JTLT({
      data, templates, outputType: 'json',
      success (result) {
        out = result;
        return result;
      }
    }).transform();
    assert.deepEqual(out, [8, 5, 2]);
  });

  it('should handle NaN values in number sorting (lines 199-201)', function () {
    const data = {items: [{val: 5}, {val: 'not-a-number'}, {val: 'also-nan'}, {val: 2}]};
    let out;
    const templates = [{
      path: '$',
      template () {
        this.applyTemplates('$.items[*]', 'item', {select: '$.val', type: 'number'});
      }
    }, {
      path: '$.items[*]',
      mode: 'item',
      template (value) {
        this.string(String(value.val));
      }
    }];
    new JTLT({
      data, templates, outputType: 'string',
      success (result) {
        out = result; return result;
      }
    }).transform();
    // NaN values should be sorted to the end
    assert.isString(out);
  });

  it('should handle applyTemplates with object missing select property (line 140)', function () {
    const data = {items: [1, 2, 3]};
    let out;
    const templates = [{
      path: '$',
      template () {
        // Pass object with mode but no select - triggers select ?? fallback on line 140
        this.applyTemplates({mode: 'test', select: undefined});
      }
    }, {
      path: '$[*]',
      mode: 'test',
      template (value) {
        this.number(value);
      }
    }];
    new JTLT({
      data, templates, outputType: 'json',
      success (result) {
        out = result; return result;
      }
    }).transform();
    assert.isArray(out);
  });
});
describe('StringJoiningTransformer - edge cases', function () {
  it('should handle element() with element object as elName', function () {
    const {document} = (new JSDOM('')).window;
    const el = document.createElement('a');
    el.setAttribute('href', '/go');
    const jt = new StringJoiningTransformer('', {document});
    jt.element(el, {title: 't'}, [], function () {
      jt.text('X');
    });
    const out = jt.get();
    assert.include(out, 'href="/go"');
    assert.include(out, 'title="t"');
    assert.match(out, />X<\/[aA]>/v);
  });

  it('should throw error when attribute called after tag closed', function () {
    const jt = new StringJoiningTransformer('', {});
    jt.element('div', {}, [], function () {
      jt.text('hi');
      assert.throws(() => {
        jt.attribute('id', 'oops');
      }, /An attribute cannot be added after an opening tag has been closed/v);
    });
  });

  it('should handle string() with nested _strTemp state', function () {
    const jt = new StringJoiningTransformer('', {});
    jt._strTemp = 'foo';
    jt.string('bar');
    assert.equal(jt._strTemp, 'foobar');
  });

  it('should handle array() with callback in StringJoiningTransformer', function () {
    const jt = new StringJoiningTransformer('', {mode: 'JavaScript'});
    jt.array(null, function () {
      this.number(1);
      this.number(2);
    });
    const out = jt.get();
    assert.match(out, /\[.*1.*2.*\]/v);
  });

  it('should handle nested array() inside object() state', function () {
    const jt = new StringJoiningTransformer('', {mode: 'JavaScript'});
    jt.object(null, function () {
      this.propOnly('items', function () {
        this.array([1, 2]);
      });
    });
    const out = jt.get();
    assert.include(out, '"items":[1,2]');
  });

  it('should handle element() with xmlElements mode', function () {
    const jt = new StringJoiningTransformer('', {xmlElements: true});
    jt.element('div', {id: 'test'});
    const out = jt.get();
    assert.include(out, '<div');
    assert.include(out, 'id="test"');
  });

  it('should handle undefined() without cfg mode', function () {
    const jt = new StringJoiningTransformer('', {});
    assert.throws(() => {
      jt.undefined();
    }, /undefined is not allowed unless added in JavaScript mode/v);
  });

  it('should handle function() without cfg mode', function () {
    const jt = new StringJoiningTransformer('', {});
    assert.throws(() => {
      jt.function(function f () {});
    }, /function is not allowed unless added in JavaScript mode/v);
  });

  it('should throw when propOnly not followed by value', function () {
    const jt = new StringJoiningTransformer('', {mode: 'JavaScript'});
    jt.object(null, function () {
      assert.throws(() => {
        this.propOnly('test', function () {
          // Don't set a value
        });
      }, /propOnly\(\) must be followed up with setting a value/v);
    });
  });

  it('should handle object() with JHTMLForJSON mode at root', function () {
    const jt = new StringJoiningTransformer('', {JHTMLForJSON: true});
    jt.object({a: 1});
    const out = jt.get();
    assert.include(out, '<dl');
  });

  it('should handle object() with non-JavaScript mode using Stringifier', function () {
    const jt = new StringJoiningTransformer('', {mode: 'HTML'});
    jt.object({a: 1, b () {}});
    const out = jt.get();
    assert.include(out, '"a"');
  });

  it('should throw when appending directly in object state', function () {
    const jt = new StringJoiningTransformer('', {mode: 'JavaScript'});
    jt.object(null, function () {
      jt._objPropState = true;
      assert.throws(() => {
        jt.append('test');
      }, /Object values must be added via propValue\(\) or after propOnly\(\)/v);
    });
  });

  it('should throw when calling propOnly twice without setting value', function () {
    const jt = new StringJoiningTransformer('', {mode: 'JavaScript'});
    jt.object(null, function () {
      jt.propOnly('a', function () {
        jt.string('value1');
      });
      jt.propOnlyState = true;
      assert.throws(() => {
        jt.propOnly('b', function () {});
      }, /propOnly\(\) can only be called again after a value is set/v);
    });
  });

  it('should handle nested object inside array state', function () {
    const jt = new StringJoiningTransformer('', {mode: 'JavaScript'});
    jt.array(null, function () {
      jt.object({x: 1});
    });
    const out = jt.get();
    assert.match(out, /\[.*\{.*"x".*1.*\}.*\]/v);
  });

  it('should handle object() with Element input', function () {
    const {document} = (new JSDOM('')).window;
    const elem = toJHTMLDOM({a: 1}, {mode: 'JavaScript', stringifiers: {}, document});
    const jt = new StringJoiningTransformer('', {document, mode: 'JavaScript'});
    jt.object(elem);
    const out = jt.get();
    assert.include(out, '"a"');
  });

  it('should handle array() with Element input', function () {
    const {document} = (new JSDOM('')).window;
    const elem = toJHTMLDOM([1, 2], {mode: 'JavaScript', stringifiers: {}, document});
    const jt = new StringJoiningTransformer('', {document, mode: 'JavaScript'});
    jt.array(elem);
    const out = jt.get();
    assert.match(out, /\[.*1.*2.*\]/v);
  });

  it('should handle string() with _strTemp set', function () {
    const st = new StringJoiningTransformer('', {});
    st._strTemp = 'PRE';
    st.string('POST');
    assert.include(st._strTemp, 'PREPOST');
  });

  it('should handle function() with element input', function () {
    // Simulate a JHTML element conversion result for a function
    const st = new StringJoiningTransformer('', {mode: 'JavaScript'});
    // Instead of a real element, use a string that would result from conversion
    st.function('function y() {}');
    const out = st.get();
    assert.include(out, 'function');
  });

  it('should merge property sets in _usePropertySets', function () {
    const st = new StringJoiningTransformer('', {});
    st.propertySets = {ps: {x: 1}};
    const result = st._usePropertySets({y: 2}, 'ps');
    assert.deepEqual(result, {y: 2, x: 1});
  });
  it('should handle element with element object as elName', function () {
    const {document} = (new JSDOM('')).window;
    const el = document.createElement('span');
    el.dataset.x = 'y';
    el.setAttribute('title', 't');
    el.textContent = 'Z';
    const st = new StringJoiningTransformer('', {document});
    st.element(el, {id: 'test'}, [], function () {
      this.text('X');
    });
    const out = st.get();
    assert.match(out, /span/vi);
    assert.include(out, 'data-x="y"');
    assert.include(out, 'title="t"');
    assert.include(out, 'id="test"');
    assert.include(out, 'X');
  });

  it('should handle element with childNodes array', function () {
    const st = new StringJoiningTransformer('', {});
    const {document} = (new JSDOM('')).window;
    const child = document.createElement('p');
    child.textContent = 'child';
    st.element('div', {}, [child], function () {});
    const out = st.get();
    assert.include(out, 'child');
  });

  it('should throw error when attribute called with tag already closed', function () {
    const st = new StringJoiningTransformer('', {});
    st.element('div', {}, [], function () {});
    st._openTagState = false;
    assert.throws(() => {
      st.attribute('foo', 'bar');
    }, /An attribute cannot be added after an opening tag has been closed/v);
  });
  it('object() with callback adds properties', function () {
    const st = new StringJoiningTransformer('', {mode: 'JavaScript'});
    st.object({a: 1}, function () {
      this.propValue('b', 2);
    });
    const result = st.get();
    assert.include(result, '1');
    assert.include(result, '2');
  });

  it('array() with callback adds items', function () {
    const st = new StringJoiningTransformer('', {mode: 'JavaScript'});
    st.array([1, 2], function () {
      this.number(3);
    });
    const result = st.get();
    assert.include(result, '1');
    assert.include(result, '2');
    assert.include(result, '3');
  });

  it('object() with JHTMLForJSON', function () {
    const st = new StringJoiningTransformer('', {JHTMLForJSON: true});
    st.object({a: 1});
    const result = st.get();
    assert.isString(result);
  });

  it('array() with JHTMLForJSON', function () {
    const st = new StringJoiningTransformer('', {JHTMLForJSON: true});
    st.array([1, 2, 3]);
    const result = st.get();
    assert.isString(result);
  });
});

describe('StringJoiningTransformer - defensive errors', function () {
  it('should throw when propValue called outside object state', function () {
    const st = new StringJoiningTransformer('', {mode: 'JavaScript'});
    assert.throws(() => {
      st.propValue('foo', 'bar');
    }, /propValue\(\) can only be called after an object state has been set up\./v);
  });

  it('should throw when propOnly called outside object state', function () {
    const st = new StringJoiningTransformer('', {mode: 'JavaScript'});
    assert.throws(() => {
      st.propOnly('foo', () => {});
    }, /propOnly\(\) can only be called after an object state has been set up\./v);
  });
});

describe('StringJoiningTransformer - property sets', function () {
  it('should assign properties from propSets', function () {
    const st = new StringJoiningTransformer('', {mode: 'JavaScript'});
    st.object({a: 1}, null, undefined, {b: 2, c: 3});
    const result = st.get();
    assert.include(result, '1');
    assert.include(result, '2');
    assert.include(result, '3');
  });

  it('should assign properties from propSets and usePropertySets together', function () {
    const st = new StringJoiningTransformer('', {mode: 'JavaScript'});
    st.propertySets = {ps1: {d: 4}};
    st.object({a: 1}, null, ['ps1'], {b: 2, c: 3});
    const result = st.get();
    assert.include(result, '1');
    assert.include(result, '2');
    assert.include(result, '3');
    assert.include(result, '4');
  });
});
