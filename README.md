# jtlt

JavaScript Template Language Transformations (JTLT, pronounced as
"Jetlet")—a JavaScript equivalent of [XSLT](https://www.w3.org/Style/XSL/),
for JSON/JavaScript object data sources.

As with XSLT, allows for declarative, linear declaration of
(recursive) templates and can be transformed into different
formats (e.g., HTML strings, JSON, DOM objects, etc.).

***Early alpha state!!!***

## Credits

Packaged with [JSONPath Plus](https://github.com/s3u/JSONPath).

The sample file is from <https://goessner.net/articles/JsonPath/>

## Installation

```shell
npm install .
```

In the browser, you will also need to include the dependencies.
See the [test file](test/test.html).

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

- Joiners (output builders):
    - StringJoiningTransformer: Builds a string. Context‑aware append() routes into objects/arrays when inside object()/array() scopes, otherwise concatenates to a buffer. Includes element(), attribute(), and text() helpers for HTML/XML emission.
    - DOMJoiningTransformer: Builds a DocumentFragment/Element tree. element()/attribute()/text() add real nodes; primitives append as text nodes.
    - JSONJoiningTransformer: Builds real JS values (objects/arrays/primitives) without serialization.

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

## Quick start

```js
import JTLT from 'jtlt';

const data = {title: 'Hello', items: ['a', 'b']};

const templates = [
  {path: '$', template () {
    this.applyTemplates({mode: 'html'});
  }},
  {mode: 'html', path: '$.title', template (v) {
    this.string('<h1>', () => this.text(v));
    this.string('</h1>');
  }},
  {mode: 'html', path: '$.items[*]', template (v) {
    this.element('li', {}, [], () => this.text(v));
  }}
];

const out = new JTLT({data, templates, outputType: 'string'}).
  transform('html');

console.log(out);
```

Notes:

- Modes let you organize multiple passes or output targets.
- You can also call templates by name via this.callTemplate('name').
- For DOM output, use outputType: 'dom'. For JSON output, use 'json'.

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

1.  Document and add test cases to cover current features! (Could adapt an XSLT/XQuery test suite)

    1.  Implement and demo equivalent to applying and calling templates, and
        root template

    2.  Demo chaining of methods, including [equivalents](https://www.saxonica.com/papers/XTech2005/mhkpaper.html#S4.)
        to XQuery's FLWOR expressions (see also Promises to-do), perhaps
        even making aliases so that XQuery's friendlier terms can be used
        instead of XSLT's.

2.  Support processing of JSON documents with `$jtlt-stylesheet` to let
    documents define their own targeted stylesheets.

3.  When sufficiently documented, add as example library/tool to
    JSONPath wiki.

4.  Allow alternative to `element()`, `array()`, etc. methods by just
    detecting those types from return values (and generic of each
    type like `dom()` and `json()`).

5.  Allow, depending on mode, containers to contain containers of other
    types (e.g., a JS container containing DOM objects, or temporary use
    of a string container, etc.).

    1.  Support XML and add [hXML](https://github.com/brettz9/hxml) methods.

    2.  Support [JHTML](https://github.com/brettz9/jhtml).

    3.  Support `appendJSON()`/`appendDOM()` and
        `appendType('json', ...)` (allowing type extensions).

6.  Add `appendResult(function () {return result})`.

7.  Add JSON update functions (equivalent to Xquery Update Facility for
    XML ([overview](http://www.xmlplease.com/xquery-update))) and create
    JSON serialization (as with XSLT expressed itself in declarative XML)
    so one can submit and evaluate
    through [HTTPQuery](https://github.com/brettz9/httpquery) (and also
    supply to JSONEditor, etc.). Utilize updating by reference.

8. Demo narrowing to subset of JavaScript (as with `jspe`) to make
    JTLT truly "declarative" as far as freedom from scripting

## Possible to-dos

1.  Make schema-aware so that templates could target types. Most reusable
    application may be having a type-driven view of a JSON Schema instance
    (e.g., dates could be shown inside a calendar widget). Perhaps this
    schema-awareness could also drive a JSON editor (as with other existing
    projects) (even using same API as JSONEditor?) (or type-aware filtered
    search/raw queries). This would help not only for editors which edit a
    JSON file in full, but also for providing schema paths or other identifiers
    so that a transformed/queried subset of a file (or joining of multiple
    files) could point the way for edited contents to be saved back to the
    correct JSON file and position in the JSON file.

2.  Add a [non-eval PR for JSONPath](https://github.com/s3u/JSONPath/pull/4).
    The OR condition (outside of filters) is another important feature as
    would be schema-aware path results.

3.  Allow hybrid JSON/[Jamilih](https://github.com/brettz9/jamilih) or
    JSON/(X)HTML/XML so that one can add
    XPath or query into HTML in a relevant manner

4.  Support pull parsing/streaming? Pass `done()` function to templates to
    signal completion?

5.  Support Promise API in addition to callbacks (reconcile with
    current chaining; see also XQuery FLWOR to-do)

6.  Add [XQuery Functions](https://code.google.com/p/jsxqueryparser/source/browse/trunk/jsxqueryparser/XQueryParser.js#1768)
    (also supporting DOM and JSON where possible) as plug-in (also any
    missing from XSLT/XQuery 3.0). Also add, if not present among these
    functions (or in XQuery), add equivalents to XSLT's
    `document()` and `unparsed-text()` for allowing non-JSON file
    retrieval (as well as variables/parameters) and also methods for
    iterating or retrieving IndexedDB, `localStorage`, and cookies
    (names, keys and values).

7.  Add `outputType` which uses a DOM joiner but allows specialized
    serialized output (e.g., pretty-printed HTML) so the users
    don't need to build it themselves (likewise with stringified
    JSON output).

8.  See code for other possible to-dos
