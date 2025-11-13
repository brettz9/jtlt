import {expect} from 'chai';
import JTLT, {JSONJoiningTransformer} from '../src/index-node.js';

// Use the sample data so we don't add more fixtures
const data = (await import(
  './data/jsonpath-sample.json', {with: {type: 'json'}}
)).default;

describe('JSONJoiningTransformer output', () => {
  it('builds an array of authors using root + author templates', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data,
      outputType: 'json',
      templates: [
        {path: '$', template () {
          this.applyTemplates('$.store.book[*].author');
        }},
        {path: '$.store.book[*].author', template (author) {
          return author;
        }}
      ],
      success (result) {
        try {
          expect(result).to.be.an('array');
          expect(result).to.have.length(4);
          expect(
            result && typeof result === 'object' &&
            '0' in result && result[0]
          ).to.equal('Nigel Rees');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('builds an object with propValue via object() and string()', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data,
      outputType: 'json',
      unwrapSingleResult: true,
      joiningTransformer: new JSONJoiningTransformer(
        {}, {unwrapSingleResult: true}
      ),
      templates: [
        {
          path: '$.store.book[0]',
          template (book) {
            const bk =
              /**
               * @type {{
               *   category: string,
               *   author: string,
               *   title: string,
               *   price: number,
               * }}
               */ (book);
            const jt = this._config.joiningTransformer;
            this.object(function () {
              jt.propValue('author', bk.author);
              jt.propValue('price', bk.price);
            });
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.be.an('object');
          expect(
            result && typeof result === 'object' &&
            'author' in result && result.author
          ).to.equal('Nigel Rees');
          expect(
            result && typeof result === 'object' &&
            'price' in result && result.price
          ).to.equal(8.95);
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it(
    'returns plain array when output() is called without exposeDocuments',
    (done) => {
      const joiner = new JSONJoiningTransformer([]);
      joiner.output({
        method: 'xml',
        version: '1.0',
        encoding: 'utf8'
      });
      joiner.element('root', {id: 'main'}, [], () => {
        joiner.element('item', {}, [], () => {
          joiner.text('Hello');
        });
      });
      const result = joiner.get();
      try {
        // Without exposeDocuments, get() returns the raw array
        expect(result).to.be.an('array');
        expect(result).to.have.length(1);
        expect(result[0]).to.be.an('array');
        expect(result[0][0]).to.equal('root');
        expect(result[0][1]).to.deep.equal({id: 'main'});
        done();
      } catch (err) {
        done(err);
      }
    }
  );

  it(
    'returns array of document wrappers when exposeDocuments is true',
    (done) => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});
      joiner.element('root', {id: 'test'}, [], () => {
        joiner.text('Content');
      });
      const result = joiner.get();
      try {
        // With exposeDocuments, get() returns an array of documents
        expect(result).to.be.an('array');
        expect(result).to.have.length(1);
        expect(result[0]).to.be.an('object');
        expect(result[0]).to.have.property('$document');
        expect(result[0].$document).to.have.property('childNodes');
        const {childNodes} = result[0].$document;
        // Root element is the last child (preceded optionally by DOCTYPE)
        const rootEl = childNodes.at(-1);
        expect(rootEl[0]).to.equal('root');
        expect(rootEl[1]).to.deep.equal({id: 'test'});
        done();
      } catch (err) {
        done(err);
      }
    }
  );

  it(
    'includes xmlDecl when omitXmlDeclaration=false for html (element path)',
    () => {
      const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});
      joiner.output({
        method: 'html', omitXmlDeclaration: false, version: '1.2'
      });
      joiner.element('div', {}, [], () => {
        joiner.text('Hello');
      });
      const docs = joiner.get();
      // With exposeDocuments, get() returns an array of docs
      expect(Array.isArray(docs)).to.equal(true);
      const doc = docs[0];
      expect(doc).to.have.property('$document');
      expect(doc.$document).to.have.property('xmlDeclaration');
      expect(doc.$document.xmlDeclaration.version).to.equal('1.2');
      // Ensure first child is the element (no DTD for html)
      const {childNodes} = doc.$document;
      const first = childNodes[0];
      expect(Array.isArray(first)).to.equal(true);
      expect(first[0]).to.equal('div');
    }
  );

  it('includes DTD for xhtml in element path with exposeDocuments', () => {
    const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});
    joiner.output({method: 'xhtml'});
    joiner.element('html', {}, [], () => {
      joiner.element('body', {}, [], () => {
        joiner.text('X');
      });
    });
    const docs = joiner.get();
    const doc = docs[0];
    const {childNodes} = doc.$document;
    // First child should be DOCTYPE object
    const first = childNodes[0];
    expect(Array.isArray(first)).to.equal(false);
    expect(first).to.have.property('$DOCTYPE');
    expect(first.$DOCTYPE.name).to.equal('html');
  });

  it('includes xmlDecl and DTD for xml in element path', () => {
    const joiner = new JSONJoiningTransformer([], {exposeDocuments: true});
    joiner.output({method: 'xml', version: '1.0'});
    joiner.element('root', {}, [], () => {
      joiner.text('Z');
    });
    const docs = joiner.get();
    const doc = docs[0];
    // xmlDeclaration present
    expect(doc.$document.xmlDeclaration).to.exist;
    // DTD present for xml method
    const {childNodes} = doc.$document;
    const first = childNodes[0];
    expect(first).to.have.property('$DOCTYPE');
    expect(first.$DOCTYPE.name).to.equal('root');
  });

  it('resultDocument uses cfg.method when no output() is set', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.resultDocument('raw.json', () => {
      // no output() inside; build an element
      joiner.element('root', {}, [], () => {
        joiner.text('Y');
      });
    }, {method: 'json'});
    const res = joiner._resultDocuments[0];
    expect(res.href).to.equal('raw.json');
    // Format falls back to cfg.method
    expect(res.format).to.equal('json');
    // With cfg present, a $document wrapper is created even without output()
    expect(res.document).to.have.property('$document');
    const {childNodes} = res.document.$document;
    // No DTD for non-xml/xhtml methods
    const first = childNodes[0];
    expect(Array.isArray(first)).to.equal(true);
    expect(first[0]).to.equal('root');
  });

  it(
    'returns plain element array when neither output() nor exposeDocument',
    (done) => {
      const joiner = new JSONJoiningTransformer([]);
      joiner.element('root', {}, [], () => {
        joiner.text('Simple');
      });
      const result = joiner.get();
      try {
        expect(result).to.be.an('array');
        expect(result).to.have.length(1);
        expect(result[0]).to.be.an('array');
        expect(result[0][0]).to.equal('root');
        done();
      } catch (err) {
        done(err);
      }
    }
  );
});
