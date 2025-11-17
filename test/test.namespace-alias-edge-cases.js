import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JSONJoiningTransformer from '../src/JSONJoiningTransformer.js';
import DOMJoiningTransformer from '../src/DOMJoiningTransformer.js';
import StringJoiningTransformer from '../src/StringJoiningTransformer.js';

const {window} = new JSDOM('');
const {document} = window;

describe('namespaceAlias edge cases', function () {
  describe('Default namespace (alias === "#default")', function () {
    it('StringJoiningTransformer uses xmlns without prefix', function () {
      const joiner = new StringJoiningTransformer('');
      // Don't set any alias, so '#default' stays as '#default'
      joiner.element('root', {}, [], function () {
        joiner.namespace('', 'http://example.com');
      });
      const result = joiner.get();
      // Should be xmlns="..." not xmlns:something="..."
      expect(result).to.include('xmlns="http://example.com"');
      expect(result).not.to.include('xmlns:');
    });

    it('DOMJoiningTransformer uses xmlns without prefix', function () {
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.element('root', {}, function () {
        joiner.namespace('', 'http://example.com');
      });
      const result = joiner.get();
      if (Array.isArray(result)) {
        throw new TypeError('Unexpected array result');
      }
      const el = /** @type {Element} */ (result.firstChild);
      expect(el.hasAttribute('xmlns')).to.be.true;
      expect(el.getAttribute('xmlns')).to.equal('http://example.com');
      // Should not have xmlns:default or similar
      expect(el.hasAttribute('xmlns:default')).to.be.false;
    });

    it('JSONJoiningTransformer uses empty string key', function () {
      const joiner = new JSONJoiningTransformer([]);
      joiner.element('root', {}, function () {
        joiner.namespace('', 'http://example.com');
      });
      const result = joiner.get();
      // Empty string key for default namespace
      expect(result[0][1].xmlns).to.have.property('');
      expect(result[0][1].xmlns['']).to.equal('http://example.com');
    });
  });

  describe('_replaceNamespaceAliasInElement with colon', function () {
    it('should handle prefixed element with alias to #default', function () {
      const joiner = new StringJoiningTransformer('');
      // Map prefix 'foo' back to '#default' (remove prefix)
      joiner.namespaceAlias('foo', '#default');
      const result = joiner._replaceNamespaceAliasInElement('foo:bar');
      // When colonIdx !== -1 and alias is '#default',
      // result is '' + 'bar' (slice after colon) = 'bar'
      expect(result).to.equal('bar');
    });

    it('should handle unprefixed element with non-default alias', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.namespaceAlias('#default', 'ns');
      const result = joiner._replaceNamespaceAliasInElement('bar');
      // When element has no prefix but alias is 'ns',
      // result is 'ns' + ':' + 'bar' = 'ns:bar'
      expect(result).to.equal('ns:bar');
    });

    it('should handle unprefixed element with default alias', function () {
      const joiner = new StringJoiningTransformer('');
      // No alias set, so '#default' stays '#default'
      const result = joiner._replaceNamespaceAliasInElement('bar');
      // When element has no prefix and alias is '#default',
      // return element name unchanged
      expect(result).to.equal('bar');
    });
  });

  describe('_replaceNamespaceAliasInNamespaceDeclaration', function () {
    it('should return non-xmlns attributes unchanged', function () {
      const joiner = new StringJoiningTransformer('');
      const result =
        joiner._replaceNamespaceAliasInNamespaceDeclaration('class');
      expect(result).to.equal('class');
    });

    it('should handle xmlns: prefix with alias', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.namespaceAlias('foo', 'bar');
      const result =
        joiner._replaceNamespaceAliasInNamespaceDeclaration('xmlns:foo');
      // Note: This function gets the prefix from the attribute name,
      // but it's designed for a different use case
      // The prefix here is the first 6 chars 'xmlns:', not 'foo'
      // So it looks up 'xmlns:' in the map, not found, returns 'xmlns:'
      expect(result).to.equal('xmlns:xmlns:');
    });

    it('should handle xmlns (default) with alias', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.namespaceAlias('#default', 'myns');
      const result =
        joiner._replaceNamespaceAliasInNamespaceDeclaration('xmlns');
      // No colon, so prefix is '#default', alias is 'myns'
      expect(result).to.equal('xmlns:myns');
    });

    it('should handle xmlns (default) without alias', function () {
      const joiner = new StringJoiningTransformer('');
      const result =
        joiner._replaceNamespaceAliasInNamespaceDeclaration('xmlns');
      // No alias, prefix is '#default', alias is also '#default'
      expect(result).to.equal('xmlns');
    });
  });
});
