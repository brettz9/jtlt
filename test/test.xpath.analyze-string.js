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

describe('XPathTransformerContext analyzeString', () => {
  it('should split text on newlines', () => {
    const {document} = buildDom('<root>Line 1\nLine 2\nLine 3</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        this.analyzeString(text, /\n/v, {
          matchingSubstring () {
            this.string('<br/>');
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
    expect(result).to.equal('Line 1<br/>Line 2<br/>Line 3');
  });

  it('should extract content from square brackets', () => {
    const {document} = buildDom(
      '<root>Some [cited] text with [multiple] citations</root>'
    );
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        this.analyzeString(
          text,
          /\[(?<bracket>.*?)\]/v,
          {
            matchingSubstring (substring, groups, regexGroup) {
              this.string('<cite>');
              this.string(regexGroup(1));
              this.string('</cite>');
            },
            nonMatchingSubstring (substring) {
              this.string(substring);
            }
          }
        );
      }
    }]);
    const transformer = new XPathTransformer({
      data: document,
      templates,
      joiningTransformer: joiner
    });
    const result = transformer.transform();
    expect(result).to.equal(
      'Some <cite>cited</cite> text with <cite>multiple</cite> citations'
    );
  });

  it('should handle empty string input', () => {
    const {document} = buildDom('<root></root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        this.analyzeString(text, /\n/v, {
          matchingSubstring () {
            this.string('MATCH');
          },
          nonMatchingSubstring () {
            this.string('NOMATCH');
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
    expect(result).to.equal('');
  });

  it('should parse date format', () => {
    const {document} = buildDom('<root>23 March 2002</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        this.analyzeString(
          text,
          /(?<day>\d{1,2})\s(?<month>[A-Z][a-z]+)\s(?<year>\d{4})/v,
          {
            matchingSubstring (substring, groups, regexGroup) {
              const day = regexGroup(1).padStart(2, '0');
              const monthName = regexGroup(2);
              const year = regexGroup(3);
              const monthNum = String(
                months.indexOf(monthName) + 1
              ).padStart(2, '0');
              this.string(`${year}-${monthNum}-${day}`);
            }
          }
        );
      }
    }]);
    const transformer = new XPathTransformer({
      data: document,
      templates,
      joiningTransformer: joiner
    });
    const result = transformer.transform();
    expect(result).to.equal('2002-03-23');
  });

  it('should handle text with only non-matching parts', () => {
    const {document} = buildDom('<root>No digits here</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        this.analyzeString(text, /\d+/v, {
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
    expect(result).to.equal('No digits here');
  });

  it('should handle text with only matching parts', () => {
    const {document} = buildDom('<root>123</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        this.analyzeString(text, /\d+/v, {
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
    expect(result).to.equal('[123]');
  });

  it('should throw on zero-length matching regex', () => {
    const {document} = buildDom('<root>test</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        this.analyzeString(text, /.*/v, {
          matchingSubstring (substring) {
            this.string(substring);
          }
        });
      }
    }]);
    expect(() => {
      const transformer = new XPathTransformer({
        data: document,
        templates,
        joiningTransformer: joiner
      });
      transformer.transform();
    }).to.throw(/zero-length/v);
  });

  it('should work with string regex and flags', () => {
    const {document} = buildDom('<root>Test TEST test</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        this.analyzeString(text, 'test', {
          flags: 'iv',
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
    expect(result).to.equal('[Test] [TEST] [test]');
  });

  it('should handle multiple capturing groups', () => {
    const {document} = buildDom('<root>Name: John, Age: 30</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        this.analyzeString(
          text,
          /(?<key>\w+):\s*(?<value>\w+)/v,
          {
            matchingSubstring (substring, groups, regexGroup) {
              this.string(regexGroup(1) + '=' + regexGroup(2) + '; ');
            }
          }
        );
      }
    }]);
    const transformer = new XPathTransformer({
      data: document,
      templates,
      joiningTransformer: joiner
    });
    const result = transformer.transform();
    expect(result).to.equal('Name=John; Age=30; ');
  });

  it('should return empty string for invalid regex groups', () => {
    const {document} = buildDom('<root>test123</root>');
    const joiner = new StringJoiningTransformer('');
    // eslint-disable-next-line @stylistic/max-len -- Long
    const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([{
      path: '/root',
      template () {
        const text = this._contextNode.textContent || '';
        this.analyzeString(
          text,
          /(?<word>[a-z]+)(?<num>\d+)/v,
          {
            matchingSubstring (substring, groups, regexGroup) {
              // Test various invalid group accesses
              this.string(regexGroup(-1)); // Negative index
              this.string(regexGroup(99)); // Out of bounds
              this.string(regexGroup(1)); // Valid
              this.string(',');
              this.string(regexGroup(2)); // Valid
            }
          }
        );
      }
    }]);
    const transformer = new XPathTransformer({
      data: document,
      templates,
      joiningTransformer: joiner
    });
    const result = transformer.transform();
    expect(result).to.equal('test,123');
  });
});
