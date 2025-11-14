import {expect} from 'chai';
import JTLT from '../src/index-node.js';
import {JSDOM} from 'jsdom';

describe(
  'valueOf in template() and forEach() without callTemplate',
  function () {
    describe('valueOf in regular template function', function () {
      it(
        'should work with $paramName when value passed to template',
        (done) => {
          // This test shows that valueOf($paramName) should work in
          // templates when the template function receives parameters
          // eslint-disable-next-line no-new -- exercising API
          new JTLT({
            data: {users: [{name: 'Alice'}]},
            outputType: 'string',
            templates: [
              {
                path: '$',
                template () {
                  this.applyTemplates('$.users[*]');
                }
              },
              {
                path: '$.users[*]',
                template (user) {
                  // Currently valueOf doesn't have access to the
                  // template's value parameter
                  // We want to enable passing it as a parameter context
                  this.string('User: ');
                  this.valueOf('$.name'); // This works - it's a JSONPath
                  // But we want to support something like this:
                  // this.valueOf({select: '$value'}) where $value is
                  // the current context
                }
              }
            ],
            success (result) {
              try {
                expect(result).to.include('User: Alice');
                done();
              } catch (err) {
                done(err);
              }
            }
          });
        }
      );
    });

    describe('valueOf with parameters in forEach', function () {
      it('should work when forEach callback has access to value', (done) => {
        // Test that we can use valueOf to access the forEach value
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {items: ['apple', 'banana', 'cherry']},
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.forEach('$.items[*]', function (item) {
                  this.string('- ');
                  // Currently works by using the item parameter
                  this.string(item);
                  this.string('\n');
                });
              }
            }
          ],
          success (result) {
            try {
              expect(result).to.include('- apple');
              expect(result).to.include('- banana');
              expect(result).to.include('- cherry');
              done();
            } catch (err) {
              done(err);
            }
          }
        });
      });

      it('should support valueOf($0) to access forEach value', (done) => {
        // This is what we want to enable - accessing forEach value
        // via valueOf
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {items: ['apple', 'banana', 'cherry']},
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.forEach('$.items[*]', function () {
                  this.string('- ');
                  // We want this to work:
                  this.valueOf({select: '$0'});
                  this.string('\n');
                });
              }
            }
          ],
          success (result) {
            try {
              expect(result).to.include('- apple');
              expect(result).to.include('- banana');
              expect(result).to.include('- cherry');
              done();
            } catch (err) {
              done(err);
            }
          }
        });
      });

      it('should support valueOf(.) to access current context', (done) => {
        // Test that valueOf({select: '.'}) gets the current context
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {items: ['apple', 'banana', 'cherry']},
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.forEach('$.items[*]', function () {
                  this.string('* ');
                  this.valueOf({select: '.'});
                  this.string('\n');
                });
              }
            }
          ],
          success (result) {
            try {
              expect(result).to.include('* apple');
              expect(result).to.include('* banana');
              expect(result).to.include('* cherry');
              done();
            } catch (err) {
              done(err);
            }
          }
        });
      });

      it('should access object properties via valueOf in forEach', (done) => {
        // Test with more complex objects
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {
            users: [
              {name: 'Alice', age: 30},
              {name: 'Bob', age: 25}
            ]
          },
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.forEach('$.users[*]', function () {
                  this.valueOf({select: '$.name'});
                  this.string(' is ');
                  this.valueOf({select: '$.age'});
                  this.string(' years old\n');
                });
              }
            }
          ],
          success (result) {
            try {
              expect(result).to.include('Alice is 30 years old');
              expect(result).to.include('Bob is 25 years old');
              done();
            } catch (err) {
              done(err);
            }
          }
        });
      });
    });

    describe('valueOf in regular templates', function () {
      it('should support valueOf(.) in template to get context', (done) => {
        // Test valueOf({select: '.'}) in regular templates
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {items: ['x', 'y', 'z']},
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.applyTemplates('$.items[*]');
              }
            },
            {
              path: '$.items[*]',
              template () {
                this.string('[');
                this.valueOf({select: '.'});
                this.string(']');
              }
            }
          ],
          success (result) {
            try {
              expect(result).to.equal('[x][y][z]');
              done();
            } catch (err) {
              done(err);
            }
          }
        });
      });

      it('should support valueOf($0) in template', (done) => {
        // Test valueOf({select: '$0'}) in regular templates
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {numbers: [1, 2, 3]},
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.applyTemplates('$.numbers[*]');
              }
            },
            {
              path: '$.numbers[*]',
              template () {
                this.string('N:');
                this.valueOf({select: '$0'});
                this.string(';');
              }
            }
          ],
          success (result) {
            try {
              expect(result).to.equal('N:1;N:2;N:3;');
              done();
            } catch (err) {
              done(err);
            }
          }
        });
      });

      it(
        'should support valueOf(.) in applyTemplates with no select',
        (done) => {
          // Test valueOf({select: '.'}) when applyTemplates()
          // called without arguments
          // eslint-disable-next-line no-new -- exercising API
          new JTLT({
            data: {
              items: ['X', 'Y', 'Z']
            },
            outputType: 'string',
            templates: [
              {
                path: '$.items',
                template () {
                  // applyTemplates with no arguments - should apply to children
                  this.applyTemplates();
                }
              },
              {
                path: '$.items[*]',
                template () {
                  this.string('[');
                  this.valueOf({select: '.'});
                  this.string(']');
                }
              }
            ],
            success (result) {
              try {
                expect(result).to.equal('[X][Y][Z]');
                done();
              } catch (err) {
                done(err);
              }
            }
          });
        }
      );
    });

    describe('valueOf in root templates', function () {
      it('should support valueOf($0) in root template', (done) => {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {name: 'Root', value: 42},
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.string('Name:');
                this.valueOf({select: '$.name'});
                this.string(',Value:');
                this.valueOf({select: '$.value'});
              }
            }
          ],
          success (result) {
            try {
              expect(result).to.equal('Name:Root,Value:42');
              done();
            } catch (err) {
              done(err);
            }
          }
        });
      });

      it('should support valueOf(.) in root template', (done) => {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: 'simple-value',
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.string('[');
                this.valueOf({select: '.'});
                this.string(']');
              }
            }
          ],
          success (result) {
            try {
              expect(result).to.equal('[simple-value]');
              done();
            } catch (err) {
              done(err);
            }
          }
        });
      });
    });
  }
);

describe('valueOf in XPath templates and forEach', function () {
  /**
   * @returns {{document: Document}}
   */
  function buildDom () {
    const dom = new JSDOM(`
      <root>
        <item id="a">Apple</item>
        <item id="b">Banana</item>
        <item id="c">Cherry</item>
      </root>
    `);
    return {document: dom.window.document};
  }

  describe('valueOf in XPath forEach', function () {
    it('should support valueOf($0) in forEach callback', (done) => {
      const {document} = buildDom();
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: document,
        outputType: 'string',
        engineType: 'xpath',
        templates: [
          {
            path: '/',
            template () {
              this.forEach('//item', function () {
                this.string('- ');
                this.valueOf({select: '$0'});
                this.string('\n');
              });
            }
          }
        ],
        success (result) {
          try {
            expect(result).to.include('- Apple');
            expect(result).to.include('- Banana');
            expect(result).to.include('- Cherry');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('should support valueOf(.) in forEach to get current node', (done) => {
      const {document} = buildDom();
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: document,
        outputType: 'string',
        engineType: 'xpath',
        templates: [
          {
            path: '/',
            template () {
              this.forEach('//item', function () {
                this.string('* ');
                this.valueOf({select: '.'});
                this.string('\n');
              });
            }
          }
        ],
        success (result) {
          try {
            expect(result).to.include('* Apple');
            expect(result).to.include('* Banana');
            expect(result).to.include('* Cherry');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });
  });

  describe('valueOf in XPath templates', function () {
    it('should support valueOf(.) in template', (done) => {
      const {document} = buildDom();
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: document,
        outputType: 'string',
        engineType: 'xpath',
        templates: [
          {
            path: '/',
            template () {
              this.applyTemplates('//item');
            }
          },
          {
            path: '//item',
            template () {
              this.string('[');
              this.valueOf({select: '.'});
              this.string(']');
            }
          }
        ],
        success (result) {
          try {
            expect(result).to.include('[Apple]');
            expect(result).to.include('[Banana]');
            expect(result).to.include('[Cherry]');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('should support valueOf($0) in template', (done) => {
      const {document} = buildDom();
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: document,
        outputType: 'string',
        engineType: 'xpath',
        templates: [
          {
            path: '/',
            template () {
              this.applyTemplates('//item');
            }
          },
          {
            path: '//item',
            template () {
              this.string('Item:');
              this.valueOf({select: '$0'});
              this.string(';');
            }
          }
        ],
        success (result) {
          try {
            expect(result).to.include('Item:Apple;');
            expect(result).to.include('Item:Banana;');
            expect(result).to.include('Item:Cherry;');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('should handle text nodes in forEach with valueOf($0)', (done) => {
      const dom = new JSDOM(
        `<root><item>First</item><item>Second</item></root>`
      );
      const {document} = dom.window;
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: document,
        outputType: 'string',
        engineType: 'xpath',
        templates: [
          {
            path: '/',
            template () {
              // Select text nodes specifically
              this.forEach('//item/text()', function () {
                this.string('[');
                this.valueOf({select: '$0'});
                this.string(']');
              });
            }
          }
        ],
        success (result) {
          try {
            expect(result).to.include('[First]');
            expect(result).to.include('[Second]');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it(
      'should support valueOf(.) in applyTemplates with no select',
      (done) => {
        // Test valueOf({select: '.'}) when applyTemplates()
        // called without arguments
        const dom = new JSDOM(
          `<root><item>X</item><item>Y</item><item>Z</item></root>`
        );
        const {document} = dom.window;
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: document,
          outputType: 'string',
          engineType: 'xpath',
          templates: [
            {
              path: '//root',
              template () {
                // applyTemplates with no args - applies to child elements
                this.applyTemplates();
              }
            },
            {
              path: '//item',
              template () {
                this.string('(');
                this.valueOf({select: '.'});
                this.string(')');
              }
            }
          ],
          success (result) {
            try {
              expect(result).to.equal('(X)(Y)(Z)');
              done();
            } catch (err) {
              done(err);
            }
          }
        });
      }
    );
  });

  describe('valueOf in XPath root templates', function () {
    /**
     * @returns {{document: Document}}
     */
    function buildSimpleDom () {
      const dom = new JSDOM(`<root>RootText</root>`);
      return {document: dom.window.document};
    }

    it('should support valueOf(.) in XPath root template', (done) => {
      const {document} = buildSimpleDom();
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: document,
        outputType: 'string',
        engineType: 'xpath',
        templates: [
          {
            path: '/',
            template () {
              // In root template, valueOf(.) gets document text content
              this.string('[');
              this.valueOf({select: '.'});
              this.string(']');
            }
          }
        ],
        success (result) {
          try {
            // Document node's textContent includes all text in the document
            expect(result).to.match(/\[.*RootText.*\]/v);
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('should support valueOf($0) in XPath root template', (done) => {
      const {document} = buildSimpleDom();
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: document,
        outputType: 'string',
        engineType: 'xpath',
        templates: [
          {
            path: '/',
            template () {
              // $0 should reference the document node
              this.string('Content:');
              this.valueOf({select: '$0'});
            }
          }
        ],
        success (result) {
          try {
            // Document node's textContent includes all text
            expect(result).to.match(/Content:.*RootText/v);
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });
  });
});
