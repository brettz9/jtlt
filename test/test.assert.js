// @ts-nocheck
import {expect} from 'chai';
import JTLT from '../src/index-node.js';
import {JSDOM} from 'jsdom';

describe('assert() method', () => {
  describe('JSONPath context', () => {
    it('should pass when test expression is truthy', () => {
      const data = {count: 5};
      const jt = new JTLT({
        data,
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.assert('$.count');
            this.string('passed');
          }
        }],
        success (result) {
          return result;
        }
      });
      const result = jt.transform('');
      expect(result).to.equal('passed');
    });

    it('should throw when test expression is falsy', () => {
      const data = {count: 0};
      expect(() => {
        const jt = new JTLT({
          data,
          outputType: 'string',
          templates: [{
            path: '$',
            template () {
              this.assert('$.count');
              this.string('should not reach here');
            }
          }],
          success (result) {
            return result;
          }
        });
        jt.transform('');
      }).to.throw(/Assertion failed.*\$\.count/v);
    });

    it('should throw with custom message', () => {
      const data = {items: []};
      expect(() => {
        const jt = new JTLT({
          data,
          outputType: 'string',
          templates: [{
            path: '$',
            template () {
              this.assert('$.items[0]', 'Items array must not be empty');
              this.string('should not reach here');
            }
          }],
          success (result) {
            return result;
          }
        });
        jt.transform('');
      }).to.throw('Assertion failed: Items array must not be empty');
    });

    it('should pass for non-empty array', () => {
      const data = {items: [1, 2, 3]};
      const jt = new JTLT({
        data,
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.assert('$.items[*]', 'Items array must not be empty');
            this.string(String(this.get('$.items.length', false)));
          }
        }],
        success (result) {
          return result;
        }
      });
      const result = jt.transform('');
      expect(result).to.equal('3');
    });

    it('should pass for truthy string', () => {
      const data = {name: 'test'};
      const jt = new JTLT({
        data,
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.assert('$.name');
            this.string(this.get('$.name', false));
          }
        }],
        success (result) {
          return result;
        }
      });
      const result = jt.transform('');
      expect(result).to.equal('test');
    });

    it('should fail for empty string', () => {
      const data = {name: ''};
      expect(() => {
        const jt = new JTLT({
          data,
          outputType: 'string',
          templates: [{
            path: '$',
            template () {
              this.assert('$.name', 'Name must not be empty');
              this.string('should not reach here');
            }
          }],
          success (result) {
            return result;
          }
        });
        jt.transform('');
      }).to.throw('Assertion failed: Name must not be empty');
    });

    it('should pass for object', () => {
      const data = {config: {enabled: true}};
      const jt = new JTLT({
        data,
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.assert('$.config');
            this.string('ok');
          }
        }],
        success (result) {
          return result;
        }
      });
      const result = jt.transform('');
      expect(result).to.equal('ok');
    });

    it('should chain with other methods', () => {
      const data = {value: 42};
      const jt = new JTLT({
        data,
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.assert('$.value').
              string('Value is: ').
              valueOf('$.value');
          }
        }],
        success (result) {
          return result;
        }
      });
      const result = jt.transform('');
      expect(result).to.equal('Value is: 42');
    });
  });

  describe('XPath context', () => {
    it('should pass when test expression is truthy', () => {
      const {window} = new JSDOM('<root><count>5</count></root>');
      const doc = window.document;
      const jt = new JTLT({
        data: doc,
        outputType: 'string',
        engineType: 'xpath',
        templates: [{
          path: '/',
          template () {
            this.assert('//count');
            this.string('passed');
          }
        }],
        success (result) {
          return result;
        }
      });
      const result = jt.transform('');
      expect(result).to.equal('passed');
    });

    it('should throw when test expression is falsy', () => {
      const {window} = new JSDOM('<root></root>');
      const doc = window.document;
      expect(() => {
        const jt = new JTLT({
          data: doc,
          outputType: 'string',
          engineType: 'xpath',
          templates: [{
            path: '/',
            template () {
              this.assert('//count', 'Count element must exist');
              this.string('should not reach here');
            }
          }],
          success (result) {
            return result;
          }
        });
        jt.transform('');
      }).to.throw('Assertion failed: Count element must exist');
    });

    it('should throw without message when test is falsy', () => {
      const {window} = new JSDOM('<root></root>');
      const doc = window.document;
      expect(() => {
        const jt = new JTLT({
          data: doc,
          outputType: 'string',
          engineType: 'xpath',
          templates: [{
            path: '/',
            template () {
              this.assert('//missing');
              this.string('should not reach here');
            }
          }],
          success (result) {
            return result;
          }
        });
        jt.transform('');
      }).to.throw(/Assertion failed: \/\/missing/v);
    });

    it('should pass for multiple matches', () => {
      const {window} = new JSDOM('<root><item>1</item><item>2</item></root>');
      const doc = window.document;
      const jt = new JTLT({
        data: doc,
        outputType: 'string',
        engineType: 'xpath',
        templates: [{
          path: '/',
          template () {
            this.assert('//item', 'Must have at least one item');
            this.string('hasItems');
          }
        }],
        success (result) {
          return result;
        }
      });
      const result = jt.transform('');
      expect(result).to.equal('hasItems');
    });

    it('should chain with other XPath methods', () => {
      const {window} = new JSDOM('<root><value>42</value></root>');
      const doc = window.document;
      const jt = new JTLT({
        data: doc,
        outputType: 'string',
        engineType: 'xpath',
        templates: [{
          path: '/',
          template () {
            this.assert('//value').
              string('Value: ').
              valueOf('//value');
          }
        }],
        success (result) {
          return result;
        }
      });
      const result = jt.transform('');
      expect(result).to.equal('Value: 42');
    });
  });
});
