import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JSONPathTransformerContext from '../src/JSONPathTransformerContext.js';
import XPathTransformerContext from '../src/XPathTransformerContext.js';
import JSONJoiningTransformer from '../src/JSONJoiningTransformer.js';
import DOMJoiningTransformer from '../src/DOMJoiningTransformer.js';
import StringJoiningTransformer from '../src/StringJoiningTransformer.js';

describe('namespace() method', () => {
  describe('JSONJoiningTransformer', () => {
    it('adds namespace declaration to element attributes', () => {
      const joiner = new JSONJoiningTransformer([]);
      joiner.element('root', {}, function () {
        joiner.namespace('ns', 'http://example.com/ns');
      });
      const result = joiner.get();
      // JSONJoiningTransformer uses JHTML format:
      // [tagName, attributes, children]
      expect(result).to.deep.equal([[
        'root',
        {
          xmlns: {
            ns: 'http://example.com/ns'
          }
        },
        []
      ]]);
    });

    it('adds multiple namespace declarations to same element', () => {
      const joiner = new JSONJoiningTransformer([]);
      joiner.element('root', {}, function () {
        joiner.namespace('ns1', 'http://example.com/ns1');
        joiner.namespace('ns2', 'http://example.com/ns2');
      });
      const result = joiner.get();
      expect(result).to.deep.equal([[
        'root',
        {
          xmlns: {
            ns1: 'http://example.com/ns1',
            ns2: 'http://example.com/ns2'
          }
        },
        []
      ]]);
    });

    it('adds namespace to nested element', () => {
      const joiner = new JSONJoiningTransformer([]);
      joiner.element('root', {}, function () {
        joiner.element('child', {}, function () {
          joiner.namespace('ns', 'http://example.com/child-ns');
        });
      });
      const result = joiner.get();
      expect(result).to.deep.equal([[
        'root',
        [[
          'child',
          {
            xmlns: {
              ns: 'http://example.com/child-ns'
            }
          },
          []
        ]]
      ]]);
    });

    it('is no-op when called outside element context', () => {
      const joiner = new JSONJoiningTransformer([]);
      joiner.namespace('ns', 'http://example.com/ns');
      const result = joiner.get();
      expect(result).to.deep.equal([]);
    });

    it('applies character maps to namespace URI', () => {
      const joiner = new JSONJoiningTransformer([]);
      joiner.characterMap('amp-map', [
        {character: '&', string: '&amp;'}
      ]);
      joiner.output({useCharacterMaps: ['amp-map']});
      joiner.element('root', {}, function () {
        joiner.namespace('ns', 'http://example.com/ns?a=1&b=2');
      });
      const result = joiner.get();
      // Result is [['root', {xmlns: {ns: '...'}}, []]]
      expect(result[0][1].xmlns.ns).to.equal(
        'http://example.com/ns?a=1&amp;b=2'
      );
    });

    it('returns this for chaining', () => {
      const joiner = new JSONJoiningTransformer([]);
      joiner.element('root', {}, function () {
        const result = joiner.namespace('ns', 'http://example.com/ns');
        expect(result).to.equal(joiner);
      });
    });
  });

  describe('DOMJoiningTransformer', () => {
    it('adds namespace declaration using setAttributeNS', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.element('root', {}, function () {
        joiner.namespace('ns', 'http://example.com/ns');
      });
      const frag = joiner.get();
      const rootEl = /** @type {Element} */ (
        /** @type {DocumentFragment} */ (frag).firstChild
      );
      expect(rootEl.getAttribute('xmlns:ns')).to.equal('http://example.com/ns');
    });

    it('adds multiple namespace declarations', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.element('root', {}, function () {
        joiner.namespace('ns1', 'http://example.com/ns1');
        joiner.namespace('ns2', 'http://example.com/ns2');
      });
      const frag = joiner.get();
      const rootEl = /** @type {Element} */ (
        /** @type {DocumentFragment} */ (frag).firstChild
      );
      expect(rootEl.getAttribute('xmlns:ns1')).to.equal('http://example.com/ns1');
      expect(rootEl.getAttribute('xmlns:ns2')).to.equal('http://example.com/ns2');
    });

    it('returns this for chaining', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      joiner.element('root', {}, function () {
        const result = joiner.namespace('ns', 'http://example.com/ns');
        expect(result).to.equal(joiner);
      });
    });
  });

  describe('StringJoiningTransformer', () => {
    it('appends namespace declaration as attribute', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns', 'http://example.com/ns');
      });
      const result = joiner.get();
      expect(result).to.equal('<root xmlns:ns="http://example.com/ns"></root>');
    });

    it('adds multiple namespace declarations', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns1', 'http://example.com/ns1');
        joiner.namespace('ns2', 'http://example.com/ns2');
      });
      const result = joiner.get();
      expect(result).to.include('xmlns:ns1="http://example.com/ns1"');
      expect(result).to.include('xmlns:ns2="http://example.com/ns2"');
    });

    it('applies character maps to namespace URI', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.characterMap('amp-map', [
        {character: '&', string: '&amp;'}
      ]);
      joiner.output({useCharacterMaps: ['amp-map']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns', 'http://example.com/ns?a=1&b=2');
      });
      const result = joiner.get();
      expect(result).to.include('xmlns:ns="http://example.com/ns?a=1&amp;b=2"');
    });

    it('returns this for chaining', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.element('root', {}, [], function () {
        const result = joiner.namespace('ns', 'http://example.com/ns');
        expect(result).to.equal(joiner);
      });
    });
  });

  describe('JSONPathTransformerContext', () => {
    it('delegates to joining transformer', () => {
      const joiner = new JSONJoiningTransformer([]);
      const ctx = new JSONPathTransformerContext({
        data: {},
        joiningTransformer: joiner,
        templates: []
      }, []);

      ctx.element('root', {}, [], function () {
        ctx.namespace('ns', 'http://example.com/ns');
      });

      const result = ctx.getOutput();
      // JHTML format: [tagName, attributes, children]
      expect(result).to.deep.equal([[
        'root',
        {
          xmlns: {
            ns: 'http://example.com/ns'
          }
        },
        []
      ]]);
    });

    it('returns this for chaining', () => {
      const joiner = new JSONJoiningTransformer([]);
      const ctx = new JSONPathTransformerContext({
        data: {},
        joiningTransformer: joiner,
        templates: []
      }, []);

      ctx.element('root', {}, [], function () {
        const result = ctx.namespace('ns', 'http://example.com/ns');
        expect(result).to.equal(ctx);
      });
    });

    it('works with StringJoiningTransformer', () => {
      const joiner = new StringJoiningTransformer('');
      const ctx = new JSONPathTransformerContext({
        data: {},
        joiningTransformer: /** @type {any} */ (joiner),
        templates: []
      }, []);

      ctx.element('root', {}, [], function () {
        ctx.namespace('ns', 'http://example.com/ns');
      });

      const result = ctx.getOutput();
      expect(result).to.equal('<root xmlns:ns="http://example.com/ns"></root>');
    });
  });

  describe('XPathTransformerContext', () => {
    it('delegates to joining transformer (DOM)', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      const ctx = new XPathTransformerContext({
        data: document,
        joiningTransformer: joiner
      }, []);

      ctx.element('root', {}, [], function () {
        ctx.namespace('ns', 'http://example.com/ns');
      });

      const result = ctx.getOutput();
      const frag = /** @type {DocumentFragment} */ (result);
      const rootEl = /** @type {Element} */ (frag.firstChild);
      expect(rootEl.getAttribute('xmlns:ns')).to.equal('http://example.com/ns');
    });

    it('returns this for chaining', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      const ctx = new XPathTransformerContext({
        data: document,
        joiningTransformer: joiner
      }, []);

      ctx.element('root', {}, [], function () {
        const result = ctx.namespace('ns', 'http://example.com/ns');
        expect(result).to.equal(ctx);
      });
    });

    it('works with StringJoiningTransformer', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = new StringJoiningTransformer('');
      const ctx = new XPathTransformerContext({
        data: document,
        joiningTransformer: /** @type {any} */ (joiner)
      }, []);

      ctx.element('root', {}, [], function () {
        ctx.namespace('ns', 'http://example.com/ns');
      });

      const result = ctx.getOutput();
      expect(result).to.equal('<root xmlns:ns="http://example.com/ns"></root>');
    });
  });
});
