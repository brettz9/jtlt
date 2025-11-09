import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JSONPathTransformer from '../src/JSONPathTransformer.js';
import XPathTransformer from '../src/XPathTransformer.js';
import {JSONJoiningTransformer, DOMJoiningTransformer} from '../src/index.js';

/**
 * Build a JSONPath transformer, run its root template, and return output.
 * Exercises JSONPathTransformerContext forwarding of comment() and
 * processingInstruction() calls to the JSONJoiningTransformer.
 * @returns {{out: any[]}} Object containing JSON joiner output
 */
function makeJSONCtx () {
  const joiner = new JSONJoiningTransformer([], {});
  /** @type {{path: string, template: (this: any)=> void}} */
  const tpl = {
    path: '$',
    template () {
      // Open root element then emit comment and PI within its callback.
      this.element('root', {}, [], () => {
        this.comment('jc');
        this.processingInstruction('jpi', 'jdata');
      });
    }
  };
  // Cast config to any; constructor JSDoc doesn't list joiningTransformer.
  const engine = new JSONPathTransformer(/** @type {any} */ ({
    data: {a: 1},
    templates: [tpl],
    joiningTransformer: joiner
  }));
  const out = engine.transform('');
  return {out};
}

/**
 * Build an XPath transformer, run its root template, and return output.
 * Exercises XPathTransformerContext forwarding of comment() and
 * processingInstruction() calls to the DOMJoiningTransformer.
 * @returns {{out: DocumentFragment, doc: Document}} DOM output + document
 */
function makeXPathCtx () {
  const {window} = new JSDOM('<root/>');
  const doc = window.document;
  const joiner = new DOMJoiningTransformer(
    doc.createDocumentFragment(), {document: doc}
  );
  /** @type {{path: string, template: (this: any)=> void}} */
  const tpl = {
    path: '/',
    template () {
      // Emit comment and PI at document root (no element wrapper needed).
      this.comment('xc');
      this.processingInstruction('xpi', 'xdata');
    }
  };
  const engine = new XPathTransformer(/** @type {any} */ ({
    data: doc,
    templates: [tpl],
    joiningTransformer: joiner,
    xpathVersion: 1
  }));
  const out = engine.transform('');
  return {out, doc};
}

describe('Context forwarding: comment() + processingInstruction()', () => {
  it('JSONPathTransformerContext -> JSONJoiningTransformer', () => {
    const {out} = makeJSONCtx();
    const root = out[0];
    expect(root).to.deep.include.members([
      ['!', 'jc'], // comment marker
      ['?', 'jpi', 'jdata']
    ]);
  });

  it('XPathTransformerContext -> DOMJoiningTransformer', () => {
    const {out} = makeXPathCtx();
    expect(out.nodeType).to.equal(11); // DocumentFragment
    let hasComment = false;
    let hasPI = false;
    for (const node of out.childNodes) {
      if (node.nodeType === 8 && node.nodeValue === 'xc') {
        hasComment = true;
      } else if (node.nodeType === 7) {
        const pi = /** @type {ProcessingInstruction} */ (node);
        if (pi.target === 'xpi' && pi.data === 'xdata') {
          hasPI = true;
        }
      }
    }
    expect(hasComment).to.equal(true);
    expect(hasPI).to.equal(true);
  });
});
