/* JSONPathTransformerContext if() tests */
import {expect} from 'chai';
import JTLT from '../src/index.js';

const sample = {store: {book: [
  {category: 'reference', price: 8.95},
  {category: 'fiction', price: 12.99}
]}};

describe('JSONPath if() method', () => {
  it('should conditionally execute callback on non-empty result set', () => {
    const jt = new JTLT({
      data: sample,
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.if('$.store.book[?(@.price < 10)]', () => {
            this.string('cheap');
          });
          this.if('$.nonexistent', () => {
            this.string('none');
          });
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('cheap');
  });

  it('should handle multiple matches as truthy', () => {
    const jt = new JTLT({
      data: sample,
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          // Select all books - should return 2 items
          this.if('$.store.book[*]', () => {
            this.string('multi');
          });
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('multi');
  });

  it('should coerce scalar selection and skip falsy (0)', () => {
    const jt = new JTLT({
      data: {a: 0, b: 1},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.if('$.a', () => {
            this.string('A');
          }); // 0 => falsy -> no match
          this.if('$.b', () => {
            this.string('B');
          }); // 1 => truthy -> match
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('B');
  });

  it('should no-op if callback missing', () => {
    const jt = new JTLT({
      data: {x: 1},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          // @ts-expect-error Deliberately missing callback
          this.if('$.x');
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('');
  });

  it('should treat single object result as truthy', () => {
    const jt = new JTLT({
      data: {nested: {empty: {}}, arr: [1, 2], num: 5},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.if('$.nested', () => {
            this.string('obj');
          }); // Object => truthy even if empty
          this.if('$.arr', () => {
            this.string('arr');
          }); // Array is object => truthy
          this.if('$.num', () => {
            this.string('num');
          }); // Number => Boolean(5) => truthy
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('objarrnum');
  });

  it('should use Boolean() for single primitive result', () => {
    const jt = new JTLT({
      data: {empty: '', full: 'text'},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.if('$.empty', () => {
            this.string('E');
          }); // Empty string => falsy
          this.if('$.full', () => {
            this.string('F');
          }); // Non-empty string => truthy
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('F');
  });

  it('should handle null as falsy despite being object type', () => {
    const jt = new JTLT({
      data: {n: null, z: 0},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.if('$.n', () => {
            this.string('N');
          }); // null => falsy
          this.if('$.z', () => {
            this.string('Z');
          }); // 0 => falsy
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

  it('should handle non-function callback parameter', () => {
    const jt = new JTLT({
      data: {val: 1},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          // Pass non-function as callback
          // @ts-expect-error Deliberate non-function callback string
          this.if('$.val', 'not-a-function');
          // @ts-expect-error Deliberate non-function callback null
          this.if('$.val', null);
          // @ts-expect-error Deliberate non-function callback undefined
          this.if('$.val', undefined);
          this.string('done');
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('done');
  });
});
