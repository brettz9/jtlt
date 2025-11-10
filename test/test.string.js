import {expect} from 'chai';
import JTLT from '../src/index.js';

/**
 * @param {(err?: Error) => void} done - Test done callback
 * @param {string} expected - Expected result
 * @param {import('../src/index.js').XPathTemplateArray} templates - Array
 *   of template objects
 * @param {object} [replace] - Properties to replace in config
 * @returns {void}
 */
function runTest (done, expected, templates, replace) {
  const config =
    /**
     * @type {import('../src/index.js').JSONPathJTLTOptions<"string">}
     */ ({
      autostart: true,
      ajaxData: import.meta.dirname + '/data/jsonpath-sample.json',
      outputType: /** @type {'string'} */ ('string'), // string is default
      templates: [
        {
          // We could instead try a root template which applied on
          //   the author path
          name: 'scalars',
          path: '$..*@scalar()',
          /**
           * @returns {void}
           */
          template () {
            //
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.equal(expected);
          done();
        } catch (err) {
          done(/** @type {Error} */ (err));
        }
      }
    });
  if (replace) {
    // @ts-expect-error Ok
    config.templates[0] =
    /**
     * @type {(
     *   import('../src/index.js').XPathTemplateObject |
     *   [string, import('../src/index.js').TemplateFunction<
     *     import('../src/XPathTransformerContext.js').default
     *   >]
     * )}
     */ (templates.shift());
  }
  templates.forEach((template) => {
    // @ts-expect-error Ok
    config.templates.push(template);
  });
  try {
    // eslint-disable-next-line no-new -- API
    new JTLT(config);
  } catch (e) {
    // eslint-disable-next-line no-console -- Testing
    console.error('Error', e);
    done();
  }
}

describe('jtlt', () => {
  it('should support the simple array-based template format', (done) => {
    // eslint-disable-next-line @stylistic/max-len -- Long
    const expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    runTest(done, expected, [
      [
        '$.store.book[*].author',
        function (author) {
          return `<b>${author}</b>`;
        }
      ]
    ]);
    // Could just do
    //   runTest(
    //     done,
    //     expected,
    //     ['$.store.book[*].author', author => '<b>' + author + '</b>']);
    //   but may want to use `this`
  });
  it('should be able to use valueOf to get current context', (done) => {
    // eslint-disable-next-line @stylistic/max-len -- Long
    const expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    runTest(done, expected, [{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      /**
       * @returns {void}
       */
      template () {
        this.string('<b>');
        this.valueOf({select: '.'});
        this.string('</b>');
      }
    }]);
  });
  it('should be able to utilize argument to template', (done) => {
    // eslint-disable-next-line @stylistic/max-len -- Long
    const expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    runTest(done, expected, [{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template (author) {
        this.string(`<b>${author}</b>`);
      }
    }]);
  });
  it('should be able to call `plainText`', (done) => {
    // eslint-disable-next-line @stylistic/max-len -- Long
    const expected = '<i>Nigel Rees</i><i>Evelyn Waugh</i><i>Herman Melville</i><i>J. R. R. Tolkien</i>';
    runTest(done, expected, [{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template (author) {
        this.plainText(`<i>${author}</i>`);
      }
    }]);
  });

  it('should be able to provide return value from template', (done) => {
    // eslint-disable-next-line @stylistic/max-len -- Long
    const expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    runTest(done, expected, [{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template (author) {
        return `<b>${author}</b>`;
      }
    }]);
  });
  it(
    'should be able to use a root template calling applyTemplates ' +
      'with a select path',
    (done) => {
      // eslint-disable-next-line @stylistic/max-len -- Long
      const expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
      runTest(done, expected, [
        [
          '$',
          function (value, cfg) {
            this.applyTemplates(
              '$.store.book[*].author', cfg?.mode
            );
          }
        ],
        [
          '$.store.book[*].author',
          function (author) {
            return `<b>${author}</b>`;
          }
        ]
      ], {});
    }
  );
  it('should support multiple child templates', (done) => {
    // eslint-disable-next-line @stylistic/max-len -- Long
    const expected = '<b>Nigel Rees</b><u>8.95</u><b>Evelyn Waugh</b><u>12.99</u><b>Herman Melville</b><u>8.99</u><b>J. R. R. Tolkien</b><u>22.99</u>';
    runTest(done, expected, [{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template (author) {
        return `<b>${author}</b>`;
      }
    }, {
      name: 'price', // For use with calling templates
      path: '$.store.book[*].price',
      template (price) {
        return `<u>${price}</u>`;
      }
    }]);
  });
  it('should support nested templates', (done) => {
    // eslint-disable-next-line @stylistic/max-len -- Long
    const expected = '<i><b>Nigel Rees</b><u>8.95</u></i><i><b>Evelyn Waugh</b><u>12.99</u></i><i><b>Herman Melville</b><u>8.99</u></i><i><b>J. R. R. Tolkien</b><u>22.99</u></i>';
    runTest(done, expected, [{
      name: 'book', // For use with calling templates
      path: '$.store.book[*]',
      /**
       * @returns {void}
       */
      template (/* book */) {
        this.string('<i>');
        this.applyTemplates();
        this.string('</i>');
      }
    }, {
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template (author) {
        return `<b>${author}</b>`;
      }
    }, {
      name: 'price', // For use with calling templates
      path: '$.store.book[*].price',
      template (price) {
        return `<u>${price}</u>`;
      }
    }]);
  });
});
