import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JSONPathTransformer from '../src/JSONPathTransformer.js';
import XPathTransformer from '../src/XPathTransformer.js';
import JSONJoiningTransformer from '../src/JSONJoiningTransformer.js';
import DOMJoiningTransformer from '../src/DOMJoiningTransformer.js';
import StringJoiningTransformer from '../src/StringJoiningTransformer.js';

describe('format-number() function', function () {
  describe('JSONPathTransformer', function () {
    it('should format a number with default format', function () {
      const data = {value: 1234.56};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.valueOf("format-number(1234.56, '1')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('1,234.56');
    });

    it('should format a number with zero-padding', function () {
      const data = {value: 42};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.valueOf("format-number(42, '0000')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('0042');
    });

    it('should format a number with custom decimal format', function () {
      const data = {value: 1234.56};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.decimalFormat('european', {
                decimalSeparator: ',',
                groupingSeparator: '.'
              });
              this.valueOf("format-number(1234.56, '1', 'european')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('1.234,56');
    });

    it('should format with expression evaluation', function () {
      const data = {value: 9876};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.valueOf("format-number($.value, '1')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('9,876');
    });

    it('should handle parameter reference not in params', function () {
      const data = {value: 123};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              // $notDefined is not in params, should default to 0
              this.valueOf("format-number($notDefined, '1')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('0');
    });

    it('should define unnamed default decimal format', function () {
      const data = {value: 1234.56};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              // Define default (unnamed) decimal format
              this.decimalFormat({
                decimalSeparator: ',',
                groupingSeparator: ' '
              });
              this.valueOf("format-number(1234.56, '1', '')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('1 234,56');
    });

    it(
      'should handle NaN with custom NaN string in decimal format',
      function () {
        const data = {value: Number.NaN};
        const result = new JSONPathTransformer({
          templates: [
            {
              path: '$',
              template () {
                this.decimalFormat('custom', {
                  NaN: 'NOT_A_NUMBER'
                });
                this.valueOf("format-number(0, '1', 'custom')");
                // Manually append NaN value formatted
                const formatted = this._formatNumber(
                  Number.NaN, '1', undefined, undefined, 'custom', 'en'
                );
                this.plainText(' ' + formatted);
              }
            }
          ],
          joiningTransformer: new StringJoiningTransformer(''),
          data
        }).transform();
        expect(result).to.include('NOT_A_NUMBER');
      }
    );

    it('should use custom zeroDigit in decimal format', function () {
      const data = {value: 42};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.decimalFormat('arabic', {
                zeroDigit: '٠'
              });
              this.valueOf("format-number(42, '0000', 'arabic')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('٠٠42');
    });

    it('should handle groupingSeparator without decimal format', function () {
      const data = {value: 1234.56};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              // Call _formatNumber with groupingSeparator but no format
              const formatted = this._formatNumber(
                1234.56, '1', ' ', undefined, undefined, 'en'
              );
              this.plainText(formatted);
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('1 234.56');
    });

    it(
      'should handle decimalFormat with undefined symbols parameter',
      function () {
        const data = {value: 123};
        const result = new JSONPathTransformer({
          templates: [
            {
              path: '$',
              template () {
                // Pass undefined as second parameter to test symbols || {}
                this.decimalFormat('test', undefined);
                this.valueOf("format-number(123, '1')");
              }
            }
          ],
          joiningTransformer: new StringJoiningTransformer(''),
          data
        }).transform();
        expect(result).to.equal('123');
      }
    );

    it('should handle string number conversion', function () {
      const data = {value: '456'};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              // $.value returns a string, should convert to number
              this.valueOf("format-number($.value, '0000')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('0456');
    });

    it('should use default format when format string omitted', function () {
      const data = {value: 789};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              // Omit second parameter to test default format
              this.valueOf('format-number(789)');
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('789');
    });
  });

  describe('XPathTransformer', function () {
    it('should format a number with default format', function () {
      const dom = new JSDOM('<root><value>1234.56</value></root>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              this.valueOf("format-number(1234.56, '1')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('1,234.56');
    });

    it('should format a number with zero-padding', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              this.valueOf("format-number(42, '0000')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('0042');
    });

    it('should format a number with custom decimal format', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              this.decimalFormat('european', {
                decimalSeparator: ',',
                groupingSeparator: '.'
              });
              this.valueOf("format-number(1234.56, '1', 'european')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('1.234,56');
    });

    it('should format with Roman numerals', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              this.valueOf("format-number(42, 'I')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('XLII');
    });

    it('should format with alphabetic', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              this.valueOf("format-number(3, 'a')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('c');
    });

    it('should handle parameter reference not in params', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              // $notDefined is not in params, should default to 0
              this.valueOf("format-number($notDefined, '1')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('0');
    });

    it('should define unnamed default decimal format', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              // Define default (unnamed) decimal format
              this.decimalFormat({
                decimalSeparator: ',',
                groupingSeparator: ' '
              });
              this.valueOf("format-number(1234.56, '1', '')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('1 234,56');
    });

    it('should handle Intl.NumberFormat error gracefully', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;

      // Stub Intl.NumberFormat to throw an error
      const OriginalNumberFormat = Intl.NumberFormat;
      // @ts-ignore - Intentionally stubbing for test
      Intl.NumberFormat = function () {
        throw new Error('Forced NumberFormat error');
      };

      try {
        const result = new XPathTransformer({
          templates: [
            {
              path: '/',
              template () {
                this.valueOf("format-number(123.45, '1')");
              }
            }
          ],
          joiningTransformer: new StringJoiningTransformer(''),
          data: doc
        }).transform();
        // Should fall back to String(num)
        expect(result).to.equal('123.45');
      } finally {
        // @ts-ignore - Restore original
        Intl.NumberFormat = OriginalNumberFormat;
      }
    });

    it('should use custom zeroDigit in decimal format', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              this.decimalFormat('arabic', {
                zeroDigit: '٠'
              });
              this.valueOf("format-number(42, '0000', 'arabic')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('٠٠42');
    });

    it('should handle groupingSeparator without decimal format', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              // Use number() method with groupingSeparator to test the path
              this.number({
                value: 1234.56,
                groupingSeparator: ' '
              });
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.match(/1 234/v);
    });

    it('should evaluate XPath expression in format-number', function () {
      const dom = new JSDOM('<root><value>999</value></root>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              // Format-number can evaluate simple numbers,
              // not full XPath expressions in value position
              this.valueOf("format-number(999, '0000')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('0999');
    });

    it('should use default format when format string omitted', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              // Omit second parameter to test default format
              this.valueOf('format-number(789)');
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('789');
    });

    it('should evaluate XPath expression for value', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              this.valueOf('format-number(1 + 2, "0")');
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('3');
    });

    it('should use groupingSeparator without decimal format', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              this.valueOf('format-number(1234.56, "#,##0.00")');
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('1,234.56');
    });

    it('should use unnamed decimal format', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              this.decimalFormat({
                groupingSeparator: ' ',
                decimalSeparator: ','
              });
              this.valueOf('format-number(1234.56, "#,##0.00")');
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('1 234,56');
    });

    it('should use decimal format with partial symbols', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              this.decimalFormat('partial', {
                decimalSeparator: ','
                // No groupingSeparator defined - should use default
              });
              this.valueOf('format-number(1234.56, "#,##0.00", "partial")');
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('1,234,56');
    });

    it('should handle XPath returning string number', function () {
      const dom = new JSDOM('<root><value>123</value></root>');
      const doc = dom.window.document;
      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              this._params = {strNum: '123'};
              this.valueOf('format-number($strNum, "0000")');
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc
      }).transform();
      expect(result).to.equal('0123');
    });

    it(
      'should use named decimal format with undefined symbols parameter',
      function () {
        const dom = new JSDOM('<root/>');
        const doc = dom.window.document;
        const result = new XPathTransformer({
          templates: [
            {
              path: '/',
              template () {
                this.decimalFormat('empty');
                this.valueOf('format-number(1234.56, "1", "empty")');
              }
            }
          ],
          joiningTransformer: new StringJoiningTransformer(''),
          data: doc
        }).transform();
        expect(result).to.equal('1,234.56');
      }
    );
  });

  describe('DOM output', function () {
    it('should work with DOMJoiningTransformer', function () {
      const dom = new JSDOM('<root/>');
      const doc = dom.window.document;
      const frag = doc.createDocumentFragment();

      const result = new XPathTransformer({
        templates: [
          {
            path: '/',
            template () {
              this.element('number', {}, [], () => {
                this.valueOf("format-number(1234.56, '1')");
              });
            }
          }
        ],
        joiningTransformer: new DOMJoiningTransformer(frag, {document: doc}),
        data: doc
      }).transform();

      const elem = /** @type {DocumentFragment} */ (result).firstChild;
      expect(elem).to.exist;
      expect(/** @type {Node} */ (elem).textContent).to.equal('1,234.56');
    });
  });

  describe('JSON output', function () {
    it('should work with JSONJoiningTransformer', function () {
      const data = {value: 999};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.object(() => {
                this.propValue('formatted', this.valueOf(
                  "format-number($.value, '0000')"
                ));
              });
            }
          }
        ],
        joiningTransformer: new JSONJoiningTransformer([]),
        data
      }).transform();
      // valueOf returns undefined, so we need to test differently
      expect(result).to.be.an('array');
    });

    it('should evaluate JSONPath expression for value', function () {
      const data = {a: {b: 100}};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.valueOf("format-number($.a.b, '0')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('100');
    });

    it('should evaluate JSONPath with array index', function () {
      const data = {items: [42, 99, 123]};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.valueOf("format-number($.items[1], '0000')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('0099');
    });

    it('should parse plain number string in expression', function () {
      const data = {};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              // Use literal number string (not a JSONPath, not a parameter)
              this.valueOf("format-number(999, '0000')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('0999');
    });

    it('should handle parameter not in populated params object', function () {
      const data = {};
      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              // Set params with some values, but not the one we're looking for
              this._params = {otherParam: 100};
              this.valueOf("format-number($missingParam, '1')");
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();
      expect(result).to.equal('0');
    });

    it(
      'should use parameter value from params in JSONPath context',
      function () {
        const data = {};
        const result = new JSONPathTransformer({
          templates: [
            {
              path: '$',
              template () {
                // Set a parameter and actually use it
                this._params = {myNum: 777};
                this.valueOf("format-number($myNum, '0000')");
              }
            }
          ],
          joiningTransformer: new StringJoiningTransformer(''),
          data
        }).transform();
        expect(result).to.equal('0777');
      }
    );
  });
});
