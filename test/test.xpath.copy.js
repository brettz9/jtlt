import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import XPathTransformerContext from '../src/XPathTransformerContext.js';
import DOMJoiningTransformer from '../src/DOMJoiningTransformer.js';

/**
 * Build a DOM Document from an XML string.
 * @param {string} xml XML source
 * @returns {Document}
 */
function makeDoc (xml) {
  const {window} = new JSDOM('<!doctype html><html><body></body></html>');
  return new window.DOMParser().parseFromString(xml, 'text/xml');
}

describe('XPathTransformerContext copy / copyOf', () => {
  it('should shallow and deep clone current context node', () => {
    const doc = makeDoc(
      '<root><item id="a">A</item><item id="b"><child>C</child></item></root>'
    );
    const {document} = (new JSDOM('')).window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    const ctx = new XPathTransformerContext(
      {data: doc, joiningTransformer: joiner, xpathVersion: 1},
      []
    );

    // Set context to second item
    const secondItem = ctx.get('//item', true)[1];
    ctx._contextNode = secondItem; // Internal usage for test purposes

    ctx.copy(); // shallow (no children for element clone)
    ctx.copyOf(); // deep (includes child)

    const frag = joiner.get();
    // eslint-disable-next-line prefer-destructuring -- TS
    const childNodes = /** @type {DocumentFragment} */ (
      frag
    ).childNodes;
    expect(childNodes.length).to.equal(2);
    const shallowClone = childNodes[0];
    const deepClone = childNodes[1];
    // Shallow clone should have no children
    expect(shallowClone.childNodes.length).to.equal(0);
    // Deep clone should retain child
    expect(deepClone.childNodes.length).to.equal(1);
    expect(
      deepClone.firstChild && deepClone.firstChild.textContent
    ).to.equal('C');
  });

  it('copyOf with select should deep clone matching nodes', () => {
    const doc = makeDoc(
      '<root><item id="a">A</item><item id="b">B</item></root>'
    );
    const {document} = (new JSDOM('')).window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    const ctx = new XPathTransformerContext(
      {data: doc, joiningTransformer: joiner, xpathVersion: 1},
      []
    );

    ctx.copyOf('//item');
    const frag = joiner.get();
    // eslint-disable-next-line prefer-destructuring -- TS
    const childNodes = /** @type {DocumentFragment} */ (
      frag
    ).childNodes;
    expect(childNodes.length).to.equal(2);
    expect(childNodes[0].textContent).to.equal('A');
    expect(childNodes[1].textContent).to.equal('B');
  });

  it('copyOf with scalar XPath appends scalar value', () => {
    const doc = makeDoc('<root><item>A</item></root>');
    const {document} = (new JSDOM('')).window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    const ctx = new XPathTransformerContext(
      {data: doc, joiningTransformer: joiner, xpathVersion: 1},
      []
    );

    ctx.copyOf('string(//item)');
    const frag = joiner.get();
    // eslint-disable-next-line prefer-destructuring -- TS
    const textContent = /** @type {DocumentFragment} */ (
      frag
    ).textContent;
    // StringJoiningTransformer would wrap differently; DOM joiner adds text
    expect(textContent).to.equal('A');
  });
});
