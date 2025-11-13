import {expect} from 'chai';
import JSONPathTransformerContext from '../src/JSONPathTransformerContext.js';
import JSONJoiningTransformer from '../src/JSONJoiningTransformer.js';

describe('JSONPathTransformerContext _calculatePosition with count', () => {
  it('returns length of matched array for count argument', () => {
    const data = {items: [1, 2, 3, 4]};
    const ctx = new JSONPathTransformerContext({
      data,
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.iterationState = {index: 2};
    // Should return 4 for $.items
    expect(ctx.calculatePosition('$.items')).to.equal(4);
  });

  it('returns 1 if count does not match', () => {
    const data = {items: []};
    const ctx = new JSONPathTransformerContext({
      data,
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.iterationState = {index: 0};
    // Should return 0 for $.items (empty array)
    expect(ctx.calculatePosition('$.items')).to.equal(0);
  });

  it('returns index+1 if count is not provided', () => {
    const data = {items: [1, 2, 3]};
    const ctx = new JSONPathTransformerContext({
      data,
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.iterationState = {index: 1};
    // Should return 2 (index+1)
    expect(ctx.calculatePosition()).to.equal(2);
  });

  it('returns 1 if no iterationState and no count', () => {
    const data = {items: [1, 2, 3]};
    const ctx = new JSONPathTransformerContext({
      data,
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    expect(ctx.calculatePosition()).to.equal(1);
  });
});
