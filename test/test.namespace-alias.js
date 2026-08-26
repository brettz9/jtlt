import {expect} from 'chai';
import {JSDOM} from 'jsdom';

import JSONJoiningTransformer from '../src/JSONJoiningTransformer.js';
import DOMJoiningTransformer from '../src/DOMJoiningTransformer.js';
import StringJoiningTransformer from '../src/StringJoiningTransformer.js';

const {window} = new JSDOM('');
const {document} = window;

describe('namespaceAlias() method', function () {
  describe('StringJoiningTransformer', function () {
    it('should use namespaceAlias with default prefix', function () {
      const joiner = new StringJoiningTransformer('');
      // Empty string prefix is automatically converted to '#default' internally
      joiner.namespaceAlias('', 'ns1');
      joiner.element('root', {}, [], function () {
        joiner.namespace('', 'https://example.com/ns1');
        joiner.text('Test');
      });
      const result = joiner.get();
      expect(result).to.include('xmlns:ns1="https://example.com/ns1"');
    });

    it('should use namespaceAlias with prefixed namespace', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.namespaceAlias('old', 'new');
      joiner.element('root', {}, [], function () {
        joiner.namespace('old', 'https://example.com/ns');
        joiner.text('Test');
      });
      const result = joiner.get();
      expect(result).to.include('xmlns:new="https://example.com/ns"');
    });

    it('should handle multiple namespace aliases', function () {
      const joiner = new StringJoiningTransformer('');
      joiner.namespaceAlias('a', 'x');
      joiner.namespaceAlias('b', 'y');
      joiner.element('root', {}, [], function () {
        joiner.namespace('a', 'https://example.com/a');
        joiner.namespace('b', 'https://example.com/b');
      });
      const result = joiner.get();
      expect(result).to.include('xmlns:x="https://example.com/a"');
      expect(result).to.include('xmlns:y="https://example.com/b"');
    });
  });

  describe('DOMJoiningTransformer', function () {
    it('should use namespaceAlias with default prefix', function () {
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.namespaceAlias('', 'ns1');
      joiner.element('root', {}, function () {
        joiner.namespace('', 'https://example.com/ns1');
        joiner.text('Test');
      });
      const result = joiner.get();
      if (Array.isArray(result)) {
        throw new TypeError('Unexpected array result');
      }
      const el = /** @type {Element} */ (result.firstChild);
      expect(el.hasAttribute('xmlns:ns1')).to.be.true;
      expect(el.getAttribute('xmlns:ns1')).
        to.equal('https://example.com/ns1');
    });

    it('should use namespaceAlias with prefixed namespace', function () {
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.namespaceAlias('old', 'new');
      joiner.element('root', {}, function () {
        joiner.namespace('old', 'https://example.com/ns');
        joiner.text('Test');
      });
      const result = joiner.get();
      if (Array.isArray(result)) {
        throw new TypeError('Unexpected array result');
      }
      const el = /** @type {Element} */ (result.firstChild);
      expect(el.hasAttribute('xmlns:new')).to.be.true;
      expect(el.getAttribute('xmlns:new')).
        to.equal('https://example.com/ns');
    });

    it('should handle multiple namespace aliases', function () {
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.namespaceAlias('a', 'x');
      joiner.namespaceAlias('b', 'y');
      joiner.element('root', {}, function () {
        joiner.namespace('a', 'https://example.com/a');
        joiner.namespace('b', 'https://example.com/b');
      });
      const result = joiner.get();
      if (Array.isArray(result)) {
        throw new TypeError('Unexpected array result');
      }
      const el = /** @type {Element} */ (result.firstChild);
      expect(el.hasAttribute('xmlns:x')).to.be.true;
      expect(el.getAttribute('xmlns:x')).
        to.equal('https://example.com/a');
      expect(el.hasAttribute('xmlns:y')).to.be.true;
      expect(el.getAttribute('xmlns:y')).
        to.equal('https://example.com/b');
    });
  });

  describe('JSONJoiningTransformer', function () {
    it('should use namespaceAlias with default prefix', function () {
      const joiner = new JSONJoiningTransformer([]);
      joiner.namespaceAlias('', 'myns');
      joiner.element('root', {}, function () {
        joiner.namespace('', 'https://example.com');
      });
      const result = joiner.get();
      expect(result[0][1].xmlns).to.have.property('myns');
      expect(result[0][1].xmlns.myns).to.equal('https://example.com');
    });

    it('should use namespaceAlias with prefixed namespace', function () {
      const joiner = new JSONJoiningTransformer([]);
      joiner.namespaceAlias('foo', 'bar');
      joiner.element('root', {}, function () {
        joiner.namespace('foo', 'https://example.com/foo');
      });
      const result = joiner.get();
      expect(result[0][1].xmlns).to.have.property('bar');
      expect(result[0][1].xmlns.bar).to.equal('https://example.com/foo');
    });

    it('should handle multiple namespace aliases', function () {
      const joiner = new JSONJoiningTransformer([]);
      joiner.namespaceAlias('a', 'x');
      joiner.namespaceAlias('b', 'y');
      joiner.element('root', {}, function () {
        joiner.namespace('a', 'https://example.com/a');
        joiner.namespace('b', 'https://example.com/b');
      });
      const result = joiner.get();
      expect(result[0][1].xmlns).to.have.property('x');
      expect(result[0][1].xmlns.x).to.equal('https://example.com/a');
      expect(result[0][1].xmlns).to.have.property('y');
      expect(result[0][1].xmlns.y).to.equal('https://example.com/b');
    });
  });
});
