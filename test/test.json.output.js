import {expect} from 'chai';
import JTLT, {JSONJoiningTransformer} from '../src/index.js';

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
          expect(result[0]).to.equal('Nigel Rees');
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
        {path: '$.store.book[0]', template (book) {
          const jt = this._config.joiningTransformer;
          this.object(function () {
            jt.propValue('author', book.author);
            jt.propValue('price', book.price);
          });
        }}
      ],
      success (result) {
        try {
          expect(result).to.be.an('object');
          expect(result.author).to.equal('Nigel Rees');
          expect(result.price).to.equal(8.95);
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });
});
