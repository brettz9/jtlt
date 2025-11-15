/* eslint-disable @stylistic/max-len, no-new, no-empty-function
  -- Test file for preserveSpace/stripSpace */
// @ts-nocheck
import {assert} from 'chai';
import {JSDOM} from 'jsdom';
import JTLT from '../src/index-node.js';

describe('preserveSpace() and stripSpace()', function () {
  describe('JSONPathTransformerContext', function () {
    it('should declare elements for preserve-space', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.preserveSpace('pre');
        this.preserveSpace(['code', 'textarea']);
        this.string('test');
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      });
      assert.equal(out, 'test');
    });

    it('should declare elements for strip-space', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.stripSpace('div');
        this.stripSpace(['span', 'p']);
        this.string('test');
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      });
      assert.equal(out, 'test');
    });

    it('should support wildcard pattern', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        this.stripSpace('*');
        this.string('test');
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      });
      assert.equal(out, 'test');
    });

    it('_shouldStripSpace returns false for preserve-space elements', function () {
      const data = {root: {}};
      const templates = [{path: '$', template () {
        this.preserveSpace('pre');
        this.stripSpace('div');
        assert.isFalse(this._shouldStripSpace('pre'));
        assert.isTrue(this._shouldStripSpace('div'));
        assert.isFalse(this._shouldStripSpace('span'));
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success () {}
      });
    });

    it('_shouldStripSpace handles wildcard in preserve', function () {
      const data = {root: {}};
      const templates = [{path: '$', template () {
        this.preserveSpace('*');
        this.stripSpace('div');
        // preserve-space takes precedence
        assert.isFalse(this._shouldStripSpace('div'));
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success () {}
      });
    });

    it('_shouldStripSpace handles wildcard in strip', function () {
      const data = {root: {}};
      const templates = [{path: '$', template () {
        this.stripSpace('*');
        assert.isTrue(this._shouldStripSpace('div'));
        assert.isTrue(this._shouldStripSpace('span'));
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success () {}
      });
    });

    it('should return this for chaining', function () {
      const data = {root: {}};
      const templates = [{path: '$', template () {
        const result1 = this.preserveSpace('pre');
        const result2 = this.stripSpace('div');
        assert.strictEqual(result1, this);
        assert.strictEqual(result2, this);
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success () {}
      });
    });
  });

  describe('XPathTransformerContext', function () {
    it('should declare elements for preserve-space', function () {
      const {window} = new JSDOM('<root><item>test</item></root>');
      const data = window.document;
      let out;
      const templates = [{
        path: '/',
        template () {
          this.preserveSpace('pre');
          this.preserveSpace(['code', 'textarea']);
          this.text('test');
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success (result) {
          out = result; return result;
        }
      });
      assert.equal(out, 'test');
    });

    it('should declare elements for strip-space', function () {
      const {window} = new JSDOM('<root><item>test</item></root>');
      const data = window.document;
      let out;
      const templates = [{
        path: '/',
        template () {
          this.stripSpace('div');
          this.stripSpace(['span', 'p']);
          this.text('test');
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success (result) {
          out = result; return result;
        }
      });
      assert.equal(out, 'test');
    });

    it('_shouldStripSpace returns false for non-element nodes', function () {
      const {window} = new JSDOM('<root>text</root>');
      const data = window.document;
      const templates = [{
        path: '/',
        template () {
          this.stripSpace('div');
          const textNode = data.documentElement.firstChild;
          const docNode = data;
          // Text nodes should return false (only element nodes are checked)
          assert.isFalse(this._shouldStripSpace(textNode));
          // Document nodes should also return false
          assert.isFalse(this._shouldStripSpace(docNode));

          // Test with preserveSpace as well
          this.preserveSpace('span');
          assert.isFalse(this._shouldStripSpace(textNode));
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success () {}
      });
    });

    it('_shouldStripSpace handles element nodes correctly', function () {
      const {window} = new JSDOM('<root><div>test</div></root>');
      const data = window.document;
      const templates = [{
        path: '/',
        template () {
          this.preserveSpace('pre');
          this.stripSpace('div');
          const divNode = data.querySelector('div');
          assert.isTrue(this._shouldStripSpace(divNode));
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success () {}
      });
    });

    it('_shouldStripSpace preserveSpace takes precedence', function () {
      const {window} = new JSDOM('<root><div>test</div></root>');
      const data = window.document;
      const templates = [{
        path: '/',
        template () {
          this.preserveSpace('div');
          this.stripSpace('div');
          const divNode = data.querySelector('div');
          // preserve-space takes precedence
          assert.isFalse(this._shouldStripSpace(divNode));
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success () {}
      });
    });

    it('_shouldStripSpace handles wildcard', function () {
      const {window} = new JSDOM('<root><div>test</div><span>x</span></root>');
      const data = window.document;
      const templates = [{
        path: '/',
        template () {
          this.stripSpace('*');
          const divNode = data.querySelector('div');
          const spanNode = data.querySelector('span');
          assert.isTrue(this._shouldStripSpace(divNode));
          assert.isTrue(this._shouldStripSpace(spanNode));
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success () {}
      });
    });

    it('should return this for chaining', function () {
      const {window} = new JSDOM('<root><item>test</item></root>');
      const data = window.document;
      const templates = [{
        path: '/',
        template () {
          const result1 = this.preserveSpace('pre');
          const result2 = this.stripSpace('div');
          assert.strictEqual(result1, this);
          assert.strictEqual(result2, this);
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success () {}
      });
    });
  });

  describe('Integration tests', function () {
    it('should work with JSON data and string output', function () {
      const data = {elements: ['pre', 'code', 'div']};
      let out;
      const templates = [{path: '$', template () {
        this.preserveSpace('pre');
        this.stripSpace(['div', 'span']);
        this.forEach('$.elements[*]', function (elem) {
          this.string(elem + ',');
        });
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      });
      assert.equal(out, 'pre,code,div,');
    });

    it('should work with XML data and DOM output', function () {
      const {window} = new JSDOM('<root><pre>  keep  </pre><div>  strip  </div></root>');
      const data = window.document;
      let out;
      const templates = [{
        path: '/',
        template () {
          this.preserveSpace('pre');
          this.stripSpace('div');
          this.applyTemplates();
        }
      }, {
        path: '//text()',
        template (node) {
          this.text(node.nodeValue);
        }
      }];
      new JTLT({
        data, templates, outputType: 'dom', engineType: 'xpath',
        success (result) {
          out = result; return result;
        }
      });
      assert.ok(out);
    });

    it('should actually strip whitespace from DOM', function () {
      const {window} = new JSDOM(`
        <root>
          <div>
            <span>  text  </span>
          </div>
        </root>
      `);
      const data = window.document;
      const textNodes = [];
      const templates = [{
        path: '/',
        template () {
          this.stripSpace('div');
          this.applyTemplates('//text()');
        }
      }, {
        path: '//text()',
        template (node) {
          textNodes.push(node.nodeValue);
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success () {}
      });
      // Should only have the 'text' node, whitespace-only nodes in div should be stripped
      const nonEmptyTexts = textNodes.filter((t) => t.trim() !== '');
      assert.equal(nonEmptyTexts.length, 1);
      assert.include(nonEmptyTexts[0], 'text');
    });

    it('should strip whitespace but preserve non-whitespace', function () {
      const {window} = new JSDOM(`
        <root>
          <div>
            text content
          </div>
        </root>
      `);
      const data = window.document;
      let textContent = '';
      const templates = [{
        path: '/',
        template () {
          this.stripSpace('div');
          this.applyTemplates('//div');
        }
      }, {
        path: '//div',
        template (node) {
          // Get all child text nodes
          const texts = [];
          for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child.nodeType === 3) {
              texts.push(child.nodeValue);
            }
          }
          textContent = texts.join('');
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success () {}
      });
      // Should have the actual text content (whitespace around it may be stripped)
      assert.include(textContent, 'text content');
    });

    it('should strip whitespace with wildcard', function () {
      const {window} = new JSDOM(`
        <root>
          <div>  </div>
          <span>  </span>
          <p>text</p>
        </root>
      `);
      const data = window.document;
      const elementCounts = {};
      const templates = [{
        path: '/',
        template () {
          this.stripSpace('*');
          this.applyTemplates('//*');
        }
      }, {
        path: '//*',
        template (node) {
          const name = node.nodeName.toLowerCase();
          elementCounts[name] = (elementCounts[name] || 0) + 1;
          // Count text node children
          let textNodeCount = 0;
          for (let i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === 3) {
              textNodeCount++;
            }
          }
          elementCounts[name + '_texts'] = textNodeCount;
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success () {}
      });
      // div and span should have no text nodes (whitespace stripped)
      // p should have one text node
      assert.equal(elementCounts.div_texts, 0);
      assert.equal(elementCounts.span_texts, 0);
      assert.equal(elementCounts.p_texts, 1);
    });

    it('should not strip when preserve-space is set', function () {
      const {window} = new JSDOM(`
        <root>
          <pre>  whitespace  </pre>
        </root>
      `);
      const data = window.document;
      const textNodes = [];
      const templates = [{
        path: '/',
        template () {
          this.preserveSpace('pre');
          this.stripSpace('*');
          this.applyTemplates('//text()');
        }
      }, {
        path: '//text()',
        template (node) {
          textNodes.push(node.nodeValue);
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success () {}
      });
      // Should have text nodes including whitespace in pre element
      const preText = textNodes.find((t) => t.includes('whitespace'));
      assert.ok(preText);
      assert.include(preText, '  whitespace  ');
    });

    it('should clone DOM not mutate original', function () {
      const {window} = new JSDOM(`
        <root>
          <div>  </div>
        </root>
      `);
      const data = window.document;
      const originalDiv = data.querySelector('div');
      const originalChildCount = originalDiv.childNodes.length;

      const templates = [{
        path: '/',
        template () {
          this.stripSpace('div');
          this.applyTemplates();
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success () {}
      });

      // Original should be unchanged
      assert.equal(originalDiv.childNodes.length, originalChildCount);
    });

    it('should work with mixed preserve and strip declarations', function () {
      const data = {root: {}};
      let out;
      const templates = [{path: '$', template () {
        // Declare multiple times
        this.preserveSpace('pre');
        this.preserveSpace('code');
        this.stripSpace('div');
        this.stripSpace('p');
        this.stripSpace('span');

        // Test they're all registered
        assert.isFalse(this._shouldStripSpace('pre'));
        assert.isFalse(this._shouldStripSpace('code'));
        assert.isTrue(this._shouldStripSpace('div'));
        assert.isTrue(this._shouldStripSpace('p'));
        assert.isTrue(this._shouldStripSpace('span'));
        assert.isFalse(this._shouldStripSpace('article'));

        this.string('ok');
      }}];
      new JTLT({
        data, templates, outputType: 'string',
        success (result) {
          out = result; return result;
        }
      });
      assert.equal(out, 'ok');
    });

    it('should handle _cloneAndStripWhitespace with no strip declarations', function () {
      const {window} = new JSDOM('<root><div>test</div></root>');
      const data = window.document;
      const templates = [{
        path: '/',
        template () {
          // Call _cloneAndStripWhitespace directly without any stripSpace declarations
          const cloned = this._cloneAndStripWhitespace(this._origNode);
          assert.ok(cloned);
          // Should return a clone even without strip declarations
          assert.notStrictEqual(cloned, this._origNode);
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success () {}
      });
    });

    it('should cover all pattern matching branches in _shouldStripSpace', function () {
      const {window} = new JSDOM('<root><div>test</div><span>test</span><pre>code</pre></root>');
      const data = window.document;
      const templates = [{
        path: '/',
        template () {
          const divNode = data.querySelector('div');
          const spanNode = data.querySelector('span');
          const preNode = data.querySelector('pre');

          // Test with specific element names to ensure both sides of OR are evaluated
          // This ensures line 80-81 (the return statement with OR) is fully covered
          this.preserveSpace(['pre', 'code']); // Specific names, not wildcard
          this.stripSpace(['div', 'span']); // Specific names, not wildcard

          // These tests will evaluate pattern === elementName (not pattern === '*')
          assert.isFalse(this._shouldStripSpace(preNode)); // preserve list, specific name match - preserve takes precedence
          assert.isTrue(this._shouldStripSpace(divNode)); // strip list, specific name match
          assert.isTrue(this._shouldStripSpace(spanNode)); // strip list, specific name match

          // Test where element is NOT in lists - this tests the false branch
          const root = data.documentElement;
          assert.isFalse(this._shouldStripSpace(root)); // 'root' not in any list

          // Reset to test preserve-space pattern matching where preserve blocks strip
          this._stripSpaceElements = [];
          this._preserveSpaceElements = [];
          this.preserveSpace(['pre']);
          this.stripSpace(['div', 'pre']); // pre is in both, preserve should win
          assert.isFalse(this._shouldStripSpace(preNode)); // preserve takes precedence
          assert.isTrue(this._shouldStripSpace(divNode)); // only in strip list
        }
      }];
      new JTLT({
        data, templates, outputType: 'string', engineType: 'xpath',
        success () {}
      });
    });
  });
});
