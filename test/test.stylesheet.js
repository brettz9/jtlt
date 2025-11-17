import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JSONPathTransformerContext from '../src/JSONPathTransformerContext.js';
import XPathTransformerContext from '../src/XPathTransformerContext.js';
import JSONJoiningTransformer from '../src/JSONJoiningTransformer.js';
import DOMJoiningTransformer from '../src/DOMJoiningTransformer.js';
import StringJoiningTransformer from '../src/StringJoiningTransformer.js';
import AbstractJoiningTransformer from
  '../src/AbstractJoiningTransformer.js';

const {window} = new JSDOM('');
const {document} = window;

describe('stylesheet() and transform() methods', function () {
  describe('StringJoiningTransformer', function () {
    it(
      'should exclude unused namespace with excludeResultPrefixes',
      function () {
        const joiner = new StringJoiningTransformer('');
        joiner.stylesheet({excludeResultPrefixes: ['unused']});
        joiner.element('root', {}, [], function () {
          joiner.namespace('unused', 'http://example.com/unused');
          joiner.namespace('used', 'http://example.com/used');
          joiner.element('used:child');
        });
        const result = joiner.get();

        // Should not include unused namespace
        expect(result).not.to.include('xmlns:unused');
        // Should include used namespace
        expect(result).to.include('xmlns:used="http://example.com/used"');
      }
    );

    it('should include excluded namespace if actually used', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.stylesheet({excludeResultPrefixes: ['ns']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns', 'http://example.com/ns');
        joiner.element('ns:child');
      });
      const result = joiner.get();

      // Should include namespace because it's used
      expect(result).to.include('xmlns:ns="http://example.com/ns"');
    });

    it('should work with multiple excluded prefixes', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.stylesheet({excludeResultPrefixes: ['a', 'b', 'c']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('a', 'http://example.com/a');
        joiner.namespace('b', 'http://example.com/b');
        joiner.namespace('c', 'http://example.com/c');
        joiner.namespace('d', 'http://example.com/d');
        joiner.element('d:used');
      });
      const result = joiner.get();

      expect(result).not.to.include('xmlns:a');
      expect(result).not.to.include('xmlns:b');
      expect(result).not.to.include('xmlns:c');
      expect(result).to.include('xmlns:d="http://example.com/d"');
    });

    it('should support transform() as alias to stylesheet()', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.transform({excludeResultPrefixes: ['unused']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('unused', 'http://example.com/unused');
      });
      const result = joiner.get();

      expect(result).not.to.include('xmlns:unused');
    });

    it('should return this for chaining', function () {
      const joiner = new StringJoiningTransformer('');
      const result1 = joiner.stylesheet({excludeResultPrefixes: ['a']});
      const result2 = joiner.transform({excludeResultPrefixes: ['b']});

      expect(result1).to.equal(joiner);
      expect(result2).to.equal(joiner);
    });

    it('should handle empty excludeResultPrefixes array', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.stylesheet({excludeResultPrefixes: []});
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns', 'http://example.com/ns');
      });
      const result = joiner.get();

      // Should include namespace (nothing excluded)
      expect(result).to.include('xmlns:ns="http://example.com/ns"');
    });

    it('should work without excludeResultPrefixes property', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.stylesheet({});
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns', 'http://example.com/ns');
      });
      const result = joiner.get();

      expect(result).to.include('xmlns:ns="http://example.com/ns"');
    });

    it('should handle default namespace (empty prefix)', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.stylesheet({excludeResultPrefixes: ['']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('', 'http://example.com/default');
        joiner.element('child'); // Uses default namespace
      });
      const result = joiner.get();

      // Should include default namespace because it's used
      expect(result).to.include('xmlns="http://example.com/default"');
    });
  });

  describe('DOMJoiningTransformer', function () {
    it(
      'should exclude unused namespace with excludeResultPrefixes',
      function () {
        const joiner = new DOMJoiningTransformer(
          document.createDocumentFragment(),
          {document}
        );
        joiner.stylesheet({excludeResultPrefixes: ['unused']});
        joiner.element('root', {}, function () {
          joiner.namespace('unused', 'http://example.com/unused');
          joiner.namespace('used', 'http://example.com/used');
          joiner.element('used:child');
        });
        const result = joiner.get();
        if (Array.isArray(result)) {
          throw new TypeError('Unexpected array result');
        }
        const el = /** @type {Element} */ (result.firstChild);

        // Should not have unused namespace
        expect(el.hasAttribute('xmlns:unused')).to.be.false;
        // Should have used namespace
        expect(el.hasAttribute('xmlns:used')).to.be.true;
        expect(el.getAttribute('xmlns:used')).
          to.equal('http://example.com/used');
      }
    );

    it('should include excluded namespace if actually used', function () {
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.stylesheet({excludeResultPrefixes: ['ns']});
      joiner.element('root', {}, function () {
        joiner.namespace('ns', 'http://example.com/ns');
        joiner.element('ns:child');
      });
      const result = joiner.get();
      if (Array.isArray(result)) {
        throw new TypeError('Unexpected array result');
      }
      const el = /** @type {Element} */ (result.firstChild);

      expect(el.hasAttribute('xmlns:ns')).to.be.true;
      expect(el.getAttribute('xmlns:ns')).to.equal('http://example.com/ns');
    });

    it('should support transform() as an alias', function () {
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.transform({excludeResultPrefixes: ['unused']});
      joiner.element('root', {}, function () {
        joiner.namespace('unused', 'http://example.com/unused');
      });
      const result = joiner.get();
      if (Array.isArray(result)) {
        throw new TypeError('Unexpected array result');
      }
      const el = /** @type {Element} */ (result.firstChild);

      expect(el.hasAttribute('xmlns:unused')).to.be.false;
    });

    it('should handle default namespace exclusion and usage', function () {
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.stylesheet({excludeResultPrefixes: ['']});
      joiner.element('root', {}, function () {
        joiner.namespace('', 'http://example.com/default');
        joiner.element('child'); // Uses default namespace
      });
      const result = joiner.get();
      if (Array.isArray(result)) {
        throw new TypeError('Unexpected array result');
      }
      const el = /** @type {Element} */ (result.firstChild);

      // Should include default namespace because it's used
      expect(el.hasAttribute('xmlns')).to.be.true;
      expect(el.getAttribute('xmlns')).to.equal('http://example.com/default');
    });
  });

  describe('JSONJoiningTransformer', function () {
    it(
      'should exclude unused namespace with excludeResultPrefixes',
      function () {
        const joiner = new JSONJoiningTransformer([]);
        joiner.stylesheet({excludeResultPrefixes: ['unused']});
        joiner.element('root', {}, function () {
          joiner.namespace('unused', 'http://example.com/unused');
          joiner.namespace('used', 'http://example.com/used');
          joiner.element('used:child');
        });
        const result = joiner.get();

        const rootElement = result[0];
        const {xmlns} = rootElement[1];

        // Should not have unused namespace
        expect(xmlns).not.to.have.property('unused');
        // Should have used namespace
        expect(xmlns).to.have.property('used');
        expect(xmlns.used).to.equal('http://example.com/used');
      }
    );

    it('should include excluded namespace if actually used', function () {
      const joiner = new JSONJoiningTransformer([]);
      joiner.stylesheet({excludeResultPrefixes: ['ns']});
      joiner.element('root', {}, function () {
        joiner.namespace('ns', 'http://example.com/ns');
        joiner.element('ns:child');
      });
      const result = joiner.get();

      const rootElement = result[0];
      const {xmlns} = rootElement[1];

      expect(xmlns).to.have.property('ns');
      expect(xmlns.ns).to.equal('http://example.com/ns');
    });

    it('should support transform() as an alias', function () {
      const joiner = new JSONJoiningTransformer([]);
      joiner.transform({excludeResultPrefixes: ['unused']});
      joiner.element('root', {}, function () {
        joiner.namespace('unused', 'http://example.com/unused');
      });
      const result = joiner.get();

      const rootElement = result[0];
      const {xmlns} = rootElement[1];

      expect(xmlns).to.be.undefined;
    });

    it('should work with multiple prefixes', function () {
      const joiner = new JSONJoiningTransformer([]);
      joiner.stylesheet({excludeResultPrefixes: ['a', 'b']});
      joiner.element('root', {}, function () {
        joiner.namespace('a', 'http://example.com/a');
        joiner.namespace('b', 'http://example.com/b');
        joiner.namespace('c', 'http://example.com/c');
        joiner.element('c:used');
      });
      const result = joiner.get();

      const rootElement = result[0];
      const {xmlns} = rootElement[1];

      expect(xmlns).not.to.have.property('a');
      expect(xmlns).not.to.have.property('b');
      expect(xmlns).to.have.property('c');
    });

    it('should handle default namespace (empty prefix)', function () {
      const joiner = new JSONJoiningTransformer([]);
      joiner.stylesheet({excludeResultPrefixes: ['']});
      joiner.element('root', {}, function () {
        joiner.namespace('', 'http://example.com/default');
        joiner.element('child'); // Uses default namespace
      });
      const result = joiner.get();

      const rootElement = result[0];
      const {xmlns} = rootElement[1];

      // Should include default namespace because it's used
      expect(xmlns).to.have.property('');
      expect(xmlns['']).to.equal('http://example.com/default');
    });
  });

  describe('Integration with namespace tracking', function () {
    it('should track namespace usage in nested elements', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.stylesheet({excludeResultPrefixes: ['ns1', 'ns2']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns1', 'http://example.com/ns1');
        joiner.namespace('ns2', 'http://example.com/ns2');
        joiner.element('ns1:outer', {}, [], function () {
          joiner.element('ns2:inner');
        });
      });
      const result = joiner.get();

      // Both should be included because both are used
      expect(result).to.include('xmlns:ns1="http://example.com/ns1"');
      expect(result).to.include('xmlns:ns2="http://example.com/ns2"');
    });

    it('should accumulate excluded from multiple calls', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.stylesheet({excludeResultPrefixes: ['a']});
      joiner.stylesheet({excludeResultPrefixes: ['b']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('a', 'http://example.com/a');
        joiner.namespace('b', 'http://example.com/b');
        joiner.namespace('c', 'http://example.com/c');
      });
      const result = joiner.get();

      // Both a and b should be excluded
      expect(result).not.to.include('xmlns:a');
      expect(result).not.to.include('xmlns:b');
      // c should be included (not excluded, even though unused)
      expect(result).to.include('xmlns:c="http://example.com/c"');
    });
  });

  describe('Edge cases', function () {
    it('should handle default namespace correctly', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.stylesheet({excludeResultPrefixes: ['']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('', 'http://example.com/default');
        joiner.element('child');
      });
      const result = joiner.get();

      // Default namespace IS included because child element uses it
      expect(result).to.include('xmlns="http://example.com/default"');
    });

    it('should exclude unused default namespace', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.stylesheet({excludeResultPrefixes: ['']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('', 'http://example.com/default');
        // Don't use any child elements - namespace is truly unused
      });
      const result = joiner.get();

      // Should not include unused default namespace
      expect(result).not.to.include('xmlns="http://example.com/default"');
    });

    it('should flush default namespace in DOM joiner', function () {
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.stylesheet({excludeResultPrefixes: ['']});
      joiner.element('root', {}, function () {
        joiner.namespace('', 'http://example.com/default');
        joiner.element('child');
      });
      const result = joiner.get();
      if (Array.isArray(result)) {
        throw new TypeError('Unexpected array result');
      }
      const el = /** @type {Element} */ (result.firstChild);

      // Default namespace IS included because child uses it
      expect(el.hasAttribute('xmlns')).to.be.true;
      expect(el.getAttribute('xmlns')).to.equal('http://example.com/default');
    });

    it('should flush default namespace in JSON joiner', function () {
      const joiner = new JSONJoiningTransformer([]);
      joiner.stylesheet({excludeResultPrefixes: ['']});
      joiner.element('root', {}, function () {
        joiner.namespace('', 'http://example.com/default');
        joiner.element('child');
      });
      const result = joiner.get();

      const rootElement = result[0];
      const {xmlns} = rootElement[1];

      // Default namespace IS included because child uses it
      expect(xmlns).to.have.property('');
      expect(xmlns['']).to.equal('http://example.com/default');
    });

    it('should handle namespace aliasing with excluded', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.namespaceAlias('old', 'new');
      joiner.stylesheet({excludeResultPrefixes: ['new']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('old', 'http://example.com/ns');
        joiner.element('old:child'); // Tracked as 'new' after aliasing
      });
      const result = joiner.get();

      // Should be included because aliased prefix 'new' is used
      expect(result).to.include('xmlns:new="http://example.com/ns"');
    });

    it(
      'should handle aliasing prefix to empty string (default ns)',
      function () {
        const joiner = new StringJoiningTransformer('');
        // Alias 'temp' prefix to empty string (default namespace)
        joiner.namespaceAlias('temp', '');
        joiner.stylesheet({excludeResultPrefixes: ['']});
        joiner.element('root', {}, [], function () {
          joiner.namespace('temp', 'http://example.com/default');
          joiner.element('child'); // Uses default namespace
        });
        const result = joiner.get();

        // Should include default namespace because it's used
        expect(result).to.include('xmlns="http://example.com/default"');
      }
    );

    it('should handle aliasing to empty string in DOM joiner', function () {
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.namespaceAlias('temp', '');
      joiner.stylesheet({excludeResultPrefixes: ['']});
      joiner.element('root', {}, function () {
        joiner.namespace('temp', 'http://example.com/default');
        joiner.element('child');
      });
      const result = joiner.get();
      if (Array.isArray(result)) {
        throw new TypeError('Unexpected array result');
      }
      const el = /** @type {Element} */ (result.firstChild);

      expect(el.hasAttribute('xmlns')).to.be.true;
      expect(el.getAttribute('xmlns')).to.equal('http://example.com/default');
    });

    it('should handle aliasing to empty string in JSON joiner', function () {
      const joiner = new JSONJoiningTransformer([]);
      joiner.namespaceAlias('temp', '');
      joiner.stylesheet({excludeResultPrefixes: ['']});
      joiner.element('root', {}, function () {
        joiner.namespace('temp', 'http://example.com/default');
        joiner.element('child');
      });
      const result = joiner.get();

      const rootElement = result[0];
      const {xmlns} = rootElement[1];

      expect(xmlns).to.have.property('');
      expect(xmlns['']).to.equal('http://example.com/default');
    });
  });

  describe('Context methods', function () {
    it('should work from JSONPathTransformerContext', function () {
      const joiner = new JSONJoiningTransformer([]);
      const ctx = new JSONPathTransformerContext({
        data: {},
        joiningTransformer: joiner,
        templates: []
      }, []);

      ctx.stylesheet({excludeResultPrefixes: ['unused']});
      ctx.element('root', {}, [], function () {
        ctx.namespace('unused', 'http://example.com/unused');
      });

      const result = ctx.getOutput();
      const rootElement = result[0];
      const {xmlns} = rootElement[1];

      expect(xmlns).to.be.undefined;
    });

    it(
      'should work with transform() alias in XPathTransformerContext',
      function () {
        const joiner = new StringJoiningTransformer('');
        const ctx = new XPathTransformerContext({
          data: document,
          joiningTransformer: /** @type {any} */ (joiner)
        }, []);

        ctx.transform({excludeResultPrefixes: ['unused']});
        ctx.element('root', {}, function () {
          ctx.namespace('unused', 'http://example.com/unused');
        });

        const result = ctx.getOutput();
        expect(result).not.to.include('xmlns:unused');
      }
    );

    it(
      'should use transform() alias in JSONPathTransformerContext',
      function () {
        const joiner = new StringJoiningTransformer('');
        const ctx = new JSONPathTransformerContext({
          data: {},
          joiningTransformer: /** @type {any} */ (joiner),
          templates: []
        }, []);

        ctx.transform({excludeResultPrefixes: ['test']});
        ctx.element('root', {}, [], function () {
          ctx.namespace('test', 'http://example.com/test');
        });

        const result = ctx.getOutput();
        expect(result).not.to.include('xmlns:test');
      }
    );
  });

  describe('Attribute prefix tracking', function () {
    it('should track prefixed attributes and flush namespace', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.stylesheet({excludeResultPrefixes: ['ns']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns', 'http://example.com/ns');
        joiner.element('item', {}, [], function () {
          joiner.attribute('ns:attr', 'value');
        });
      });
      const result = joiner.get();

      // Namespace should be included because prefixed attribute uses it
      expect(result).to.include('xmlns:ns="http://example.com/ns"');
      expect(result).to.include('ns:attr="value"');
    });

    it('should not track xmlns attributes as prefix usage', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.stylesheet({excludeResultPrefixes: ['ns']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns', 'http://example.com/ns');
        joiner.element('item', {}, [], function () {
          // xmlns:ns itself shouldn't trigger tracking
          joiner.attribute('xmlns:other', 'http://example.com/other');
        });
      });
      const result = joiner.get();

      // Should NOT include ns namespace (only xmlns:other was used)
      expect(result).not.to.include('xmlns:ns=');
    });

    it('should handle attributes without colons', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.stylesheet({excludeResultPrefixes: ['ns']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns', 'http://example.com/ns');
        joiner.element('item', {}, [], function () {
          joiner.attribute('plain', 'value');
        });
      });
      const result = joiner.get();

      // Namespace should not be included (no prefixed usage)
      expect(result).not.to.include('xmlns:ns');
    });
  });

  describe('Default _flushPendingNamespace', function () {
    it('should handle base class _flushPendingNamespace call', function () {
      // Create a base instance without overriding _flushPendingNamespace
      const baseJoiner = new AbstractJoiningTransformer({});
      baseJoiner.stylesheet({excludeResultPrefixes: ['ns']});

      // Add something to the pending map
      baseJoiner._pendingNamespaceMap.set('ns', {
        prefix: 'ns',
        namespaceURI: 'http://example.com/ns'
      });

      // Call the base class method directly - it does nothing
      baseJoiner._flushPendingNamespace('ns');

      // Base implementation does nothing, so map should still have the entry
      expect(baseJoiner._pendingNamespaceMap.size).to.equal(1);
    });
  });
});
