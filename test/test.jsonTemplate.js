import {expect} from 'chai';
import {
  isJSONTemplateNodeArray, jtlt, validateJSONTemplate
} from '../src/index.js';

/**
 * The declarative (jamilih-shaped) node format used by idb-manager route
 * overrides — see `~/idb-manager/ROUTE-OVERRIDES-PLAN.md` §3 and
 * `~/idb-manager/JTLT-JSON-TEMPLATES-PROPOSAL.md`. This suite is written
 * against that design ahead of the implementation (`src/jsonTemplate.js`,
 * the `format`/`defaultTemplateFormat` normalization in `JTLT#setDefaults`,
 * and any `JSONPathTransformerContext` additions it turns out to need) so
 * the API shape can be reviewed as runnable usage rather than only prose.
 *
 * `$variable` binds a selector result and reads it back via a bare `$name`
 * reference in a later node: `_lookupParam` (which already backed
 * `if()`/`choose()`/comparisons/the `$name` form of `valueOf()`) was extended
 * to also consult `this.vars`, not just `this._params` / `this._runtimeParams`.
 * (Note the bare-`$name` convention throughout jtlt: `$n` resolves a
 * param/var; `$.n` is always a JSONPath query against the data, never a
 * var/param reference — so referencing a `variable()`-set value needs the
 * bare form, not a dotted one.)
 *
 * `$indexedDB` + `$as` binds a *raw fetched value* (not a selector result):
 * `variable()` was widened to accept the same `string | {select} | {value}`
 * forms `param()`/`withParam()` already do (via the shared `_paramSpec`/
 * `_resolveParam` helpers), so `this.variable(as, {value: rows})` binds the
 * fetched array with no selector round-trip.
 *
 * Iterating that bound array needed one more fix: `forEach()` never consulted
 * `_lookupParam` at all (unlike `valueOf()`/`if()`), and jsonpath-plus has no
 * concept of a named root to continue a path from — `$records[*]` is not
 * `$.records[*]`, it is simply not a match. So `forEach()` now recognizes a
 * bare `$name` (same convention as everywhere else — no trailing path) and
 * iterates that value's own elements directly, treating a non-array value as
 * a length-1 sequence (XPath's data model). The `$forEach` selector for a
 * bound variable is therefore `'$records'`, not `'$records[*]'`.
 */

/**
 * Render a string-output transform from a single declarative node array
 * used as the whole document's template, via a bare `TemplateObject` (no
 * outer `[...]` needed for `config.templates`).
 * @param {import('../src/index.js').JSONTemplateNode[]} nodes
 * @param {object} [data]
 * @param {Record<string, unknown>} [params]
 * @param {Record<string, unknown>} [extensions]
 * @returns {Promise<string>}
 */
function renderJSON (nodes, data = {}, params = {}, extensions = {}) {
  return jtlt({
    data,
    outputType: 'string',
    params,
    extensions,
    templates: {path: '$', template: nodes}
  });
}

/**
 * @param {Promise<unknown>} promise
 * @returns {Promise<Error>}
 */
async function expectRejection (promise) {
  let error;
  try {
    await promise;
  } catch (err) {
    error = /** @type {Error} */ (err);
  }
  expect(error).to.be.an('error');
  return /** @type {Error} */ (error);
}

describe('JSON (jamilih) templates', function () {
  describe('config shape detection', function () {
    it('accepts a bare TemplateObject as `templates` (no outer array)',
      async function () {
        const out = await jtlt({
          data: {},
          outputType: 'string',
          templates: {path: '$', template: [['p', ['hi']]]}
        });
        expect(out).to.equal('<p>hi</p>');
      });

    it('accepts a bare [path, nodes] tuple as `templates`', async function () {
      const out = await jtlt({
        data: {},
        outputType: 'string',
        templates: ['$', [['p', ['hi']]]]
      });
      expect(out).to.equal('<p>hi</p>');
    });

    it(
      'accepts an explicit `[{path, template}]` list entry, mixed with a ' +
      'function-template entry',
      async function () {
        const out = await jtlt({
          data: {a: 'X'},
          outputType: 'string',
          templates: [
            {path: '$', template: [['div', [[{$applyTemplates: '$.a'}]]]]},
            ['$.a', function (v) {
              this.string(String(v));
            }]
          ]
        });
        expect(out).to.equal('<div>X</div>');
      }
    );

    it(
      'infers format: "json" from an Array `template` — no explicit ' +
      '`format` needed',
      async function () {
        expect(
          await renderJSON([['span', ['ok']]])
        ).to.equal('<span>ok</span>');
      }
    );

    it(
      'rejects a live function embedded in the structure under the ' +
      'default format: "json"',
      async function () {
        await expectRejection(renderJSON([
          ['button', {$on: {click () {
            //
          }}}]
        ]));
      }
    );

    it(
      'allows a live function embedded in the structure under an inline ' +
      'format: "javascript"',
      async function () {
        const out = await jtlt({
          data: {},
          outputType: 'string',
          templates: {
            path: '$',
            format: 'javascript',
            template: [['button', {$on: {click () {
              //
            }}}]]
          }
        });
        expect(out).to.be.a('string');
      }
    );

    it(
      'honors a config-level `defaultTemplateFormat` when an entry has no ' +
      'format of its own',
      async function () {
        const out = await jtlt({
          data: {},
          outputType: 'string',
          defaultTemplateFormat: 'javascript',
          templates: {
            path: '$',
            template: [['button', {$on: {click () {
              //
            }}}]]
          }
        });
        expect(out).to.be.a('string');
      }
    );

    it(
      "an entry's own `format` overrides `defaultTemplateFormat`",
      async function () {
        await expectRejection(jtlt({
          data: {},
          outputType: 'string',
          defaultTemplateFormat: 'javascript',
          templates: {
            path: '$',
            format: 'json',
            template: [['button', {$on: {click () {
              //
            }}}]]
          }
        }));
      }
    );
  });

  describe('operation vocabulary', function () {
    it('bare $text emits a literal text node (valid as jamilih\'s own ' +
      'text-node form, no $jtltText needed for the plain-literal case)',
    async function () {
      expect(await renderJSON([[{$text: 'hello'}]])).to.equal('hello');
    });

    it('bare $jtltText (no $select) is equivalent to bare $text — it is ' +
      'the general/canonical form and never reaches jamilih\'s own $text ' +
      'handling, so it works with or without $select',
    async function () {
      expect(await renderJSON([[{$jtltText: 'hello'}]])).to.equal('hello');
    });

    it('$jtltText + $select emits the selected value (the combined ' +
      'dynamic form, which is what actually needs the $jtlt namespace)',
    async function () {
      expect(
        await renderJSON(
          [[{$jtltText: '', $select: '$.name'}]], {name: 'Ada'}
        )
      ).to.equal('Ada');
    });

    it('$string emits a literal string', async function () {
      expect(await renderJSON([[{$string: 'value'}]])).to.equal('value');
    });

    it('$string + $select emits the selected value, stringified',
      async function () {
        expect(
          await renderJSON([[{$string: '', $select: '$.name'}]], {name: 'Ada'})
        ).to.equal('Ada');
      });

    it('an element with no attributes and no children renders as an ' +
      'empty tag', async function () {
      expect(await renderJSON([['b']])).to.equal('<b></b>');
    });

    it('an element with both attributes and children (the full 3-item ' +
      'form) renders both', async function () {
      expect(
        await renderJSON([['p', {id: 'x'}, ['hi']]])
      ).to.equal('<p id="x">hi</p>');
    });

    it('$valueOf emits the selected value', async function () {
      expect(
        await renderJSON([[{$valueOf: '$.name'}]], {name: 'Ada'})
      ).to.equal('Ada');
    });

    it('$applyTemplates dispatches to a matching function-template entry',
      async function () {
        const out = await jtlt({
          data: {items: ['a', 'b']},
          outputType: 'string',
          templates: [
            {path: '$', template: [[{$applyTemplates: '$.items[*]'}]]},
            ['$.items[*]', function (v) {
              this.element('li', {}, [], () => this.text(String(v)));
            }]
          ]
        });
        expect(out).to.equal('<li>a</li><li>b</li>');
      });

    it('$if renders the then-branch when the test passes', async function () {
      expect(
        await renderJSON(
          [[{$if: '$flag'}, [['p', ['yes']]]]], {}, {flag: true}
        )
      ).to.equal('<p>yes</p>');
    });

    it('$if renders nothing when the test fails (no else branch)',
      async function () {
        expect(
          await renderJSON(
            [[{$if: '$flag'}, [['p', ['yes']]]]], {}, {flag: false}
          )
        ).to.equal('');
      });

    it('$if with an else-branch renders it when the test fails',
      async function () {
        expect(
          await renderJSON(
            [[{$if: '$flag'}, [['p', ['yes']]], [['p', ['no']]]]],
            {},
            {flag: false}
          )
        ).to.equal('<p>no</p>');
      });

    it('$if with an else-branch renders the then-branch when the test ' +
      'passes', async function () {
      expect(
        await renderJSON(
          [[{$if: '$flag'}, [['p', ['yes']]], [['p', ['no']]]]],
          {},
          {flag: true}
        )
      ).to.equal('<p>yes</p>');
    });

    it('$forEach iterates a selected array', async function () {
      expect(
        await renderJSON(
          [
            [{$forEach: '$.items[*]'}, [
              // `forEach()` sets each item as the data context (`$`), the
              // same as `$indexedDB`'s children below — `@` is not a
              // general `valueOf()`/`get()` idiom in jtlt (it's meaningful
              // only in sort/group-by expressions), so a bare current-item
              // reference here is `$`, not `@`.
              ['li', [
                [{$valueOf: '$'}]
              ]]
            ]]
          ],
          {items: ['a', 'b', 'c']}
        )
      ).to.equal('<li>a</li><li>b</li><li>c</li>');
    });

    it(
      '$renderDefault invokes the caller-supplied `renderDefault` extension',
      async function () {
        // Called directly (not through `renderJSON`) so `extensions` keeps
        // the contextual `this` typing `JSONPathJTLTOptions.extensions`
        // declares (a generic helper parameter loses that).
        const out = await jtlt({
          data: {},
          outputType: 'string',
          templates: {
            path: '$',
            template: [
              ['h1', ['Custom view']],
              [{$renderDefault: true}]
            ]
          },
          extensions: {
            renderDefault () {
              this.element('default', {}, [], () => {
                //
              });
            }
          }
        });
        expect(out).to.equal('<h1>Custom view</h1><default></default>');
      }
    );

    it(
      '$variable binds a selector result, readable back via a bare $name ' +
      'reference in a later node',
      async function () {
        expect(
          await renderJSON(
            [
              [{$variable: 'n', $select: '$.name'}],
              [{$valueOf: '$n'}]
            ],
            {name: 'Ada'}
          )
        ).to.equal('Ada');
      }
    );

    describe('$indexedDB', function () {
      before(async function () {
        if (typeof window === 'undefined') {
          const {default: setGlobalVars} = await import('indexeddbshim');
          setGlobalVars(globalThis, {checkOrigin: false, memoryDatabase: ''});
        }
        const idb = await import('idb');
        const db = await idb.openDB('jsonTemplateTestDB', 1, {
          upgrade (dbs) {
            const store = dbs.createObjectStore('users', {keyPath: 'id'});
            store.put({id: 1, name: 'Alice'});
            store.put({id: 2, name: 'Bob'});
          }
        });
        db.close();
      });

      it(
        'fetches rows and binds them via $as, iterated with a bare $name ' +
        '$forEach (not $records[*] — jsonpath-plus has no notion of a ' +
        'named root to continue a path from, so a bound variable is ' +
        'iterated directly by $forEach, not queried via [*])',
        async function () {
          expect(
            await renderJSON([
              [{
                $indexedDB: {
                  db: 'jsonTemplateTestDB', store: 'users',
                  options: {resultType: 'value'}
                },
                $as: 'records'
              }, [
                // Bare $records (no [*]): $forEach resolves it against the
                // bound variable and iterates its elements directly.
                [{$forEach: '$records'}, [
                  // Ordinary $-rooted JSONPath: $forEach sets the current
                  // item as the data context for each iteration, so `$.name`
                  // (not `@.name` — `@` is only valid as a bare whole-item
                  // reference, never as a prefix for a further path) reads
                  // the current row's `name`.
                  ['p', [[{$valueOf: '$.name'}]]]
                ]]
              ]]
            ])
          ).to.equal('<p>Alice</p><p>Bob</p>');
        }
      );

      it(
        '$as is optional — omitted, it swaps $ (the current data context) ' +
        'to the fetched rows for the children instead of naming them, ' +
        "matching XSLT's common `xsl:for-each select=\"document(...)\"` " +
        'idiom (no `xsl:variable` needed just to iterate a loaded document)',
        async function () {
          expect(
            await renderJSON([
              [{
                $indexedDB: {
                  db: 'jsonTemplateTestDB', store: 'users',
                  options: {resultType: 'value'}
                }
                // No $as: children see the fetched rows as `$` directly.
              }, [
                [{$forEach: '$[*]'}, [
                  ['p', [[{$valueOf: '$.name'}]]]
                ]]
              ]]
            ])
          ).to.equal('<p>Alice</p><p>Bob</p>');
        }
      );

      it(
        "$indexedDB's children are optional — a bare prefetch (binding " +
        'via $as with no immediate consumer) is a legitimate leaf use',
        async function () {
          expect(
            await renderJSON([
              [{
                $indexedDB: {
                  db: 'jsonTemplateTestDB', store: 'users',
                  options: {resultType: 'value'}
                },
                $as: 'records'
              }]
            ])
          ).to.equal('');
        }
      );

      it(
        '$indexedDB works nested inside an element\'s children too, not ' +
        "just at a template's top level — element()/if()/forEach() all " +
        "duck-type their callback's return value, so an async callback " +
        '(one that awaits the fetch) keeps output correctly ordered',
        async function () {
          expect(
            await renderJSON([
              ['div', [
                [{
                  $indexedDB: {
                    db: 'jsonTemplateTestDB', store: 'users',
                    options: {resultType: 'value'}
                  },
                  $as: 'records'
                }, [
                  [{$forEach: '$records'}, [
                    ['p', [[{$valueOf: '$.name'}]]]
                  ]]
                ]]
              ]]
            ])
          ).to.equal('<div><p>Alice</p><p>Bob</p></div>');
        }
      );
    });
  });

  describe('rejection / validation', function () {
    // Every literal below is *statically* invalid too — `tsc` already
    // rejects each at compile time, which is what `@ts-expect-error`
    // documents. These tests exist for the same shape arriving at runtime
    // without having gone through TypeScript at all (the real case for a
    // route override: JSON loaded back out of IndexedDB), where the
    // interpreter's own validation is the only guard.
    it('rejects an unknown operation key', async function () {
      await expectRejection(renderJSON([
        // @ts-expect-error -- deliberately invalid; see block comment above
        [{$notARealOp: 'x'}]
      ]));
    });

    it(
      'rejects a non-$-prefixed key on an operation node\'s leading object',
      async function () {
        await expectRejection(renderJSON([
          // @ts-expect-error -- deliberately invalid; see block comment above
          [{forEach: '$.x'}, [['p', []]]]
        ]));
      }
    );

    it(
      'rejects $text combined with $select — jamilih rejects the ' +
      'unrecognized $select alongside its own reserved $text ' +
      '(UNKNOWN_MAGIC_PROPERTY); the combined dynamic form must use ' +
      '$jtltText instead',
      async function () {
        await expectRejection(renderJSON([
          // @ts-expect-error -- deliberately invalid; see block comment above
          [{$text: 'hello', $select: '$.x'}]
        ]));
      }
    );

    it('rejects a bare (non-namespaced) $mode on $applyTemplates',
      async function () {
        await expectRejection(renderJSON([
          // @ts-expect-error -- deliberately invalid; see block comment above
          [{$applyTemplates: '$.x', $mode: 'view'}]
        ]));
      });

    it('rejects a structurally unrecognizable node (an empty array)',
      async function () {
        await expectRejection(renderJSON([
          // @ts-expect-error -- deliberately invalid; see block comment above
          []
        ]));
      });

    it(
      'rejects a structurally unrecognizable node (a leading item that is ' +
      'neither a string name nor a plain-object op key)',
      async function () {
        await expectRejection(renderJSON([
          // @ts-expect-error -- deliberately invalid; see block comment above
          [42]
        ]));
      }
    );

    it('rejects $if with no then-branch node array', async function () {
      await expectRejection(renderJSON([
        // @ts-expect-error -- deliberately invalid; see block comment above
        [{$if: '$flag'}]
      ]));
    });

    it('rejects $forEach with no children node array', async function () {
      await expectRejection(renderJSON([
        // @ts-expect-error -- deliberately invalid; see block comment above
        [{$forEach: '$.items[*]'}]
      ]));
    });

    it('rejects an $if else-branch that is given but not a node array',
      async function () {
        await expectRejection(renderJSON([
          // @ts-expect-error -- deliberately invalid; see block comment above
          [{$if: '$flag'}, [['p', ['yes']]], 'not-an-array']
        ]));
      });

    it(
      'rejects an $indexedDB children item that is given but not a node ' +
      'array',
      async function () {
        await expectRejection(renderJSON([
          // @ts-expect-error -- deliberately invalid; see block comment above
          [{$indexedDB: {db: 'x', store: 'y'}}, 'not-an-array']
        ]));
      }
    );
  });

  describe('validateJSONTemplate() / isJSONTemplateNodeArray() (the ' +
    'non-executing "validate before save" entry points)', function () {
    it('isJSONTemplateNodeArray recognizes an array, rejects anything else',
      function () {
        expect(isJSONTemplateNodeArray([['p', ['hi']]])).to.equal(true);
        expect(isJSONTemplateNodeArray(function () {
          //
        })).to.equal(false);
      });

    it('validateJSONTemplate reports no errors for a valid template',
      function () {
        expect(validateJSONTemplate([['p', ['hi']]])).to.deep.equal(
          {valid: true, errors: []}
        );
      });

    it('validateJSONTemplate rejects a non-array top level directly ' +
      '(not just via the jtlt()/compileJSONTemplate() integration path)',
    function () {
      const result = validateJSONTemplate(
        // @ts-expect-error -- deliberately invalid; see block comment above
        {not: 'an array'}
      );
      expect(result.valid).to.equal(false);
      expect(result.errors).to.have.length(1);
    });
  });
});
