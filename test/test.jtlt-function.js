import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {jtlt} from '../src/index-node.js';

/**
 * Build XML Document for testing.
 * @returns {Document}
 */
function buildDoc () {
  const {window} = new JSDOM('<!doctype html><html><body></body></html>');
  const parser = new window.DOMParser();
  return parser.parseFromString(
    '<root><item>test</item></root>',
    'text/xml'
  );
}

describe('jtlt function wrapper', () => {
  describe('JSONPath engine (default)', () => {
    it('resolves with json output (default)', async () => {
      const result = await jtlt({
        data: {name: 'test'},
        templates: [{
          path: '$.name',
          template (value) {
            const jt = this._config.joiningTransformer;
            this.object(function () {
              jt.propValue('result', value);
            });
          }
        }]
      });

      expect(result).to.be.an('array');
      // @ts-expect-error - result type is unknown
      expect(result[0]).to.deep.equal({result: 'test'});
    });

    it('resolves with string output', async () => {
      const result = await jtlt({
        data: {name: 'test'},
        outputType: 'string',
        templates: [{
          path: '$.name',
          template (value) {
            // @ts-expect-error - value type
            this.string(value);
          }
        }]
      });

      expect(result).to.equal('test');
    });

    it('resolves with dom output', async () => {
      const result = await jtlt({
        data: {name: 'test'},
        outputType: 'dom',
        templates: [{
          path: '$.name',
          template (value) {
            // @ts-expect-error - function as 3rd arg is cb, not children
            this.element('div', {}, function () {
              // @ts-expect-error - value type
              this.text(value);
            });
          }
        }]
      });

      expect(result.textContent).to.include('test');
    });
  });

  describe('XPath engine', () => {
    it('resolves with json output', async () => {
      const doc = buildDoc();
      const result = await jtlt({
        engineType: 'xpath',
        data: doc,
        outputType: 'json',
        xpathVersion: 1,
        templates: [{
          path: '//item',
          template (n) {
            const jt = this._config.joiningTransformer;
            this.object(function () {
              jt.propValue('text', n.textContent);
            });
          }
        }]
      });

      expect(result).to.be.an('array');
      // @ts-expect-error - result type is unknown
      expect(result[0]).to.have.property('text', 'test');
    });

    it('resolves with dom output', async () => {
      const doc = buildDoc();
      const result = await jtlt({
        engineType: 'xpath',
        data: doc,
        outputType: 'dom',
        xpathVersion: 1,
        templates: [{
          path: '//item',
          template (n) {
            this.element('span', {}, function () {
              this.text(n.textContent);
            });
          }
        }]
      });

      // @ts-expect-error - result type is unknown
      expect(result.textContent).to.include('test');
    });

    it('resolves with string output (default for xpath)', async () => {
      const doc = buildDoc();
      const result = await jtlt({
        engineType: 'xpath',
        data: doc,
        xpathVersion: 1,
        templates: [{
          path: '//item',
          template (n) {
            this.string(n.textContent);
          }
        }]
      });

      expect(result).to.include('test');
    });
  });

  describe('exposeDocuments configuration', () => {
    it('passes exposeDocuments to JSON joiner', async () => {
      const result = await jtlt({
        data: {name: 'test'},
        exposeDocuments: true,
        templates: [{
          path: '$.name',
          template (value) {
            const jt = this._config.joiningTransformer;
            this.object(function () {
              jt.propValue('result', value);
            });
          }
        }]
      });

      // With exposeDocuments, result is still an array but may be wrapped
      expect(result).to.be.an('array');
    });

    it('passes exposeDocuments to DOM joiner', async () => {
      const result = await jtlt({
        data: {name: 'test'},
        outputType: 'dom',
        exposeDocuments: true,
        templates: [{
          path: '$.name',
          template (value) {
            // @ts-expect-error - function as 3rd arg is cb, not children
            this.element('div', {}, function () {
              // @ts-expect-error - value type
              this.text(value);
            });
          }
        }]
      });

      // With exposeDocuments, result should be array-like
      expect(result).to.exist;
    });

    it('passes exposeDocuments to string joiner', async () => {
      const result = await jtlt({
        data: {name: 'test'},
        outputType: 'string',
        exposeDocuments: true,
        templates: [{
          path: '$.name',
          template (value) {
            // @ts-expect-error - value type
            this.string(value);
          }
        }]
      });

      // With exposeDocuments, result should be array-like
      expect(result).to.exist;
    });
  });
});
