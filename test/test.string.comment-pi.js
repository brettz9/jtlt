import {expect} from 'chai';
import JTLT from '../src/index.js';

// Cover StringJoiningTransformer comment() and processingInstruction() methods
// (currently the only uncovered lines: 578-580, 588-590).

describe('StringJoiningTransformer comment()/processingInstruction()', () => {
  it('emits HTML comment and PI in string output', function commentPI (done) {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {},
      outputType: 'string',
      templates: [
        {path: '$', template () {
          /** @type {any} */ const jt = this._config.joiningTransformer;
          jt.comment('note');
          jt.processingInstruction('xml-stylesheet', 'href="x.css"');
        }}
      ],
      success (/** @type {any} */ result) {
        try {
          expect(result).to.equal('<!--note--><?xml-stylesheet href="x.css"?>');
          done();
        } catch (err) {
          done(/** @type {any} */ (err));
        }
      }
    });
  });
});
