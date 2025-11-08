import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import XPathTransformerContext from '../src/XPathTransformerContext.js';
import StringJoiningTransformer from '../src/StringJoiningTransformer.js';

/**
 * Create an XML Document from a string.
 * @param {string} xml XML markup
 * @returns {Document}
 */
function makeDoc (xml) {
  const {window} = new JSDOM('<!doctype html><html><body></body></html>');
  const doc = new window.DOMParser().parseFromString(xml, 'text/xml');
  return doc;
}

describe('XPathTransformerContext branch coverage', () => {
  it('v2 asNodes true branch returns array for node set', () => {
    const doc = makeDoc('<root><child>a</child><child>b</child></root>');
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: doc,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, []);
    const arr = ctx.get('//child', true);
    expect(Array.isArray(arr)).to.be.true;
    expect(arr).to.have.lengthOf(2);
  });

  it('applyTemplates first call falls back to dot when select missing', () => {
    const doc = makeDoc('<root><n>t</n></root>');
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '//*',
        /** @this {any} */
        template () {
          this.string('x');
        }
      }
    ];
    const ctx = new XPathTransformerContext({
      data: doc,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, templates);
    // First call without select triggers select = select || '.' path
    // @ts-ignore Deliberately call without args to exercise fallback
    ctx.applyTemplates();
    const out = ctx.getOutput();
    expect(out).to.include('x');
  });

  it('filters templates by mode when provided', () => {
    const doc = makeDoc('<root><n>t</n></root>');
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '//*',
        mode: 'm1',
        /** @this {any} */
        template () {
          this.string('m1');
        }
      },
      {
        path: '//*',
        /** @this {any} */
        template () {
          this.string('base');
        }
      }
    ];
    const ctx = new XPathTransformerContext({
      data: doc,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, templates);
    ctx.applyTemplates('//*', 'm1');
    const out = ctx.getOutput();
    expect(out).to.include('m1');
    expect(out).to.not.include('base');
  });

  it('sorts without resolver (falls back to 0 for both aPr/bPr)', () => {
    const doc = makeDoc('<root><child>a</child></root>');
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '//*',
        /** @this {any} */
        template () {
          this.appendOutput('A');
        }
      },
      {
        path: '//child',
        /** @this {any} */
        template () {
          this.appendOutput('B');
        }
      }
    ];
    const ctx = new XPathTransformerContext({
      data: doc,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, templates);
    ctx.applyTemplates('//child');
    const out = ctx.getOutput();
    expect(out).to.be.a('string');
  });

  it('valueOf covers element textContent and scalar first branches', () => {
    const doc = makeDoc('<root><child>3</child></root>');
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: doc.documentElement,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, []);
    // element context -> textContent
    ctx.valueOf('.');
    // scalar selection via valueOf -> first is non-node (number)
    const joiner2 = new StringJoiningTransformer('');
    const ctx2 = new XPathTransformerContext({
      data: doc.documentElement,
      joiningTransformer: joiner2,
      xpathVersion: 2
    }, []);
    ctx2.valueOf('1+2');
    const out2 = ctx2.getOutput();
    expect(out2).to.include('3');
  });

  it('valueOf covers text node branch', () => {
    const doc = makeDoc('<root><child>hi</child></root>');
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: doc.documentElement,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, []);
    const text = doc.createTextNode('hello');
    ctx.set(text);
    ctx.valueOf();
    const out = ctx.getOutput();
    expect(out).to.include('hello');
  });
});
