import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {DOMJoiningTransformer} from '../src/index-node.js';

// Covers AbstractJoiningTransformer.config() without callback (no restore)
// by setting requireSameChildren=true and verifying a guarded method throws.
describe('AbstractJoiningTransformer config() without callback', () => {
  it('persists config when no callback supplied', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );

    // Set requireSameChildren=true without callback to persist setting
    joiner.config('requireSameChildren', true);

    // Now calling object() should trigger the guard and throw
    const thrower = () => joiner.object({}, () => {
      joiner.text('x');
    });
    expect(thrower).to.throw(
      'Cannot embed object children for a dom joining transformer.'
    );
  });
});
