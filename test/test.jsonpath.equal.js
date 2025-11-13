import {expect} from 'chai';
import JSONPathTransformer from '../src/JSONPathTransformer.js';

describe('JSONPathTransformer equal-priority root templates', () => {
  it('does not throw by default splicing behavior in constructor', () => {
    /** @returns {string} */
    const noop = function () {
      return '';
    };
    const jpt = new JSONPathTransformer(({
      errorOnEqualPriority: true,
      data: {x: 1},
      templates: [
        {name: 'r1', path: '$', template: noop},
        {name: 'r2', path: '$', template: noop}
      ],
      // minimal joiner to satisfy context
      // @ts-expect-error testing
      joiningTransformer: {
        append () {
          // no-op for test
        },
        get () {
          return '';
        }
      }
    }));
    // Constructor splicing ensures only one root template remains,
    // so no error is thrown here.
    expect(() => jpt.transform('')).to.not.throw();
  });
});
