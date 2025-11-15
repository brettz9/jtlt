/* eslint-disable @stylistic/max-len, no-new, array-callback-return
  -- Test file for map/mapEntry aliases */
// @ts-nocheck
import {assert} from 'chai';
import {JSDOM} from 'jsdom';
import JTLT, {
  DOMJoiningTransformer, JSONJoiningTransformer, StringJoiningTransformer
} from '../src/index-node.js';

describe('map() and mapEntry() aliases', function () {
  describe('JSONPathTransformerContext', function () {
    it('should support map() as alias for object()', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.map(() => {
          this.mapEntry('key1', 'value1');
          this.mapEntry('key2', 'value2');
        });
      }}];
      new JTLT({
        data, templates, outputType: 'json', unwrapSingleResult: true,
        success (result) {
          out = result; return result;
        }
      });
      assert.deepEqual(out, {key1: 'value1', key2: 'value2'});
    });

    it('should support map() with seed object', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.map({base: 'val'}, () => {
          this.mapEntry('extra', 'added');
        });
      }}];
      new JTLT({
        data, templates, outputType: 'json', unwrapSingleResult: true,
        success (result) {
          out = result; return result;
        }
      });
      assert.deepEqual(out, {base: 'val', extra: 'added'});
    });

    it('should support mapEntry() for setting properties', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.map(() => {
          this.mapEntry('a', 1);
          this.mapEntry('b', 2);
          this.mapEntry('c', 3);
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

    it('should call map() and mapEntry() directly on joiner', function () {
      const jt = new JSONJoiningTransformer([], {});
      jt.map(function () {
        this.mapEntry('x', 1);
      });
      const out = jt.get();
      assert.deepEqual(out[0], {x: 1});
    });
  });

  describe('StringJoiningTransformer', function () {
    it('should support map() alias in string output', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.map({}, () => {
          this.mapEntry('name', 'test');
          this.mapEntry('value', 42);
        });
      }}];
      new JTLT({
        data, templates, outputType: 'string', joiningConfig: {mode: 'JavaScript'},
        success (result) {
          out = result; return result;
        }
      });
      assert.include(out, '"name"');
      assert.include(out, '"test"');
      assert.include(out, '"value"');
      assert.include(out, '42');
    });

    it('should support map() without callback', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.map({x: 1, y: 2});
      }}];
      new JTLT({
        data, templates, outputType: 'string', joiningConfig: {mode: 'JavaScript'},
        success (result) {
          out = result; return result;
        }
      });
      assert.include(out, '"x"');
      assert.include(out, '"y"');
    });

    it('should call map() and mapEntry() directly on joiner', function () {
      const jt = new StringJoiningTransformer('', {mode: 'JavaScript'});
      jt.map({}, function () {
        this.mapEntry('k', 'v');
      });
      const out = jt.get();
      assert.include(out, '"k"');
      assert.include(out, '"v"');
    });
  });

  describe('DOMJoiningTransformer', function () {
    it('should support map() alias in DOM output', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.element('div', {}, () => {
          this.map({a: 1});
        });
      }}];
      new JTLT({
        data, templates, outputType: 'dom',
        success (result) {
          out = result; return result;
        }
      });
      assert.ok(out.querySelector('div'));
    });

    it('should support mapEntry() as no-op in DOM', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.element('div', {}, () => {
          this.mapEntry('key', 'val'); // No-op in DOM
          this.text('content');
        });
      }}];
      new JTLT({
        data, templates, outputType: 'dom',
        success (result) {
          out = result; return result;
        }
      });
      const div = out.querySelector('div');
      assert.equal(div.textContent, 'content');
    });

    it('should call map() and mapEntry() directly on joiner', function () {
      const {document} = new JSDOM('').window;
      const jt = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      jt.map({x: 1});
      jt.mapEntry('y', 2);
      assert.ok(jt.get());
    });
  });

  describe('XPathTransformerContext', function () {
    it('should support map() and mapEntry() with XML data', function () {
      const {window} = new JSDOM('<root><item>test</item></root>');
      const data = window.document;
      let out;
      const templates = [{
        path: '/',
        template () {
          this.map(() => {
            this.mapEntry('source', 'xml');
            this.mapEntry('hasItem', true);
          });
        }
      }];
      new JTLT({
        data, templates, outputType: 'json', unwrapSingleResult: true,
        engineType: 'xpath',
        success (result) {
          out = result; return result;
        }
      });
      assert.deepEqual(out, {source: 'xml', hasItem: true});
    });
  });

  describe('Nested usage', function () {
    it('should support nested map() calls', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.map(() => {
          this.mapEntry('outer', 'value');
          this.mapEntry('nested', null);
          this.propValue('nested', null); // Use old name too
          this.map({inner: 'data'});
        });
      }}];
      new JTLT({
        data, templates, outputType: 'json',
        success (result) {
          out = result; return result;
        }
      });
      assert.isArray(out);
      assert.ok(out[0].outer);
    });

    it('should mix map/mapEntry with object/propValue', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.map(() => {
          this.mapEntry('a', 1);
          this.propValue('b', 2); // Old name
        });
        this.object(() => {
          this.mapEntry('c', 3); // New name
          this.propValue('d', 4); // Old name
        });
      }}];
      new JTLT({
        data, templates, outputType: 'json',
        success (result) {
          out = result; return result;
        }
      });
      assert.equal(out.length, 2);
      assert.deepEqual(out[0], {a: 1, b: 2});
      assert.deepEqual(out[1], {c: 3, d: 4});
    });
  });
});
