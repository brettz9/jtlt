import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import DOMJoiningTransformer from '../src/DOMJoiningTransformer.js';

describe('DOMJoiningTransformer childNodes argument', () => {
  it('supports childNodes array with string children', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );

    joiner.element('div', {class: 'test'}, ['Hello', ' ', 'World']);
    const frag = /** @type {DocumentFragment} */ (joiner.get());
    const div = frag.querySelector('div');

    expect(div).to.exist;
    expect(div?.textContent).to.equal('Hello World');
    expect(div?.getAttribute('class')).to.equal('test');
  });

  it('supports childNodes array with DOM nodes', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );

    const span = document.createElement('span');
    span.textContent = 'inner';
    joiner.element('div', {}, [span]);
    const frag = /** @type {DocumentFragment} */ (joiner.get());
    const div = frag.querySelector('div');

    expect(div).to.exist;
    expect(div?.querySelector('span')).to.exist;
    expect(div?.textContent).to.equal('inner');
  });

  it('supports childNodes array with mixed content', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );

    const em = document.createElement('em');
    em.textContent = 'emphasized';
    joiner.element('p', {}, ['Text before ', em, ' text after']);
    const frag = /** @type {DocumentFragment} */ (joiner.get());
    const p = frag.querySelector('p');

    expect(p).to.exist;
    expect(p?.textContent).to.equal('Text before emphasized text after');
    expect(p?.querySelector('em')).to.exist;
  });

  it('combines childNodes array with callback', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );

    joiner.element('div', {}, ['Initial text'], () => {
      joiner.text(' added via callback');
    });
    const frag = /** @type {DocumentFragment} */ (joiner.get());
    const div = frag.querySelector('div');

    expect(div).to.exist;
    expect(div?.textContent).to.equal('Initial text added via callback');
  });

  it('applies character maps to childNodes strings', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document, exposeDocuments: true}
    );

    joiner.characterMap('test', [{character: '©', string: '(C)'}]);
    joiner.output({useCharacterMaps: ['test']});
    joiner.element('div', {}, ['Copyright ©']);

    const docsRaw = joiner.get();
    /** @type {XMLDocument[]} */
    const docs = /** @type {XMLDocument[]} */ (
      /** @type {unknown} */ (docsRaw)
    );
    expect(Array.isArray(docs)).to.be.true;
    expect(docs.length).to.equal(1);

    const div = docs[0].documentElement;
    expect(div).to.exist;
    expect(div.tagName.toLowerCase()).to.equal('div');
    expect(div.textContent).to.equal('Copyright (C)');
  });

  it('supports argument overloading - atts as array', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );

    // When atts position has array, treat as childNodes
    joiner.element('div', ['child1', 'child2']);
    const frag = /** @type {DocumentFragment} */ (joiner.get());
    const div = frag.querySelector('div');

    expect(div).to.exist;
    expect(div?.textContent).to.equal('child1child2');
  });

  it('supports argument overloading - atts as function', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );

    // When atts position has function, treat as callback
    joiner.element('div', () => {
      joiner.text('callback text');
    });
    const frag = /** @type {DocumentFragment} */ (joiner.get());
    const div = frag.querySelector('div');

    expect(div).to.exist;
    expect(div?.textContent).to.equal('callback text');
  });

  it('supports argument overloading - childNodes as function', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );

    // When childNodes position has function, treat as callback
    joiner.element('div', {id: 'test'}, () => {
      joiner.text('callback');
    });
    const frag = /** @type {DocumentFragment} */ (joiner.get());
    const div = frag.querySelector('div');

    expect(div).to.exist;
    expect(div?.textContent).to.equal('callback');
    expect(div?.getAttribute('id')).to.equal('test');
  });

  it('handles empty childNodes array', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );

    joiner.element('div', {}, []);
    const frag = /** @type {DocumentFragment} */ (joiner.get());
    const div = frag.querySelector('div');

    expect(div).to.exist;
    expect(div?.textContent).to.equal('');
  });

  it('supports Node childNodes in root element with output()', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document, exposeDocuments: true}
    );

    const span = document.createElement('span');
    span.textContent = 'inner content';

    joiner.output({method: 'xml'});
    joiner.element('root', {}, [span]);

    const docsRaw = joiner.get();
    /** @type {XMLDocument[]} */
    const docs = /** @type {XMLDocument[]} */ (
      /** @type {unknown} */ (docsRaw)
    );

    expect(Array.isArray(docs)).to.be.true;
    expect(docs.length).to.equal(1);

    const root = docs[0].documentElement;
    expect(root.tagName.toLowerCase()).to.equal('root');
    expect(root.querySelector('span')).to.exist;
    expect(root.textContent).to.equal('inner content');
  });
});
