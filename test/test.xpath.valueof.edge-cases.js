import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JTLT from '../src/index-node.js';

/**
 * Parse XML string to Document.
 * @param {string} xml - XML string to parse
 * @returns {Document}
 */
function parseXML (xml) {
  const {window} = new JSDOM('<!doctype html><html><body></body></html>');
  const parser = new window.DOMParser();
  return parser.parseFromString(xml, 'text/xml');
}

describe('XPath valueOf edge cases', () => {
  it(
    'handles Document parameter without documentElement',
    (done) => {
      const xml = '<root><item>test</item></root>';
      const doc = parseXML(xml);
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const emptyDoc = window.document.implementation.createDocument(
        null,
        null,
        null
      );

      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: doc,
        engineType: 'xpath',
        outputType: 'string',
        templates: [
          {
            path: '/',
            /**
             * @this {import('../src/XPathTransformerContext.js').default}
             */
            template () {
              // Manually set up parameter context with emptyDoc
              const prevParams = this._params;
              this._params = {0: emptyDoc};
              this.element('result', {}, [], () => {
                // valueOf with Document parameter w/o documentElement
                this.valueOf({select: '$0'});
                this.text(' fallback');
              });
              this._params = prevParams;
            }
          }
        ],
        /**
         * @param {string} result
         */
        success (result) {
          try {
            expect(result).to.be.a('string');
            expect(result).to.include('<result>');
            expect(result).to.include('fallback');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it('handles Document context without documentElement in valueOf', (done) => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const emptyDoc = window.document.implementation.createDocument(
      null,
      null,
      null
    );

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: emptyDoc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          /**
           * @this {import('../src/XPathTransformerContext.js').default}
           */
          template () {
            // Context is a Document without documentElement
            this.element('result', {}, [], () => {
              this.valueOf('.');
              this.text(' text');
            });
          }
        }
      ],
      /**
       * @param {string} result
       */
      success (result) {
        try {
          expect(result).to.be.a('string');
          expect(result).to.include('<result>');
          expect(result).to.include('text');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });
});
