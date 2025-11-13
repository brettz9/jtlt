import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {
  DOMJoiningTransformer,
  JSONJoiningTransformer,
  StringJoiningTransformer
} from '../src/index-node.js';

describe('Branch coverage edge cases', () => {
  describe('DOMJoiningTransformer branches', () => {
    it('xmlns fallback when no prefix in element name (line 233)', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({method: 'xml'});
      // No colon in element name; hits else branch (xmlns from atts)
      joiner.element('root', {xmlns: 'http://example.com/ns'}, () => {
        joiner.text('x');
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      expect(doc.documentElement.namespaceURI).to.equal('http://example.com/ns');
    });

    it('omitXmlDeclaration undefined with html method (line 220)', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({method: 'html'});
      joiner.element('html', {}, () => {
        joiner.text('x');
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      // No xmlDecl for html when omitXmlDeclaration is undefined
      const first = doc.firstChild;
      expect(first && first.nodeType).to.not.equal(7);
    });

    it('xmlDecl with no version (line 247-254)', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({method: 'xml', encoding: 'iso-8859-1'});
      joiner.element('root', {}, () => {
        joiner.text('x');
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      const pi = doc.firstChild;
      expect(pi && pi.nodeType).to.equal(7);
      const val = pi && pi.nodeValue;
      expect(val && val.includes('iso-8859-1')).to.equal(true);
      expect(val && val.includes('version')).to.equal(false);
    });

    it('xmlDecl with standalone false omits attribute (line 254)', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({method: 'xml', version: '1.0', standalone: false});
      joiner.element('root', {}, () => {
        joiner.text('x');
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      const pi = doc.firstChild;
      expect(pi && pi.nodeType).to.equal(7);
      const val = pi && pi.nodeValue;
      // standalone=false is falsy, so outer ternary omits standalone attribute
      expect(val && val.includes('standalone')).to.equal(false);
    });

    it('non-object elName path (line 291)', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      // Call element twice; first creates root doc; second is non-root
      joiner.output({method: 'xml'});
      joiner.element('root', {}, () => {
        // elName is string here, not object; hits createElement path
        joiner.element('child', {id: 'x'}, () => {
          joiner.text('c');
        });
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      const child = doc.querySelector('child');
      expect(child).to.exist;
      expect(child && child.getAttribute('id')).to.equal('x');
    });

    it('resultDocument format fallback to cfg (line 466)', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.resultDocument('x.xml', () => {
        // No output() call; no this._outputConfig
        joiner.element('x', {}, () => {
          joiner.text('y');
        });
      }, {method: 'xml'});
      const res = joiner._resultDocuments[0];
      // Format should fallback to cfg.method
      expect(res.format).to.equal('xml');
    });
  });

  describe('JSONJoiningTransformer branches', () => {
    it('xmlDecl without version (line 458)', () => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});
      joiner.output({
        method: 'xhtml', encoding: 'utf16', omitXmlDeclaration: false
      });
      joiner.element('html', {}, [], () => {
        joiner.text('x');
      });
      const doc = joiner._docs[0];
      const {xmlDeclaration} = doc.$document;
      expect(xmlDeclaration).to.exist;
      expect(xmlDeclaration.encoding).to.equal('utf16');
      expect(xmlDeclaration.version).to.equal(undefined);
    });

    it('elementData fallback when _obj not array (line 682-684)', () => {
      const joiner = new JSONJoiningTransformer({});
      joiner.resultDocument('x.xml', () => {
        joiner.output({method: 'xml'});
        // _obj is {} not []; elementData = this._obj
        joiner.element('root', {}, [], () => {
          joiner.text('x');
        });
      });
      const res = joiner._resultDocuments[0];
      // Should still build document wrapper
      expect(res.document.$document).to.exist;
      const name = res.document.$document.childNodes.at(-1);
      expect(Array.isArray(name)).to.equal(true);
      expect(name[0]).to.equal('root');
    });

    it('resultDocument format fallback to cfg (line 720)', () => {
      const joiner = new JSONJoiningTransformer([]);
      joiner.resultDocument('x.json', () => {
        joiner.element('x', {}, [], () => {
          joiner.text('y');
        });
      }, {method: 'json'});
      const res = joiner._resultDocuments[0];
      // No output() in callback; fallback to cfg.method
      expect(res.format).to.equal('json');
    });
  });

  describe('StringJoiningTransformer branches', () => {
    it('xmlDecl without encoding (line 478-484)', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({method: 'xml', version: '1.1'});
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const out = joiner._str;
      expect(out).to.include('version="1.1"');
      expect(out).to.not.include('encoding');
    });

    it('DOCTYPE SYSTEM without PUBLIC (line 495)', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({method: 'xml', doctypeSystem: 'system.dtd'});
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const out = joiner._str;
      expect(out).to.include('<!DOCTYPE root SYSTEM "system.dtd">');
      expect(out).to.not.include('PUBLIC');
    });

    it('resultDocument format fallback to cfg (line 808)', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.resultDocument('x.xml', () => {
        joiner.element('x', {}, [], () => {
          joiner.text('y');
        });
      }, {method: 'xml'});
      const res = joiner._resultDocuments[0];
      // No output() in callback; fallback to cfg.method
      expect(res.format).to.equal('xml');
    });
  });
});
