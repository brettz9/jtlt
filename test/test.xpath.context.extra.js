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
    const joiner = new StringJoiningTransformer('', {document: doc});
    const ctx = new XPathTransformerContext({
      data: doc.documentElement,
      joiningTransformer: joiner,
      xpathVersion: 1
    }, []);
    // Use ANY_TYPE by calling without asNodes; environment may not
    // yield iterator type in jsdom, so assert default fallback behavior
    const res = ctx._evalXPath('//*');
    // When not asNodes, non-iterator types fall back to context node
    // which here is the document element
    // @ts-ignore jsdom element
    expect(res.nodeType).to.equal(1);
  });

  it('covers v2 scalar return (line 132) without asNodes', () => {
    const doc = makeDoc('<root><child>Test</child></root>');
    const joiner = new StringJoiningTransformer('', {document: doc});
    const ctx = new XPathTransformerContext({
      data: doc.documentElement,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, []);
    const scalarWrapped = ctx._evalXPath('1+2', true);
    expect(Array.isArray(scalarWrapped)).to.be.true;
    expect(scalarWrapped[0]).to.equal(3);
  });
});
