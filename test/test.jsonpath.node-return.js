import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JSONPathTransformer from '../src/JSONPathTransformer.js';
import {DOMJoiningTransformer} from '../src/index-node.js';

describe('JSONPathTransformer transform - Node return', () => {
  it('appends returned DOM Node via joiner.append', () => {
    const {document} = (new JSDOM('')).window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );

    const templates = [
      {
        path: '$',
        template () {
          const el = document.createElement('span');
          el.setAttribute('id', 'node-ret');
          el.textContent = 'Hi';
          return el; // Return a Node to trigger Node branch
        }
      }
    ];

    const engine = new JSONPathTransformer({
      data: {x: 1},
      joiningTransformer: joiner,
      templates
    });

    engine.transform();
    const frag = /** @type {DocumentFragment} */ (joiner.get());
    const span = frag.querySelector('span#node-ret');
    expect(span).to.exist;
    expect(span && span.textContent).to.equal('Hi');
  });
});
