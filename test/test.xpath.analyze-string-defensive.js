import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {
  StringJoiningTransformer,
  XPathTransformer
} from '../src/index.js';

/**
 * Build a small DOM for XPath evaluation.
 * @param {string} xml - XML content
 * @returns {{document: Document}}
 */
function buildDom (xml) {
  const {window} = new JSDOM('<!doctype html><html><body></body></html>');
  const parser = new window.DOMParser();
  const document = parser.parseFromString(xml, 'text/xml');
  return {document};
}

describe('XPathTransformerContext analyzeString defensive code', () => {
  it('covers defensive zero-length check (lines 1241-1242)', () => {
    // This test covers the defensive zero-length check at lines 1241-1242
    // Lookahead (?=.) doesn't match empty string (passes test(''))
    // but creates zero-length matches in actual strings
    const {document} = buildDom('<root>abc</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        // Lookahead creates zero-length matches
        this.analyzeString(text, /(?=.)/v, {
          matchingSubstring (substring) {
            this.string('[' + substring + ']');
          },
          nonMatchingSubstring (substring) {
            this.string(substring);
          }
        });
      }
    }]);
    const transformer = new XPathTransformer({
      data: document,
      templates,
      joiningTransformer: joiner
    });
    const result = transformer.transform();
    // Should work without infinite loop due to defensive code
    expect(result).to.equal('[]a[]b[]c');
  });

  it('covers string regex with g flag already present (line 1162)', () => {
    const {document} = buildDom('<root>a1b2c3</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        // String regex with flags that already include 'g'
        this.analyzeString(text, String.raw`\d`, {
          flags: 'gv',
          matchingSubstring (substring) {
            this.string('[' + substring + ']');
          },
          nonMatchingSubstring (substring) {
            this.string(substring);
          }
        });
      }
    }]);
    const transformer = new XPathTransformer({
      data: document,
      templates,
      joiningTransformer: joiner
    });
    const result = transformer.transform();
    expect(result).to.equal('a[1]b[2]c[3]');
  });

  it('covers missing matchingSubstring callback (line 1207)', () => {
    const {document} = buildDom('<root>a1b2</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        // Only provide nonMatchingSubstring
        this.analyzeString(text, /\d/v, {
          nonMatchingSubstring (substring) {
            this.string(substring);
          }
        });
      }
    }]);
    const transformer = new XPathTransformer({
      data: document,
      templates,
      joiningTransformer: joiner
    });
    const result = transformer.transform();
    expect(result).to.equal('ab');
  });

  it('covers missing nonMatchingSubstring callback (line 1209)', () => {
    const {document} = buildDom('<root>a1b2</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        // Only provide matchingSubstring
        this.analyzeString(text, /\d/v, {
          matchingSubstring (substring) {
            this.string('[' + substring + ']');
          }
        });
      }
    }]);
    const transformer = new XPathTransformer({
      data: document,
      templates,
      joiningTransformer: joiner
    });
    const result = transformer.transform();
    expect(result).to.equal('[1][2]');
  });

  it('covers optional group fallback (line 1197)', () => {
    const {document} = buildDom('<root>test  space</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        // Optional capturing group that might be empty
        // eslint-disable-next-line prefer-named-capture-group -- Testing
        this.analyzeString(text, /(\w+)(\s*)/v, {
          matchingSubstring (substring, groups, regexGroup) {
            const word = regexGroup(1);
            const space = regexGroup(2); // Might be empty string
            this.string('[' + word + '][' + space + ']');
          }
        });
      }
    }]);
    const transformer = new XPathTransformer({
      data: document,
      templates,
      joiningTransformer: joiner
    });
    const result = transformer.transform();
    expect(result).to.include('[test]');
  });
});
