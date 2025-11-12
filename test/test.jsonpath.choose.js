/* JSONPathTransformerContext choose() tests */
import {expect} from 'chai';
import JTLT from '../src/index-node.js';

const sample = {store: {book: [
  {category: 'reference', price: 8.95},
  {category: 'fiction', price: 12.99}
]}};

describe('JSONPath choose() method', () => {
  it('should execute whenCb on truthy match and skip otherwiseCb', () => {
    const jt = new JTLT({
      data: sample,
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.choose('$.store.book[?(@.price < 10)]', () => {
            this.string('cheap');
          }, () => {
            this.string('expensive');
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

  it('should execute otherwiseCb when no match', () => {
    const jt = new JTLT({
      data: sample,
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.choose('$.store.book[?(@.price > 100)]', () => {
            this.string('pricey');
          }, () => {
            this.string('none');
          });
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('none');
  });

  it('should treat multiple matches as truthy', () => {
    const jt = new JTLT({
      data: sample,
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.choose('$.store.book[*]', () => {
            this.string('multi');
          }, () => {
            this.string('empty');
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

  it('should apply Boolean() for single primitive and decide branches', () => {
    const jt = new JTLT({
      data: {a: 0, b: 1},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.choose('$.a', () => {
            this.string('A');
          }, () => {
            this.string('a-fail');
          });
          this.choose('$.b', () => {
            this.string('B');
          }, () => {
            this.string('b-fail');
          });
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('a-failB');
  });

  it('should treat single object result as truthy', () => {
    const jt = new JTLT({
      data: {nested: {}, num: 5},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.choose('$.nested', () => {
            this.string('obj');
          }, () => {
            this.string('no-obj');
          });
          this.choose('$.num', () => {
            this.string('num');
          }, () => {
            this.string('no-num');
          });
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('objnum');
  });

  it('should invoke otherwiseCb for falsy (null, empty)', () => {
    const jt = new JTLT({
      data: {n: null, empty: ''},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.choose('$.n', () => {
            this.string('N');
          }, () => {
            this.string('null');
          });
          this.choose('$.empty', () => {
            this.string('E');
          }, () => {
            this.string('empty');
          });
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('nullempty');
  });

  it('should ignore non-function callbacks gracefully', () => {
    const jt = new JTLT({
      data: {val: 1, none: 0},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          // whenCb non-function: do nothing though condition truthy
          // @ts-expect-error Deliberate non-function whenCb
          this.choose('$.val', 'not-fn', null);
          // otherwiseCb non-function: do nothing though condition falsy
          this.choose('$.none', () => {
            this.string('bad');
          // @ts-expect-error Deliberate non-function otherwiseCb
          }, 'not-fn');
          // Add sentinel output to assert graceful handling
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
});
