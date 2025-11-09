import {expect} from 'chai';
import JTLT from '../src/index.js';

describe('DOMJoiningTransformer output', () => {
  it('builds a simple list', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {items: ['a', 'b', 'c']},
      outputType: 'dom',
      templates: [
        {path: '$', template () {
          const doc = /** @type {Document} */ (
            this._config.joiningTransformer._cfg.document
          );
          const ul = doc.createElement('ul');
          this.forEach('$.items[*]', function (v) {
            const li = doc.createElement('li');
            li.textContent = v;
            ul.append(li);
          });
          return ul;
        }}
      ],
      success (frag) {
        try {
          // Result is a DocumentFragment; check text contents
          expect(frag.textContent).to.equal('abc');
          expect(frag.querySelectorAll('li').length).to.equal(3);
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });
});
