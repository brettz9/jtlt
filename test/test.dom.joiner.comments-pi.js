import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import DOMJoiningTransformer from '../src/DOMJoiningTransformer.js';

/**
 * Build a DOM joiner with a fresh document.
 * @returns {{doc: Document, joiner: DOMJoiningTransformer}}
 */
function makeJoiner () {
  const {window} = new JSDOM('<!doctype html><html><body></body></html>');
  const doc = window.document;
  const frag = doc.createDocumentFragment();
  const joiner = new DOMJoiningTransformer(
    frag,
    {document: doc}
  );
  return {doc, joiner};
}

describe('DOMJoiningTransformer comment() and processingInstruction()', () => {
  it('appends a comment node to a DocumentFragment', () => {
    const {joiner} = makeJoiner();
    joiner.comment('hello world');
    const frag = joiner.get();
    expect(frag.childNodes).to.have.lengthOf(1);
    const cmt = frag.childNodes[0];
    expect(cmt.nodeType).to.equal(8); // Comment
    expect(cmt.nodeValue).to.equal('hello world');
  });

  it('appends a comment node when current _dom is an Element', () => {
    const {doc, joiner} = makeJoiner();
    // Switch context to element via element()
    joiner.element('div', {id: 'x'}, () => {
      joiner.comment('inside');
    });
    const frag = joiner.get();
    const div = /** @type {Element} */ (frag.querySelector('div'));
    expect(div).to.exist; // ensure element appended
    const cmt = div.childNodes[0];
    expect(cmt.nodeType).to.equal(8);
    expect(cmt.nodeValue).to.equal('inside');
  });

  it('throws on comment() when _dom is an unsupported Text node', () => {
    const {doc, joiner} = makeJoiner();
    // @ts-ignore override internal _dom for negative test
    joiner._dom = doc.createTextNode('x');
    expect(() => joiner.comment('bad')).to.throw(
      'You may only set a comment on a document, fragment, or element'
    );
  });

  it('appends a processing instruction node to a fragment', () => {
    const {joiner} = makeJoiner();
    joiner.processingInstruction(
      'xml-stylesheet',
      'type="text/xsl" href="test.xsl"'
    );
    const pi = /** @type {ProcessingInstruction} */ (
      joiner.get().childNodes[0]
    );
    expect(pi.nodeType).to.equal(7); // ProcessingInstruction
    expect(pi.target).to.equal('xml-stylesheet');
    expect(pi.data).to.equal('type="text/xsl" href="test.xsl"');
  });

  it('appends a processing instruction inside an element context', () => {
    const {joiner} = makeJoiner();
    joiner.element('root', {}, () => {
      joiner.processingInstruction('xml-stylesheet', 'a="b"');
    });
    const pi = /** @type {ProcessingInstruction} */ (
      /** @type {Element} */ (joiner.get().querySelector('root')).childNodes[0]
    );
    expect(pi.nodeType).to.equal(7);
    expect(pi.target).to.equal('xml-stylesheet');
    expect(pi.data).to.equal('a="b"');
  });

  it('throws on processingInstruction() when _dom is a Text node', () => {
    const {doc, joiner} = makeJoiner();
    // @ts-ignore override internal _dom for negative test
    joiner._dom = doc.createTextNode('x');
    expect(() => joiner.processingInstruction('xml-stylesheet', 'a')).to.throw(
      'You may only set a processing instruction on a document, ' +
      'fragment, or element'
    );
  });
});
