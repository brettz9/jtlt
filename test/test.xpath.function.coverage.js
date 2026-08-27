import {JSDOM} from 'jsdom';
import {expect} from 'chai';
import XPathTransformerContext from '../src/XPathTransformerContext.js';
import JTLT from '../src/index-node.js';

describe('XPathTransformerContext function coverage', () => {
  it(
    'should exercise remaining direct methods for full function coverage',
    () => {
      // Build minimal DOM
      const {
        window
      } = new JSDOM('<root id="r"><child id="c">text</child></root>');
      const doc = window.document;
      // Stub joiner capturing all calls
      const joiner = /** @type {any} */ ({
        /** @type {unknown[]} */ _out: [],
        append (/** @type {unknown} */ v) {
          this._out.push(v);
        },
        get () {
          return this._out;
        },
        string (/** @type {unknown} */ s) {
          this._out.push(s);
        },
        number (/** @type {unknown} */ n) {
          this._out.push(n);
        },
        plainText (/** @type {unknown} */ t) {
          this._out.push(t);
        },
        propValue (/** @type {unknown} */ p, /** @type {unknown} */ v) {
          this._out.push({prop: p, val: v});
        },
        object (/** @type {unknown[]} */ ...args) {
          this._out.push({objectArgs: args});
        },
        array (/** @type {unknown[]} */ ...args) {
          this._out.push({arrayArgs: args});
        },
        element (
          /** @type {unknown} */ name,
          /** @type {unknown} */ atts,
          /** @type {unknown} */ children
        ) {
          this._out.push({el: name, atts, children});
        },
        attribute (
          /** @type {unknown} */ name,
          /** @type {unknown} */ val,
          /** @type {unknown} */ avoid
        ) {
          this._out.push({att: name, val, avoid});
        },
        text (/** @type {unknown} */ txt) {
          this._out.push({text: txt});
        }
      });
      // Minimal templates so applyTemplates can run if called
      const templates = [
        {path: '.', template () { /* root template minimal for coverage */ }},
        {path: '//*', template () {
          /* element template minimal for coverage */
        }}
      ];
      const ctx = new XPathTransformerContext({
        data: doc,
        joiningTransformer: joiner
      }, templates);

      // Direct method invocations (chainability & side-effects)
      expect(ctx.appendOutput('a')).to.equal(ctx);
      expect(ctx.getOutput()).to.deep.equal(['a']);
      expect(ctx.string('b')).to.equal(ctx);
      expect(ctx.number(42)).to.equal(ctx);
      expect(ctx.plainText('plain')).to.equal(ctx);
      expect(ctx.propValue('p', 'v')).to.equal(ctx);
      expect(ctx.object({x: 1})).to.equal(ctx);
      expect(ctx.array([1, 2, 3])).to.equal(ctx);
      expect(ctx.element('div', {class: 'c'}, ['child'])).to.equal(ctx);
      expect(ctx.attribute('data-x', 'y', true)).to.equal(ctx);
      expect(ctx.text('txt')).to.equal(ctx);

      // variable(), key()/getKey(), propertySet(), _usePropertySets exercise
      expect(ctx.variable('var1', '//child')).to.equal(ctx);
      // Use applyTemplates to trigger default root rule and thereby invoke
      // static DefaultTemplateRules.transformRoot.template for function cov.
      ctx.applyTemplates('.');
      expect(ctx.vars.var1).to.have.length(1);
      expect(ctx.key('childKey', '//child', 'id')).to.equal(ctx);
      const found = ctx.getKey('childKey', 'c');
      expect(found.getAttribute('id')).to.equal('c');
      expect(ctx.propertySet('base', {a: 1})).to.equal(ctx);
      expect(ctx.propertySet('derived', {b: 2}, ['base'])).to.equal(ctx);
      // Trigger element default rule by applying templates on element context
      ctx._contextNode = doc.documentElement; // <root>
      ctx.applyTemplates('*');
      expect(ctx.propertySets.derived).to.deep.equal({b: 2, a: 1});

      // valueOf for context node textContent and with select object form
      ctx._contextNode = /** @type {Element} */ (doc.querySelector('child'));
      expect(ctx.valueOf()).to.equal(ctx);
      expect(joiner._out.at(-1)).to.deep.equal({text: 'text'});
      expect(ctx.valueOf({select: '.'})).to.equal(ctx);

      // forEach over nodes
      /** @type {string[]} */
      const collected = [];
      expect(
        ctx.forEach('//child', function (node) {
          collected.push(node.nodeName);
        })
      ).to.equal(ctx);
      expect(collected).to.deep.equal(['CHILD']);

      // set() new context
      const newNode = /** @type {Element} */ (doc.querySelector('root'));
      expect(ctx.set(newNode)).to.equal(ctx);
      expect(ctx._contextNode).to.equal(newNode);
    }
  );

  it('should call message for coverage', (done) => {
    let called = false;
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const doc = new window.DOMParser().parseFromString('<root />', 'text/xml');
    JTLT.create({
      data: doc,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '//root',
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
});
