import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JSONPathTransformerContext from '../src/JSONPathTransformerContext.js';
import XPathTransformerContext from '../src/XPathTransformerContext.js';
import StringJoiningTransformer from '../src/StringJoiningTransformer.js';
import DOMJoiningTransformer from '../src/DOMJoiningTransformer.js';

const {window} = new JSDOM('');
const {document} = window;

describe('namespaceAlias() via context', function () {
  describe('JSONPathTransformerContext', function () {
    it('should call namespaceAlias on joiner', function () {
      const joiner = new StringJoiningTransformer('');
      /** @type {JSONPathTransformerContext<"string">} */
      const ctx = new JSONPathTransformerContext({
        data: {test: 'value'},
        joiningTransformer: joiner
      }, []);

      ctx.namespaceAlias('old', 'new');
      ctx.element('root', function () {
        ctx.namespace('old', 'http://example.com/ns');
      });

      const result = ctx.getOutput();
      expect(result).to.include('xmlns:new="http://example.com/ns"');
    });

    it('should return this for chaining', function () {
      const joiner = new StringJoiningTransformer('');
      /** @type {JSONPathTransformerContext<"string">} */
      const ctx = new JSONPathTransformerContext({
        data: {test: 'value'},
        joiningTransformer: joiner
      }, []);

      const ret = ctx.namespaceAlias('a', 'b');
      expect(ret).to.equal(ctx);
    });
  });

  describe('XPathTransformerContext', function () {
    it('should call namespaceAlias on joiner', function () {
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      const ctx = new XPathTransformerContext({
        data: document,
        joiningTransformer: joiner
      }, []);

      ctx.namespaceAlias('old', 'new');
      ctx.element('root', {}, function () {
        ctx.namespace('old', 'http://example.com/ns');
      });

      const result = /** @type {DocumentFragment} */ (ctx.getOutput());
      const el = /** @type {Element} */ (result.firstChild);
      expect(el.getAttribute('xmlns:new')).to.equal('http://example.com/ns');
    });

    it('should return this for chaining', function () {
      const joiner = new DOMJoiningTransformer(
        document.createDocumentFragment(),
        {document}
      );
      const ctx = new XPathTransformerContext({
        data: document,
        joiningTransformer: joiner
      }, []);

      const ret = ctx.namespaceAlias('a', 'b');
      expect(ret).to.equal(ctx);
    });
  });
});
