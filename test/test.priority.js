import {expect} from 'chai';
import JTLT from '../src/index-node.js';

describe('Template priority and equal handling', () => {
  it('prefers last template when equal priority (default)', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'A'},
      outputType: 'string',
      templates: [
        {path: '$.x', template () {
          this.string('first');
        }},
        {path: '$.x', template () {
          this.string('second');
        }}
      ],
      success (result) {
        try {
          expect(result).to.equal('first');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('throws when errorOnEqualPriority is true', () => {
    expect(() => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {x: 'A'},
        errorOnEqualPriority: true,
        outputType: 'string',
        templates: [
          {path: '$.x', template () {
            this.string('first');
          }},
          {path: '$.x', template () {
            this.string('second');
          }}
        ],
        success () { /* not reached */ }
      });
    }).to.throw(Error, /equal priority/v);
  });
});
