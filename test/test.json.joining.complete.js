import {expect} from 'chai';
import {JSONJoiningTransformer} from '../src/index-node.js';

describe('JSONJoiningTransformer complete coverage', () => {
  describe(
    'document() with omitXmlDeclaration=false for html (line 458)',
    () => {
      it(
        'includes xmlDeclaration when method=html and ' +
        'omitXmlDeclaration=false',
        () => {
          const joiner = new JSONJoiningTransformer([], {
            exposeDocuments: true
          });
          joiner.document(() => {
            joiner.output({
              method: 'html',
              omitXmlDeclaration: false,
              version: '1.1',
              encoding: 'utf8'
            });
            joiner.element('div', {class: 'container'}, [], () => {
              joiner.text('Test content');
            });
          });

          const docs = joiner.get();
          expect(Array.isArray(docs)).to.equal(true);
          const doc = docs[0];
          expect(doc).to.have.property('$document');
          expect(doc.$document).to.have.property('xmlDeclaration');
          expect(doc.$document.xmlDeclaration.version).to.equal('1.1');
          expect(doc.$document.xmlDeclaration.encoding).to.equal('utf8');

          // HTML method should not include DTD
          const {childNodes} = doc.$document;
          expect(childNodes.length).to.be.greaterThan(0);
          // First child should be the element, not a DTD
          const firstChild = childNodes[0];
          expect(Array.isArray(firstChild)).to.equal(true);
          expect(firstChild[0]).to.equal('div');
        }
      );

      it('includes xmlDeclaration with standalone for html', () => {
        const joiner = new JSONJoiningTransformer([], {
          exposeDocuments: true
        });
        joiner.document(() => {
          joiner.output({
            method: 'html',
            omitXmlDeclaration: false,
            version: '1.0',
            standalone: true
          });
          joiner.element('html', {}, [], () => {
            joiner.element('body', {}, [], () => {
              joiner.text('Standalone HTML');
            });
          });
        });

        const docs = joiner.get();
        const doc = docs[0];
        expect(doc.$document.xmlDeclaration).to.exist;
        expect(doc.$document.xmlDeclaration.version).to.equal('1.0');
        expect(doc.$document.xmlDeclaration.standalone).to.equal(true);
      });
    }
  );

  describe(
    'resultDocument() with cfg.method but no output() (line 720)',
    () => {
      it('uses cfg.method as format when no output() is called', () => {
        const joiner = new JSONJoiningTransformer([]);

        joiner.resultDocument('test.html', () => {
          // No output() call - just build content
          joiner.element('div', {id: 'test'}, [], () => {
            joiner.text('Content without output()');
          });
        }, {method: 'html'});

        // Check the stored result document
        expect(joiner._resultDocuments).to.have.lengthOf(1);
        const result = joiner._resultDocuments[0];
        expect(result.href).to.equal('test.html');
        expect(result.format).to.equal('html');
        // Since cfg was provided, document should have $document wrapper
        expect(result.document).to.have.property('$document');
      });

      it('uses cfg.method as format for multiple result documents', () => {
        const joiner = new JSONJoiningTransformer([]);

        joiner.resultDocument('one.xml', () => {
          joiner.element('item', {id: '1'}, [], () => {
            joiner.text('First');
          });
        }, {method: 'xml'});

        joiner.resultDocument('two.json', () => {
          joiner.array([{key: 'value'}]);
        }, {method: 'json'});

        expect(joiner._resultDocuments).to.have.lengthOf(2);
        expect(joiner._resultDocuments[0].format).to.equal('xml');
        expect(joiner._resultDocuments[1].format).to.equal('json');
      });

      it(
        'prefers output() method over cfg.method when both present',
        () => {
          const joiner = new JSONJoiningTransformer([]);

          joiner.resultDocument('test.html', () => {
            // output() method should take precedence
            joiner.output({method: 'xhtml'});
            joiner.element('div', {}, [], () => {
              joiner.text('XHTML content');
            });
          }, {method: 'html'}); // cfg.method is html

          const result = joiner._resultDocuments[0];
          // Should use 'xhtml' from output(), not 'html' from cfg
          expect(result.format).to.equal('xhtml');
        }
      );

      it('handles resultDocument with cfg.method and no content', () => {
        const joiner = new JSONJoiningTransformer([]);

        joiner.resultDocument('empty.txt', () => {
          // Empty callback - no output() or content
        }, {method: 'text'});

        const result = joiner._resultDocuments[0];
        expect(result.format).to.equal('text');
        // Empty result still gets $document wrapper with cfg
        expect(result.document).to.have.property('$document');
        expect(result.document.$document.childNodes).to.deep.equal([[]]);
      });

      it('uses cfg.method when output() has no method property', () => {
        const joiner = new JSONJoiningTransformer([]);

        joiner.resultDocument('test.xml', () => {
          // output() without method, should fall back to cfg.method
          joiner.output({version: '1.0'});
          joiner.element('root', {}, [], () => {
            joiner.text('Fallback to cfg');
          });
        }, {method: 'xml'});

        const result = joiner._resultDocuments[0];
        // Should use cfg.method as fallback
        expect(result.format).to.equal('xml');
        expect(result.document).to.have.property('$document');
      });
    }
  );
});
