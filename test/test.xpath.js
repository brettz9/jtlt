import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {
  StringJoiningTransformer,
  XPathTransformer,
  XPathTransformerContext
} from '../src/index.js';

/**
 * Build a small DOM for XPath evaluation.
 * @returns {{document: Document}}
 */
function buildDom () {
  const {window} = new JSDOM('<!doctype html><html><body></body></html>');
  const parser = new window.DOMParser();
  const document = parser.parseFromString(
    '<root><item id="a">text</item><item id="b">more</item></root>',
    'text/xml'
  );
  return {document};
}

describe('XPathTransformer basics', () => {
  it('renders simple elements using templates', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        name: 'root',
        path: '/',
        /** @this {any} */
        template () {
          // Render all items
          this.applyTemplates('//item');
        }
      },
      {
        name: 'item',
        path: '//item',
        /**
         * @this {any}
         * @param {any} node
         */
        template (node) {
          // Lowercase tagName in jsdom HTML; use provided name to avoid case
          this.element('item', {}, [], () => {
            this.text(node.textContent);
          });
        }
      }
    ];

    const engine = new XPathTransformer(/** @type {any} */ ({
      data: document,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 2 // ensure 2.0 mode also works
    }));

    const out = engine.transform('');
    expect(out).to.be.a('string');
    expect(out).to.include('<item>text</item>');
    expect(out).to.include('<item>more</item>');
  });

  it('throws on equal-priority root templates when configured', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {name: 'root1', path: '/', template () { /* no-op */ }},
      {name: 'root2', path: '/', template () { /* no-op */ }}
    ];

    const engine = new XPathTransformer(/** @type {any} */ ({
      data: document,
      templates,
      joiningTransformer: joiner,
      errorOnEqualPriority: true
    }));

    expect(() => engine.transform('')).to.throw('equal priority');
  });
});

describe('XPathTransformerContext core methods', () => {
  it('supports get/forEach/valueOf/variable/key', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: document,
      joiningTransformer: joiner
    }, []);

    // get as nodes
    const nodes = ctx.get('//*[@id="a"]', true);
    expect(nodes).to.be.an('array');
    expect(nodes[0]).to.have.property('nodeType');

    // forEach iterates
    let count = 0;
    ctx.forEach('//item', function () {
      count++;
    });
    expect(count).to.equal(2);

    // valueOf appends text of first match
    ctx.valueOf('//*[@id="b"]');

    // variable
    ctx.variable('idA', '//*[@id="a"]');
    expect(Array.isArray(ctx.vars.idA)).to.equal(true);
    expect(ctx.vars.idA).to.have.lengthOf(1);

    // key / getKey
    ctx.key('byId', '//item', 'id');
    const node = ctx.getKey('byId', 'a');
    expect(node.getAttribute('id')).to.equal('a');

    // element/text pass-through
    ctx.element('span', {class: 'cls'}, [], () => ctx.text('hi'));

    // Output should include our earlier valueOf and element
    const out = ctx.getOutput();
    expect(out).to.include('more');
    expect(out).to.include('<span class="cls">hi</span>');
  });
});

describe('XPathTransformer basics (version 1)', () => {
  it('renders items via native XPathEvaluator', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        name: 'root',
        path: '/',
        /** @this {any} */
        template () {
          this.applyTemplates('//item');
        }
      },
      {
        name: 'item',
        path: '//item',
        /**
         * @this {any}
         * @param {any} node
         */
        template (node) {
          this.element('item', {}, [], () => this.text(node.textContent));
        }
      }
    ];

    const engine = new XPathTransformer(/** @type {any} */ ({
      data: document,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 1
    }));

    const out = engine.transform('');
    expect(out).to.include('<item>text</item>');
    expect(out).to.include('<item>more</item>');
  });
});
