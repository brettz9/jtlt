# API (Concise Overview)

For the full reference (engines, contexts, joiners, sorting, keys, variables,
property sets, defaults, roadmap), see `docs/API.expanded.md`.

## Facade: JTLT

```js
import JTLT from 'jtlt';
new JTLT({
  data: {title: 'Hi'},
  templates: [
    {path: '$.title', template (v) {
      this.string('<h1>', () => this.text(v));
      this.string('</h1>');
    }}
  ],
  outputType: 'string',
  success: (out) => out
}).transform('');
```

## Engines

- JSONPathTransformer: on JSON with JSONPath selectors; resolves
	priority and falls back to defaults when no template matches.
- XPathTransformer (experimental): on XML/HTML DOM. Choose
	`engineType: 'xpath'` on JTLT and set `xpathVersion: 1 | 2`.

## Context basics

`applyTemplates(select?, mode?)`, `forEach(select, cb)`, `valueOf(path?)`,
`variable(name, select)`, `key(name, match, use)`, `getKey(name, value)`.
JSONPath variables store values; XPath variables store arrays of nodes.

Cloning:
`copy()` (shallow clone current JSON value or DOM node) and
`copyOf(select?)` (deep clone; optional selector overrides target; scalar
selectors append the scalar). JSONPath deep cloning uses `structuredClone`
fallbacks; XPath uses `cloneNode(true)`.

Conditional execution:
- `if(select, cb)` — runs `cb` when the selector matches (non-empty
  result set) or coerces to a truthy scalar.
- `choose(select, whenCb, otherwiseCb?)` — like `if()`, but also runs
  `otherwiseCb` when the condition fails.

## Joiners

StringJoiningTransformer, DOMJoiningTransformer, JSONJoiningTransformer with
helpers: `string`, `text`, `element`, `attribute`, `object`, `array`,
`number`, `boolean`, `plainText`, `append`, `get`, `document`.

### document() method

Similar to XSLT's `xsl:document`, the `document()` method allows templates to
generate multiple output documents. It accepts a callback that builds the
document content, and an optional output configuration.

**Signature**: `document(callback, outputConfig?)`

When `exposeDocuments` is enabled, each document created with `document()` is
added to the array returned by `get()`.

**Example**:
```js
joiner.document(() => {
  joiner.output({method: 'xml', version: '1.0'});
  joiner.element('doc1', {}, () => {
    joiner.text('First document');
  });
});

joiner.document(() => {
  joiner.element('doc2', {}, () => {
    joiner.text('Second document');
  });
});

const docs = joiner.get(); // Returns array of 2 documents
```

## Sorting

Path string (ascending text), comparator function, object spec
`{select, type, order}`, or array of specs.

## Keys

`key(name, match, use)` builds an index; `getKey(name, value)` returns the
match or the context sentinel if missing.

## Variables & valueOf

`variable(name, select)` caches a selection. `valueOf(path)` returns the first
match or current node when no path is given.

## Property sets

Register with `propertySet(name, obj, extendNames?)`. Inside `object()` set
`propSets = ['name']` to activate.

## Defaults

- JSONPath: objects traverse properties; arrays iterate items; primitives
	emit; functions call and emit return.
- XPath: elements traverse children; text emits value; scalars use
	`valueOf('.')`.

See `API.expanded.md` for details and examples.
