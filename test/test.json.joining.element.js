import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {JSONJoiningTransformer} from '../src/index-node.js';

describe('JSONJoiningTransformer element/attribute/text (Jamilih JSON)', () => {
  it('builds element with dataset, $a, text, nested element', () => {
    const jt = new JSONJoiningTransformer([], {});
    jt.element(
      'div',
      {dataset: {fooBar: 'X'}, $a: [['id', 'test'], ['z', '1']]},
      [],
      () => {
        jt.attribute('data-extra', 'e');
        jt.attribute('dataset', {barBaz: 'Q'});
        jt.attribute('$a', [['role', 'button']]);
        jt.text('hi');
        jt.element('span', {class: 'c'}, [], () => jt.text('inner'));
      }
    );
    const out = /** @type {import('jamilih').JamilihArray[]} */ (jt.get());
    expect(out).to.be.an('array');
    // root element added as first array element
    const el = out[0];
    expect(el[0]).to.equal('div');
    expect(el[1]).to.include({id: 'test', z: '1'});
    expect(el[1]).to.include({'data-foo-bar': 'X'});
    expect(el[1]).to.include({'data-extra': 'e'});
    expect(el[1]).to.include({'data-bar-baz': 'Q'});
    expect(el[1]).to.include({role: 'button'});
    expect(el[2]).to.deep.include.members(['hi']);
    // nested child
    const child = el[2];
    expect(child).to.deep.include.members(
      ['hi', ['span', {class: 'c'}, ['inner']]]
    );
  });

  it('supports atts as function and childNodes as function signatures', () => {
    const jt = new JSONJoiningTransformer([], {});
    // atts as function
    jt.element('div', function () {
      this.text('a');
    });
    // childNodes as function
    jt.element('p', {}, function () { /* no children */ });
    const out = /** @type {import('jamilih').JamilihArray[]} */ (jt.get());
    expect(out[0][0]).to.equal('div');
    expect(out[0]).to.deep.include.members(['div', ['a']]);
    expect(out[1][0]).to.equal('p');
  });

  it('elName as Element merges attributes into atts', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const doc = window.document;
    const el = doc.createElement('a');
    el.setAttribute('href', '#');
    el.dataset.x = 'y';

    const jt = new JSONJoiningTransformer([], {});
    jt.element(el, {role: 'note'}, [], () => { /* no children */ });

    const out = /** @type {import('jamilih').JamilihArray[]} */ (jt.get());
    const jml = out[0];
    expect(/** @type {string} */ (jml[0]).toLowerCase()).to.equal('a');
    expect(jml[1]).to.include({href: '#', 'data-x': 'y', role: 'note'});
  });
});
