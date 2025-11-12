import {expect} from 'chai';
import JTLT from '../src/index-node.js';
// eslint-disable-next-line @stylistic/max-len -- Long
// import JSONPathTransformerContext from '../src/JSONPathTransformerContext.js';

// Basic test ensuring that template/query functions receive the correct `this`
// context instance matching the engine type when executed.
describe('Template function this-binding', () => {
  it('binds `this` to JSONPathTransformerContext for template', () => {
    let isCtxInstance;
    const jtlt = new JTLT({
      data: {foo: 'bar'},
      success (result) { /* noop */ },
      engineType: 'jsonpath',
      template (value) { // root template via forQuery fallback
        // Avoid instanceof lint by checking constructor name
        isCtxInstance = Boolean(
          this && this.constructor && this.constructor.name ===
            'JSONPathTransformerContext'
        );
        return undefined;
      }
    });
    // Force autostart by calling transform if not already
    jtlt.transform('default');
    expect(isCtxInstance).to.equal(true);
  });

  it('binds `this` for explicit templates array', () => {
    let isCtxInstance2;
    const jtlt = new JTLT({
      data: {foo: 'baz'},
      success (result) { /* noop */ },
      engineType: 'jsonpath',
      templates: [{
        name: 'root',
        path: '$',
        template (val) {
          isCtxInstance2 = Boolean(
            this && this.constructor && this.constructor.name ===
              'JSONPathTransformerContext'
          );
          return undefined;
        }
      }]
    });
    jtlt.transform('default');
    expect(isCtxInstance2).to.equal(true);
  });
});
