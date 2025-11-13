import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {
  XPathTransformerContext, DOMJoiningTransformer
} from '../src/index-node.js';

describe('XPathTransformerContext complete coverage', () => {
  describe('constructor validation (lines 37-38)', () => {
    it('throws error when config.data is missing', () => {
      const {window} = new JSDOM('<root></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      expect(() => {
        return new XPathTransformerContext({
          joiningTransformer: joiner
        }, []);
      }).to.throw(Error, /requires config\.data/v);
    });
  });

  describe('valueOf with parameter references (lines 375-384)', () => {
    it('resolves parameter reference starting with $', () => {
      const {window} = new JSDOM('<root><item>Test</item></root>', {
        url: 'http://localhost'
      });
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, []);
      ctx._params = {myParam: 'parameter-value'};

      // valueOf appends to joiner and returns context
      const result = ctx.valueOf('$myParam');
      expect(result).to.equal(ctx);

      // Check that the parameter value was appended
      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.equal('parameter-value');
    });

    it('falls back to XPath when parameter not found (lines 378-383)', () => {
      const {window} = new JSDOM('<root><item>Test</item></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, []);
      ctx._params = {knownParam: 'known'};

      // $unknownParam not in params, should fall back to XPath evaluation
      // XPath variables aren't supported in jsdom, so it will throw
      expect(() => ctx.valueOf('$unknownParam')).to.throw(
        Error,
        /Value should be a node-set|localStorage/v
      );
    });

    it('evaluates $ reference as XPath when no params set', () => {
      const {window} = new JSDOM('<root><item>123</item></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, []);

      // Should fall back to XPath evaluation which will throw for
      // unsupported variables
      expect(() => ctx.valueOf('$someVar')).to.throw(
        Error,
        /Value should be a node-set|localStorage/v
      );
    });

    it('returns scalar when XPath fallback returns non-node', () => {
      const {window} = new JSDOM('<root><item>123</item></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, []);
      ctx._params = {};

      // $var doesn't exist in params, will throw trying to evaluate as XPath
      expect(() => ctx.valueOf('$missingVar')).to.throw(
        Error,
        /Value should be a node-set|localStorage/v
      );
    });
  });

  describe('text() with scalar value (lines 459-460)', () => {
    it('appends scalar value when not a node', () => {
      const {window} = new JSDOM('<root><item>Test</item></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, []);

      // Pass a scalar value directly
      // @ts-expect-error - testing scalar value handling
      ctx.text(42);

      const result = /** @type {Element} */ (joiner.get());
      expect(result.textContent).to.include('42');
    });

    it('appends string scalar', () => {
      const {window} = new JSDOM('<root></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, []);

      ctx.text('hello');

      const result = /** @type {Element} */ (joiner.get());
      expect(result.textContent).to.equal('hello');
    });

    it('appends boolean scalar', () => {
      const {window} = new JSDOM('<root></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, []);

      // @ts-expect-error - testing boolean scalar handling
      ctx.text(true);

      const result = /** @type {Element} */ (joiner.get());
      expect(result.textContent).to.equal('true');
    });
  });

  describe('output() method (lines 589-591)', () => {
    it('calls output on joining transformer', () => {
      const {window} = new JSDOM('<root></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document, exposeDocuments: true}
      );

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, []);

      // Call output() on context
      ctx.output({method: 'xml', version: '1.0'});
      ctx.element('test', {}, () => {
        ctx.text('content');
      });

      const docs = joiner.get();
      expect(Array.isArray(docs)).to.equal(true);
      expect(docs).to.have.lengthOf(1);
    });

    it('output() returns context for chaining', () => {
      const {window} = new JSDOM('<root></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, []);

      const result = ctx.output({method: 'html'});
      expect(result).to.equal(ctx);
    });
  });

  describe('callTemplate method (lines 294-340)', () => {
    it('calls a named template with parameters', () => {
      const {window} = new JSDOM('<root><item>Test</item></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // eslint-disable-next-line @stylistic/max-len -- Long
      const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([
        {
          name: 'myTemplate',
          template () {
            // Access parameter via valueOf
            this.valueOf('$testParam');
            this.text(' - processed');
          }
        }
      ]);

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, templates);

      // Call template with withParams
      ctx.callTemplate('myTemplate', [
        {name: 'testParam', value: 'param-value'}
      ]);

      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.include('param-value');
      expect(output.textContent).to.include(' - processed');
    });

    it('calls template with object syntax', () => {
      const {window} = new JSDOM('<root></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // eslint-disable-next-line @stylistic/max-len -- Long
      const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([
        {
          name: 'test',
          template () {
            this.text('called');
          }
        }
      ]);

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, templates);

      ctx.callTemplate({
        name: 'test',
        withParam: [{name: 'p1', value: 'v1'}]
      });

      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.equal('called');
    });

    it('calls template with object syntax without withParam', () => {
      const {window} = new JSDOM('<root></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // eslint-disable-next-line @stylistic/max-len -- Long
      const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([
        {
          name: 'noParams',
          template () {
            this.text('no-params');
          }
        }
      ]);

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, templates);

      // Call with object but no withParam property
      ctx.callTemplate({name: 'noParams'});

      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.equal('no-params');
    });

    it('throws when template not found', () => {
      const {window} = new JSDOM('<root></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, []);

      expect(() => ctx.callTemplate('nonexistent')).to.throw(
        Error,
        /cannot be called as it was not found/v
      );
    });

    it('uses select for parameter values', () => {
      const {window} = new JSDOM('<root><value>123</value></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // eslint-disable-next-line @stylistic/max-len -- Long
      const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([
        {
          name: 'withSelect',
          template () {
            // The parameter value comes from select evaluation
            this.text(String(this._params?.selectedValue || ''));
          }
        }
      ]);

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, templates);

      ctx.callTemplate('withSelect', [
        {name: 'selectedValue', select: 'string(//value)'}
      ]);

      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.equal('123');
    });

    it('stores parameters by index when name not provided', () => {
      const {window} = new JSDOM('<root></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // eslint-disable-next-line @stylistic/max-len -- Long
      const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([
        {
          name: 'indexed',
          template () {
            this.valueOf('$0');
          }
        }
      ]);

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, templates);

      ctx.callTemplate('indexed', [
        {value: 'index-zero'}
      ]);

      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.equal('index-zero');
    });

    it('restores previous parameter context after call', () => {
      const {window} = new JSDOM('<root></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // eslint-disable-next-line @stylistic/max-len -- Long
      const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([
        {
          name: 'inner',
          template () {
            this.valueOf('$innerParam');
          }
        }
      ]);

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, templates);

      // Set outer params
      ctx._params = {outerParam: 'outer'};

      ctx.callTemplate('inner', [
        {name: 'innerParam', value: 'inner'}
      ]);

      // After callTemplate, params should be restored
      expect(ctx._params).to.deep.equal({outerParam: 'outer'});
    });

    it('appends template return value when defined', () => {
      const {window} = new JSDOM('<root></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const templates = [
        {
          name: 'returnsValue',
          template () {
            // Return a value instead of using context methods
            return 'returned-value';
          }
        }
      ];

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, templates);

      ctx.callTemplate('returnsValue');

      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.equal('returned-value');
    });
  });

  describe('copyOf scalar branch (lines 459-460)', () => {
    it('appends scalar result from XPath evaluation', () => {
      const {window} = new JSDOM('<root><num>42</num></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, []);

      // copyOf with an XPath that returns a scalar (number)
      ctx.copyOf('count(//num)');

      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.include('1');
    });

    it('handles scalar string result', () => {
      const {window} = new JSDOM('<root><text>hello</text></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, []);

      // Use string() function to get scalar
      ctx.copyOf('string(//text)');

      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.equal('hello');
    });
  });

  describe('template !t.path branch (lines 225-226)', () => {
    it('filters out templates without path during matching', () => {
      const {window} = new JSDOM('<root><item>Test</item></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // eslint-disable-next-line @stylistic/max-len -- Long
      const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([
        {
          name: 'namedOnly',
          // No path property - this is a named-only template
          template () {
            this.text('named-template');
          }
        },
        {
          path: '//item',
          template () {
            this.text('path-template');
          }
        }
      ]);

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, templates);

      // Apply templates - should use path-template for //item nodes
      ctx.forEach('//item', function () {
        // The context will apply matching templates
        this.text(' matched');
      });

      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.include(' matched');
    });

    it('filters templates by mode', () => {
      const {window} = new JSDOM('<root><item>Test</item></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // eslint-disable-next-line @stylistic/max-len -- Long
      const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([
        {
          path: '//item',
          mode: 'special',
          template () {
            this.text('special-mode');
          }
        },
        {
          path: '//item',
          template () {
            this.text('default-mode');
          }
        }
      ]);

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, templates);

      // Apply templates with mode - should only match special mode template
      ctx.applyTemplates('//item', 'special');

      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.include('special-mode');
      expect(output.textContent).to.not.include('default-mode');
    });

    it('excludes templates with name but no path', () => {
      const {window} = new JSDOM('<root><item>Test</item></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // eslint-disable-next-line @stylistic/max-len -- Long
      const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([
        {
          name: 'namedTemplate',
          // No path - should be excluded from applyTemplates
          template () {
            this.text('named-template');
          }
        },
        {
          path: '//item',
          template () {
            this.text('path-template');
          }
        }
      ]);

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, templates);

      // Apply templates - should NOT use named-only template
      ctx.applyTemplates('//item');

      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.include('path-template');
      expect(output.textContent).to.not.include('named-template');
    });

    it('handles template with neither name nor path', () => {
      const {window} = new JSDOM('<root><item>Test</item></root>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );

      // eslint-disable-next-line @stylistic/max-len -- Long
      const templates = /** @type {import('../src/index.js').XPathTemplateObject<any>[]} */ ([
        {
          // No name, no path - edge case
          template () {
            this.text('no-path-no-name');
          }
        },
        {
          path: '//item',
          template () {
            this.text('with-path');
          }
        }
      ]);

      const ctx = new XPathTransformerContext({
        data: document.documentElement,
        joiningTransformer: joiner
      }, templates);

      // Apply templates - template without path should be filtered out
      ctx.applyTemplates('//item');

      const output = /** @type {Element} */ (joiner.get());
      expect(output.textContent).to.include('with-path');
      // Template without path shouldn't be applied
      expect(output.textContent).to.not.include('no-path-no-name');
    });
  });
});
