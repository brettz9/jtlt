import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {
  DOMJoiningTransformer,
  JSONJoiningTransformer,
  StringJoiningTransformer
} from '../src/index-node.js';

describe('document() method', () => {
  describe('DOMJoiningTransformer', () => {
    it('creates multiple documents with document()', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document, exposeDocuments: true}
      );

      // Create first document using document()
      joiner.document(() => {
        joiner.output({
          method: 'xml',
          version: '1.0',
          encoding: 'utf8'
        });
        joiner.element('doc1', {}, () => {
          joiner.text('First document');
        });
      });

      // Create second document using document()
      joiner.document(() => {
        joiner.output({
          method: 'xml',
          version: '1.0'
        });
        joiner.element('doc2', {}, () => {
          joiner.text('Second document');
        });
      });

      const docsRaw = joiner.get();
      const docs = /** @type {XMLDocument[]} */ (
        /** @type {unknown} */ (docsRaw)
      );

      expect(Array.isArray(docs)).to.be.true;
      expect(docs.length).to.equal(2);

      // Check first document
      expect(docs[0].nodeType).to.equal(9); // DOCUMENT_NODE
      expect(docs[0].documentElement.nodeName).to.equal('doc1');
      expect(docs[0].documentElement.textContent).to.equal('First document');

      // Check second document
      expect(docs[1].nodeType).to.equal(9);
      expect(docs[1].documentElement.nodeName).to.equal('doc2');
      expect(docs[1].documentElement.textContent).to.equal('Second document');
    });

    it('allows nested elements within document()', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document, exposeDocuments: true}
      );

      joiner.document(() => {
        joiner.output({method: 'xml'});
        joiner.element('root', {}, () => {
          joiner.element('child1', {}, () => {
            joiner.text('Child 1');
          });
          joiner.element('child2', {}, () => {
            joiner.text('Child 2');
          });
        });
      });

      const docs = /** @type {XMLDocument[]} */ (
        /** @type {unknown} */ (joiner.get())
      );

      expect(docs.length).to.equal(1);
      const root = docs[0].documentElement;
      expect(root.nodeName).to.equal('root');
      expect(root.children.length).to.equal(2);
      expect(root.children[0].nodeName).to.equal('child1');
      expect(root.children[1].nodeName).to.equal('child2');
    });

    it('preserves state after document() callback', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document, exposeDocuments: true}
      );

      // Create a document with specific config
      joiner.output({method: 'xml', version: '1.0'});
      joiner.element('mainDoc', {}, () => {
        joiner.text('Main');
      });

      // Create a nested document with different config
      joiner.document(() => {
        joiner.output({method: 'html'});
        joiner.element('nestedDoc', {}, () => {
          joiner.text('Nested');
        });
      });

      // Verify main document state is preserved
      const docs = /** @type {XMLDocument[]} */ (
        /** @type {unknown} */ (joiner.get())
      );

      expect(docs.length).to.equal(2);
      expect(docs[0].documentElement.nodeName).to.equal('mainDoc');
      expect(docs[1].documentElement.nodeName).to.equal('nestedDoc');
    });
  });

  describe('JSONJoiningTransformer', () => {
    it('creates multiple documents with document()', () => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});

      // Create first document
      joiner.document(() => {
        joiner.output({
          method: 'xml',
          doctypePublic: '-//W3C//DTD XHTML 1.0//EN'
        });
        joiner.element('doc1', {}, () => {
          joiner.text('First document');
        });
      });

      // Create second document
      joiner.document(() => {
        joiner.output({method: 'xml'});
        joiner.element('doc2', {attr: 'value'}, () => {
          joiner.text('Second document');
        });
      });

      const docs = joiner.get();

      expect(Array.isArray(docs)).to.be.true;
      expect(docs.length).to.equal(2);

      // Check first document structure
      expect(docs[0].$document).to.exist;
      expect(docs[0].$document.childNodes).to.be.an('array');
      expect(docs[0].$document.childNodes.length).to.equal(2); // DOCTYPE + element

      // Check second document structure
      expect(docs[1].$document).to.exist;
      expect(docs[1].$document.childNodes).to.be.an('array');
    });

    it('allows nested elements within document()', () => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});

      joiner.document(() => {
        joiner.output({method: 'xml'});
        joiner.element('root', {id: 'test'}, () => {
          joiner.element('child1', {}, () => {
            joiner.text('Child 1');
          });
          joiner.element('child2', {}, () => {
            joiner.text('Child 2');
          });
        });
      });

      const docs = joiner.get();

      expect(docs.length).to.equal(1);
      expect(docs[0].$document).to.exist;

      // Extract root element from document
      const childNodes = docs[0].$document.childNodes;
      const rootElement = childNodes.find(
        (/** @type {any} */ node) => Array.isArray(node) && node[0] === 'root'
      );

      expect(rootElement).to.exist;
      expect(rootElement[0]).to.equal('root');
      expect(rootElement[1]).to.deep.equal({id: 'test'});
      // Children are in remaining array elements
      expect(rootElement.length).to.be.greaterThan(2);
    });

    it('preserves state after document() callback', () => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});

      // Create main document
      joiner.output({method: 'xml'});
      joiner.element('mainDoc', {}, () => {
        joiner.text('Main');
      });

      // Create nested document
      joiner.document(() => {
        joiner.output({method: 'html'});
        joiner.element('nestedDoc', {}, () => {
          joiner.text('Nested');
        });
      });

      const docs = joiner.get();

      expect(docs.length).to.equal(2);
      // Main document should be preserved
      const mainElement = docs[0].$document.childNodes.find(
        (/** @type {any} */ node) =>
          Array.isArray(node) && node[0] === 'mainDoc'
      );
      expect(mainElement).to.exist;

      // Nested document should exist
      const nestedElement = docs[1].$document.childNodes.find(
        (/** @type {any} */ node) =>
          Array.isArray(node) && node[0] === 'nestedDoc'
      );
      expect(nestedElement).to.exist;
    });
  });

  describe('StringJoiningTransformer', () => {
    it('creates multiple documents with document()', () => {
      const joiner = new StringJoiningTransformer('', {
        exposeDocuments: true
      });

      // Create first document
      joiner.document(() => {
        joiner.output({
          method: 'xml',
          version: '1.0',
          encoding: 'utf8',
          doctypePublic: '-//W3C//DTD XHTML 1.0//EN',
          doctypeSystem: 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
        });
        joiner.element('doc1', {}, () => {
          joiner.text('First document');
        });
      });

      // Create second document
      joiner.document(() => {
        joiner.output({method: 'xml'});
        joiner.element('doc2', {attr: 'value'}, () => {
          joiner.text('Second document');
        });
      });

      const docsRaw = joiner.get();
      const docs = /** @type {string[]} */ (docsRaw);

      expect(Array.isArray(docs)).to.be.true;
      expect(docs.length).to.equal(2);

      // Check first document
      expect(docs[0]).to.include('<?xml');
      expect(docs[0]).to.include('version="1.0"');
      expect(docs[0]).to.include('encoding="utf8"');
      expect(docs[0]).to.include('<!DOCTYPE doc1');
      expect(docs[0]).to.include('<doc1>');
      expect(docs[0]).to.include('First document');

      // Check second document
      expect(docs[1]).to.include('<doc2');
      expect(docs[1]).to.include('attr="value"');
      expect(docs[1]).to.include('Second document');
    });

    it('allows nested elements within document()', () => {
      const joiner = new StringJoiningTransformer('', {
        exposeDocuments: true
      });

      joiner.document(() => {
        joiner.output({method: 'xml'});
        joiner.element('root', {id: 'test'}, () => {
          joiner.element('child1', {}, () => {
            joiner.text('Child 1');
          });
          joiner.element('child2', {}, () => {
            joiner.text('Child 2');
          });
        });
      });

      const docs = /** @type {string[]} */ (joiner.get());

      expect(docs.length).to.equal(1);
      expect(docs[0]).to.include('<root id="test">');
      expect(docs[0]).to.include('<child1>');
      expect(docs[0]).to.include('Child 1');
      expect(docs[0]).to.include('<child2>');
      expect(docs[0]).to.include('Child 2');
      expect(docs[0]).to.include('</root>');
    });

    it('preserves state after document() callback', () => {
      const joiner = new StringJoiningTransformer('', {
        exposeDocuments: true
      });

      // Build main document
      joiner.output({method: 'xml'});
      joiner.element('mainDoc', {}, () => {
        joiner.text('Main');
      });

      // Create nested document
      joiner.document(() => {
        joiner.output({method: 'html'});
        joiner.element('nestedDoc', {}, () => {
          joiner.text('Nested');
        });
      });

      const docs = /** @type {string[]} */ (joiner.get());

      expect(docs.length).to.equal(2);
      expect(docs[0]).to.include('<mainDoc>');
      expect(docs[0]).to.include('Main');
      expect(docs[1]).to.include('<nestedDoc>');
      expect(docs[1]).to.include('Nested');
    });

    it('handles document() without output config', () => {
      const joiner = new StringJoiningTransformer('', {
        exposeDocuments: true
      });

      joiner.document(() => {
        joiner.element('simpleDoc', {}, () => {
          joiner.text('Content');
        });
      });

      const docs = /** @type {string[]} */ (joiner.get());

      expect(docs.length).to.equal(1);
      expect(docs[0]).to.include('<simpleDoc>');
      expect(docs[0]).to.include('Content');
      // Should not include XML declaration without output() config
      expect(docs[0]).to.not.include('<?xml');
    });
  });
});
