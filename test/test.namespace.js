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
      const joiner = JSONJoiningTransformer.create([]);
      joiner.element('root', {}, function () {
        joiner.namespace('ns', 'https://example.com/ns');
      });
      const result = joiner.get();
      // JSONJoiningTransformer uses JHTML format:
      // [tagName, attributes, children]
      expect(result).to.deep.equal([[
        'root',
        {
          xmlns: {
            ns: 'https://example.com/ns'
          }
        },
        []
      ]]);
    });

    it('adds multiple namespace declarations to same element', () => {
      const joiner = JSONJoiningTransformer.create([]);
      joiner.element('root', {}, function () {
        joiner.namespace('ns1', 'https://example.com/ns1');
        joiner.namespace('ns2', 'https://example.com/ns2');
      });
      const result = joiner.get();
      expect(result).to.deep.equal([[
        'root',
        {
          xmlns: {
            ns1: 'https://example.com/ns1',
            ns2: 'https://example.com/ns2'
          }
        },
        []
      ]]);
    });

    it('adds namespace to nested element', () => {
      const joiner = JSONJoiningTransformer.create([]);
      joiner.element('root', {}, function () {
        joiner.element('child', {}, function () {
          joiner.namespace('ns', 'https://example.com/child-ns');
        });
      });
      const result = joiner.get();
      expect(result).to.deep.equal([[
        'root',
        [[
          'child',
          {
            xmlns: {
              ns: 'https://example.com/child-ns'
            }
          },
          []
        ]]
      ]]);
    });

    it('is no-op when called outside element context', () => {
      const joiner = JSONJoiningTransformer.create([]);
      joiner.namespace('ns', 'https://example.com/ns');
      const result = joiner.get();
      expect(result).to.deep.equal([]);
    });

    it('applies character maps to namespace URI', () => {
      const joiner = JSONJoiningTransformer.create([]);
      joiner.characterMap('amp-map', [
        {character: '&', string: '&amp;'}
      ]);
      joiner.output({useCharacterMaps: ['amp-map']});
      joiner.element('root', {}, function () {
        joiner.namespace('ns', 'https://example.com/ns?a=1&b=2');
      });
      const result = joiner.get();
      // Result is [['root', {xmlns: {ns: '...'}}, []]]
      expect(result[0][1].xmlns.ns).to.equal(
        'https://example.com/ns?a=1&amp;b=2'
      );
    });

    it('returns this for chaining', () => {
      const joiner = JSONJoiningTransformer.create([]);
      joiner.element('root', {}, function () {
        const result = joiner.namespace('ns', 'https://example.com/ns');
        expect(result).to.equal(joiner);
      });
    });
  });

  describe('DOMJoiningTransformer', () => {
    it('adds namespace declaration using setAttributeNS', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = DOMJoiningTransformer.create(
        document.createDocumentFragment(),
        {document}
      );
      joiner.element('root', {}, function () {
        joiner.namespace('ns', 'https://example.com/ns');
      });
      const frag = joiner.get();
      const rootEl = /** @type {Element} */ (frag.firstChild);
      expect(rootEl.getAttribute('xmlns:ns')).to.equal('https://example.com/ns');
    });

    it('adds multiple namespace declarations', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = DOMJoiningTransformer.create(
        document.createDocumentFragment(),
        {document}
      );
      joiner.element('root', {}, function () {
        joiner.namespace('ns1', 'https://example.com/ns1');
        joiner.namespace('ns2', 'https://example.com/ns2');
      });
      const frag = joiner.get();
      const rootEl = /** @type {Element} */ (frag.firstChild);
      expect(rootEl.getAttribute('xmlns:ns1')).to.equal('https://example.com/ns1');
      expect(rootEl.getAttribute('xmlns:ns2')).to.equal('https://example.com/ns2');
    });

    it('returns this for chaining', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = DOMJoiningTransformer.create(
        document.createDocumentFragment(),
        {document}
      );
      joiner.element('root', {}, function () {
        const result = joiner.namespace('ns', 'https://example.com/ns');
        expect(result).to.equal(joiner);
      });
    });
  });

  describe('StringJoiningTransformer', () => {
    it('appends namespace declaration as attribute', () => {
      const joiner = StringJoiningTransformer.create('');
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns', 'https://example.com/ns');
      });
      const result = joiner.get();
      expect(result).to.equal('<root xmlns:ns="https://example.com/ns"></root>');
    });

    it('adds multiple namespace declarations', () => {
      const joiner = StringJoiningTransformer.create('');
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns1', 'https://example.com/ns1');
        joiner.namespace('ns2', 'https://example.com/ns2');
      });
      const result = joiner.get();
      expect(result).to.include('xmlns:ns1="https://example.com/ns1"');
      expect(result).to.include('xmlns:ns2="https://example.com/ns2"');
    });

    it('applies character maps to namespace URI', () => {
      const joiner = StringJoiningTransformer.create('');
      joiner.characterMap('amp-map', [
        {character: '&', string: '&amp;'}
      ]);
      joiner.output({useCharacterMaps: ['amp-map']});
      joiner.element('root', {}, [], function () {
        joiner.namespace('ns', 'https://example.com/ns?a=1&b=2');
      });
      const result = joiner.get();
      expect(result).to.include('xmlns:ns="https://example.com/ns?a=1&amp;b=2"');
    });

    it('returns this for chaining', () => {
      const joiner = StringJoiningTransformer.create('');
      joiner.element('root', {}, [], function () {
        const result = joiner.namespace('ns', 'https://example.com/ns');
        expect(result).to.equal(joiner);
      });
    });
  });

  describe('JSONPathTransformerContext', () => {
    it('delegates to joining transformer', () => {
      const joiner = JSONJoiningTransformer.create([]);
      const ctx = new JSONPathTransformerContext({
        data: {},
        joiningTransformer: joiner,
        templates: []
      }, []);

      ctx.element('root', {}, [], function () {
        ctx.namespace('ns', 'https://example.com/ns');
      });

      const result = ctx.getOutput();
      // JHTML format: [tagName, attributes, children]
      expect(result).to.deep.equal([[
        'root',
        {
          xmlns: {
            ns: 'https://example.com/ns'
          }
        },
        []
      ]]);
    });

    it('returns this for chaining', () => {
      const joiner = JSONJoiningTransformer.create([]);
      const ctx = new JSONPathTransformerContext({
        data: {},
        joiningTransformer: joiner,
        templates: []
      }, []);

      ctx.element('root', {}, [], function () {
        const result = ctx.namespace('ns', 'https://example.com/ns');
        expect(result).to.equal(ctx);
      });
    });

    it('works with StringJoiningTransformer', () => {
      const joiner = StringJoiningTransformer.create('');
      const ctx = new JSONPathTransformerContext({
        data: {},
        outputType: 'string',
        joiningTransformer: joiner,
        templates: []
      }, []);

      ctx.element('root', {}, [], function () {
        ctx.namespace('ns', 'https://example.com/ns');
      });

      const result = ctx.getOutput();
      expect(result).to.equal('<root xmlns:ns="https://example.com/ns"></root>');
    });
  });

  describe('XPathTransformerContext', () => {
    it('delegates to joining transformer (DOM)', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = DOMJoiningTransformer.create(
        document.createDocumentFragment(),
        {document}
      );
      const ctx = new XPathTransformerContext({
        data: document,
        joiningTransformer: joiner
      }, []);

      ctx.element('root', {}, [], function () {
        ctx.namespace('ns', 'https://example.com/ns');
      });

      const result = ctx.getOutput();
      const frag = /** @type {DocumentFragment} */ (result);
      const rootEl = /** @type {Element} */ (frag.firstChild);
      expect(rootEl.getAttribute('xmlns:ns')).to.equal('https://example.com/ns');
    });

    it('returns this for chaining', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = DOMJoiningTransformer.create(
        document.createDocumentFragment(),
        {document}
      );
      const ctx = new XPathTransformerContext({
        data: document,
        joiningTransformer: joiner
      }, []);

      ctx.element('root', {}, [], function () {
        const result = ctx.namespace('ns', 'https://example.com/ns');
        expect(result).to.equal(ctx);
      });
    });

    it('works with StringJoiningTransformer', () => {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const {document} = window;
      const joiner = StringJoiningTransformer.create('');
      const ctx = new XPathTransformerContext({
        data: document,
        joiningTransformer: joiner
      }, []);

      ctx.element('root', {}, [], function () {
        ctx.namespace('ns', 'https://example.com/ns');
      });

      const result = ctx.getOutput();
      expect(result).to.equal('<root xmlns:ns="https://example.com/ns"></root>');
    });
  });
});
