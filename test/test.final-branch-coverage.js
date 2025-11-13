import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {
  DOMJoiningTransformer,
  JSONJoiningTransformer,
  StringJoiningTransformer
} from '../src/index-node.js';

describe('Final branch coverage for nested conditionals', () => {
  describe('DOMJoiningTransformer nested branches', () => {
    it('xmlDecl with all three fields set', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({
        method: 'xml',
        version: '1.0',
        encoding: 'iso-8859-1',
        standalone: true
      });
      joiner.element('root', {}, () => {
        joiner.text('x');
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      const pi = doc.firstChild;
      const val = pi && pi.nodeValue;
      expect(val && val.includes('version="1.0"')).to.equal(true);
      expect(val && val.includes('encoding="iso-8859-1"')).to.equal(true);
      expect(val && val.includes('standalone="yes"')).to.equal(true);
    });

    it('xmlDecl version and standalone, no encoding', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({method: 'xml', version: '1.1', standalone: true});
      joiner.element('root', {}, () => {
        joiner.text('x');
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      const pi = doc.firstChild;
      const val = pi && pi.nodeValue;
      expect(val && val.includes('version="1.1"')).to.equal(true);
      expect(val && val.includes('standalone="yes"')).to.equal(true);
      expect(val && !val.includes('encoding')).to.equal(true);
    });

    it('xmlDecl encoding and standalone, no version', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({
        method: 'xml', encoding: 'utf16', standalone: true
      });
      joiner.element('root', {}, () => {
        joiner.text('x');
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      const pi = doc.firstChild;
      const val = pi && pi.nodeValue;
      expect(val && val.includes('encoding="utf16"')).to.equal(true);
      expect(val && val.includes('standalone="yes"')).to.equal(true);
      expect(val && !val.includes('version')).to.equal(true);
    });
  });

  describe('JSONJoiningTransformer nested field branches', () => {
    it('xmlDecl with all three fields', () => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});
      joiner.output({
        method: 'xml',
        version: '1.0',
        encoding: 'utf8',
        standalone: true
      });
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const doc = joiner._docs[0];
      const {xmlDeclaration} = doc.$document;
      expect(xmlDeclaration.version).to.equal('1.0');
      expect(xmlDeclaration.encoding).to.equal('utf8');
      expect(xmlDeclaration.standalone).to.equal(true);
    });

    it('xmlDecl version and standalone', () => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});
      joiner.output({method: 'xml', version: '1.1', standalone: true});
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const doc = joiner._docs[0];
      const {xmlDeclaration} = doc.$document;
      expect(xmlDeclaration.version).to.equal('1.1');
      expect(xmlDeclaration.standalone).to.equal(true);
      expect(xmlDeclaration.encoding).to.equal(undefined);
    });

    it('xmlDecl encoding and standalone', () => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});
      joiner.output({method: 'xml', encoding: 'ascii', standalone: true});
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const doc = joiner._docs[0];
      const {xmlDeclaration} = doc.$document;
      expect(xmlDeclaration.encoding).to.equal('ascii');
      expect(xmlDeclaration.standalone).to.equal(true);
      expect(xmlDeclaration.version).to.equal(undefined);
    });

    it('resultDocument elementData from non-array _obj', () => {
      const joiner = new JSONJoiningTransformer({x: 1});
      joiner.resultDocument('doc.xml', () => {
        joiner.output({method: 'xml'});
        // Initial _obj is object, not array
        joiner._obj = {nested: {y: 2}};
      });
      const res = joiner._resultDocuments[0];
      // Should construct document with elementData = _obj
      expect(res.document.$document).to.exist;
    });
  });

  describe('StringJoiningTransformer nested branches', () => {
    it('xmlDecl with all three fields', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({
        method: 'xml',
        version: '1.0',
        encoding: 'utf8',
        standalone: true
      });
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const out = joiner._str;
      expect(out).to.include('version="1.0"');
      expect(out).to.include('encoding="utf8"');
      expect(out).to.include('standalone="yes"');
    });

    it('xmlDecl version and standalone', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({method: 'xml', version: '1.1', standalone: true});
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const out = joiner._str;
      expect(out).to.include('version="1.1"');
      expect(out).to.include('standalone="yes"');
      expect(out).to.not.include('encoding');
    });

    it('xmlDecl encoding and standalone', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({
        method: 'xml', encoding: 'utf16', standalone: true
      });
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const out = joiner._str;
      expect(out).to.include('encoding="utf16"');
      expect(out).to.include('standalone="yes"');
      expect(out).to.not.include('version');
    });

    it('xmlDecl version and encoding, no standalone', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({method: 'xml', version: '1.0', encoding: 'utf8'});
      joiner.element('root', {}, [], () => {
        joiner.text('x');
      });
      const out = joiner._str;
      expect(out).to.include('version="1.0"');
      expect(out).to.include('encoding="utf8"');
      expect(out).to.not.include('standalone');
    });
  });

  describe('Misc edge cases for complete coverage', () => {
    it('DOM omitXmlDeclaration false with xhtml includes xmlDecl', () => {
      const {window} = new JSDOM('<!doctype html><html></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.output({method: 'xhtml', omitXmlDeclaration: false});
      joiner.element('html', {}, () => {
        joiner.text('x');
      });
      const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
      const pi = doc.firstChild;
      expect(pi && pi.nodeType).to.equal(7);
    });

    it('JSON omitXmlDeclaration false with html includes xmlDecl', () => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});
      joiner.output({method: 'html', omitXmlDeclaration: false});
      joiner.element('div', {}, [], () => {
        joiner.text('x');
      });
      const doc = joiner._docs[0];
      expect(doc.$document.xmlDeclaration).to.exist;
    });

    it('String omitXmlDeclaration false with html includes xmlDecl', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({method: 'html', omitXmlDeclaration: false});
      joiner.element('div', {}, [], () => {
        joiner.text('x');
      });
      const out = joiner._str;
      expect(out).to.include('<?xml');
    });
  });
});
