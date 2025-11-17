import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JTLT from '../src/index-node.js';

describe('function() - XSLT-like stylesheet functions', function () {
  it('should register and call a simple function', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 5},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          // Register function
          this.function({
            name: 'f:double',
            params: [{name: 'n'}],
            body: (n) => n * 2
          });

          // Call function via valueOf
          this.string('Result: ');
          this.valueOf({select: 'f:double(10)'});
        }
      }],
      success (result) {
        try {
          expect(result).to.include('Result: 20');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should require namespaced function names', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          try {
            this.function({
              name: 'double', // no namespace!
              body: (n) => n * 2
            });
            done(new Error('Should have thrown error'));
          } catch (err) {
            expect(/** @type {Error} */ (err).message).to.include(
              'must be in a namespace'
            );
            done();
          }
        }
      }],
      success () {
        // No success callback needed - test ends in template
      }
    });
  });

  it('should support Q{uri}name notation', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.function({
            name: 'Q{http://example.com}triple',
            params: [{name: 'n'}],
            body: (n) => n * 3
          });

          // Call via valueOf - Q{} notation works too
          this.valueOf({select: 'Q{http://example.com}triple(7)'});
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('21');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should handle multiple parameters', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.function({
            name: 'math:add',
            params: [{name: 'a'}, {name: 'b'}],
            body: (a, b) => a + b
          });

          this.string('Sum: ');
          this.valueOf({select: 'math:add(5, 7)'});
        }
      }],
      success (result) {
        try {
          expect(result).to.include('Sum: 12');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should handle zero parameters', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.function({
            name: 'util:constant',
            body: () => 42
          });

          // Call with empty parentheses for zero-param function
          this.valueOf({select: 'util:constant()'});
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('42');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should distinguish functions by arity', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          // Register two functions with same name but different arity
          this.function({
            name: 'f:greet',
            params: [{name: 'name'}],
            body: (name) => `Hello, ${name}!`
          });

          this.function({
            name: 'f:greet',
            params: [{name: 'title'}, {name: 'name'}],
            body: (title, name) => `Hello, ${title} ${name}!`
          });

          // Call with different arities via valueOf
          this.valueOf({select: "f:greet('Alice')"});
          this.string(' ');
          this.valueOf({select: "f:greet('Dr.', 'Smith')"});
        }
      }],
      success (result) {
        try {
          expect(result).to.include('Hello, Alice!');
          expect(result).to.include('Hello, Dr. Smith!');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should throw error for duplicate function registration', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.function({
            name: 'f:test',
            params: [{name: 'x'}],
            body: (x) => x
          });

          try {
            this.function({
              name: 'f:test',
              params: [{name: 'y'}], // same arity
              body: (y) => y * 2
            });
            done(new Error('Should have thrown error'));
          } catch (err) {
            expect(/** @type {Error} */ (err).message).to.include(
              'already registered'
            );
            done();
          }
        }
      }],
      success () {
        // No success callback needed - test ends in template
      }
    });
  });

  it('should throw error when calling undefined function', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          try {
            this.invokeFunctionByArity('f:undefined', [1, 2, 3]);
            done(new Error('Should have thrown error'));
          } catch (err) {
            expect(/** @type {Error} */ (err).message).to.include(
              'not found'
            );
            done();
          }
        }
      }],
      success () {
        // No success callback needed - test ends in template
      }
    });
  });

  it('should throw error for wrong arity', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.function({
            name: 'f:test',
            params: [{name: 'x'}, {name: 'y'}],
            body: (x, y) => x + y
          });

          try {
            // Try calling with wrong number of arguments
            this.invokeFunctionByArity('f:test', [1]); // needs 2 args
            done(new Error('Should have thrown error'));
          } catch (err) {
            expect(/** @type {Error} */ (err).message).to.include(
              'not found'
            );
            done();
          }
        }
      }],
      success () {
        // No success callback needed - test ends in template
      }
    });
  });

  it('should return complex values', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'json',
      templates: [{
        path: '$',
        template () {
          this.function({
            name: 'data:makeObject',
            params: [{name: 'key'}, {name: 'value'}],
            body: (key, value) => ({[key]: value})
          });

          const obj = this.invokeFunctionByArity(
            'data:makeObject', ['name', 'Alice']
          );
          // eslint-disable-next-line unicorn/no-this-assignment -- Closure
          const that = this;
          this.object(function () {
            that.propValue('result', obj);
          });
        }
      }],
      success (result) {
        try {
          expect(result).to.deep.equal([{result: {name: 'Alice'}}]);
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should work with XPath context', (done) => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(
      '<root><item>5</item></root>',
      'text/xml'
    );

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      xpathVersion: 1,
      outputType: 'string',
      templates: [{
        path: '/root',
        template () {
          this.function({
            name: 'math:square',
            params: [{name: 'n'}],
            body: (n) => n * n
          });

          // Use forEach to get the item value and call function
          this.forEach('item', function (item) {
            const value = Number(item.textContent);
            const result = this.invokeFunctionByArity('math:square', [value]);
            this.string(`${result}`);
          });
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('25');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should be callable from different templates', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {items: [1, 2, 3]},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            // Register function once at root
            this.function({
              name: 'f:format',
              params: [{name: 'n'}],
              body (n) {
                return `[${n}]`;
              }
            });

            // Apply templates to items
            this.applyTemplates({select: '$.items[*]'});
          }
        },
        {
          path: '$.items[*]',
          template (item) {
            // Call function from item template
            const formatted = this.invokeFunctionByArity('f:format', [item]);
            this.string(formatted);
            this.string(' ');
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.equal('[1] [2] [3] ');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should support recursive functions', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          // Recursive factorial function
          // eslint-disable-next-line unicorn/no-this-assignment -- Closure
          const that = this;
          this.function({
            name: 'math:factorial',
            params: [{name: 'n'}],
            body (n) {
              if (n <= 1) {
                return 1;
              }
              // Recursive call via callFunction
              return n * that.invokeFunctionByArity('math:factorial', [n - 1]);
            }
          });

          const result = that.invokeFunctionByArity('math:factorial', [5]);
          that.string(`5! = ${result}`);
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('5! = 120');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should handle functions with context access', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {threshold: 10},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          const threshold = this.get('$.threshold', false);

          this.function({
            name: 'app:isAboveThreshold',
            params: [{name: 'value'}],
            body: (value) => value > threshold
          });

          const result1 = this.invokeFunctionByArity(
            'app:isAboveThreshold', [15]
          );
          const result2 = this.invokeFunctionByArity(
            'app:isAboveThreshold', [5]
          );
          this.string(
            `15>${threshold}: ${result1}, 5>${threshold}: ${result2}`
          );
        }
      }],
      success (result) {
        try {
          expect(result).to.include('15>10: true');
          expect(result).to.include('5>10: false');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should work with parameter type hints (as attribute)', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.function({
            name: 'str:length',
            params: [{name: 's', as: 'xs:string'}],
            as: 'xs:integer',
            body: (s) => String(s).length
          });

          this.string('Length: ');
          this.valueOf({select: "str:length('hello')"});
        }
      }],
      success (result) {
        try {
          expect(result).to.include('Length: 5');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should work with callTemplate inside forEach', (done) => {
    // Test that functions can be called from within callTemplate
    // invoked inside forEach
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {items: [1, 2, 3]},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            // Register function
            this.function({
              name: 'f:bracket',
              params: [{name: 'n'}],
              body: (n) => `[${n}]`
            });

            // Use forEach with callTemplate
            this.forEach('$.items[*]', function (item) {
              this.callTemplate({
                name: 'formatter',
                withParam: [{name: 'value', value: item}]
              });
            });
          }
        },
        {
          name: 'formatter',
          template () {
            // Get parameter value directly from _params
            const val = this._params?.value;
            const formatted = this.invokeFunctionByArity('f:bracket', [val]);
            this.string(formatted);
            this.string(' ');
          }
        }
      ],
      success (result) {
        try {
          expect(result).to.equal('[1] [2] [3] ');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it(
    'should support parameter references in valueOf function calls (JSONPath)',
    (done) => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {value: 10},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.function({
              name: 'calc:add',
              params: [{name: 'a'}, {name: 'b'}],
              body: (a, b) => (a || 0) + (b || 0)
            });

            // Set parameter directly for testing
            this._params = {base: 5};
            // Call function with parameter reference
            this.valueOf({select: 'calc:add($base, 3)'});
            this.string(' ');
            // Call with undefined parameter
            this.valueOf({select: 'calc:add($missing, 2)'});
          }
        }],
        success (result) {
          try {
            expect(result).to.include('8'); // base=5 + 3
            expect(result).to.include('2'); // undefined + 2 = 0 + 2
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it('should support parameter references in valueOf (XPath)', (done) => {
    const dom = new JSDOM('<root><value>10</value></root>');
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: dom.window.document,
      engineType: 'xpath',
      outputType: 'dom',
      xpathVersion: 1,
      templates: [{
        path: '/',
        template () {
          this.function({
            name: 'math:subtract',
            params: [{name: 'a'}, {name: 'b'}],
            body: (a, b) => a - b
          });

          // Set parameter directly for testing
          this._params = {offset: 3};
          // Call function with parameter reference $offset
          this.valueOf({select: 'math:subtract(10, $offset)'});
        }
      }],
      success (result) {
        try {
          expect(result.textContent).to.include('7'); // 10 - 3
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should handle complex argument parsing (nested parens)', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.function({
            name: 'test:echo',
            params: [{name: 'x'}],
            body: (x) => x
          });

          // Call with various argument formats to test parsing
          this.valueOf({select: 'test:echo("abc")'});
        }
      }],
      success (result) {
        try {
          expect(result).to.include('abc');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  describe('XPath context', function () {
    it('should call registered function via valueOf (XPath 1.0)', (done) => {
      const dom = new JSDOM('<root><item>test</item></root>');
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: dom.window.document,
        engineType: 'xpath',
        outputType: 'dom',
        xpathVersion: 1,
        templates: [{
          path: '/',
          template () {
            // Register function
            this.function({
              name: 'util:exclaim',
              params: [{name: 'text'}],
              body: (text) => `${text}!`
            });

            // Call function via valueOf
            this.valueOf({select: 'util:exclaim("Hello")'});
          }
        }],
        success (result) {
          try {
            expect(result.textContent).to.include('Hello!');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('should call registered function natively (fontoxpath 3.1)', (done) => {
      const dom = new JSDOM('<root><value>42</value></root>');
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: dom.window.document,
        engineType: 'xpath',
        outputType: 'dom',
        xpathVersion: 3.1,
        templates: [{
          path: '/',
          template () {
            // Register function - this should register with fontoxpath
            this.function({
              name: 'math:triple',
              params: [{name: 'n', as: 'xs:integer'}],
              as: 'xs:integer',
              body: (n) => n * 3
            });

            // Call via XPath select (fontoxpath will handle natively)
            this.applyTemplates('//value');
          }
        }, {
          path: '//value',
          template () {
            // Use function in XPath expression evaluated by fontoxpath
            this.valueOf({select: 'math:triple(number(.))'});
          }
        }],
        success (result) {
          try {
            expect(result.textContent).to.include('126'); // 42 * 3
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('should support function with multiple parameters (XPath)', (done) => {
      const dom = new JSDOM('<root/>');
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: dom.window.document,
        engineType: 'xpath',
        outputType: 'dom',
        xpathVersion: 1,
        templates: [{
          path: '/',
          template () {
            this.function({
              name: 'str:concat3',
              params: [{name: 'a'}, {name: 'b'}, {name: 'c'}],
              body: (a, b, c) => `${a}-${b}-${c}`
            });

            this.valueOf({select: 'str:concat3("X", "Y", "Z")'});
          }
        }],
        success (result) {
          try {
            expect(result.textContent).to.include('X-Y-Z');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('should handle undefined param reference in XPath function', (done) => {
      const dom = new JSDOM('<root/>');
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: dom.window.document,
        engineType: 'xpath',
        outputType: 'dom',
        xpathVersion: 1,
        templates: [{
          path: '/',
          template () {
            this.function({
              name: 'test:checkUndefined',
              params: [{name: 'val'}],
              body: (val) => (val === undefined ? 'undefined' : 'defined')
            });

            // $nonexistent not in params - returns undefined
            this.valueOf({select: 'test:checkUndefined($nonexistent)'});
          }
        }],
        success (result) {
          try {
            expect(result.textContent).to.include('undefined');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('should support Q{uri}name syntax (fontoxpath)', (done) => {
      const dom = new JSDOM('<root/>');
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: dom.window.document,
        engineType: 'xpath',
        outputType: 'dom',
        xpathVersion: 3.1,
        templates: [{
          path: '/',
          template () {
            this.function({
              name: 'Q{http://example.org/ns}greet',
              params: [{name: 'name'}],
              body: (name) => `Hello, ${name}!`
            });

            // fontoxpath can call with Q{} syntax
            this.valueOf({select: 'Q{http://example.org/ns}greet("World")'});
          }
        }],
        success (result) {
          try {
            expect(result.textContent).to.include('Hello, World!');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('should work with undefined xpathVersion (defaults to 1)', (done) => {
      const dom = new JSDOM('<root/>');
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: dom.window.document,
        engineType: 'xpath',
        outputType: 'dom',
        // No xpathVersion specified - tests ?? 1 default
        templates: [{
          path: '/',
          template () {
            this.function({
              name: 'str:reverse',
              params: [{name: 'text'}],
              body: (text) => [...text].toReversed().join('')
            });

            this.valueOf({select: 'str:reverse("hello")'});
          }
        }],
        success (result) {
          try {
            expect(result.textContent).to.include('olleh');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('should call invokeFunctionByArity directly', (done) => {
      const dom = new JSDOM('<root/>');
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: dom.window.document,
        engineType: 'xpath',
        outputType: 'dom',
        xpathVersion: 1,
        templates: [{
          path: '/',
          template () {
            this.function({
              name: 'calc:multiply',
              params: [{name: 'a'}, {name: 'b'}],
              body: (a, b) => a * b
            });

            // Call via invokeFunctionByArity directly
            const result = this.invokeFunctionByArity('calc:multiply', [7, 6]);
            this.text(`${result}`);
          }
        }],
        success (result) {
          try {
            expect(result.textContent).to.equal('42');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('should handle strings with escaped characters in valueOf', (done) => {
      const dom = new JSDOM('<root/>');
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: dom.window.document,
        engineType: 'xpath',
        outputType: 'dom',
        xpathVersion: 1,
        templates: [{
          path: '/',
          template () {
            this.function({
              name: 'str:echo',
              params: [{name: 'text'}],
              body: (text) => text
            });

            // Call with nested expression containing comma - depth > 0
            this.valueOf({select: 'str:echo(concat("a", "b"))'});
          }
        }],
        success (result) {
          try {
            expect(result.textContent).to.include('ab');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it(
      'should handle JSONPath expression arguments in function calls',
      (done) => {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {val: 5},
          outputType: 'string',
          templates: [{
            path: '$',
            template () {
              this.function({
                name: 'calc:double',
                params: [{name: 'x'}],
                body: (x) => x * 2
              });

              // Argument is JSONPath expression - triggers get() fallback
              this.valueOf({select: 'calc:double($.val)'});
            }
          }],
          success (result) {
            try {
              expect(result).to.include('10');
              done();
            } catch (err) {
              done(err);
            }
          }
        });
      }
    );
  });
});
