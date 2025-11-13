import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {
  DOMJoiningTransformer,
  JSONJoiningTransformer,
  StringJoiningTransformer
} from '../src/index-node.js';

describe('Additional branch coverage', () => {
  describe('DOMJoiningTransformer xmlDecl field permutations', () => {
    it('xmlDecl with only encoding, no version or standalone', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({method: 'xml', encoding: 'utf8'});
      joiner.element('root', {}, () => {
        joiner.text('x');
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      const pi = doc.firstChild;
      expect(pi && pi.nodeType).to.equal(7);
      const val = pi && pi.nodeValue;
      expect(val && val.includes('encoding="utf8"')).to.equal(true);
      expect(val && !val.includes('version')).to.equal(true);
      expect(val && !val.includes('standalone')).to.equal(true);
    });

    it('xmlDecl with only standalone, no version or encoding', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({method: 'xml', standalone: true});
      joiner.element('root', {}, () => {
        joiner.text('x');
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      const pi = doc.firstChild;
      expect(pi && pi.nodeType).to.equal(7);
      const val = pi && pi.nodeValue;
      expect(val && val.includes('standalone="yes"')).to.equal(true);
      expect(val && !val.includes('version')).to.equal(true);
      expect(val && !val.includes('encoding')).to.equal(true);
    });

    it('xmlns from atts with no prefix in element name', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({method: 'xml'});
      // Element name without colon; xmlns comes from atts
      joiner.element('root', {xmlns: 'http://test.com'}, () => {
        joiner.text('x');
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      expect(doc.documentElement.namespaceURI).to.equal('http://test.com');
    });
  });

  describe('JSONJoiningTransformer xmlDecl field permutations', () => {
    it('xmlDecl with only standalone, no version or encoding', () => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});
      joiner.output({method: 'xml', standalone: true});
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const doc = joiner._docs[0];
      const {xmlDeclaration} = doc.$document;
      expect(xmlDeclaration).to.exist;
      expect(xmlDeclaration.standalone).to.equal(true);
      expect(xmlDeclaration.version).to.equal(undefined);
      expect(xmlDeclaration.encoding).to.equal(undefined);
    });

    it('xmlDecl with encoding but no version', () => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});
      joiner.output({method: 'xml', encoding: 'ascii'});
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const doc = joiner._docs[0];
      const {xmlDeclaration} = doc.$document;
      expect(xmlDeclaration).to.exist;
      expect(xmlDeclaration.encoding).to.equal('ascii');
      expect(xmlDeclaration.version).to.equal(undefined);
    });

    it('resultDocument with empty _obj array (line 682)', () => {
      const joiner = new JSONJoiningTransformer([]);
      joiner.resultDocument('empty.xml', () => {
        joiner.output({method: 'xml'});
        joiner._obj = []; // Force empty array
      });
      const res = joiner._resultDocuments[0];
      expect(res.href).to.equal('empty.xml');
      expect(res.document.$document).to.exist;
      const {childNodes} = res.document.$document;
      // Should have DTD and 'root' fallback element
      expect(Array.isArray(childNodes)).to.equal(true);
    });

    it('resultDocument format uses callback outputConfig', () => {
      const joiner = new JSONJoiningTransformer([]);
      joiner.resultDocument('doc.xml', () => {
        joiner.output({method: 'xhtml'});
        joiner.element('html', {}, [], () => {
          joiner.text('x');
        });
      });
      const res = joiner._resultDocuments[0];
      // Should use this._outputConfig.method set in callback
      expect(res.format).to.equal('xhtml');
    });
  });

  describe('StringJoiningTransformer xmlDecl and DOCTYPE permutations', () => {
    it('xmlDecl with only standalone', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({method: 'xml', standalone: true});
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const out = joiner._str;
      expect(out).to.include('standalone="yes"');
      expect(out).to.not.include('version');
      expect(out).to.not.include('encoding');
    });

    it('DOCTYPE with only publicId set (requires systemId)', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({
        method: 'xml',
        doctypePublic: '-//W3C//DTD XHTML 1.0//EN',
        doctypeSystem: 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
      });
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const out = joiner._str;
      expect(out).to.include('<!DOCTYPE root PUBLIC');
      expect(out).to.include('-//W3C//DTD XHTML 1.0//EN');
      expect(out).to.include('http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd');
    });

    it('resultDocument format uses callback config', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.resultDocument('doc.html', () => {
        joiner.output({method: 'html'});
        joiner.element('div', {}, [], () => {
          joiner.text('x');
        });
      });
      const res = joiner._resultDocuments[0];
      expect(res.format).to.equal('html');
    });

    it('xmlDecl with version and encoding, no standalone', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({method: 'xml', version: '1.1', encoding: 'utf-16'});
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const out = joiner._str;
      expect(out).to.include('version="1.1"');
      expect(out).to.include('encoding="utf-16"');
      expect(out).to.not.include('standalone');
    });
  });

  describe('Edge cases for better branch coverage', () => {
    it('DOM: element without xmlns in atts uses null namespace', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({method: 'xml'});
      // Element name without colon and no xmlns in atts
      joiner.element('root', {}, () => {
        joiner.text('content');
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      // Document created with null namespace when no xmlns provided
      expect(doc.documentElement.nodeName).to.equal('root');
      expect(doc.documentElement.namespaceURI).to.equal(null);
    });

    it('JSON: elementData fallback when _obj is object not array', () => {
      const joiner = new JSONJoiningTransformer({});
      joiner.resultDocument('doc.xml', () => {
        joiner.output({method: 'xml'});
        // _obj starts as {}, not []
        joiner.element('root', {a: '1'}, [], () => {
          joiner.text('x');
        });
      });
      const res = joiner._resultDocuments[0];
      expect(res.document.$document).to.exist;
      // Should construct document with 'root' element
      const {childNodes} = res.document.$document;
      const el = childNodes.find(
        (/** @type {any} */ n) => Array.isArray(n) && n[0] === 'root'
      );
      expect(el).to.exist;
    });

    it('DOM: resultDocument without output() uses cfg format', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.resultDocument('doc.txt', () => {
        // No output() call, cfg provides method
        joiner.element('div', {}, () => {
          joiner.text('text');
        });
      }, {method: 'text'});
      const res = joiner._resultDocuments[0];
      // Format should be from cfg parameter
      expect(res.format).to.equal('text');
    });
  });
});
