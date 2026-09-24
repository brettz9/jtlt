# CHANGES for jtlt

## 0.25.0

- chore: update jsdom, jsonpath-plus, devDeps.

## 0.24.2

- chore: update simple-get-json

## 0.24.1

- fix: avoid fragile use of combined string (with NUL byte) as key
- chore: update codemirror/state (though moving with other codemirror to devDeps), jamilih, jsdom, devDeps

## 0.24.0

- feat: the declarative `{$variable: name, $select}` node now also accepts
  a literal `$value` (`{$variable: name, $value: literal}`), mirroring the
  JS-API-level `variable()`'s existing `{value}` form — lets a template
  bind a literal array/object embedded directly in the template itself
  (e.g. a fixed collection list), not just a value fetched from `data`/
  `params`/`$indexedDB`. `$forEach`'s own bare-`$name` convention then
  iterates it directly (`$forEach: '$name'`). When both `$select` and
  `$value` are given, `$value` wins (matching `variable()`'s own
  `_paramSpec` precedence) — not a documented shape to combine
  intentionally, just parity with the existing JS-API tiebreak.
- feat: `forEach()` (and the declarative `{$forEach: sel, $key?: name}`
  node) now accepts an optional `keyVar`/`$key` name that binds each
  iteration's key — the array index, or (for an object-wildcard select
  like `$.*`) the object property name, from jsonpath-plus's own
  `parentProperty` on a `resultType: 'all'` match — for the duration of
  that iteration, readable back via a bare `$name` reference (same
  convention as `variable()`). This is what lets a template render
  "property: value" pairs while iterating an object's own properties, or
  skip one property by name via `$if` (e.g. `{$if: "$prop !== 'blob'"}`)
  — jsonpath-plus's match data already carried this key; `forEach()`
  itself was simply discarding it. A bare-`$name` (bound-variable)
  iteration over an array also now gets its own index as the key; a
  non-array bound value (treated as a length-1 sequence) has no
  meaningful key.

## 0.23.0

- feat: `${sel}` template-literal-style interpolation for a declarative
  (jamilih-shaped) element's string-valued attributes, e.g. `['a', {href:
  '/words/${$.key}'}, ['dog']]`. Each `${sel}` placeholder is resolved via
  `ctx.get(sel.trim(), false)` at runtime and coerced to a string
  (`null`/`undefined` becomes `''`, not the literal "null"/"undefined");
  a value with no `${` at all is returned unchanged. Combined with
  jamilih's own `innerHTML` magic attribute (already accepted at
  validation time, just not previously *executed* correctly — see below),
  this covers "raw HTML from a data value" too, e.g. `{innerHTML:
  '${$.definitionHtml}'}` — no separate operation is needed.
- feat: new `interpolateAttributes` option (`compileJSONTemplate`,
  `validateJSONTemplate`, and the `TemplateObject`/config-wide
  `defaultInterpolateAttributes` fallback) restricts which element
  attribute names `${sel}` interpolation applies to: `{allow: [...]}` or
  `{deny: [...]}`. Every string-valued attribute is eligible when omitted
  (the default, backward-compatible behavior). A `${...}`-shaped literal
  string sitting in an ineligible attribute is not flagged as an error —
  it may just as well be a coincidental literal value (e.g. a currency
  template or CSS `calc()`-like string) — it simply renders as literal
  text.
- fix: `innerHTML` (jamilih's own magic attribute key, already accepted by
  `isValidJamilih` at validation time) was never actually given raw-HTML
  treatment by the *execution* engine — `StringJoiningTransformer`'s
  callback-driven `element()` path rendered it as a literal
  `innerHTML="..."` attribute, and `DOMJoiningTransformer`'s `element()`
  called `setAttribute('innerHTML', ...)`, which does nothing useful on a
  real DOM element. Both now special-case `innerHTML` to match jamilih's
  own real DOM builder (`jml.js`): `StringJoiningTransformer` appends the
  value as raw, unescaped content, and `DOMJoiningTransformer` sets
  `element.innerHTML = value` directly (real, browser-parsed HTML nodes).
  `JSONJoiningTransformer` output needed no change — its output already
  *is* a jamilih-shaped structure, where `innerHTML` staying a literal
  attribute key is correct (a later `jml()` call handles it).

## 0.22.0

BREAKING: Changes extension system to provide extensions with the full argument rather than assigning a special meaning to `select` and passing only its value.

- feat: extension-call declarative operation nodes — any operation-node key
  not otherwise recognized, e.g. `{$greet: {select: '$.path'}}`, calls a
  named function of that same name from `config.extensions` (`ctx[name]
  (argObject)`, the argument object passed through entirely unresolved —
  no key, including a conventional `select`, is interpreted by jtlt itself;
  the extension reads whatever it needs via `this.get(...)`, `this.valueOf
  (...)`, etc. — the argument is an object, matching `$indexedDB`'s own
  convention, so a call can carry any number of named fields, e.g. `{select,
  db, store}`). Restricted at runtime to names actually present in
  `config.extensions` (tracked via a new `context._extensionNames` `Set`,
  populated by `applyExtensions`): a declarative `behavior` — e.g. an
  admin-authored, untrusted template — can never invoke an arbitrary
  built-in context method (`element`, `indexedDB`, etc.) by name this way.
  Like `$renderDefault`, the extension itself is responsible for inserting
  any output (e.g. via `this.appendOutput(...)`); the interpreter never does
  so on its behalf. Trade-off: because any not-otherwise-recognized
  `$`-prefixed key becomes a live extension name, a future jtlt release
  adding a new built-in operation could collide with an extension name a
  consumer already uses — consumers documenting their extension names
  ([jtlt's wiki](https://github.com/brettz9/jtlt/wiki/Extension-registry) is
  reserved for this purpose) are encouraged to also list jtlt's own reserved
  op keys as names to avoid.

## 0.21.0

- feat: extension-call declarative operation nodes — any operation-node key
  not otherwise recognized, e.g. `{$greet: {select?: '$.path'}}`, calls a
  named function of that same name from `config.extensions` (`ctx[name]
  (value)`, `value` from `select`, or the current `$` context data when
  `select` is omitted — the argument is an object, matching `$indexedDB`'s
  own convention, leaving room for more named fields later). Restricted at
  runtime to names actually present in `config.extensions` (tracked via a
  new `context._extensionNames` `Set`, populated by `applyExtensions`): a
  declarative `behavior` — e.g. an admin-authored, untrusted template — can
  never invoke an arbitrary built-in context method (`element`, `indexedDB`,
  etc.) by name this way. Like `$renderDefault`, the extension itself is
  responsible for inserting any output (e.g. via `this.appendOutput(...)`);
  the interpreter never does so on its behalf. Trade-off: because any
  not-otherwise-recognized `$`-prefixed key becomes a live extension name, a
  future jtlt release adding a new built-in operation could collide with an
  extension name a consumer already uses — consumers documenting their
  extension names ([jtlt's wiki](https://github.com/brettz9/jtlt/wiki/Extension-registry) is reserved for this purpose)
  are encouraged to also list jtlt's own reserved op keys as names to avoid.
- fix: `_autoStart`'s `transform()` call discarded its returned promise
  entirely, so a rejection (e.g. a template throwing) became a silently
  swallowed unhandled rejection instead of surfacing anywhere — `await
  jtlt({...})` would hang forever rather than reject. Added a new `error`
  config option (alongside the existing `success`) and wired a `.catch()` in
  `_autoStart` that calls it (or falls back to `console.error`); the `jtlt()`
  convenience function now rejects its promise via `error` on failure
  instead of hanging.

## 0.20.0

- fix: `ObjectCallback` / `ArrayCallback` / `SimpleCallback` (in the String/
  DOM/JSON joining transformers) mis-emitted in `dist/*.d.ts` — a `@callback`
  tag combined with `@this` produced raw, unparsed JSDoc text instead of a
  proper `this:` function-type parameter (present since these typedefs were
  introduced; only surfaced once a consumer's own JSDoc first referenced a
  jtlt type — `dist/index.d.ts`'s `import('jtlt')...` was otherwise never
  loaded for type-checking). Switched to the equivalent `@typedef {(this:
  ...) => ...}` function-type form (already used successfully elsewhere,
  e.g. `TemplateFunction`), which emits correctly.
- feat: `extractReads(nodes)`, exported alongside `compileJSONTemplate` /
  `validateJSONTemplate` / `isJSONTemplateNodeArray` — statically derives
  the deduplicated `{db, store}` targets a declarative template's
  `$indexedDB` nodes touch, walking the whole tree (element children,
  `$if`/`$forEach` bodies, another `$indexedDB` node's own children — not
  just the top level). Total: an `$indexedDB` node whose `db`/`store` isn't
  a literal, non-empty string is reported as an error rather than silently
  omitted from the result. `validateJSONTemplate()` folds these errors in
  automatically, so `compileJSONTemplate()` rejects an unresolvable target
  too, not just a standalone `extractReads()` caller.

## 0.19.0

- feat: declarative jamilih node format

## 0.18.0

- feat: `this.if()` / `choose()` / `assert()` accept a simple, non-`eval`
  binary comparison as their test, e.g. `this.if('$name === "x"')` or
  `this.if('$count < 50')` — a bare `$name` parameter (or, for the JSONPath
  engine, a plain dotted/indexed `$...` path) on the left, one of
  `===` / `!==` / `==` / `!=` / `<` / `<=` / `>` / `>=`, and a string,
  number, boolean, `null`, or `undefined` literal on the right; anything
  more complex is left to the JSONPath/XPath engine

## 0.17.0

- feat: `this.if('$name', ...)` (and `choose()`/`assert()`) test a parameter
  — local, with-param, or `config.params` runtime — when passed a bare
  `$name` reference rather than a path expression

## 0.16.0

- feat: `this.param(name, default)` (`xsl:param`) declares a parameter whose
  default is overridden by a caller's with-param or by a `config.params`
  runtime value; `this.withParam(name, value)` (`xsl:with-param`) stages
  values for the next `callTemplate()`/`applyTemplates()`; `config.params`
  runtime values are also visible as `$name` in any template

## 0.15.0

- feat: allow custom extensions
- feat(types): `jtlt/context-extensions` `ContextExtensions` interface;
  augment it via declaration merging so `extensions` helpers type-check on
  `this` inside templates without suppressions
- chore: bump codemirror/state, jamilih, and devDeps.

## 0.14.0

- feat: indexedDB JSONPath and XPath support
- feat: async templates are awaited by default; new off-by-default `sync`
  option throws instead (replaces `async`/`syncOnly`)
- fix: `getKey()` resolves its `match` against the document root, so it now
  works inside `forEach()`/`applyTemplates()` callbacks
- fix(types): more precise typing (any -> unknown)
- docs: lead with the `jtlt()` function; correct examples

## 0.13.0

- fix(types): more precise typing
- chore: update deps and devDeps

## 0.12.0

- feat: allow `sequence` for this.function

## 0.11.0

- feat: change `this.function` to `outputFunction` and add new `this.function`

## 0.10.0

- feat: add `stylesheet` (and `transform` alias)

## 0.9.0

- feat: add `match` as alias to our `path`
- feat: `mode()` (`onMultipleMatch`, `warningOnMultipleMatch`,
  `onNoMatch`, `warningOnNoMatch`)

## 0.8.0

- feat: `namespaceAlias` and allow #default for `namespace`

## 0.7.3

- fix: `valueOf` should work like text() in auto-closing tags

## 0.7.2

- fix: restore context after `applyTemplates`

## 0.7.1

- fix: ensure context methods available within callbacks

## 0.7.0

- feat: `stripSpace` and `preserveSpace`

## 0.6.0

- feat: add `map` and `mapEntry` aliases to `object` and `propValue`
- feat: `attributeSet()`
- feat: `assert()`
- fix: functional `usePropertySets` argument with DOM joining transformer

## 0.5.0

- feat: `forEachGroup`
- feat: `characterMap` and element fixes
- feat: `namespace()`
- feat: `decimalFormat()`
- fix: `valueOf` and context when no arguments to `applyTemplates()`
- fix: add childNodes argument to dom joining transformer

## 0.4.0

- feat: `number()` enhancements
- feat: `analyzeString()`
- feat: xpath 3.1
- feat: demo
- fix: set XPath default query to `//*`
- fix(types): outputType

## 0.3.0

- feat: `if()`
- feat: `choose()`
- feat: propSets for DOM
- feat: add `comment()` and `processingInstruction()`
- feat: optional `path` may be omitted when `name` present (named-only templates)
- feat: XPath `copy()` (shallow) and `copyOf(select?)` (deep cloning / scalar append)
- feat: JSONPath cloning docs expanded (existing `copy`/`copyOf` clarified)
- fix: avoid appending `undefined` from `callTemplate` when template returns nothing
- fix: parameter fallback in `valueOf` for JSONPath param access
- fix: scalar XPath `copyOf()` prevents DOM hierarchy errors when expression returns Document
 - feat: add `exposeDocuments` option
 - feat: callTemplate in XPath
 - feat: add `document()` (XSLT `xsl:document`-like) and `resultDocument()` (XSLT `xsl:result-document`-like) to all joiners
 - feat: support `output({method})` values `json` and `xhtml` across joiners
 - change: JSON joiner `$document` wrapper includes DOCTYPE only when `method` is `xml` or `xhtml`; XML declaration emitted for `xml`/`xhtml` unless `omitXmlDeclaration`

## 0.2.0

- fix: point to `types` and add `exports`

## 0.1.0

- Initial version
