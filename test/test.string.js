import {expect} from 'chai';
import JTLT from '../src/index.js';

/**
 * @param {(err?: Error) => void} done - Test done callback
 * @param {string} expected - Expected result
 * @param {any[]} templates - Array of template objects
 * @param {object} [replace] - Properties to replace in config
 * @returns {void}
 */
function runTest (done, expected, templates, replace) {
  const config = {
    autostart: true,
    ajaxData: import.meta.dirname + '/data/jsonpath-sample.json',
    outputType: 'string', // string is default
    templates: [
      { // We could instead try a root template which applied on the author path
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
    /**
     * @param {any} result - Result
     * @returns {void}
     */
    success (result) {
      try {
        expect(result).to.equal(expected);
        done();
      } catch (/** @type {any} */ err) {
        done(/** @type {Error} */ (err));
      }
    }
  };
  if (replace) {
    config.templates[0] = templates.shift();
  }
  templates.forEach((template) => {
    config.templates.push(template);
  });
  try {
    // eslint-disable-next-line no-new -- API
    new JTLT(config);
  } catch (/** @type {any} */ e) {
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
        /**
         * @param {any} author - Author
         * @returns {string}
         */
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
        /** @type {any} */ (this).string('<b>');
        /** @type {any} */ (this).valueOf({select: '.'});
        /** @type {any} */ (this).string('</b>');
      }
    }]);
  });
  it('should be able to utilize argument to template', (done) => {
    // eslint-disable-next-line @stylistic/max-len -- Long
    const expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    runTest(done, expected, [{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      /**
       * @param {any} author - Author
       * @returns {void}
       */
      template (author) {
        /** @type {any} */ (this).string(`<b>${author}</b>`);
      }
    }]);
  });
  it('should be able to call `plainText`', (done) => {
    // eslint-disable-next-line @stylistic/max-len -- Long
    const expected = '<i>Nigel Rees</i><i>Evelyn Waugh</i><i>Herman Melville</i><i>J. R. R. Tolkien</i>';
    runTest(done, expected, [{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      /**
       * @param {any} author - Author
       * @returns {void}
       */
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
      /**
       * @param {any} author - Author
       * @returns {string}
       */
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
          /**
           * @param {any} value - Value
           * @param {{mode: string}} cfg - Config
           * @this {import('../src/JSONPathTransformerContext.js').default}
           * @returns {void}
           */
          function (value, cfg) {
            this.applyTemplates(
              '$.store.book[*].author', cfg.mode
            );
          }
        ],
        [
          '$.store.book[*].author',
          /**
           * @param {any} author - Author
           * @returns {string}
           */
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
      /**
       * @param {any} author - Author
       * @returns {string}
       */
      template (author) {
        return `<b>${author}</b>`;
      }
    }, {
      name: 'price', // For use with calling templates
      path: '$.store.book[*].price',
      /**
       * @param {any} price - Price
       * @returns {string}
       */
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
        /** @type {any} */ (this).string('<i>');
        /** @type {any} */ (this).applyTemplates();
        /** @type {any} */ (this).string('</i>');
      }
    }, {
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      /**
       * @param {any} author - Author
       * @returns {string}
       */
      template (author) {
        return `<b>${author}</b>`;
      }
    }, {
      name: 'price', // For use with calling templates
      path: '$.store.book[*].price',
      /**
       * @param {any} price - Price
       * @returns {string}
       */
      template (price) {
        return `<u>${price}</u>`;
      }
    }]);
  });
});
