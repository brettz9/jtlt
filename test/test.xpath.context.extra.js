import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import XPathTransformerContext from '../src/XPathTransformerContext.js';
import StringJoiningTransformer from '../src/StringJoiningTransformer.js';

/**
 * Helper to create a Document.
 * @param {string} html
 * @returns {Document}
 */
function makeDoc (html) {
  return new JSDOM(html).window.document;
}

describe('XPathTransformerContext additional coverage', () => {
  it('covers iterator branch (v1) returning nodes via iterateNext()', () => {
    const doc = makeDoc(
      '<root><child>A</child><child>B</child><child>C</child></root>'
    );
    // Provide a joiner though we won't append output here
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: doc.documentElement,
      joiningTransformer: joiner,
      xpathVersion: 1
    }, []);
    // Use ANY_TYPE by calling without asNodes; jsdom returns iterator type
    // which gets converted to an array via iterateNext()
    const res = /** @type {Node[]} */ (ctx._evalXPath('//*'));
    // Should return array of nodes from iterator
    expect(Array.isArray(res)).to.equal(true);
    expect(res.length).to.be.greaterThan(0);
    expect(res[0].nodeType).to.equal(1);
  });

  it('covers v2 scalar return (line 132) without asNodes', () => {
    const doc = makeDoc('<root><child>Test</child></root>');
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: doc.documentElement,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, []);
    const scalarWrapped = /** @type {Node[]} */ (ctx._evalXPath('1+2', true));
    expect(Array.isArray(scalarWrapped)).to.be.true;
    expect(scalarWrapped[0]).to.equal(3);
  });
});
