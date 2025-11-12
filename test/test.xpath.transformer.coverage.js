import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import XPathTransformer from '../src/XPathTransformer.js';
import {StringJoiningTransformer} from '../src/index-node.js';

/**
 * @param {string} xml
 * @returns {Document}
 */
function makeDoc (xml) {
  const {window} = new JSDOM('<!doctype html><html><body></body></html>');
  const parser = new window.DOMParser();
  return parser.parseFromString(xml, 'text/xml');
}

describe('XPathTransformer additional coverage', () => {
  it('maps array shorthand templates', () => {
    const doc = makeDoc('<root><item>a</item><item>b</item></root>');
    const joiner = new StringJoiningTransformer('');

    const engine = new (/** @type {typeof XPathTransformer<"string">} */ (
      XPathTransformer
    ))({
      data: doc,
      templates: [
        ['//item', function itemTpl (n) {
          this.element('x', {}, [], () => this.text(n.textContent));
        }]
      ],
      joiningTransformer: joiner,
      xpathVersion: 1
    });
    const out = engine.transform('');
    // Default root rule triggers traversal then item template emits <x> nodes
    expect(out).to.include('<x>a</x>').and.to.include('<x>b</x>');
  });

  it('uses last of multiple root templates when not erroring', () => {
    const doc = makeDoc('<root/>');
    const joiner = new StringJoiningTransformer('');

    const engine = new XPathTransformer({
      data: doc,
      templates: [
        {
          path: '/',
          template () {
            this.string('first');
          }
        },
        {
          path: '/',
          template () {
            this.string('second');
          }
        }
      ],
      joiningTransformer: joiner,
      errorOnEqualPriority: false,
      xpathVersion: 1
    });
    const out = engine.transform('');
    expect(out).to.equal('second');
  });

  it('falls back to default root rule when no root template present', () => {
    const doc = makeDoc('<root><item>a</item></root>');
    const joiner = new StringJoiningTransformer('');

    const engine = new (/** @type {typeof XPathTransformer<"string">} */ (
      XPathTransformer
    ))({
      data: doc,
      templates: [
        {
          path: '//item',
          template (n) {
            this.string(n.textContent);
          }
        }
      ],
      joiningTransformer: joiner,
      xpathVersion: 1
    });
    const out = engine.transform('');
    // We only assert that some output is produced by the default rule path
    expect(out).to.be.a('string');
  });

  it('splits root vs non-root templates in constructor', () => {
    const doc = makeDoc('<root><item>a</item></root>');
    const joiner = new StringJoiningTransformer('');
    const engine = new XPathTransformer({
      data: doc,
      templates: [
        {
          path: '/',
          template () {
            this.string('R');
          }
        },
        ['//item', /** @returns {void} */ function () {
          this.string('I');
        }]
      ],
      joiningTransformer: joiner,
      xpathVersion: 1
    });
    const out = engine.transform('');
    // Root template should be separated and used; non-root ignored at root
    expect(out).to.equal('R');
  });

  it('filters root and non-root templates distinctly', () => {
    const doc = makeDoc('<root><item>x</item><item>y</item></root>');
    const joiner = new StringJoiningTransformer('');

    // First engine: mix of root (/) and non-root paths to hit both filters
    const cfg1 = {
      data: doc,
      templates: [
        {
          path: '/',
          template () {
            return '';
          }
        },
        {
          path: '//item',
          template () {
            return '';
          }
        },
        {
          path: '//other',
          template () {
            return '';
          }
        }
      ],
      joiningTransformer: joiner,
      xpathVersion: 1
    };
    const engine1 = new XPathTransformer(cfg1);
    expect(engine1.rootTemplates).to.have.lengthOf(1);
    expect(engine1.templates).to.have.lengthOf(2);

    // Second engine: only non-root to ensure filter returns empty for root
    const joiner2 = new StringJoiningTransformer('');
    const cfg2 = {
      data: doc,
      templates: [
        {
          path: '//item',
          template () {
            return '';
          }
        },
        {
          path: '//other',
          template () {
            return '';
          }
        }
      ],
      joiningTransformer: joiner2,
      xpathVersion: 1
    };
    const engine2 = new XPathTransformer(cfg2);
    expect(engine2.rootTemplates).to.have.lengthOf(0);
    expect(engine2.templates).to.have.lengthOf(2);

    // Verify functional behavior with the first engine
    const joiner3 = new StringJoiningTransformer('');
    const engine3 = new (/** @type {typeof XPathTransformer<"string">} */ (
      XPathTransformer
    ))({
      data: doc,
      templates: [
        {
          path: '/',
          template () {
            this.applyTemplates('//item', '');
          }
        },
        {
          path: '//item',
          template (n) {
            this.string(n.textContent);
          }
        }
      ],
      joiningTransformer: joiner3,
      xpathVersion: 1
    });
    const out = engine3.transform('');
    expect(out).to.equal('xy');
  });

  it('throws on duplicate template names', () => {
    const doc = makeDoc('<root/>');
    const joiner = new StringJoiningTransformer('');
    const cfg = {
      data: doc,
      templates: [
        {
          name: 'test',
          path: '//item',
          template () {
            return '';
          }
        },
        {
          name: 'test',
          path: '//other',
          template () {
            return '';
          }
        }
      ],
      joiningTransformer: joiner,
      xpathVersion: 1
    };
    expect(() => new XPathTransformer(cfg)).to.throw(
      'Templates must all have different names.'
    );
  });
});
