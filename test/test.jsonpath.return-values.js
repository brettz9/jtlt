import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JTLT, {
  JSONPathTransformer,
  StringJoiningTransformer,
  DOMJoiningTransformer,
  JSONJoiningTransformer
} from '../src/index-node.js';

describe('JSONPathTransformer return value handling', () => {
  it('appends string return value from root template (line 82-83)', () => {
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '$',
        template () {
          // Return a string instead of using this.string()
          return 'returned-string';
        }
      }
    ];
    const engine = new JSONPathTransformer({
      data: {x: 1},
      templates,
      joiningTransformer: joiner
    });
    const out = engine.transform('');
    expect(out).to.equal('returned-string');
  });

  it('appends Node return value from root template (line 82-83)', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    const templates = [
      {
        path: '$',
        template () {
          // Return a DOM node
          const el = document.createElement('span');
          el.textContent = 'node-return';
          return el;
        }
      }
    ];
    const engine = new JSONPathTransformer({
      data: {x: 1},
      templates,
      joiningTransformer: joiner
    });
    const result = engine.transform('');
    // Result should be the fragment with the appended node
    const frag = /** @type {DocumentFragment} */ (result);
    expect(frag.querySelector('span')).to.exist;
    const span = frag.querySelector('span');
    expect(span && span.textContent).to.equal('node-return');
  });

  it('appends object return value from root template (line 84-86)', () => {
    const joiner = new JSONJoiningTransformer([]);
    const templates = [
      {
        path: '$',
        template () {
          // Return an object (not string or Node)
          return {key: 'value', num: 42};
        }
      }
    ];
    const engine = new JSONPathTransformer({
      data: {x: 1},
      templates,
      joiningTransformer: joiner
    });
    const result = engine.transform('');
    // Result should be the array with the appended object
    expect(Array.isArray(result)).to.equal(true);
    const arr = /** @type {any[]} */ (result);
    expect(arr.length).to.equal(1);
    expect(arr[0]).to.deep.equal({key: 'value', num: 42});
  });

  it('appends array return value from root template (line 84-86)', () => {
    const joiner = new JSONJoiningTransformer([]);
    const templates = [
      {
        path: '$',
        template () {
          // Return an array
          return [1, 2, 3];
        }
      }
    ];
    const engine = new JSONPathTransformer({
      data: {x: 1},
      templates,
      joiningTransformer: joiner
    });
    const result = engine.transform('');
    expect(Array.isArray(result)).to.equal(true);
    const arr = /** @type {any[]} */ (result);
    expect(arr.length).to.equal(1);
    expect(arr[0]).to.deep.equal([1, 2, 3]);
  });

  it('appends number return value from root template (line 84-86)', () => {
    const joiner = new JSONJoiningTransformer([]);
    const templates = [
      {
        path: '$',
        template () {
          // Return a number
          return 123;
        }
      }
    ];
    const engine = new JSONPathTransformer({
      data: {x: 1},
      templates,
      joiningTransformer: joiner
    });
    const result = engine.transform('');
    expect(Array.isArray(result)).to.equal(true);
    const arr = /** @type {any[]} */ (result);
    expect(arr[0]).to.equal(123);
  });

  it('handles undefined return (no append, line 77)', () => {
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '$',
        template () {
          // Return undefined explicitly
          return undefined;
        }
      }
    ];
    const engine = new JSONPathTransformer({
      data: {x: 1},
      templates,
      joiningTransformer: joiner
    });
    const out = engine.transform('');
    // Should be empty string since nothing was appended
    expect(out).to.equal('');
  });

  it('integrates return values in full transform', (done) => {
    const jtlt = new JTLT({
      data: {message: 'test'},
      outputType: 'string',
      templates: [
        {
          path: '$.message',
          template (val) {
            // Return a value that will be appended
            return `Result: ${val}`;
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.equal('Result: test');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });
});
