import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {DOMJoiningTransformer} from '../src/index-node.js';

describe('DOMJoiningTransformer complete coverage', () => {
  describe('Namespaced element names (lines 220, 233)', () => {
    it('handles prefixed element names with namespace', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document, exposeDocuments: true}
      );

      joiner.output({method: 'xml'});
      joiner.element('svg:svg', {svg: 'http://www.w3.org/2000/svg'}, () => {
        joiner.element('svg:circle', {svg: 'http://www.w3.org/2000/svg'});
      });

      const docs = /** @type {XMLDocument[]} */ (joiner.get());
      expect(docs).to.have.lengthOf(1);
      const doc = docs[0];
      expect(doc.documentElement.nodeName).to.equal('svg:svg');
    });

    it('handles unprefixed element names with xmlns', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document, exposeDocuments: true}
      );

      joiner.output({method: 'xml'});
      joiner.element('html', {xmlns: 'http://www.w3.org/1999/xhtml'}, () => {
        joiner.element('body');
      });

      const docs = /** @type {XMLDocument[]} */ (joiner.get());
      const doc = docs[0];
      expect(doc.documentElement.nodeName).to.equal('html');
      expect(doc.documentElement.namespaceURI).to.equal(
        'http://www.w3.org/1999/xhtml'
      );
    });

    it('creates document without namespace when no xmlns provided', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document, exposeDocuments: true}
      );

      joiner.output({method: 'xml'});
      joiner.element('root', {id: 'test'}, () => {
        joiner.text('Content');
      });

      const docs = /** @type {XMLDocument[]} */ (joiner.get());
      const doc = docs[0];
      expect(doc.documentElement.nodeName).to.equal('root');
      expect(doc.documentElement.getAttribute('id')).to.equal('test');
    });
  });

  describe(
    'omitXmlDeclaration with html method (lines 247, 254)',
    () => {
      it(
        'includes xmlDecl PI when method=html and ' +
        'omitXmlDeclaration=false',
        () => {
          const {window} = new JSDOM(
            '<!doctype html><html><body></body></html>'
          );
          const {document} = window;
          const joiner = new DOMJoiningTransformer(
            document.createDocumentFragment(),
            {document, exposeDocuments: true}
          );

          joiner.output({
            method: 'html',
            omitXmlDeclaration: false,
            version: '1.1'
          });
          joiner.element('div', {}, () => {
            joiner.text('HTML with XML declaration');
          });

          const docs = /** @type {XMLDocument[]} */ (joiner.get());
          const doc = docs[0];
          // Check for processing instruction
          const {firstChild} = doc;
          // PROCESSING_INSTRUCTION_NODE
          expect(firstChild?.nodeType).to.equal(7);
          expect(firstChild?.nodeName).to.equal('xml');
        }
      );

      it('includes standalone in xmlDecl PI when true', () => {
        const {window} = new JSDOM(
          '<!doctype html><html><body></body></html>'
        );
        const {document} = window;
        const joiner = new DOMJoiningTransformer(
          document.createDocumentFragment(),
          {document, exposeDocuments: true}
        );

        joiner.output({
          method: 'xml',
          omitXmlDeclaration: false,
          version: '1.0',
          standalone: true
        });
        joiner.element('root', {}, () => {
          joiner.text('Standalone');
        });

        const docs = /** @type {XMLDocument[]} */ (joiner.get());
        const doc = docs[0];
        const {firstChild} = doc;
        expect(firstChild?.nodeType).to.equal(7);
        expect(firstChild?.nodeValue).to.include('standalone="yes"');
      });
    }
  );

  describe('Element as object (line 291)', () => {
    it('accepts existing element as root with output config (line 216)', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document, exposeDocuments: true}
      );

      // Create an element manually - when used as root with outputConfig,
      // only its localName is used to create a new document
      const existingEl = document.createElement('article');

      // Pass element as root with output config
      joiner.output({method: 'xml'});
      // Attributes passed in second parameter ARE applied to the new doc root
      joiner.element(existingEl, {id: 'main', class: 'root-element'});

      const docs = /** @type {XMLDocument[]} */ (joiner.get());
      expect(docs).to.have.lengthOf(1);
      const doc = docs[0];
      // When an element is passed as root, its localName is used
      expect(doc.documentElement.nodeName).to.equal('article');
      // Attributes passed in second arg are applied to new document element
      expect(doc.documentElement.getAttribute('id')).to.equal('main');
      expect(doc.documentElement.getAttribute('class')).to.equal(
        'root-element'
      );
    });

    it('accepts existing element instead of element name', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // Create an element manually
      const existingEl = document.createElement('div');
      existingEl.dataset.existing = 'true';
      existingEl.textContent = 'Existing';

      // Pass element as first argument
      joiner.element(existingEl, {class: 'added'});

      const result = /** @type {Element} */ (joiner.get());
      expect(result.childNodes).to.have.lengthOf(1);
      const el = /** @type {HTMLElement} */ (result.childNodes[0]);
      expect(el.nodeName).to.equal('DIV');
      expect(el.dataset.existing).to.equal('true');
      // Note: attributes passed as second arg are still applied
      expect(el.getAttribute('class')).to.equal('added');
    });

    it('works with element object in callback form', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const existingEl = document.createElement('section');
      joiner.element(existingEl, {id: 'main'}, () => {
        joiner.element('p', {}, () => {
          joiner.text('Inside existing element');
        });
      });

      const result = /** @type {Element} */ (joiner.get());
      const section = result.childNodes[0];
      expect(section.nodeName).to.equal('SECTION');
      expect(/** @type {Element} */ (
        section
      ).getAttribute('id')).to.equal('main');
      expect(section.childNodes).to.have.lengthOf(1);
      expect(section.childNodes[0].nodeName).to.equal('P');
    });
  });

  describe('resultDocument with cfg.method fallback (line 466)', () => {
    it('uses cfg.method when output() has no method', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      joiner.resultDocument('test.xml', () => {
        joiner.output({version: '1.0'}); // No method
        joiner.element('root', {}, () => {
          joiner.text('Fallback');
        });
      }, {method: 'xml'});

      const result = joiner._resultDocuments[0];
      expect(result.format).to.equal('xml');
    });

    it('uses cfg.method when no output() is called', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      joiner.resultDocument('test.html', () => {
        joiner.element('div', {}, () => {
          joiner.text('No output config');
        });
      }, {method: 'html'});

      const result = joiner._resultDocuments[0];
      expect(result.format).to.equal('html');
    });

    it('prefers output().method over cfg.method', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      joiner.resultDocument('test.xml', () => {
        joiner.output({method: 'xhtml'});
        joiner.element('div', {}, () => {
          joiner.text('XHTML');
        });
      }, {method: 'xml'});

      const result = joiner._resultDocuments[0];
      expect(result.format).to.equal('xhtml');
    });
  });
});
