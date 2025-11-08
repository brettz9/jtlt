# API (Expanded)

This document describes the public API surface of JTLT (JavaScript Template Language Transformations), including the JSONPath and experimental XPath engines, execution contexts, and joiners.

> Early alpha: APIs may evolve; experimental sections (XPath) can change without major version bumps.

## Core façade: `JTLT`

High-level entry point for running a transform over JSON data using JSONPath.

```js
import JTLT from 'jtlt';

const out = new JTLT({
  data: {title: 'Hello'},
  outputType: 'string',
  templates: [
    {
      path: '$.title',
      template (v) {
        this.string('<h1>', () => this.text(v));
        this.string('</h1>');
      }
    }
  ],
  success: (res) => res
}).transform('');
```

### `new JTLT(config)` options

| Option | Type | Description |
| ------ | ---- | ----------- |
| `data` | any | Root JSON/JS object. Required unless `ajaxData` provided. |
| `ajaxData` | string | URL to fetch JSON (async start). |
| `templates` | Array<TemplateObject> | Template declarations; see below. |
| `template` | Function \| TemplateObject | Single root template convenience. |
| `query` | Function | Root template convenience (wrapped as `path: '$'`). |
| `forQuery` | [select, cb] | One-off query (like FLWOR `for`). Auto-wrapped as root template. |
| `success` | Function(result) | Required callback; also receives transform return. |
| `mode` | string | Starting mode for template matching. |
| `outputType` | 'string' \| 'dom' \| 'json' | Chooses joiner. Default 'string'. |
| `joiningTransformer` | Joiner instance | Custom joiner; skip auto creation. |
| `joiningConfig` | object | Passed to joiner (e.g., `{xmlElements:true}`). |
| `unwrapSingleResult` | boolean | For JSON joiner: unwrap single-item root array. |
| `errorOnEqualPriority` | boolean | Throw when multiple templates share priority on a node. |
| `specificityPriorityResolver` | fn(path)=>number | Custom resolver for relative priorities. Defaults to XSLT-like JSONPath resolver. |
| `engine` | fn(config)=>any | Override transform engine (defaults to JSONPathTransformer). |
| `autostart` | boolean | If `false`, don’t auto-call `transform()` in constructor. |
| `preventEval` | boolean | Disable parenthetical eval portions of JSONPath (security). |

## Template objects

```ts
interface TemplateObject {
  name?: string;        // Optional identifier (for callTemplate)
  path: string;         // JSONPath or XPath expression
  mode?: string;        // Optional mode segregation
  priority?: number;    // Numeric priority (higher wins); fallback uses specificity resolver
  template(nodeValue, cfg): any; // Executed with `this` bound to context
}
```

Edge cases:
- For JSONPath: `path` examples: `$.items[*]`, `$['prop']`, `$..deep`.
- For XPath: `//item`, `/root/item`, `//*[@id='x']`.
- Root template: path `$` (JSONPath) or `/` (XPath).

## Engines

### `JSONPathTransformer`

Applies JSONPath-based templates over JSON data.

```js
import {JSONPathTransformer} from 'jtlt';
const engine = new JSONPathTransformer({data, templates});
const out = engine.transform('html');
```

Responsibilities:
- Selects matching templates for current node + mode.
- Sorts by priority (numeric or specificity resolver).
- Invokes winning template; falls back to default rules when no match.

### `XPathTransformer` (experimental)

Same pattern for XML/HTML DOM data using XPath selectors.

Config additions:
- `xpathVersion`: `1` (native `XPathEvaluator`), `2` (`xpath2.js`). Default `1`.

```js
import {XPathTransformer, StringJoiningTransformer} from 'jtlt';
// Assume `doc` is an XML Document
const joiner = new StringJoiningTransformer('', {document: doc});
const templates = [
  {
    name: 'root',
    path: '/',
    template () {
      this.applyTemplates('//item');
    }
  },
  {
    name: 'item',
    path: '//item',
    template (node) {
      this.element('li', {}, [], () => this.text(node.textContent));
    }
  }
];
const engine = new XPathTransformer({
  data: doc,
  templates,
  joiningTransformer: joiner,
  xpathVersion: 1
});
const out = engine.transform('');
```

Limitations:
- Version 2 (`xpath2.js`) may lack some XPath 2.0 functions; stick to basic location paths and simple predicates.
- Namespace resolution not yet exposed (future `namespaceResolver` option).

## Contexts

### `JSONPathTransformerContext`

Methods (subset):
- `applyTemplates(select, mode?, sort?)`
- `forEach(select, cb, sort?)`
- `valueOf(select?)`
- `if(select, cb)` — conditionally execute `cb` when selection is truthy
  (non-empty result set or truthy scalar)
- `variable(name, select)` – stores value/array from JSONPath.
- `callTemplate(name, withParam?)`
- `key(name, match, use)` / `getKey(name, value)`
- Joiner passthrough: `string()`, `text()`, `element()`, `object()`, `array()`, `number()`, `boolean()`, etc.

### `XPathTransformerContext`

Parallels JSONPath context with XPath evaluation:
- `get(select, asNodes?)` – returns node array when `asNodes=true` (v1 uses snapshot type; v2 coerces scalar to array).
- `forEach(select, cb)` – iterates matches.
- `applyTemplates(select, mode?)` – default initialization to `.` then `*` for subsequent calls.
- `if(select, cb)` — conditionally executes `cb` when XPath selects nodes
  (non-empty) or evaluates to a truthy scalar value. In XPath v1 environments
  without strict result typing, node-set existence is the primary check.
- `variable(name, select)` – always stores node arrays for XPath.
- `key(name, match, use)` – index by attribute value; `getKey` returns matching Element or context sentinel (`this`).
- Default template rules: root traverses `.`, element traverses `*`, text nodes emit `nodeValue`, scalars emit `valueOf('.')`.

## Sorting API

Both `applyTemplates` and `forEach` accept a `sort` parameter.

Types:
1. String JSONPath (or XPath) – ascending text compare of selected values.
2. Function comparator `(a, b) => number`.
3. Object spec:
   ```js
   const sortSpec = {
     select: '$.price',
     // type can be 'number' or 'text'
     type: 'number',
     // order can be 'ascending' or 'descending'
     order: 'ascending',
     // optional Intl collation/language options
     locale,
     localeOptions
   };
   ```
4. Array of string/object specs for multi-key sorting.

Numeric sorting treats non-numeric or `NaN` values with stable ordering (equal falls back to next spec or preserves order).

## Keys (Indexing)

`key(name, match, use)` builds an index of nodes/items by an attribute/property value. Later `getKey(name, value)` performs O(1) lookup. If not found, JSONPath returns context object; XPath returns context (`this`). Check identity to skip.

Example (join):
```js
ctx.key('customerById', '$.customers[*]', 'id');
const c = ctx.getKey('customerById', order.customerId);
if (c !== ctx) {
  // emit joined row
}
```

## Variables

`variable(name, select)` caches selection results:
- JSONPath: plain value or array depending on path.
- XPath: node array (even single result).

Use variables to avoid repeated path evaluation inside loops.

## Property sets

`propertySet(name, obj, useNames?)` registers a named property object; `useNames` merges listed sets into base.
`_usePropertySets(obj, name)` (internal) merges a set into `obj`.

Use within joiner object building:
```js
ctx.propertySet('base', {role: 'user'});
ctx.propertySet('admin', {priv: 'all'}, ['base']);
// Later inside object-building
ctx.object({}, () => {
  ctx.propSets = ['admin'];
});
```

## Default template rules

When no user template matches:
- JSONPath: objects iterate property names / values; arrays iterate members; functions emit return value; primitives emitted directly; property-names mode concatenates keys.
- XPath: element nodes traverse children; text nodes emit text; scalars emit value via `valueOf('.')`.

## Joiners

### `StringJoiningTransformer`
- Builds a string; supports HTML/XML element creation (`element`, `attribute`, `text`). Maintains object/array state for structured emission when in JavaScript/JSON modes.

### `DOMJoiningTransformer`
- Builds a `DocumentFragment` or `Element` tree; `element`/`attribute` create real nodes; `text` appends text nodes.

### `JSONJoiningTransformer`
- Builds real JS values; `object`/`array` manage scope; primitives appended directly. `attribute` no-op; `text` no-op; `plainText` maps to string append.

Common joiner methods summary:
- `append(value)`
- `get()`
- `object(seed?, cb?, usePropertySets?, propSets?)`
- `array(seed?, cb?)`
- `element(name, attrs?, children?, cb?)`
- `attribute(name, value, avoidEscape?)`
- `text(str)` vs `string(str, cb?)` vs `plainText(str)`
- `number()`, `boolean()`, `null()`, `undefined()` (JS mode), `nonfiniteNumber()`, `function(fn)`

## Error handling

- Equal priority templates: either last wins (default) or error if `errorOnEqualPriority=true`.
- Missing `success` callback on `JTLT` transform: throws TypeError.
- Missing data and ajaxData: throws.
- XPath v1 without native evaluator: throws "Native XPath unavailable".
- `propValue` outside object state, `propOnly` misuse, attribute after tag closed: throw.

## Performance notes

- Prefer variables and keys for repeated lookups.
- Sorting with multiple specs incurs multiple value extractions; cache via variables when repeated.
- JSONPath recursive descent (`..`) more expensive; target precise paths when possible.

## Examples

See `README.md` for FLWOR-style and join patterns.

## Roadmap (selected)

- Namespace support for XPath.
- Copy helpers (deep/shallow) parity with XSLT.
- Streaming / async query execution.
- Schema-aware template targeting.

## Versioning

Experimental features (XPath) are subject to change until stabilized; check changelog before relying in production.
