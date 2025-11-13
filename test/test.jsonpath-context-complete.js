import {expect} from 'chai';
import JTLT, {
  JSONPathTransformerContext,
  StringJoiningTransformer,
  JSONJoiningTransformer
} from '../src/index-node.js';

describe('JSONPathTransformerContext complete coverage', () => {
  describe('copy() with primitives (line 799-801)', () => {
    it('copy handles string primitive', () => {
      const joiner = new StringJoiningTransformer('');
      // eslint-disable-next-line @stylistic/max-len -- Long
      const ctx = new (/** @type {typeof JSONPathTransformerContext<"string">} */ (
        JSONPathTransformerContext
      ))({
        data: 'hello',
        joiningTransformer: joiner,
        templates: []
      }, []);
      ctx.copy();
      expect(joiner.get()).to.equal('hello');
    });

    it('copy handles number primitive', () => {
      const joiner = new JSONJoiningTransformer([]);
      const ctx = new JSONPathTransformerContext({
        data: 123,
        joiningTransformer: joiner,
        templates: []
      }, []);
      ctx.copy();
      const result = joiner.get();
      expect(result).to.deep.equal([123]);
    });

    it('copy handles boolean primitive', () => {
      const joiner = new JSONJoiningTransformer([]);
      const ctx = new JSONPathTransformerContext({
        data: true,
        joiningTransformer: joiner,
        templates: []
      }, []);
      ctx.copy();
      const result = joiner.get();
      expect(result).to.deep.equal([true]);
    });

    it('copy handles null', () => {
      const joiner = new JSONJoiningTransformer([]);
      const ctx = new JSONPathTransformerContext({
        data: null,
        joiningTransformer: joiner,
        templates: []
      }, []);
      ctx.copy();
      const result = joiner.get();
      expect(result).to.deep.equal([null]);
    });

    it('copy handles undefined', () => {
      const joiner = new JSONJoiningTransformer([]);
      const ctx = new JSONPathTransformerContext({
        // @ts-expect-error - Testing undefined context
        data: undefined,
        joiningTransformer: joiner,
        templates: []
      }, []);
      ctx.copy();
      const result = joiner.get();
      expect(result[0]).to.equal(undefined);
    });
  });

  describe('applyTemplates with named-only templates (line 322-323)', () => {
    it('filters out named-only templates from path matching', (done) => {
      // This tests that named-only templates are filtered out early
      // so line 322-323 defensive check is not hit in normal flow
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {a: 1, b: 2},
        outputType: 'string',
        templates: [
          {
            path: '$',
            template () {
              // Apply templates should filter named-only templates
              this.applyTemplates('$.a');
            }
          },
          {
            name: 'namedOnly',
            // No path - should be filtered out in modeMatchedTemplates
            template () {
              return 'NAMED';
            }
          },
          {
            path: '$.a',
            template (val) {
              return `a=${val}`;
            }
          }
        ],
        success (result) {
          try {
            expect(result).to.equal('a=1');
            expect(result).to.not.include('NAMED');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('callTemplate can invoke named-only templates', (done) => {
      // Named-only templates are meant to be called via callTemplate
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {x: 10},
        outputType: 'string',
        templates: [
          {
            path: '$',
            template () {
              this.callTemplate('helper');
            }
          },
          {
            name: 'helper',
            // Named-only template (no path)
            template () {
              return 'HELPER-CALLED';
            }
          }
        ],
        success (result) {
          try {
            expect(result).to.equal('HELPER-CALLED');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });
  });

  describe('callTemplate error handling (line 463-464)', () => {
    it('throws when calling non-existent template', () => {
      expect(() => {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {},
          outputType: 'string',
          templates: [{
            path: '$',
            template () {
              this.callTemplate('doesNotExist');
            }
          }],
          success () { /* not reached */ }
        });
      }).to.throw(
        'Template, doesNotExist, cannot be called as it was not found'
      );
    });

    it('throws with name parameter object', () => {
      expect(() => {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {},
          outputType: 'string',
          templates: [{
            path: '$',
            template () {
              this.callTemplate({name: 'missing'});
            }
          }],
          success () { /* not reached */ }
        });
      }).to.throw('Template, missing, cannot be called');
    });
  });

  describe('Full integration tests for edge cases', () => {
    it('handles multiple named-only templates with callTemplate', (done) => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {val: 5},
        outputType: 'string',
        templates: [
          {
            path: '$',
            template () {
              this.callTemplate('double');
              this.string(' and ');
              this.callTemplate('triple');
            }
          },
          {
            name: 'double',
            template (val) {
              // @ts-expect-error - Runtime safe
              return `double=${val.val * 2}`;
            }
          },
          {
            name: 'triple',
            template (val) {
              // @ts-expect-error - Runtime safe
              return `triple=${val.val * 3}`;
            }
          }
        ],
        success (result) {
          try {
            expect(result).to.equal('double=10 and triple=15');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });

    it('copy with property sets on primitive falls through', () => {
      const joiner = new JSONJoiningTransformer([]);
      const ctx = new JSONPathTransformerContext({
        data: 42,
        joiningTransformer: joiner,
        templates: []
      }, []);
      ctx.propertySets = {extra: {foo: 'bar'}};
      // Copy on primitive with property sets - sets are ignored
      ctx.copy(['extra']);
      const result = joiner.get();
      // Should still be 42, not merged with property sets
      expect(result).to.deep.equal([42]);
    });
  });

  describe('output() method coverage (lines 801-803)', () => {
    it('calls output() on string joiner for document config', (done) => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: 'hello'},
        outputType: 'string',
        templates: [
          {
            path: '$',
            template () {
              this.output({method: 'xml', version: '1.0'});
              this.element('root', {}, [], () => {
                // @ts-expect-error - Runtime safe
                this.text(this._contextObj.text);
              });
            }
          }
        ],
        success (result) {
          try {
            expect(result).to.include('<?xml version="1.0"?>');
            expect(result).to.include('<root>hello</root>');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });
  });
});
