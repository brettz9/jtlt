import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JTLT from '../src/index.js';

/**
 * Build XML Document for testing.
 * @returns {Document}
 */
function buildDoc () {
  const {window} = new JSDOM('<!doctype html><html><body></body></html>');
  const parser = new window.DOMParser();
  return parser.parseFromString(
    '<root><item>a</item><item>b</item></root>',
    'text/xml'
  );
}

describe('Facade XPath engineType integration', () => {
  it('renders via engineType "xpath" with Document input', () => {
    const doc = buildDoc();
    const out = new JTLT({
      data: doc,
      engineType: 'xpath',
      xpathVersion: 1,
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.applyTemplates('//item');
          }
        },
        {
          path: '//item',
          /**
           * @param {Element} n
           */
          template (n) {
            this.element('li', {}, [], () => this.text(n.textContent));
          }
        }
      ],
      /**
       * @param {string} res
       * @returns {string}
       */
      success: (res) => res
    }).transform('');
    expect(out).to.equal('<li>a</li><li>b</li>');
  });

  it('renders via engineType "xpath" with Element input', () => {
    const doc = buildDoc();
    const rootEl = doc.documentElement; // <root>
    const out = new JTLT({
      data: rootEl,
      engineType: 'xpath',
      xpathVersion: 1,
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.applyTemplates('//item');
          }
        },
        {
          path: '//item',
          /**
           * @param {Element} n
           */
          template (n) {
            this.element('li', {}, [], () => this.text(n.textContent));
          }
        }
      ],
      /**
       * @param {string} res
       * @returns {string}
       */
      success: (res) => res
    }).transform('');
    expect(out).to.equal('<li>a</li><li>b</li>');
  });
});
