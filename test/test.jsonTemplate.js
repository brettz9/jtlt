import {JSDOM} from 'jsdom';
import {expect} from 'chai';
import {
  extractReads, isJSONTemplateNodeArray, jtlt, setWindow, validateJSONTemplate
} from '../src/index.js';

// Named `domWindow`, not `window`: a bare `const {window} = ...` at module
// scope would shadow the global `window` for this whole file — including
// inside the `$indexedDB` describe block below, whose `before()` hook does
// its own `typeof window === 'undefined'` check to decide whether to load
// the `indexeddbshim` Node polyfill; shadowing it with a always-defined
// local would wrongly skip that and break indexedDB access entirely.
const {window: domWindow} = new JSDOM('');
setWindow(domWindow);

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
 * @param {Record<string, unknown> & ThisType<
 *   import('../src/JSONPathTransformerContext.js').default &
 *   import('../src/context-extensions.js').ContextExtensions
 * >} [extensions]
 * @param {{
 *   format?: 'json'|'javascript',
 *   interpolateAttributes?:
 *     import('../src/jsonTemplate.js').InterpolateAttributesConfig
 * }} [templateOptions] - Extra `TemplateObject` fields (e.g.
 *   `interpolateAttributes`) merged onto the single root template.
 * @returns {Promise<string>}
 */
function renderJSON (
  nodes, data = {}, params = {}, extensions = {}, templateOptions = {}
) {
  return jtlt({
    data,
    outputType: 'string',
    params,
    extensions,
    templates: {path: '$', template: nodes, ...templateOptions}
  });
}

/**
 * Render a DOM-output transform — the actual output type idb-manager's
 * Router uses (see `~/idb-manager/src/Router.js`'s `renderDeclarativeView`),
 * so `innerHTML` needs real, browser-parsed HTML nodes here, not just a
 * correctly-shaped string (string output goes through jamilih's own
 * `toHTML`/incremental builder, which is a separate code path).
 * @param {import('../src/index.js').JSONTemplateNode[]} nodes
 * @param {object} [data]
 * @returns {Promise<DocumentFragment>}
 */
function renderDOM (nodes, data = {}) {
  return /** @type {Promise<DocumentFragment>} */ (/** @type {unknown} */ (
    jtlt({
      data,
      outputType: 'dom',
      templates: {path: '$', template: nodes}
    })
  ));
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

    /* eslint-disable no-template-curly-in-string -- Intentional: these are
       jtlt's own `${sel}` placeholder literals (plain strings, not template
       literals), not a mistaken template literal. */
    describe('${sel} attribute-value interpolation', function () {
      it('resolves a `${sel}` placeholder embedded in a string attribute ' +
        'value', async function () {
        expect(
          await renderJSON(
            [['a', {href: '/words/${$.key}'}, ['dog']]],
            {key: 'dog'}
          )
        ).to.equal('<a href="/words/dog">dog</a>');
      });

      it('resolves multiple placeholders in one attribute value',
        async function () {
          expect(
            await renderJSON(
              [['a', {href: '/${$.db}/${$.store}'}, []]],
              {db: 'dictionaryDb', store: 'words'}
            )
          ).to.equal('<a href="/dictionaryDb/words"></a>');
        });

      it('leaves a plain (no `${`) attribute value untouched',
        async function () {
          expect(
            await renderJSON([['a', {href: '/static'}, []]])
          ).to.equal('<a href="/static"></a>');
        });

      it('coerces a null/undefined placeholder result to the empty ' +
        'string, not the literal "null"/"undefined"', async function () {
        expect(
          await renderJSON(
            [['a', {href: '/words/${$.missing}'}, []]],
            {}
          )
        ).to.equal('<a href="/words/"></a>');
      });

      it('interpolates jamilih\'s own `innerHTML` magic attribute — no ' +
        'separate raw-HTML operation is needed', async function () {
        expect(
          await renderJSON(
            [['div', {innerHTML: '${$.definition}'}, []]],
            {definition: '<em>bark</em>'}
          )
        ).to.equal('<div><em>bark</em></div>');
      });

      it('for DOM output, sets real, browser-parsed HTML nodes (via ' +
        "`Element#innerHTML`), not a literal, escaped '<em>' text node " +
        '— the actual output type idb-manager\'s Router uses',
      async function () {
        const frag = await renderDOM(
          [['div', {innerHTML: '${$.definition}'}, []]],
          {definition: '<em>bark</em>'}
        );
        const em = frag.querySelector('em');
        expect(em).to.not.be.null;
        expect(/** @type {Element} */ (em).textContent).to.equal('bark');
      });

      it('leaves a non-string attribute value (e.g. a `dataset` object) ' +
        'untouched, rather than crashing trying to string-interpolate ' +
        'it', async function () {
        expect(
          await renderJSON(
            [['div', {dataset: {foo: 'bar'}}, []]]
          )
        ).to.equal('<div data-foo="bar"></div>');
      });
    });
    /* eslint-enable no-template-curly-in-string -- See disable above */

    /* eslint-disable no-template-curly-in-string -- Intentional: `${...}`
       placeholder literals, not template literals. */
    describe('interpolateAttributes (allow/deny which attributes are ' +
      'eligible)', function () {
      it('with no config, every attribute is eligible (the default)',
        async function () {
          expect(
            await renderJSON(
              [['a', {href: '${$.key}'}, []]], {key: 'dog'}
            )
          ).to.equal('<a href="dog"></a>');
        });

      it('{allow: [...]} interpolates only the listed attributes, ' +
        'leaving others as literal text', async function () {
        expect(
          await renderJSON(
            [['a', {href: '${$.key}', title: '${$.key}'}, []]],
            {key: 'dog'},
            {},
            {},
            {interpolateAttributes: {allow: ['href']}}
          )
        ).to.equal('<a href="dog" title="${$.key}"></a>');
      });

      it('{deny: [...]} interpolates every attribute except the listed ' +
        'ones', async function () {
        expect(
          await renderJSON(
            [['a', {href: '${$.key}', title: '${$.key}'}, []]],
            {key: 'dog'},
            {},
            {},
            {interpolateAttributes: {deny: ['title']}}
          )
        ).to.equal('<a href="dog" title="${$.key}"></a>');
      });

      it('validateJSONTemplate does NOT flag a `${...}`-shaped string ' +
        'sitting in an attribute that is not eligible for interpolation ' +
        "— it's just a literal value there, possibly coincidental (e.g. " +
        'a currency template or CSS calc()-like string), not a mistake',
      function () {
        const {valid, errors} = validateJSONTemplate(
          [['a', {href: '${$.key}'}, []]],
          {interpolateAttributes: {allow: ['title']}}
        );
        expect(valid).to.equal(true);
        expect(errors).to.deep.equal([]);
      });

      it('compileJSONTemplate throws for a bad interpolateAttributes ' +
        'config (both allow and deny)', async function () {
        const error = await expectRejection((async () => {
          await renderJSON(
            [['a']], {}, {}, {},
            {interpolateAttributes: {allow: ['href'], deny: ['title']}}
          );
        })());
        expect(error.message).to.include('exactly one of');
      });

      it('compileJSONTemplate throws for a non-object interpolateAttributes',
        async function () {
          const error = await expectRejection((async () => {
            await renderJSON(
              [['a']], {}, {}, {},
              // @ts-expect-error Intentionally invalid for this test
              {interpolateAttributes: 'href'}
            );
          })());
          expect(error.message).to.include(
            'must be an object with exactly one of'
          );
        });

      it('compileJSONTemplate throws when allow/deny is not an array of ' +
        'non-empty strings', async function () {
        const error = await expectRejection((async () => {
          await renderJSON(
            [['a']], {}, {}, {},
            {interpolateAttributes: {allow: ['href', '']}}
          );
        })());
        expect(error.message).to.include(
          '`interpolateAttributes.allow` must be an array of non-empty'
        );
      });

      it('...and names `deny` instead of `allow` in that message when ' +
        'it was `deny` that was invalid', async function () {
        const error = await expectRejection((async () => {
          await renderJSON(
            [['a']], {}, {}, {},
            {interpolateAttributes: {deny: ['title', '']}}
          );
        })());
        expect(error.message).to.include(
          '`interpolateAttributes.deny` must be an array of non-empty'
        );
      });
    });
    /* eslint-enable no-template-curly-in-string -- See disable above */

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

    describe('extension calls (e.g. `{$greet: {...}}`)', function () {
      it(
        'passes the argument object through entirely unresolved — the ' +
        'extension itself calls `this.get(...)` for a `select` it defines',
        async function () {
          const out = await renderJSON(
            [[{$greet: {select: '$.user.name'}}]],
            {user: {name: 'Ada'}},
            {},
            {
              /** @param {{select: string}} argObject */
              greet (argObject) {
                this.text(`Hello, ${this.get(argObject.select, false)}!`);
              }
            }
          );
          expect(out).to.equal('Hello, Ada!');
        }
      );

      it(
        'passes through arbitrary literal fields alongside `select` ' +
        'unchanged — e.g. a `db`/`store` pair naming something other ' +
        'than the current data',
        async function () {
          const out = await renderJSON(
            [[{$greet: {select: '$.name', greeting: 'Hi'}}]],
            {name: 'Ada'},
            {},
            {
              /** @param {{select: string, greeting: string}} argObject */
              greet (argObject) {
                this.text(
                  `${argObject.greeting}, ${
                    this.get(argObject.select, false)
                  }!`
                );
              }
            }
          );
          expect(out).to.equal('Hi, Ada!');
        }
      );

      it('awaits an async extension', async function () {
        const out = await renderJSON(
          [[{$slowGreet: {}}]],
          {},
          {},
          {
            async slowGreet () {
              await Promise.resolve();
              this.text('Hello!');
            }
          }
        );
        expect(out).to.equal('Hello!');
      });

      it(
        'rejects a name not actually supplied via `extensions`, even one ' +
        'naming a real, built-in context method',
        async function () {
          const error = await expectRejection(
            renderJSON([[{$element: {}}]])
          );
          expect(error.message).to.include('not a registered extension');
        }
      );

      it('rejects a non-object extension-call value at validation time',
        function () {
          const {valid, errors} = validateJSONTemplate([
            [{$greet: 'not-an-object'}]
          ]);
          expect(valid).to.equal(false);
          expect(errors[0]).to.include('requires an object value');
        });
    });

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
      'rejects two unrecognized `$`-prefixed keys together (neither a ' +
      'built-in op — a single such key would instead be a candidate ' +
      'extension call, but two together can never both be extension calls)',
      async function () {
        await expectRejection(renderJSON([
          [{$notARealOp: {}, $alsoNotReal: {}}]
        ]));
      }
    );

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

  describe('extractReads() (the static reads extractor — ' +
    'ROUTE-OVERRIDES-PLAN.md §3.4, §13 decision 4)', function () {
    it('reports no reads for a template with no $indexedDB nodes',
      function () {
        expect(extractReads([['p', ['hi']]])).to.deep.equal(
          {reads: [], errors: []}
        );
      });

    it('finds a top-level $indexedDB target', function () {
      expect(extractReads([
        [{$indexedDB: {db: 'x', store: 'y'}}]
      ])).to.deep.equal({reads: [{db: 'x', store: 'y'}], errors: []});
    });

    it("finds a target nested inside an element's children", function () {
      expect(extractReads([
        ['div', [
          [{$indexedDB: {db: 'x', store: 'y'}}]
        ]]
      ])).to.deep.equal({reads: [{db: 'x', store: 'y'}], errors: []});
    });

    it('finds targets nested inside $if\'s then and else branches',
      function () {
        expect(extractReads([
          [
            {$if: '$flag'},
            [[{$indexedDB: {db: 'x', store: 'then'}}]],
            [[{$indexedDB: {db: 'x', store: 'else'}}]]
          ]
        ])).to.deep.equal({
          reads: [{db: 'x', store: 'then'}, {db: 'x', store: 'else'}],
          errors: []
        });
      });

    it("finds a target nested inside $forEach's children", function () {
      expect(extractReads([
        [{$forEach: '$.items[*]'}, [
          [{$indexedDB: {db: 'x', store: 'y'}}]
        ]]
      ])).to.deep.equal({reads: [{db: 'x', store: 'y'}], errors: []});
    });

    it("finds targets nested inside another $indexedDB node's own " +
      'children', function () {
      expect(extractReads([
        [{$indexedDB: {db: 'outer', store: 'a'}}, [
          [{$indexedDB: {db: 'inner', store: 'b'}}]
        ]]
      ])).to.deep.equal({
        reads: [{db: 'outer', store: 'a'}, {db: 'inner', store: 'b'}],
        errors: []
      });
    });

    it('deduplicates identical {db, store} targets', function () {
      expect(extractReads([
        [{$indexedDB: {db: 'x', store: 'y'}}],
        ['div', [
          [{$indexedDB: {db: 'x', store: 'y'}}]
        ]]
      ])).to.deep.equal({reads: [{db: 'x', store: 'y'}], errors: []});
    });

    it(
      'reports an error (not a silent omission) when $indexedDB\'s db is ' +
      'not a literal string',
      function () {
        // extractReads() takes untyped `unknown[]` nodes (like
        // validateJSONTemplate()), so this deliberately-invalid literal
        // needs no @ts-expect-error here — the whole point of both is
        // catching this at runtime, for a source that never went through
        // TypeScript at all (e.g. loaded back out of IndexedDB).
        const result = extractReads([
          [{$indexedDB: {db: 42, store: 'y'}}]
        ]);
        expect(result.reads).to.deep.equal([]);
        expect(result.errors).to.have.length(1);
      }
    );

    it(
      'reports an error when $indexedDB\'s store is not a literal string',
      function () {
        const result = extractReads([
          [{$indexedDB: {db: 'x', store: undefined}}]
        ]);
        expect(result.reads).to.deep.equal([]);
        expect(result.errors).to.have.length(1);
      }
    );

    it('rejects a non-array top level directly', function () {
      const result = extractReads(
        // @ts-expect-error -- deliberately invalid; see note above
        {not: 'an array'}
      );
      expect(result.reads).to.deep.equal([]);
      expect(result.errors).to.have.length(1);
    });

    it(
      'validateJSONTemplate()/compileJSONTemplate() reject a template ' +
      'whose $indexedDB target cannot be resolved statically, rather ' +
      'than silently treating it as "no read happens here"',
      async function () {
        const nodes = [
          [{$indexedDB: {db: 42, store: 'y'}}]
        ];
        expect(validateJSONTemplate(nodes).valid).to.equal(false);
        await expectRejection(
          // @ts-expect-error -- deliberately invalid; see note above
          renderJSON(nodes)
        );
      }
    );
  });
});
