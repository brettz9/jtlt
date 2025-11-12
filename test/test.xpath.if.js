/* XPathTransformerContext if() tests */
import {expect} from 'chai';
import JTLT from '../src/index-node.js';
import {JSDOM} from 'jsdom';

const {window} = new JSDOM('<ul><li class="x">Item</li><li>Other</li></ul>');
const doc = window.document;

describe('XPath if() method', () => {
  it('should execute callback for matching node set and skip non-match', () => {
    const jt = new JTLT({
      data: doc,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '/',
        template () {
          this.if('//li[@class="x"]', () => {
            this.string('<found/>');
          });
          this.if('//li[@class="none"]', () => {
            this.string('<none/>');
          });
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('<found/>');
  });

  it('should evaluate boolean XPath expression', () => {
    const jt = new JTLT({
      data: doc,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '/',
        template () {
          this.if('count(//li) > 0', () => {
            this.string('has');
          });
          this.if('count(//li) > 100', () => {
            this.string('none');
          });
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('has');
  });

  it('should no-op if callback missing', () => {
    const jt = new JTLT({
      data: doc,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '/',
        template () {
          // @ts-expect-error Deliberately missing callback
          this.if('//li[@class="x"]');
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('');
  });

  it('should unwrap single-item primitive array from scalar eval', () => {
    const {window: win2} = new JSDOM('<root><price>5</price></root>');
    const doc2 = win2.document;
    const jt = new JTLT({
      data: doc2,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '/',
        template () {
          // number() function returns number type
          this.if('number(//price)', () => {
            this.string('num');
          });
          this.if('number(0)', () => {
            this.string('zero');
          });
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('num');
  });

  it('should handle node selection fallback with invalid XPath', () => {
    const jt = new JTLT({
      data: doc,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '/',
        template () {
          // Use an XPath that contains location path chars but might fail
          // This tests the catch block in node selection fallback
          this.if('//invalid[', () => {
            this.string('should-not-run');
          });
          this.string('ok');
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('ok');
  });

  it('should handle string expressions without path chars', () => {
    const {window: win3} = new JSDOM('<root><val>test</val></root>');
    const doc3 = win3.document;
    const jt = new JTLT({
      data: doc3,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '/',
        template () {
          // String literal without path chars - won't trigger node selection
          this.if('""', () => {
            this.string('empty');
          }); // Empty string => falsy, no path chars to try node selection
          this.if('"text"', () => {
            this.string('text');
          }); // Non-empty string => truthy
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('text');
  });

  it('should handle scalar eval that returns non-primitive', () => {
    const {window: win4} = new JSDOM('<root><item>1</item></root>');
    const doc4 = win4.document;
    const jt = new JTLT({
      data: doc4,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '/',
        template () {
          // Expression that might return undefined or non-primitive scalar
          this.if('string(//missing)', () => {
            this.string('found');
          }); // Empty string from missing element => falsy
          this.if('string(//item)', () => {
            this.string('item');
          }); // Non-empty string => truthy
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('item');
  });

  it('should handle edge case of single-item array from scalar eval', () => {
    const {window: win5} = new JSDOM('<root><val>42</val></root>');
    const doc5 = win5.document;
    const jt = new JTLT({
      data: doc5,
      outputType: 'string',
      engineType: 'xpath',
      xpathVersion: 2,
      templates: [{
        path: '/',
        template () {
          // Try to trigger single-item array return from xpath2
          // This is an edge case where _evalXPath might wrap scalar
          this.if('1', () => {
            this.string('one');
          }); // Numeric literal 1 => truthy
          this.if('0', () => {
            this.string('zero');
          }); // Numeric literal 0 => falsy
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('one');
  });

  it('should handle node selection when scalar eval returns falsy', () => {
    const {window: win6} = new JSDOM('<root><item>test</item></root>');
    const doc6 = win6.document;
    const jt = new JTLT({
      data: doc6,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '/',
        template () {
          // First part fails scalar eval, falls back to node selection
          this.if('//item', () => {
            this.string('found');
          });
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('found');
  });
});
