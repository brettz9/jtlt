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

describe('characterMap - XPath context', () => {
  it('replaces characters using characterMap in XPath template', (done) => {
    const xmlString = `
      <root>
        <item>Copyright © 2024</item>
        <item>Registered ®</item>
      </root>
    `;
    const doc = parseXML(xmlString);

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.characterMap('symbols', [
              {character: '©', string: '(C)'},
              {character: '®', string: '(R)'}
            ]);
            this.output({useCharacterMaps: ['symbols']});
            this.element('result', {}, [], () => {
              this.applyTemplates('/root/item');
            });
          }
        },
        {
          path: '/root/item',
          template (node) {
            const el = /** @type {Element} */ (node);
            this.element('processed', {}, [], () => {
              this.text(el.textContent);
            });
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.be.a('string');
          expect(result).to.include('Copyright (C) 2024');
          expect(result).to.include('Registered (R)');
          expect(result).to.not.include('©');
          expect(result).to.not.include('®');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('applies characterMap to attributes in XPath template', (done) => {
    const xmlString = `
      <root>
        <product name="Widget™" price="100€"/>
      </root>
    `;
    const doc = parseXML(xmlString);

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.characterMap('symbols', [
              {character: '™', string: '(TM)'},
              {character: '€', string: ' EUR'}
            ]);
            this.output({useCharacterMaps: ['symbols']});
            this.element('result', {}, [], () => {
              this.applyTemplates('/root/product');
            });
          }
        },
        {
          path: '/root/product',
          template (node) {
            const el = /** @type {Element} */ (node);
            this.element('item', {
              name: el.getAttribute('name') || '',
              price: el.getAttribute('price') || ''
              // eslint-disable-next-line no-empty-function -- Callback needed
            }, [], () => {});
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.be.a('string');
          expect(result).to.include('name="Widget(TM)"');
          expect(result).to.include('price="100 EUR"');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('characterMap works with output type dom', (done) => {
    const xmlString = `<root><text>© ®</text></root>`;
    const doc = parseXML(xmlString);
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'dom',
      joiningConfig: {document, exposeDocuments: true},
      templates: [
        {
          path: '/',
          template () {
            this.characterMap('symbols', [
              {character: '©', string: '(C)'},
              {character: '®', string: '(R)'}
            ]);
            this.output({useCharacterMaps: ['symbols']});
            this.element('result', {}, () => {
              this.applyTemplates('/root/text');
            });
          }
        },
        {
          path: '/root/text',
          template (node) {
            const el = /** @type {Element} */ (node);
            this.text(el.textContent);
          }
        }
      ],
      success (result) {
        try {
          // Result is an array of XMLDocuments when exposeDocuments is true
          const docs = /** @type {XMLDocument[]} */ (
            /** @type {unknown} */ (result)
          );
          expect(docs).to.be.an('array');
          expect(docs.length).to.equal(1);
          const el = docs[0].documentElement;
          expect(el.tagName.toLowerCase()).to.equal('result');
          expect(el.textContent).to.equal('(C) (R)');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('multiple characterMaps applied in order', (done) => {
    const xmlString = `<root><text>a b c</text></root>`;
    const doc = parseXML(xmlString);

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.characterMap('first', [
              {character: 'a', string: 'A'}
            ]);
            this.characterMap('second', [
              {character: 'b', string: 'B'}
            ]);
            this.characterMap('third', [
              {character: 'c', string: 'C'}
            ]);
            this.output({useCharacterMaps: ['first', 'second', 'third']});
            this.element('result', {}, [], () => {
              this.applyTemplates('/root/text');
            });
          }
        },
        {
          path: '/root/text',
          template (node) {
            const el = /** @type {Element} */ (node);
            this.text(el.textContent);
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.include('A B C');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });
});

describe('characterMap - JSONPath context', () => {
  it('replaces characters using characterMap in JSONPath template', (done) => {
    const data = {
      items: [
        {text: 'Copyright © 2024'},
        {text: 'Registered ®'}
      ]
    };

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data,
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.characterMap('symbols', [
              {character: '©', string: '(C)'},
              {character: '®', string: '(R)'}
            ]);
            this.output({useCharacterMaps: ['symbols']});
            this.element('result', {}, [], () => {
              this.applyTemplates('$.items[*]');
            });
          }
        },
        {
          path: '$.items[*]',
          template (item) {
            const obj = /** @type {{text: string}} */ (item);
            this.element('processed', {}, [], () => {
              this.text(obj.text);
            });
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.be.a('string');
          expect(result).to.include('Copyright (C) 2024');
          expect(result).to.include('Registered (R)');
          expect(result).to.not.include('©');
          expect(result).to.not.include('®');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('applies characterMap to attributes in JSONPath template', (done) => {
    const data = {
      products: [
        {name: 'Widget™', price: '100€'}
      ]
    };

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data,
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.characterMap('symbols', [
              {character: '™', string: '(TM)'},
              {character: '€', string: ' EUR'}
            ]);
            this.output({useCharacterMaps: ['symbols']});
            this.element('result', {}, [], () => {
              this.applyTemplates('$.products[*]');
            });
          }
        },
        {
          path: '$.products[*]',
          template (product) {
            const obj = /** @type {{name: string, price: string}} */ (product);
            this.element('item', {
              name: obj.name,
              price: obj.price
              // eslint-disable-next-line no-empty-function -- Callback needed
            }, [], () => {});
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.be.a('string');
          expect(result).to.include('name="Widget(TM)"');
          expect(result).to.include('price="100 EUR"');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('characterMap works with output type json', (done) => {
    const data = {
      text: '© ®'
    };

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data,
      outputType: 'json',
      templates: [
        {
          path: '$',
          template () {
            this.characterMap('symbols', [
              {character: '©', string: '(C)'},
              {character: '®', string: '(R)'}
            ]);
            this.output({useCharacterMaps: ['symbols']});
            this.element('result', {}, [], () => {
              this.text(data.text);
            });
          }
        }
      ],
      success (result) {
        try {
          expect(Array.isArray(result)).to.equal(true);
          const arr = /** @type {any[]} */ (result);
          const element = arr[0];
          expect(element[0]).to.equal('result');
          expect(element[1][0]).to.equal('(C) (R)');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('multiple characterMaps applied in order with JSONPath', (done) => {
    const data = {
      text: 'a b c'
    };

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data,
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.characterMap('first', [
              {character: 'a', string: 'A'}
            ]);
            this.characterMap('second', [
              {character: 'b', string: 'B'}
            ]);
            this.characterMap('third', [
              {character: 'c', string: 'C'}
            ]);
            this.output({useCharacterMaps: ['first', 'second', 'third']});
            this.element('result', {}, [], () => {
              this.text(data.text);
            });
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.include('A B C');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('characterMap only applied when specified in useCharacterMaps', (done) => {
    const data = {
      text: '© ® ™'
    };

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data,
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.characterMap('used', [
              {character: '©', string: '(C)'}
            ]);
            this.characterMap('not-used', [
              {character: '®', string: '(R)'}
            ]);
            // Only 'used' is in useCharacterMaps
            this.output({useCharacterMaps: ['used']});
            this.element('result', {}, [], () => {
              this.text(data.text);
            });
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.include('(C)'); // © was replaced
          expect(result).to.include('®'); // ® was not replaced
          expect(result).to.include('™'); // ™ was not replaced
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });
});
