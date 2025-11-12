/* XPathTransformerContext choose() tests */
import {expect} from 'chai';
import JTLT from '../src/index-node.js';
import {JSDOM} from 'jsdom';

const {window} = new JSDOM(
  '<root><item class="a">1</item><item>2</item></root>'
);
const doc = window.document;

describe('XPath choose() method', () => {
  it('should branch for match and non-match node sets', () => {
    const jt = new JTLT({
      data: doc,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '/',
        template () {
          this.choose('//item[@class="a"]', () => {
            this.string('found');
          }, () => {
            this.string('not-found');
          });
          this.choose('//item[@class="b"]', () => {
            this.string('bad');
          }, () => {
            this.string('miss');
          });
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('foundmiss');
  });

  it('should evaluate boolean expressions and branch', () => {
    const jt = new JTLT({
      data: doc,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '/',
        template () {
          this.choose('count(//item) > 0', () => {
            this.string('yes');
          }, () => {
            this.string('no');
          });
          this.choose('count(//item) > 5', () => {
            this.string('x');
          }, () => {
            this.string('y');
          });
        }
      }],
      success (out) {
        return out;
      }
    });
    const out = jt.transform('');
    expect(out).to.equal('yesy');
  });

  it('should ignore non-function arguments gracefully', () => {
    const jt = new JTLT({
      data: doc,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '/',
        template () {
          // whenCb non-function: no output for truthy condition
          // @ts-expect-error Deliberate non-function whenCb
          this.choose('boolean(1)', 'not-fn', null);
          // otherwiseCb non-function: no output for falsy condition
          this.choose('boolean(0)', () => {
            this.string('bad');
          // @ts-expect-error Deliberate non-function otherwiseCb
          }, 'not-fn');
          // ensure transform still proceeds without errors
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
