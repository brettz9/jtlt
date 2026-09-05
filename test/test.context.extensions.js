import {expect} from 'chai';
import {jtlt} from '../src/index.js';
import JTLT from '../src/index-node.js';

// The helpers passed below via `extensions` are registered on
// `ContextExtensions` in `./context-extensions.d.ts` (declaration merging),
// so `this.<helper>()` inside templates type-checks without suppressions.
// Consumers of the published package augment `'jtlt/context-extensions'`.

describe('config.extensions (context extension mechanism)', () => {
  it(
    'merges extension methods onto the JSONPath context as `this`',
    async () => {
      const out = await jtlt({
        data: {title: 'Hello'},
        templates: [
          {path: '$', template () {
            this.wrapTitle();
          }},
          {path: '$.title', template (v) {
            this.text(/** @type {string} */ (v));
          }}
        ],
        outputType: 'string',
        extensions: {
          wrapTitle () {
            this.string('<wrap>');
            this.applyTemplates('$.title');
            this.string('</wrap>');
          }
        }
      });
      expect(out).to.equal('<wrap>Hello</wrap>');
    }
  );

  it(
    'throws when an extension key collides with an existing property',
    async () => {
      let err;
      try {
        await jtlt({
          data: {a: 1},
          templates: [{path: '$', template () {
            return '';
          }}],
          outputType: 'string',
          extensions: {applyTemplates () { /* noop */ }}
        });
      } catch (e) {
        err = e;
      }
      expect(err).to.be.an('error');
      expect(/** @type {Error} */ (err).message).to.match(/applyTemplates/v);
    }
  );

  it('merges extension methods onto the XPath context as `this`', async () => {
    const {JSDOM} = await import('jsdom');
    const dom = new JSDOM('<root><title>Hi</title></root>', {
      contentType: 'text/xml'
    });
    let ranDefault = false;
    JTLT.create({
      data: dom.window.document,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {path: '/root', template () {
          ranDefault = this.markRan();
        }}
      ],
      extensions: {
        markRan () {
          return true;
        }
      },
      success (result) { /* noop */ }
    }).transform();
    expect(ranDefault).to.equal(true);
  });
});
