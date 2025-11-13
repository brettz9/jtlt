import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JTLT, {DOMJoiningTransformer} from '../src/index-node.js';
describe('DOMJoiningTransformer', () => {
  it('exposes array of documents when exposeDocuments is set', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document, exposeDocuments: true}
    );
    joiner.output({
      method: 'xml',
      version: '1.0',
      encoding: 'utf8',
      standalone: true,
      doctypePublic: '-//W3C//DTD XHTML 1.0 Strict//EN',
      doctypeSystem: 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
    });
    joiner.element('html', {xmlns: 'http://www.w3.org/1999/xhtml'}, () => {
      joiner.element('head', {}, () => {
        joiner.element('title', {}, () => {
          joiner.text('Test');
        });
      });
    });
    // Create a second document
    joiner.root = undefined;
    joiner.element('html', {xmlns: 'http://www.w3.org/1999/xhtml'}, () => {
      joiner.element('body', {}, () => {
        joiner.text('Second doc');
      });
    });
    const docsRaw = joiner.get();
    /** @type {XMLDocument[]} */
    const docs = /** @type {XMLDocument[]} */ (
      /** @type {unknown} */ (docsRaw)
    );
    expect(Array.isArray(docs)).to.be.true;
    expect(docs.length).to.equal(2);
    docs.forEach((doc, i) => {
      expect(doc.nodeType).to.equal(9);
      expect(doc.documentElement.nodeName).to.equal('html');
    });
    const titleNode = docs[0].documentElement.querySelector('title');
    expect(titleNode).to.exist;
    expect(titleNode && titleNode.textContent).to.equal('Test');
    const bodyNode = docs[1].documentElement.querySelector('body');
    expect(bodyNode).to.exist;
    expect(bodyNode && bodyNode.textContent).to.equal('Second doc');
  });
});

describe('DOMJoiningTransformer output', () => {
  it('adds xml decl for html when omit=false', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.output({
      method: 'html', omitXmlDeclaration: false, version: '1.0'
    });
    joiner.element('div', {}, () => {
      joiner.text('Body');
    });
    const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
    const pi = doc.firstChild;
    expect(pi && pi.nodeType).to.equal(7);
    expect(pi && pi.nodeName).to.equal('xml');
    expect(pi && pi.nodeValue && pi.nodeValue.includes('1.0')).to.equal(true);
  });

  it('adds xml decl for xhtml by default', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.output({method: 'xhtml', version: '1.1'});
    joiner.element('html', {xmlns: 'http://www.w3.org/1999/xhtml'}, () => {
      joiner.element('body', {}, () => {
        joiner.text('X');
      });
    });
    const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
    const pi = doc.firstChild;
    expect(pi && pi.nodeType).to.equal(7);
    expect(pi && pi.nodeName).to.equal('xml');
    expect(pi && pi.nodeValue && pi.nodeValue.includes('1.1')).to.equal(true);
  });

  it('omits xml decl when omitXmlDeclaration=true (xml)', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.output({method: 'xml', omitXmlDeclaration: true});
    joiner.element('root', {}, () => {
      joiner.text('x');
    });
    const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
    const first = /** @type {ChildNode|null} */ (doc.firstChild);
    // Either element root or doctype comes first; ensure not PI
    expect(first && first.nodeType).to.not.equal(7);
  });
  it('object()/array() else path appends empty strings', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    // Call object() and array() to hit else branches that append ''
    joiner.object({});
    joiner.array([]);
    const frag = /** @type {DocumentFragment} */ (joiner.get());
    // Should have two text nodes (empty strings)
    expect(frag.childNodes.length).to.equal(2);
    expect(frag.firstChild && frag.firstChild.nodeType).to.equal(3);
    expect(frag.lastChild && frag.lastChild.nodeType).to.equal(3);
  });

  it('builds a simple list', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {items: ['a', 'b', 'c']},
      outputType: 'dom',
      templates: [
        {path: '$', template () {
          const doc = /** @type {Document} */ (
            this._config.joiningTransformer._cfg.document
          );
          const ul = doc.createElement('ul');
          this.forEach('$.items[*]', function (v) {
            const li = doc.createElement('li');
            li.textContent = v;
            ul.append(li);
          });
          return ul;
        }}
      ],
      success (frag) {
        try {
          // Result is a DocumentFragment; check text contents
          expect(frag.textContent).to.equal('abc');
          expect(frag.querySelectorAll('li').length).to.equal(3);
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('accepts output() configuration', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    // Just verify output() is callable and stores config
    joiner.output({
      method: 'xml',
      version: '1.0',
      encoding: 'utf8'
    });
    expect(joiner._outputConfig).to.exist;
    expect(
      joiner._outputConfig && joiner._outputConfig.method
    ).to.equal('xml');
    expect(
      joiner._outputConfig && joiner._outputConfig.version
    ).to.equal('1.0');
  });

  it(
    'builds a document fragment normally',
    () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.element('div', {class: 'test'}, () => {
        joiner.text('Content');
      });
      const result = joiner.get();
      expect(result).to.be.instanceOf(window.DocumentFragment);
      // eslint-disable-next-line prefer-destructuring -- TS
      const childNodes = /** @type {DocumentFragment} */ (
        result
      ).childNodes;
      expect(childNodes.length).to.equal(1);
      const div = /** @type {Element} */ (childNodes[0]);
      expect(div.nodeName).to.equal('DIV');
      expect(div.getAttribute('class')).to.equal('test');
      expect(div.textContent).to.equal('Content');
    }
  );

  it(
    'creates a full XML document with declaration and DOCTYPE',
    () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({
        method: 'xml',
        version: '1.0',
        encoding: 'utf8',
        standalone: true,
        doctypePublic: '-//W3C//DTD XHTML 1.0 Strict//EN',
        doctypeSystem: 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
      });
      joiner.element('html', {xmlns: 'http://www.w3.org/1999/xhtml'}, () => {
        joiner.element('head', {}, () => {
          joiner.element('title', {}, () => {
            joiner.text('Test');
          });
        });
      });

      // Access the created document
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      expect(doc).to.exist;
      expect(doc.nodeType).to.equal(9); // DOCUMENT_NODE

      // Check DOCTYPE
      expect(doc.doctype).to.exist;
      expect(doc.doctype && doc.doctype.name).to.equal('html');
      expect(
        doc.doctype && doc.doctype.publicId
      ).to.equal('-//W3C//DTD XHTML 1.0 Strict//EN');
      expect(
        doc.doctype && doc.doctype.systemId
      ).to.equal('http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd');

      // Check XML declaration (processing instruction)
      const {firstChild} = doc;
      expect(firstChild).to.exist;
      expect(
        firstChild && firstChild.nodeType
      ).to.equal(7); // PROCESSING_INSTRUCTION_NODE
      expect(
        firstChild && firstChild.nodeName
      ).to.equal('xml');
      expect(
        firstChild && firstChild.nodeValue
      ).to.include('version="1.0"');
      expect(
        firstChild && firstChild.nodeValue
      ).to.include('encoding="utf8"');
      expect(
        firstChild && firstChild.nodeValue
      ).to.include('standalone="yes"');

      // Check root element
      expect(doc.documentElement).to.exist;
      expect(doc.documentElement.nodeName).to.equal('html');
      expect(
        doc.documentElement.getAttribute('xmlns')
      ).to.equal('http://www.w3.org/1999/xhtml');

      // New: namespaced root via prefix in element name
      // Reset for a namespaced root element
      joiner.root = undefined;
      joiner.element('x:root', {x: 'http://example.com/ns'}, () => {
        joiner.text('ns');
      });
      const xmlDoc2 = /** @type {XMLDocument} */ (joiner._docs[1]);
      expect(xmlDoc2.documentElement.prefix).to.equal('x');
      expect(xmlDoc2.documentElement.namespaceURI).to.equal('http://example.com/ns');
    }
  );
});
