/* Test 'match' as alias for 'path' (XSLT compatibility) */
import {expect} from 'chai';
import JTLT from '../src/index-node.js';
import {JSDOM} from 'jsdom';

describe('match as alias for path', () => {
  describe('JSONPath', () => {
    it('should accept match instead of path', (done) => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {items: ['one', 'two', 'three']},
        outputType: 'string',
        templates: [
          {
            match: '$',
            template () {
              this.element('root', () => {
                this.applyTemplates('$.items[*]');
              });
            }
          },
          {
            match: '$.items[*]',
            template (value) {
              this.element('item', () => {
                this.text(/** @type {string} */ (value));
              });
            }
          }
        ],
        success (result) {
          expect(result).to.include('<item>one</item>');
          expect(result).to.include('<item>two</item>');
          expect(result).to.include('<item>three</item>');
          done();
        }
      });
    });

    it('should prefer path over match when both present', (done) => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {x: 'value'},
        outputType: 'string',
        templates: [
          {
            path: '$',
            match: '$.wrong',
            template () {
              this.applyTemplates('$.x');
            }
          },
          {
            path: '$.x',
            match: '$.wrong',
            template (value) {
              this.text(/** @type {string} */ (value));
            }
          }
        ],
        success (result) {
          expect(result).to.equal('value');
          done();
        }
      });
    });
  });

  describe('XPath', () => {
    it('should accept match instead of path', (done) => {
      const {window} = new JSDOM(
        '<root><item>one</item><item>two</item></root>'
      );
      const doc = window.document;

      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: doc,
        engineType: 'xpath',
        outputType: 'string',
        templates: [
          {
            match: '/',
            template () {
              this.element('result', () => {
                this.applyTemplates('//item');
              });
            }
          },
          {
            match: '//item',
            template (node) {
              this.element('output', () => {
                this.text(node.textContent);
              });
            }
          }
        ],
        success (result) {
          expect(result).to.include('<output>one</output>');
          expect(result).to.include('<output>two</output>');
          done();
        }
      });
    });

    it('should prefer path over match when both present', (done) => {
      const {window} = new JSDOM('<root><x>value</x></root>');
      const doc = window.document;

      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: doc,
        engineType: 'xpath',
        outputType: 'string',
        templates: [
          {
            path: '/',
            match: '//wrong',
            template () {
              this.applyTemplates('//x');
            }
          },
          {
            path: '//x',
            match: '//wrong',
            template (node) {
              this.text(node.textContent);
            }
          }
        ],
        success (result) {
          expect(result).to.equal('value');
          done();
        }
      });
    });
  });
});
