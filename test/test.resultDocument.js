import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {
  DOMJoiningTransformer,
  JSONJoiningTransformer,
  StringJoiningTransformer
} from '../src/index-node.js';

describe('resultDocument() method', () => {
  describe('DOMJoiningTransformer', () => {
    it('creates result documents with href metadata', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // Create first result document
      joiner.resultDocument('output/doc1.xml', () => {
        joiner.output({
          method: 'xml',
          version: '1.0',
          encoding: 'utf8'
        });
        joiner.element('doc1', {}, () => {
          joiner.text('First document');
        });
      });

      // Create second result document
      joiner.resultDocument('output/doc2.xml', () => {
        joiner.output({
          method: 'xml',
          version: '1.0'
        });
        joiner.element('doc2', {}, () => {
          joiner.text('Second document');
        });
      });

      expect(joiner._resultDocuments).to.be.an('array');
      expect(joiner._resultDocuments.length).to.equal(2);

      // Check first result document
      const result1 = joiner._resultDocuments[0];
      expect(result1.href).to.equal('output/doc1.xml');
      expect(result1.format).to.equal('xml');
      expect(result1.document).to.exist;
      expect(result1.document.nodeType).to.equal(9); // DOCUMENT_NODE
      expect(result1.document.documentElement.nodeName).to.equal('doc1');
      expect(result1.document.documentElement.textContent).to.equal(
        'First document'
      );

      // Check second result document
      const result2 = joiner._resultDocuments[1];
      expect(result2.href).to.equal('output/doc2.xml');
      expect(result2.format).to.equal('xml');
      expect(result2.document.documentElement.nodeName).to.equal('doc2');
      expect(result2.document.documentElement.textContent).to.equal(
        'Second document'
      );
    });

    it('supports different output formats via config', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      joiner.resultDocument('output/page.html', () => {
        joiner.output({method: 'html'});
        joiner.element('html', {}, () => {
          joiner.element('body', {}, () => {
            joiner.text('HTML content');
          });
        });
      }, {method: 'html'});

      const result = joiner._resultDocuments[0];
      expect(result.href).to.equal('output/page.html');
      expect(result.format).to.equal('html');
    });

    it('supports xhtml output format via config', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      joiner.resultDocument('output/page.xhtml', () => {
        joiner.output({method: 'xhtml'});
        joiner.element('html', {}, () => {
          joiner.element('body', {}, () => {
            joiner.text('XHTML content');
          });
        });
      }, {method: 'xhtml'});

      const result = joiner._resultDocuments[0];
      expect(result.href).to.equal('output/page.xhtml');
      expect(result.format).to.equal('xhtml');
    });

    it('preserves state after resultDocument() callback', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // Build main content
      joiner.element('main', {}, () => {
        joiner.text('Main content');
      });

      // Create result document
      joiner.resultDocument('separate.xml', () => {
        joiner.output({method: 'xml'});
        joiner.element('separate', {}, () => {
          joiner.text('Separate doc');
        });
      });

      // Continue building main content
      joiner.element('footer', {}, () => {
        joiner.text('Footer');
      });

      // Verify result document was created
      expect(joiner._resultDocuments.length).to.equal(1);
      expect(joiner._resultDocuments[0].href).to.equal('separate.xml');

      // Verify main DOM still has original content
      const mainEl = joiner._dom.querySelector('main');
      const footerEl = joiner._dom.querySelector('footer');
      expect(mainEl).to.exist;
      expect(footerEl).to.exist;
      expect(mainEl && mainEl.textContent).to.equal('Main content');
      expect(footerEl && footerEl.textContent).to.equal('Footer');
    });

    it('supports nested elements in result documents', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      joiner.resultDocument('nested.xml', () => {
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

      const result = joiner._resultDocuments[0];
      const root = result.document.documentElement;
      expect(root.nodeName).to.equal('root');
      expect(root.getAttribute('id')).to.equal('test');
      expect(root.children.length).to.equal(2);
      expect(root.children[0].nodeName).to.equal('child1');
      expect(root.children[1].nodeName).to.equal('child2');
    });
  });

  describe('JSONJoiningTransformer', () => {
    it('creates result documents with href metadata', () => {
      const joiner = new JSONJoiningTransformer([]);

      // Create first result document
      joiner.resultDocument('output/doc1.json', () => {
        joiner.output({
          method: 'xml', doctypePublic: '-//W3C//DTD XHTML 1.0//EN'
        });
        joiner.element('doc1', {}, [], () => {
          joiner.text('First document');
        });
      });

      // Create second result document
      joiner.resultDocument('output/doc2.json', () => {
        joiner.output({method: 'xml'});
        joiner.element('doc2', {attr: 'value'}, [], () => {
          joiner.text('Second document');
        });
      });

      expect(joiner._resultDocuments).to.be.an('array');
      expect(joiner._resultDocuments.length).to.equal(2);

      // Check first result document
      const result1 = joiner._resultDocuments[0];
      expect(result1.href).to.equal('output/doc1.json');
      expect(result1.format).to.equal('xml');
      expect(result1.document).to.exist;
      expect(result1.document.$document).to.exist;

      // Check second result document
      const result2 = joiner._resultDocuments[1];
      expect(result2.href).to.equal('output/doc2.json');
      expect(result2.format).to.equal('xml');
    });

    it('supports different output formats', () => {
      const joiner = new JSONJoiningTransformer([]);

      joiner.resultDocument('data.json', () => {
        joiner.output({method: 'json'});
        joiner.element('root', {type: 'json'}, [], () => {
          joiner.text('JSON data');
        });
      }, {method: 'json'});

      const result = joiner._resultDocuments[0];
      expect(result.href).to.equal('data.json');
      expect(result.format).to.equal('json');
    });

    it('supports xhtml output format', () => {
      const joiner = new JSONJoiningTransformer([]);

      joiner.resultDocument('page.xhtml', () => {
        joiner.output({method: 'xhtml'});
        joiner.element('html', {}, [], () => {
          joiner.element('body', {}, [], () => {
            joiner.text('XHTML content');
          });
        });
      }, {method: 'xhtml'});

      const result = joiner._resultDocuments[0];
      expect(result.href).to.equal('page.xhtml');
      expect(result.format).to.equal('xhtml');
      expect(result.document.$document).to.exist;
    });

    it('preserves state after resultDocument() callback', () => {
      const joiner = new JSONJoiningTransformer([]);

      // Build main structure
      joiner.element('main', {}, [], () => {
        joiner.text('Main');
      });

      // Create result document
      joiner.resultDocument('separate.json', () => {
        joiner.output({method: 'xml'});
        joiner.element('separate', {}, [], () => {
          joiner.text('Separate');
        });
      });

      // Continue main structure
      joiner.element('footer', {}, [], () => {
        joiner.text('Footer');
      });

      expect(joiner._resultDocuments.length).to.equal(1);
      expect(joiner._resultDocuments[0].href).to.equal('separate.json');

      // Main array should have two elements
      expect(Array.isArray(joiner._obj)).to.be.true;
      expect(joiner._obj.length).to.equal(2);
    });

    it('captures nested elements in result documents', () => {
      const joiner = new JSONJoiningTransformer([]);

      joiner.resultDocument('nested.json', () => {
        joiner.output({method: 'xml'});
        joiner.element('root', {id: 'test'}, [], () => {
          joiner.element('child1', {}, [], () => {
            joiner.text('Child 1');
          });
          joiner.element('child2', {}, [], () => {
            joiner.text('Child 2');
          });
        });
      });

      const result = joiner._resultDocuments[0];
      expect(result.document.$document).to.exist;

      const {childNodes} = result.document.$document;
      const rootElement = childNodes.find(
        (/** @type {any} */ node) => Array.isArray(node) && node[0] === 'root'
      );

      expect(rootElement).to.exist;
      expect(rootElement[0]).to.equal('root');
      expect(rootElement[1]).to.deep.equal({id: 'test'});
    });

    it('handles result documents without output config', () => {
      const joiner = new JSONJoiningTransformer([]);
      joiner.resultDocument('simple.json', () => {
        // No output() call here
        joiner.element('simple', {}, [], () => {
          joiner.text('Content');
        });
      });

      const res = joiner._resultDocuments[0];
      expect(res.href).to.equal('simple.json');
      // Without output config, document is raw array/object
      expect(Array.isArray(res.document)).to.equal(true);
      expect(res.format).to.equal(undefined);
      const el = res.document[0];
      expect(Array.isArray(el)).to.equal(true);
      expect(el[0]).to.equal('simple');
    });

    it('uses _docs when exposeDocuments is true during resultDocument', () => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});
      joiner.resultDocument('doc.xml', () => {
        joiner.output({method: 'xml'});
        joiner.element('root', {a: '1'}, [], () => {
          joiner.text('x');
        });
      }, {method: 'xml'});

      expect(joiner._docs.length).to.be.greaterThan(0);
      const lastDoc = joiner._docs.at(-1);
      const res = joiner._resultDocuments[0];
      expect(res.href).to.equal('doc.xml');
      expect(res.format).to.equal('xml');
      expect(res.document).to.equal(lastDoc);
      // Root element is last child in $document.childNodes
      const {childNodes} = res.document.$document;
      const root = childNodes.at(-1);
      expect(root[0]).to.equal('root');
      expect(root[1]).to.deep.equal({a: '1'});
    });
  });

  describe('StringJoiningTransformer', () => {
    it('creates result documents with href metadata', () => {
      const joiner = new StringJoiningTransformer('');

      // Create first result document
      joiner.resultDocument('output/doc1.xml', () => {
        joiner.output({
          method: 'xml',
          version: '1.0',
          encoding: 'utf8',
          doctypePublic: '-//W3C//DTD XHTML 1.0//EN',
          doctypeSystem: 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
        });
        joiner.element('doc1', {}, [], () => {
          joiner.text('First document');
        });
      });

      // Create second result document
      joiner.resultDocument('output/doc2.xml', () => {
        joiner.output({method: 'xml'});
        joiner.element('doc2', {attr: 'value'}, [], () => {
          joiner.text('Second document');
        });
      });

      expect(joiner._resultDocuments).to.be.an('array');
      expect(joiner._resultDocuments.length).to.equal(2);

      // Check first result document
      const result1 = joiner._resultDocuments[0];
      expect(result1.href).to.equal('output/doc1.xml');
      expect(result1.format).to.equal('xml');
      expect(result1.document).to.be.a('string');
      expect(result1.document).to.include('<?xml');
      expect(result1.document).to.include('version="1.0"');
      expect(result1.document).to.include('encoding="utf8"');
      expect(result1.document).to.include('<!DOCTYPE doc1');
      expect(result1.document).to.include('<doc1>');
      expect(result1.document).to.include('First document');

      // Check second result document
      const result2 = joiner._resultDocuments[1];
      expect(result2.href).to.equal('output/doc2.xml');
      expect(result2.format).to.equal('xml');
      expect(result2.document).to.include('<doc2');
      expect(result2.document).to.include('attr="value"');
      expect(result2.document).to.include('Second document');
    });

    it('supports different output formats', () => {
      const joiner = new StringJoiningTransformer('');

      joiner.resultDocument('page.html', () => {
        joiner.output({method: 'html'});
        joiner.element('html', {}, [], () => {
          joiner.element('body', {}, [], () => {
            joiner.text('HTML content');
          });
        });
      }, {method: 'html'});

      const result = joiner._resultDocuments[0];
      expect(result.href).to.equal('page.html');
      expect(result.format).to.equal('html');
      expect(result.document).to.include('<html>');
      expect(result.document).to.include('HTML content');
    });

    it('preserves state after resultDocument() callback', () => {
      const joiner = new StringJoiningTransformer('');

      // Build main content
      joiner.element('main', {}, [], () => {
        joiner.text('Main content');
      });

      // Create result document
      joiner.resultDocument('separate.xml', () => {
        joiner.output({method: 'xml'});
        joiner.element('separate', {}, [], () => {
          joiner.text('Separate doc');
        });
      });

      // Continue main content
      joiner.element('footer', {}, [], () => {
        joiner.text('Footer');
      });

      expect(joiner._resultDocuments.length).to.equal(1);
      expect(joiner._resultDocuments[0].href).to.equal('separate.xml');

      // Main string should contain original content
      const mainStr = joiner._str;
      expect(mainStr).to.include('<main>');
      expect(mainStr).to.include('Main content');
      expect(mainStr).to.include('<footer>');
      expect(mainStr).to.include('Footer');
    });

    it('supports nested elements in result documents', () => {
      const joiner = new StringJoiningTransformer('');

      joiner.resultDocument('nested.xml', () => {
        joiner.output({method: 'xml'});
        joiner.element('root', {id: 'test'}, [], () => {
          joiner.element('child1', {}, [], () => {
            joiner.text('Child 1');
          });
          joiner.element('child2', {}, [], () => {
            joiner.text('Child 2');
          });
        });
      });

      const result = joiner._resultDocuments[0];
      expect(result.document).to.include('<root id="test">');
      expect(result.document).to.include('<child1>');
      expect(result.document).to.include('Child 1');
      expect(result.document).to.include('<child2>');
      expect(result.document).to.include('Child 2');
      expect(result.document).to.include('</root>');
    });

    it('handles result documents without output config', () => {
      const joiner = new StringJoiningTransformer('');

      joiner.resultDocument('simple.xml', () => {
        joiner.element('simple', {}, [], () => {
          joiner.text('Content');
        });
      });

      const result = joiner._resultDocuments[0];
      expect(result.href).to.equal('simple.xml');
      expect(result.document).to.include('<simple>');
      expect(result.document).to.include('Content');
      // Should not include XML declaration without output() config
      expect(result.document).to.not.include('<?xml');
    });

    it('supports multiple result documents with different hrefs', () => {
      const joiner = new StringJoiningTransformer('');

      const hrefs = [
        'output/page1.html',
        'output/page2.html',
        'output/page3.html'
      ];

      hrefs.forEach((href, index) => {
        joiner.resultDocument(href, () => {
          joiner.output({method: 'html'});
          joiner.element('div', {id: `page${index + 1}`}, [], () => {
            joiner.text(`Page ${index + 1} content`);
          });
        }, {method: 'html'});
      });

      expect(joiner._resultDocuments.length).to.equal(3);

      joiner._resultDocuments.forEach((result, index) => {
        expect(result.href).to.equal(hrefs[index]);
        expect(result.format).to.equal('html');
        expect(result.document).to.include(`id="page${index + 1}"`);
        expect(result.document).to.include(`Page ${index + 1} content`);
      });
    });
  });

  describe('Interoperability with document() method', () => {
    it('resultDocument() and document() can be used together', () => {
      const joiner = new StringJoiningTransformer('', {
        exposeDocuments: true
      });

      // Create a regular document
      joiner.document(() => {
        joiner.output({method: 'xml'});
        joiner.element('regular', {}, [], () => {
          joiner.text('Regular doc');
        });
      });

      // Create a result document with metadata
      joiner.resultDocument('specific.xml', () => {
        joiner.output({method: 'xml'});
        joiner.element('specific', {}, [], () => {
          joiner.text('Result doc');
        });
      });

      // Check that both were created
      expect(joiner._docs.length).to.equal(1); // document() pushes here
      expect(
        joiner._resultDocuments.length
      ).to.equal(1); // resultDocument() pushes here

      expect(joiner._docs[0]).to.include('<regular>');
      expect(joiner._resultDocuments[0].href).to.equal('specific.xml');
      expect(joiner._resultDocuments[0].document).to.include('<specific>');
    });
  });
});
