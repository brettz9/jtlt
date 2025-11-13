import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {DOMJoiningTransformer} from '../src/index-node.js';

// Covers AbstractJoiningTransformer.setConfig() by toggling a guard flag
// and verifying the change takes effect immediately.
describe('AbstractJoiningTransformer setConfig()', () => {
  it('replaces config so guards reflect new values', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    // Start with requireSameChildren=true so object() would throw
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document, requireSameChildren: true}
    );

    // Now disable the guard via setConfig
    joiner.setConfig({document, requireSameChildren: false});

    // Should not throw now
    const runner = () => joiner.object({}, function () {
      this.text('ok');
    });
    expect(runner).to.not.throw();
  });
});
