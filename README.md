# jtlt

JavaScript Template Language Transformations (JTLT, pronounced as
"Jetlet")—a JavaScript equivalent of [XSLT](https://www.w3.org/Style/XSL/),
for JSON/JavaScript object or XML data sources.

As with XSLT, allows for declarative, linear declaration of
(recursive) templates and can be transformed into different
formats (e.g., strings, JSON, or DOM objects).

***Beta state!!!***

See the [Demo](https://brettz9.github.io/jtlt/demo/).

## Credits

Packaged with [JSONPath Plus](https://github.com/s3u/JSONPath).

The sample file is from <https://goessner.net/articles/JsonPath/>

## Installation

```shell
npm install jtlt
```

In the browser, you will also need to include the dependencies.
See the [test file](./test/browser/index.html).

## Basic usage

### Node

### Browser

## API

See the [docs](docs/API.md). A high‑level overview is below.

## API overview

JTLT has two layers:

- Engine (template application):
    - JSONPathTransformer: Applies templates to JSON by matching JSONPath selectors (and optional modes), resolving priority, and invoking the winning template. Falls back to built‑in default rules when no user template matches.
    - JSONPathTransformerContext: The execution context passed to templates. It mirrors the joiner API (e.g., string(), object(), array()) so templates can emit results. It also provides helpers like applyTemplates(), callTemplate(), valueOf(), variable(), and forEach().
    - XPathTransformer (experimental): Applies templates to
      XML/HTML DOM by matching XPath selectors (and optional modes).
      Supports two evaluation modes: version 1 (native
      XPathEvaluator) and version 2 (via xpath2.js). Falls back to
      built‑in default rules when no template matches.
    - XPathTransformerContext (experimental): Execution context for
      XPath. Offers get(), forEach(), valueOf(), variable(), key()
      and the same joiner helpers as the JSONPath context.

- Joiners (output builders):
    - StringJoiningTransformer: Builds a string. Context‑aware append() routes into objects/arrays when inside object()/array() scopes, otherwise concatenates to a buffer. Includes element(), attribute(), and text() helpers for HTML/XML emission.
    - DOMJoiningTransformer: Builds a DocumentFragment/Element tree. element()/attribute()/text() add real nodes; primitives append as text nodes.
    - JSONJoiningTransformer: Builds real JS values (objects/arrays/primitives) without serialization.

### Output formats and multi-document

- Output formats supported via `output({method})`: `xml`, `html`, `text`, `xhtml`, and `json`.
  - `xml`/`xhtml` behave like XML: XML declaration (unless omitted) and optional DOCTYPE.
  - `html` is HTML‑centric; `text` is raw text; `json` is JSON‑centric (no XML declaration/DOCTYPE).
- Multi-document APIs:
  - `document(cb, cfg?)`: Create additional documents; when a joiner is configured with `{exposeDocuments: true}`, `get()` returns an array of documents.
  - `resultDocument(href, cb, cfg?)`: Create additional documents with metadata (`href`, `format`, and `document`) accessible on `joiner._resultDocuments`.

### Common joiner methods

- append(value): Central sink. Based on context, concatenates to string, pushes to array, or assigns to an object property.
- get(): Return the accumulated result.
- object(obj?, cb?, usePropertySets?, propSets?): Enter object context; optionally seed from an object or build via cb.
- array(arr?, cb?): Enter array context; optionally seed from an array or build via cb.
- string(str, cb?): Emit a string value (no HTML escaping). In String joiner, optional cb lets you compose nested fragments before emitting.
- number(num), boolean(bool), null(), undefined() (JS mode only), nonfiniteNumber(NaN|Infinity), function(fn) (JS mode only): Emit primitives/functions.
- element(name, attrs?, children?, cb?): Build elements (String and DOM joiners). In String joiner, uses Jamilih under the hood to serialize; in DOM joiner, creates Elements.
- attribute(name, value, avoidEscape?): Add attributes to the most recently opened element (String joiner) or to the current Element (DOM joiner).
- text(txt): Emit text content. In String joiner, escapes & and <, and closes an open start tag if needed.
- plainText(str): Raw, no‑escape append that bypasses context routing in the String joiner (always writes to top‑level buffer). In DOM/JSON joiners, it maps to text()/string() respectively.

### string() vs text() vs plainText() (String joiner)

- text(): Escapes &, < and closes an open start tag. Use for safe text nodes in markup.
- string(): No HTML escaping or JSON stringify; routes via append() so it participates in object()/array()/propOnly() states. Optional cb to build a composite string before emitting.
- plainText(): Always writes directly to the top‑level string buffer with no escaping, ignoring object/array state. Useful for deliberate raw insertion.

### Configuration quick reference

Provide joiningConfig when constructing JTLT:

- joiningConfig.mode: 'JavaScript' or 'JSON' controls allowance of undefined/functions/non‑finite numbers in the String joiner.
- joiningConfig.JHTMLForJSON: If true, object()/array() serialize via JHTML instead of JSON.
- joiningConfig.xmlElements: Switch element() to XML serialization mode in the String joiner.
- joiningConfig.preEscapedAttributes: Skip escaping attribute values in the String joiner.

## Quick start (JSON source)

```js
import {jtlt} from 'jtlt';

const data = {title: 'Hello', items: ['a', 'b']};

const templates = [
  {path: '$', template () {
    this.applyTemplates();
  }},
  {path: '$.title', template (v) {
    this.string('<h1>', () => this.text(v));
    this.string('</h1>');
  }},
  {path: '$.items[*]', template (v) {
    this.element('li', {}, [], () => this.text(v));
  }}
];

const out = await jtlt({data, templates, outputType: 'string'});

console.log(out);
```

Notes:

- Modes let you organize multiple passes or output targets.
- You can also call templates by name via this.callTemplate('name').
- For DOM output, use outputType: 'dom'. For JSON output, use 'json'.

### Quick start (XML source with XPath)

You can run templates against XML/HTML using XPath instead of JSONPath.

- `data` should be a Document or Element (e.g., from `DOMParser` with
  `text/xml`).
- `xpathVersion`: `1` uses native XPath (browser like). `2` uses
  `xpath2.js` for XPath 2.0‑style evaluation.
- In version 2, some functions may be missing; prefer simple path
  expressions. Use version 1 for standard XPath 1.0 function support.

Example (string output) using the JTLT facade with XPath:

```js
import {JSDOM} from 'jsdom';
import {jtlt} from 'jtlt';

const {window} = new JSDOM('<!doctype><html><body></body></html>');
const parser = new window.DOMParser();
const doc = parser.parseFromString(
  '<root><item>a</item><item>b</item></root>', 'text/xml'
);

const templates = [
  {
    path: '/',
    template () {
      this.applyTemplates('//item');
    }
  },
  {
    path: '//item',
    template (n) {
      this.string('<li>', () => this.text(n.textContent));
      this.string('</li>');
    }
  }
];

const out = await jtlt({
  data: doc,
  templates,
  outputType: 'string',
  engineType: 'xpath',
  xpathVersion: 1, // or 2
  success: (res) => res
});
// -> <li>a</li><li>b</li>
```

## One-off queries with forQuery (XQuery-like)

If you just want to run a single, non-recursive query (similar to an XQuery "for … where … return …"), you can skip defining templates and use `forQuery` to seed a root function that iterates a JSONPath and emits results.

- `forQuery` takes the same arguments you’d pass to `this.forEach(select, cb)`: an absolute JSONPath selector and a callback invoked for each match.
- You can set variables via `this.variable(name, select)` and use plain JavaScript `if` for conditions (there is no dedicated `this.if`).

Example: collect item names whose price meets a threshold, using a variable sourced from the root.

```js
import JTLT from 'jtlt';

const data = {
  threshold: 10,
  items: [
    {name: 'A', price: 8},
    {name: 'B', price: 12},
    {name: 'C', price: 10}
  ]
};

const jtlt = new JTLT({
  data,
  outputType: 'json', // Top-level result will be a JSON array
  // forQuery mirrors: this.forEach(select, cb)
  forQuery: [
    '$.items[*]',
    function (item) {
      // Set a reusable variable from the root context
      this.variable('threshold', '$.threshold');
      const {threshold} = this.vars;

      // Use normal JS conditionals (no this.if helper)
      if (item.price >= threshold) {
        // In JSON output mode, appending a string pushes into
        //   the top-level array
        this.string(item.name);
      }
    }
  ],
  // success receives the final result; return it for convenience
  success: (out) => out
});

const result = jtlt.transform();
// result => ['B', 'C']
```

Tips:

- For string output, set `outputType: 'string'` and emit with `this.text()`/`this.string()` in the callback.
- `this.variable(name, select)` evaluates the JSONPath against the current context (root for `forQuery`), storing it in `this.vars[name]`.
- If you need multiple passes or richer logic, switch to named templates and modes.

## FLWOR-style (XQuery) example

You can express the essentials of a FLWOR expression (For, Let, Where, Order by, Return) using a template with `forEach()` and the new `sort` support:

Scenario: list book titles whose price is at/above a threshold, ordered by price descending and then title ascending.

```js
import JTLT from 'jtlt';

const data = {
  threshold: 10,
  store: {
    book: [
      {title: 'A Tale', price: 8},
      {title: 'Brave New', price: 12},
      {title: 'Cobalt', price: 12},
      {title: 'Delta', price: 10}
    ]
  }
};

const templates = [
  // Root template builds an HTML list
  {path: '$', mode: 'html', template () {
    // Let: bind a reusable variable from root
    this.variable('threshold', '$.threshold');

    this.element('ul', {}, [], () => {
      // For + Order by: iterate books with multi-key sort
      this.forEach('$.store.book[*]', function (b) {
        // Where: filter in JS
        if (b.price >= this.vars.threshold) {
          // Return: emit a list item for each match
          this.element('li', {}, [], () => this.text(b.title));
        }
      }, [
        {select: '$.price', type: 'number', order: 'descending'},
        {select: '$.title', type: 'text', order: 'ascending'}
      ]);
    });
  }}
];

const out = new JTLT({data, templates, outputType: 'string'}).
  transform('html');

// -> <ul><li>Brave New</li><li>Cobalt</li><li>Delta</li></ul>
console.log(out);
```

Notes:

- You can also drive a FLWOR-like flow with `applyTemplates({select, mode}, sort)` and a dedicated template `mode` instead of using an inline `forEach()` callback.
- The `sort` parameter accepts:
  - a JSONPath string relative to each item (e.g., `$.name` or `.`)
  - a comparator function `(aValue, bValue, ctx) => number`
  - an object `{select, order, type, locale, localeOptions}`
  - an array of such strings/objects for multi-key sorting

## FLWOR-style join (two forEach loops)

You can model a join across two arrays (e.g., orders ↔ customers) using two `forEach()` passes: the first builds a lookup (an index), the second consumes it to emit joined rows. This mirrors a FLWOR-style join while keeping intent explicit and fast.

Example: render an HTML list of orders annotated with customer names.

```js
import JTLT from 'jtlt';

const data = {
  customers: [
    {id: 1, name: 'Alice'},
    {id: 2, name: 'Bob'}
  ],
  orders: [
    {id: 'o-10', customerId: 2, item: 'Keyboard', date: '2024-10-01'},
    {id: 'o-11', customerId: 1, item: 'Mouse', date: '2024-09-20'}
  ]
};

const templates = [
  {path: '$', mode: 'html', template () {
    // 1) Build an index by id (first forEach)
    const byId = {};
    this.forEach('$.customers[*]', function (c) {
      byId[c.id] = c;
    });

    // 2) Emit joined rows (second forEach)
    this.element('ul', {}, [], () => {
      this.forEach('$.orders[*]', function (o) {
        const c = byId[o.customerId];
        if (!c) {
          return; // skip if no matching customer
        }
        this.element('li', {}, [], () => {
          this.text(`${c.name} — ${o.item}`);
        });
      }, {select: '$.date', type: 'text', order: 'ascending'}); // optional sort
    });
  }}
];

const out = new JTLT({data, templates, outputType: 'string'}).transform('html');
// -> <ul><li>Bob — Keyboard</li><li>Alice — Mouse</li></ul>
console.log(out);
```

Notes:

- This pattern uses two `forEach()` calls rather than nesting them, which avoids repeatedly scanning the second array for each outer item.
- If you already maintain keys in your data, you can skip the first pass and derive `byId` with `Object.fromEntries` or similar.
- For locale-aware or numeric ordering of the second pass, use the `sort` parameter (string/comparator/object/array as shown above).


## Joins with key()/getKey() (xsl:key-like)

Define an index once, then perform O(1) lookups from another sequence when rendering. If no match is found, `getKey()` returns the current context (`this`) as a sentinel; check for that to skip safely.

```js
import JTLT from 'jtlt';

const data = {
  customers: [
    {id: 1, name: 'Alice'},
    {id: 2, name: 'Bob'}
  ],
  orders: [
    {id: 'o-10', customerId: 2, item: 'Keyboard'},
    {id: 'o-11', customerId: 3, item: 'Cable'} // no matching customer
  ]
};

const templates = [
  {path: '$', mode: 'html', template () {
    // Define an index by id: key(name, match, use)
    this.key('customerById', '$.customers[*]', 'id');

    this.element('ul', {}, [], () => {
      this.forEach('$.orders[*]', function (o) {
        const c = this.getKey('customerById', o.customerId);
        // getKey returns `this` if no match; skip such rows
        if (c === this) {
          return;
        }
        this.element('li', {}, [], () => this.text(`${c.name}: ${o.item}`));
      }, {select: '$.id', order: 'ascending'});
    });
  }}
];

const out = new JTLT({data, templates, outputType: 'string'}).transform('html');
// -> <ul><li>Bob: Keyboard</li></ul>
console.log(out);
```

Tips:

- You can define multiple keys with different `use` properties (e.g., lookup by `email`, `id`, etc.).
- The `match` expression can target nested arrays (e.g., `$.stores[*].customers[*]`).
- For JSON output joins, switch `outputType: 'json'` and use `object()`/`array()` to build structured results.

## How this compares to XSLT: pros and cons

Advantages (strong parallels with XSLT):

- Template matching by path and mode: templates use JSONPath selectors and optional `mode`, with priority resolution and an option to error on equal priority.
- Built‑in default rules: when no template matches, defaults traverse and render objects, arrays, scalars, property names, and functions, similar to XSLT’s built‑in templates.
- applyTemplates/forEach and sorting: `applyTemplates(select, mode, sort)` and `forEach(select, cb, sort)` mirror `xsl:apply-templates`/`xsl:for-each` and `xsl:sort`.
- Named templates and parameters: `callTemplate(name, withParam)` reflects `xsl:call-template` + `xsl:with-param`.
- Keys and lookups: `key(name, match, use)` + `getKey(name, value)` provide `xsl:key`-style indexing for joins and fast lookups.
- Multiple output forms: string, DOM, and JSON builders ("joiners") allow emitting different result trees like XSLT’s result tree model.

Differences / current limitations:

- Expression language: XPath 2.0 implementation is not fully feature complete and the XPath 1.0 implementation from `jsdom` may not be either.
- As the syntax is JavaScript, it is not feasible to recursively transform
  JTLT syntax with itself (at least not easily) as one can do with XSLT.
  However, one can use arbitrary JavaScript, or using such as `jsep`,
  allow a particuluar subset of JavaScript.
- Stylesheet composition/precedence: no `xsl:import`/`xsl:include` equivalents; only basic priority and modes.
- Schema awareness: no type-aware processing (a major XSLT/XQuery feature).
- Multi-output (`xsl:result-document`): not built-in; pick one output type per transform.

## Differences between an exact equivalence with XSLT

JTLT, having the freedom to start a new pattern from XSLT, and though
seeking to learn from it, deviates somewhat from making an exact
equivalence with XSLT (to the extent JTLT and JSONPath implement
what could possibly be transferred to JSON-based transformations
from XSLT):

1.  Although the option is given for throwing errors upon finding
    templates of equal priority, the default behavior is to give
    preference to the last template (unlike XSLT which makes it an
    error by default).

## To-dos

See [TO-DO](./docs/TO.DO.md).
