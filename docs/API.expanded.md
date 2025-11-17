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
  path?: string;        // JSONPath or XPath expression (required for pattern-matching)
  mode?: string;        // Optional mode segregation
  priority?: number;    // Numeric priority (higher wins); fallback uses specificity resolver
  template(nodeValue, cfg): any; // Executed with `this` bound to context
}
```

Edge cases:
- Either `path` or `name` (or both) must be provided
- Templates with only `name` (no `path`) are callable only via `callTemplate`
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

### `XPathTransformer`

Same pattern for XML/HTML DOM data using XPath selectors.

Config additions:
- `xpathVersion`: `1` (native `XPathEvaluator`), `2` (`xpath2.js`), `3.1` (`fontoxpath`).
  Default `1`.

```js
import {XPathTransformer, StringJoiningTransformer} from 'jtlt';
// Assume `doc` is an XML Document
const joiner = new StringJoiningTransformer('');
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
- Versions 2 and 3 (`xpath2.js` and `fontoxpath`) may lack some XPath functions;
  stick to basic location paths and simple predicates.
- Namespace resolution not yet exposed (future `namespaceResolver` option).

## Contexts

### `JSONPathTransformerContext`

Methods (subset):
- `applyTemplates(select, mode?, sort?)`
- `forEach(select, cb, sort?)`
- `valueOf(select?)`
- `if(select, cb)` — conditionally execute `cb` when selection is truthy
  (non-empty result set or truthy scalar)
- `choose(select, whenCb, otherwiseCb?)` — like `if()`, but invokes
  `otherwiseCb` when the condition is not met (akin to xsl:choose +
  xsl:otherwise). Selection is evaluated relative to current context
  object (its own `$`).
- `variable(name, select)` – stores value/array from JSONPath.
- `callTemplate(name, withParam?)`
- `key(name, match, use)` / `getKey(name, value)`
- Joiner passthrough: `string()`, `text()`, `element()`, `object()`, `array()`, `number()`, `boolean()`, etc.
\- Cloning helpers:
  - `copy(propertySets?)` — Shallow clone of current context value (object/array). Nested references are preserved. Optional `propertySets` (array of registered names) merge into the top-level clone when object-like.
  - `copyOf(select?, propertySets?)` — Deep clone (prefers `structuredClone`; falls back to JSON + manual). When `select` is provided, clones that target instead of the current value; primitives append directly. Optional `propertySets` merge when cloning objects.

### `XPathTransformerContext`

Parallels JSONPath context with XPath evaluation:
- `get(select, asNodes?)` – returns node array when `asNodes=true` (v1 uses snapshot type; v2 coerces scalar to array).
- `forEach(select, cb)` – iterates matches.
- `applyTemplates(select, mode?)` – default initialization to `.` then `*` for subsequent calls.
- `if(select, cb)` — conditionally executes `cb` when XPath selects nodes
  (non-empty) or evaluates to a truthy scalar value. In XPath v1 environments
  without strict result typing, node-set existence is the primary check.
- `choose(select, whenCb, otherwiseCb?)` — same semantics as `if()` but with
  fallback callback when condition fails. Relative XPath resolves from the
  current context node; absolute paths (`/`, `//`) target the document root.
- `variable(name, select)` – always stores node arrays for XPath.
- `key(name, match, use)` – index by attribute value; `getKey` returns matching Element or context sentinel (`this`).
- Default template rules: root traverses `.`, element traverses `*`, text nodes emit `nodeValue`, scalars emit `valueOf('.')`.
\- Cloning helpers:
  - `copy()` — Shallow clone of the current context node (`cloneNode(false)`) appended to the joiner.
  - `copyOf(select?)` — Deep clone of each node matched by `select` (node-set) or the current node if omitted, using `cloneNode(true)`. If `select` yields a scalar, that scalar is appended. Document nodes in scalar fallback emit their `documentElement` text. Chainable.

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
- `document(cb, cfg?)` — Creates a new output document. Similar to XSLT's
  `xsl:document`, this allows templates to generate multiple output documents.
  The callback builds the document content, and optional `cfg` provides output
  configuration (encoding, doctype, etc.). When `exposeDocuments` is enabled,
  each document is added to the array returned by `get()`.
- `object(seed?, cb?, usePropertySets?, propSets?)`
- `array(seed?, cb?)`
- `element(name, attrs?, children?, cb?)`
- `attribute(name, value, avoidEscape?)`
- `text(str)` vs `string(str, cb?)` vs `plainText(str)`
- `number()`, `boolean()`, `null()`, `undefined()` (JS mode), `nonfiniteNumber()`, `function(fn)`

### document() method details

The `document()` method creates a new output document in isolation:

**DOM Joiner**: Creates a new XMLDocument with proper declaration and DOCTYPE
when configured via `output()`.

**JSON Joiner**: Creates a new document wrapper object with `$document` property
containing the Jamilih representation.

**String Joiner**: Creates a new document string with XML declaration and
DOCTYPE when configured.

**Signature**: `document(callback, outputConfig?)`

**Example**:
```js
joiner.document(() => {
  joiner.output({
    method: 'xml',
    version: '1.0',
    encoding: 'utf8',
    doctypePublic: '-//W3C//DTD XHTML 1.0//EN',
    doctypeSystem: 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
  });
  joiner.element('html', {xmlns: 'http://www.w3.org/1999/xhtml'}, () => {
    joiner.element('head', {}, () => {
      joiner.element('title', {}, () => {
        joiner.text('Document 1');
      });
    });
  });
});

joiner.document(() => {
  joiner.element('html', {}, () => {
    joiner.element('body', {}, () => {
      joiner.text('Document 2');
    });
  });
});

// When exposeDocuments is true, get() returns array of documents
const docs = joiner.get();
```

The method preserves the current joiner state, resets it for the new document,
executes the callback, captures the result, then restores the previous state.

### resultDocument() method details

The `resultDocument()` method creates output documents with associated metadata,
paralleling XSLT's `xsl:result-document` functionality. Unlike `document()`,
which stores documents in `_docs`, `resultDocument()` stores them in
`_resultDocuments` with metadata including href URI and output format.

**DOM Joiner**: Creates XMLDocument with href and format metadata.

**JSON Joiner**: Creates document wrapper object or raw JSON with metadata.

**String Joiner**: Creates document string with XML/HTML markup and metadata.

**Signature**: `resultDocument(href, callback, outputConfig?)`

**Parameters**:
- `href` (string): URI or path for the result document (e.g., `'output/page1.html'`)
- `callback` (function): Builds the document content with `this` bound to joiner
- `outputConfig` (optional): Output configuration (encoding, doctype, method, etc.)

**Result document structure**:
```ts
{
  href: string,        // The URI/path provided
  document: any,       // The generated document (XMLDocument, object, or string)
  format: string       // Output format from config.method ('xml', 'html', 'text', 'xhtml', 'json')
}
```

**Example use case - Multi-page site generation**:
```js
const pages = [
  {title: 'Home', slug: 'index', content: 'Welcome'},
  {title: 'About', slug: 'about', content: 'About us'},
  {title: 'Contact', slug: 'contact', content: 'Get in touch'}
];

pages.forEach((page) => {
  joiner.resultDocument(`output/${page.slug}.html`, () => {
    joiner.output({
      method: 'html',
      doctypePublic: '-//W3C//DTD XHTML 1.0 Strict//EN',
      doctypeSystem: 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
    });
    joiner.element('html', {xmlns: 'http://www.w3.org/1999/xhtml'}, () => {
      joiner.element('head', {}, () => {
        joiner.element('title', {}, () => {
          joiner.text(page.title);
        });
      });
      joiner.element('body', {}, () => {
        joiner.element('h1', {}, () => {
          joiner.text(page.title);
        });
        joiner.element('p', {}, () => {
          joiner.text(page.content);
        });
      });
    });
  });
});

// Write each result document to its href location
joiner._resultDocuments.forEach((result) => {
  fs.writeFileSync(result.href, result.document);
  console.log(`Generated: ${result.href} (${result.format})`);
});
```

**Interoperability**: `document()` and `resultDocument()` can be used together in
the same transformation. `document()` populates `_docs` (accessible via `get()`
when `exposeDocuments` is true), while `resultDocument()` populates
`_resultDocuments` with metadata.

### Output configuration and formats

Joiners accept an output configuration via `output(cfg)` and within `document()`/`resultDocument()`.

- `cfg.method`: one of `xml`, `html`, `text`, `xhtml`, or `json`.
  - `xml` and `xhtml` are XML-like: an XML declaration is emitted unless `omitXmlDeclaration` is true; DOCTYPE is included when `doctypePublic` or `doctypeSystem` is provided. For the JSON joiner, DOCTYPE entries are included in `$document.childNodes` only when `method` is `xml` or `xhtml`.
  - `html` emits HTML; the String and DOM joiners serialize accordingly. The JSON joiner does not include a DOCTYPE node in its `$document` wrapper for `html`.
  - `text` emits raw text (no element wrappers). The JSON joiner will not add DOCTYPE; the String joiner writes plain strings.
  - `json` indicates a JSON-centric output; for the JSON joiner, this is the natural mode and does not add XML declarations or DOCTYPE.
- `omitXmlDeclaration`: when false (or for `xml`/`xhtml` with default), include XML declaration with optional `version`, `encoding`, `standalone`.
- `doctypePublic`/`doctypeSystem`: when provided and `method` is `xml`/`xhtml`, include a DOCTYPE entry.

Notes for JSON joiner with `exposeDocuments`:

- When `exposeDocuments` is enabled in the joiner config, `get()` returns an array of `$document` wrappers. Each wrapper has a `childNodes` array where the root element is the last entry; the first entry may be a DOCTYPE object when `method` is `xml` or `xhtml`.
- For `html`, `text`, or `json` methods, no DOCTYPE is included in the JSON wrapper by default.

### Mode configuration

Similar to XSLT's `xsl:mode` element with the `on-multiple-match` and `warning-on-multiple-match` attributes, the `mode(cfg)` method configures template matching behavior when multiple templates match a node with equal priority:

**Signature**: `mode({onMultipleMatch?, warningOnMultipleMatch?})`

**Parameters**:
- `onMultipleMatch`: Controls behavior when multiple templates match with equal priority:
  - `"use-last"` (default): Uses the first template after sorting (maintains current behavior where the first template in the array wins).
  - `"fail"`: Throws an error when multiple templates have equal priority.
- `warningOnMultipleMatch` (boolean): When `true`, emits a console warning when multiple templates match with equal priority, but continues processing. This is independent of `onMultipleMatch`.

**Examples**:
```js
// Strict mode - throw error on ambiguous matches
this.mode({onMultipleMatch: 'fail'});
this.applyTemplates('$.items[*]');

// Development mode - warn but continue
this.mode({warningOnMultipleMatch: true});
this.applyTemplates('$.items[*]');

// Can combine both (warning comes before error check)
this.mode({onMultipleMatch: 'fail', warningOnMultipleMatch: true});
this.applyTemplates('$.items[*]');
```

**Use cases**:
- **Strict template matching**: Use `onMultipleMatch: 'fail'` where ambiguous matches should be caught as errors during development rather than silently choosing a template based on array order.
- **Development debugging**: Use `warningOnMultipleMatch: true` during development to identify potential template conflicts without breaking the transformation.

**Comparison to XSLT**: In XSLT 3.0, `<xsl:mode on-multiple-match="fail">` raises an error when multiple template rules match with the same priority and import precedence, while `<xsl:mode warning-on-multiple-match="yes">` emits a warning. JTLT's `mode()` method provides similar functionality for both JSONPath and XPath-based transformations.

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
