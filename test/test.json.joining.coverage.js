import {expect} from 'chai';
import {JSONJoiningTransformer} from '../src/index-node.js';

describe('JSONJoiningTransformer coverage additions', () => {
  it('element() with childNodes array and no atts/cb', () => {
    const jt = new JSONJoiningTransformer([], {});
    // Call with just name and childNodes array (no atts object provided)
    jt.element('ul', ['x', ['li', {}, 'y']]);
    const out = /** @type {import('jamilih').JamilihArray[]} */ (jt.get());
    expect(out[0][0]).to.equal('ul');
    // No attribute object present (children start at index 1)
    expect(out[0][1]).to.equal('x');
  });

  it('attribute() no-op outside callback (dataset/$a)', () => {
    const jt = new JSONJoiningTransformer([], {});
    // Outside of element callback: should silently return
    jt.attribute('dataset', {fooBar: 'v'});
    jt.attribute('$a', [['id', 'x']]);
    // Build an element afterwards to ensure prior calls didn't pollute state
    jt.element('div', {}, [], () => { /* noop */ });
    const out = /** @type {import('jamilih').JamilihArray[]} */ (jt.get());
    expect(out[0][0]).to.equal('div');
    // No attributes added since attribute() was a no-op
    expect(out[0].length).to.equal(1); // ['div'] only (no atts, no children)
  });

  it('text() no-op outside callback', () => {
    const jt = new JSONJoiningTransformer([], {});
    jt.text('ignored');
    jt.element('p', {}, [], () => jt.text('kept'));
    const out = /** @type {import('jamilih').JamilihArray[]} */ (jt.get());
    expect(out[0][0]).to.equal('p');
    // Text nodes represented as ['!', text]
    expect(out[0]).to.deep.include.members([['!', 'kept']]);
    // Ensure the outside text did not append a raw string root element
    expect(out.length).to.equal(1);
  });

  it('element() with empty atts and no children', () => {
    const jt = new JSONJoiningTransformer([], {});
    jt.element('span');
    const out = /** @type {import('jamilih').JamilihArray[]} */ (jt.get());
    expect(out[0]).to.deep.equal(['span']);
  });
});
