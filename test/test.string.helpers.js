import {expect} from 'chai';
import JTLT from '../src/index.js';

describe('StringJoiningTransformer helpers', () => {
  it('text() escapes and closes open tag', function textEscapes (done) {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [
        {path: '$', template () {
          // Use string() callback so `this` is the joiner
          /** @type {any} */ const jt = this._config.joiningTransformer;
          jt.element('span', {className: 'x'}, [], function () {
            jt.text('<&');
          });
        }}
      ],
      success (/** @type {any} */ result) {
        try {
          expect(result).to.equal('<span class="x">&lt;&amp;</span>');
          done();
        } catch (err) {
          done(/** @type {any} */ (err));
        }
      }
    });
  });

  it('attribute dataset and $a ordering', function atts (done) {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [
        {path: '$', template () {
          /** @type {any} */ const jt = this._config.joiningTransformer;
          jt.element('div', {}, [], function () {
            jt.attribute('dataset', {fooBar: 'baz'});
            jt.attribute('$a', [['z', '1'], ['a', '2']]);
          });
        }}
      ],
      success (/** @type {any} */ result) {
        try {
          expect(result).to.equal('<div data-foo-bar="baz" z="1" a="2"></div>');
          done();
        } catch (err) {
          done(/** @type {any} */ (err));
        }
      }
    });
  });

  it('element() callback closes tag', function serializerModes (done) {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          /** @type {any} */ const jt = this._config.joiningTransformer;
          jt.element('br', {}, [], function () {
            jt.text('');
          });
        }
      }],
      success (/** @type {any} */ html) {
        try {
          expect(html).to.equal('<br></br>');
          done();
        } catch (err) {
          done(/** @type {any} */ (err));
        }
      }
    });
  });

  it('string() vs plainText()', function plainVsString (done) {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [
        {path: '$', template () {
          this.string('<b>');
          this.string('x');
          this.string('</b>');
          this.plainText('<i>y</i>');
        }}
      ],
      success (/** @type {any} */ result) {
        try {
          expect(result).to.equal('<b>x</b><i>y</i>');
          done();
        } catch (err) {
          done(/** @type {any} */ (err));
        }
      }
    });
  });
});
