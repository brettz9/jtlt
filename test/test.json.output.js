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

  it('returns a document wrapper when output() is called', (done) => {
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
      expect(result).to.be.an('object');
      expect(result).to.have.property('$document');
      expect(result.$document).to.have.property('xmlDeclaration');
      expect(result.$document.xmlDeclaration).to.deep.equal({
        version: '1.0',
        encoding: 'utf8',
        standalone: undefined
      });
      expect(result.$document).to.have.property('childNodes');
      expect(result.$document.childNodes).to.be.an('array');
      expect(result.$document.childNodes).to.have.length(2);
      // DOCTYPE
      expect(result.$document.childNodes[0]).to.have.property('$DOCTYPE');
      expect(result.$document.childNodes[0].$DOCTYPE.name).to.equal('root');
      // Root element
      const rootEl = result.$document.childNodes[1];
      expect(rootEl).to.be.an('array');
      expect(rootEl[0]).to.equal('root');
      expect(rootEl[1]).to.deep.equal({id: 'main'});
      done();
    } catch (err) {
      done(err);
    }
  });

  it(
    'returns a document wrapper when exposeDocument config is true',
    (done) => {
      const joiner = new JSONJoiningTransformer([], {exposeDocument: true});
      joiner.element('root', {id: 'test'}, [], () => {
        joiner.text('Content');
      });
      const result = joiner.get();
      try {
        expect(result).to.be.an('object');
        expect(result).to.have.property('$document');
        expect(result.$document).to.have.property('childNodes');
        const rootEl = result.$document.childNodes[1];
        expect(rootEl[0]).to.equal('root');
        expect(rootEl[1]).to.deep.equal({id: 'test'});
        done();
      } catch (err) {
        done(err);
      }
    }
  );

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
