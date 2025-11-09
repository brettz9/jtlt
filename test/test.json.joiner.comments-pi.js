import {expect} from 'chai';
import {JSONJoiningTransformer} from '../src/index.js';

describe('JSONJoiningTransformer comment() and processingInstruction()', () => {
  it('emits markers inside element callback and no-ops outside', () => {
    const jt = new JSONJoiningTransformer([], {});
    jt.element('root', {}, [], () => {
      jt.comment('c1');
      jt.text('t1');
      jt.processingInstruction('pi', 'data');
    });
    // Outside element context: comment() and PI should be no-ops
    jt.comment('outside');
    jt.processingInstruction('pi2', 'd2');

    const out = jt.get();
    const root = out[0];
    expect(root[0]).to.equal('root');
    // Comment and text both use ['!', text]; PI uses ['?', target, data]
    expect(root).to.deep.include.members([
      ['!', 'c1'],
      ['!', 't1'],
      ['?', 'pi', 'data']
    ]);
    // Ensure no-ops outside did not add extra root-level items
    expect(out).to.have.lengthOf(1);
  });
});
