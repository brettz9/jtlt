import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {
  StringJoiningTransformer,
  XPathTransformer
} from '../src/index.js';

/**
 * @param {string} xml
 * @returns {Document}
 */
function makeDoc (xml) {
  const {window} = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost'
  });
  const parser = new window.DOMParser();
  return parser.parseFromString(xml, 'text/xml');
}

describe('XPathTransformerContext scalar return types (v1)', () => {
  it('handles BOOLEAN_TYPE result from XPath evaluation', () => {
    const doc = makeDoc('<root><item>test</item></root>');
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '/',
        /**
         * @this {any}
         */
        template () {
          // boolean() XPath function returns BOOLEAN_TYPE
          const bool = this.get('boolean(//item)');
          this.string(bool ? 'yes' : 'no');
        }
      }
    ];
    /** @type {any} */
    const cfg = {
      data: doc,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 1
    };
    const engine = new XPathTransformer(cfg);
    const out = engine.transform('');
    expect(out).to.equal('yes');
  });

  it('handles default case for unsupported XPathResult types', () => {
    const doc = makeDoc('<root><item>test</item></root>');
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '/',
        /**
         * @this {any}
         */
        template () {
          // Get result that may fall through to default
          const result = this.get('.');
          // Should return context node
          expect(result).to.equal(doc);
        }
      }
    ];
    /** @type {any} */
    const cfg = {
      data: doc,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 1
    };
    const engine = new XPathTransformer(cfg);
    engine.transform('');
  });

  it('handles invalid XPath expression gracefully', () => {
    const doc = makeDoc('<root><item>test</item></root>');
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        // Invalid XPath that will throw during evaluation
        path: '//@invalid[[[syntax',
        /**
         * @this {any}
         */
        template () {
          this.string('matched');
        }
      },
      {
        path: '/',
        /**
         * @this {any}
         */
        template () {
          // Should fall through to default behavior when path match fails
          this.applyTemplates('//item');
        }
      },
      {
        path: '//item',
        /**
         * @this {any}
         * @param {any} node
         */
        template (node) {
          this.string(node.textContent);
        }
      }
    ];
    /** @type {any} */
    const cfg = {
      data: doc,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 1
    };
    const engine = new XPathTransformer(cfg);
    const out = engine.transform('');
    // Should still work despite invalid template path
    expect(out).to.equal('test');
  });

  it('calls message() for logging', () => {
    const doc = makeDoc('<root/>');
    const joiner = new StringJoiningTransformer('');
    // Spy on console.log
    /* eslint-disable no-console -- Testing console output */
    const originalLog = console.log;
    let logged = null;
    console.log = (msg) => {
      logged = msg;
    };
    try {
      const templates = [
        {
          path: '/',
          /**
           * @this {any}
           */
          template () {
            // Call message method
            /** @type {any} */ this.message({test: 'data'});
          }
        }
      ];
      /** @type {any} */
      const cfg = {
        data: doc,
        templates,
        joiningTransformer: joiner,
        xpathVersion: 1
      };
      const engine = new XPathTransformer(cfg);
      engine.transform('');
      expect(logged).to.deep.equal({test: 'data'});
    } finally {
      console.log = originalLog;
      /* eslint-enable no-console -- Re-enable rule */
    }
  });

  it('uses default transformRoot rule', () => {
    const doc = makeDoc('<root><item>x</item></root>');
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '//item',
        /**
         * @this {any}
         * @param {any} node
         */
        template (node) {
          this.string(node.textContent);
        }
      }
    ];
    /** @type {any} */
    const cfg = {
      data: doc,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 1
    };
    const engine = new XPathTransformer(cfg);
    // No root template, so default transformRoot is used
    const out = engine.transform('');
    expect(out).to.equal('x');
  });

  it('uses default transformTextNodes rule', () => {
    const doc = makeDoc('<root>plain text</root>');
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '/',
        /**
         * @this {any}
         */
        template () {
          // Apply templates to text nodes
          this.applyTemplates('//text()');
        }
      }
    ];
    /** @type {any} */
    const cfg = {
      data: doc,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 1
    };
    const engine = new XPathTransformer(cfg);
    const out = engine.transform('');
    // Default text node rule returns nodeValue
    expect(out).to.include('plain text');
  });

  it('uses set() to modify context node', () => {
    const doc = makeDoc('<root><item>test</item></root>');
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '/',
        /**
         * @this {any}
         */
        template () {
          // Call set to change context
          const item = this.get('//item', true)[0];
          this.set(item);
          this.string(this._contextNode.textContent);
        }
      }
    ];
    /** @type {any} */
    const cfg = {
      data: doc,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 1
    };
    const engine = new XPathTransformer(cfg);
    const out = engine.transform('');
    expect(out).to.equal('test');
  });

  it('handles templates without priority or resolver', () => {
    const doc = makeDoc('<root><item>a</item></root>');
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '/',
        /**
         * @this {any}
         */
        template () {
          this.applyTemplates('//item');
        }
      },
      {
        // No priority property, no specificityPriorityResolver
        path: '//item',
        /**
         * @this {any}
         * @param {any} node
         */
        template (node) {
          this.string(node.textContent);
        }
      }
    ];
    /** @type {any} */
    const cfg = {
      data: doc,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 1
      // No specificityPriorityResolver - hits fallback : 0
    };
    const engine = new XPathTransformer(cfg);
    const out = engine.transform('');
    expect(out).to.equal('a');
  });

  it('uses specificityPriorityResolver for template sorting', () => {
    const doc = makeDoc('<root><item>test</item></root>');
    const joiner = new StringJoiningTransformer('');
    let resolverCalled = false;
    const templates = [
      {
        path: '/',
        /**
         * @this {any}
         */
        template () {
          this.applyTemplates('//item');
        }
      },
      {
        path: '//item',
        /**
         * @this {any}
         * @param {any} node
         */
        template (node) {
          this.string(node.textContent);
        }
      },
      {
        path: '//*',
        /**
         * @this {any}
         */
        template () {
          this.string('wildcard');
        }
      }
    ];
    /** @type {any} */
    const cfg = {
      data: doc,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 1,
      /**
       * @param {string} path
       * @returns {number}
       */
      specificityPriorityResolver (path) {
        resolverCalled = true;
        // Give higher priority to more specific paths
        return path === '//item' ? 10 : 5;
      }
    };
    const engine = new XPathTransformer(cfg);
    const out = engine.transform('');
    expect(out).to.equal('test');
    expect(resolverCalled).to.be.true;
  });

  it('throws on equal priority templates when configured', () => {
    const doc = makeDoc('<root><item>test</item></root>');
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '/',
        /**
         * @this {any}
         */
        template () {
          this.applyTemplates('//item');
        }
      },
      {
        path: '//item',
        priority: 5,
        /**
         * @this {any}
         */
        template () {
          this.string('first');
        }
      },
      {
        path: '//*',
        priority: 5,
        /**
         * @this {any}
         */
        template () {
          this.string('second');
        }
      }
    ];
    /** @type {any} */
    const cfg = {
      data: doc,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 1,
      errorOnEqualPriority: true
    };
    const engine = new XPathTransformer(cfg);
    expect(() => engine.transform('')).to.throw('Equal priority templates');
  });

  it('wraps non-array result in xpath2 (v2)', () => {
    const doc = makeDoc('<root><item>test</item></root>');
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '/',
        /**
         * @this {any}
         */
        template () {
          // Using v2, get a scalar result that needs wrapping
          const result = /** @type {any} */ (this)._evalXPath(
            '1+2', true // numeric scalar -> should be wrapped into array
          );
          // Should wrap non-array result
          expect(Array.isArray(result)).to.be.true;
          expect(result[0]).to.equal(3);
        }
      }
    ];
    /** @type {any} */
    const cfg = {
      data: doc,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 2
    };
    const engine = new XPathTransformer(cfg);
    engine.transform('');
  });
});
