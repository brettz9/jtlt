# jtlt

JavaScript Template Language Transformations (JTLT, pronounced as
"Jetlet")—a JavaScript equivalent of [XSLT](http://www.w3.org/Style/XSL/),
for JSON/JavaScript object data sources.

As with XSLT, allows for declarative, linear declaration of
(recursive) templates and can be transformed into different
formats (e.g., HTML strings, JSON, DOM objects, etc.).

***Early alpha state!!!***

## Credits

Packaged with [JSONPath Plus](https://github.com/s3u/JSONPath).

The sample file is from <http://goessner.net/articles/JsonPath/>

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

See the [docs](docs/API.md).

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

1.  Document and add test cases to cover current features!
    1.  Implement and demo equivalent to applying and calling templates, and
        root template
    1.  Demo chaining of methods, including [equivalents](http://www.saxonica.com/papers/XTech2005/mhkpaper.html#S4.)
        to XQuery's FLWOR expressions (see also Promises to-do), perhaps
        even making aliases so that XQuery's friendlier terms can be used
        instead of XSLT's.
1.  Support processing of JSON documents with `$jtlt-stylesheet` to let
    documents define their own targeted stylesheets.
1.  When sufficiently documented, add as example library/tool to
    JSONPath wiki.
1.  Allow alternative to `element()`, `array()`, etc. methods by just
    detecting those types from return values (and generic of each
    type like `dom()` and `json()`).
1.  Allow, depending on mode, containers to contain containers of other
    types (e.g., a JS container containing DOM objects, or temporary use
    of a string container, etc.).
    1.  Support XML and add [hXML](https://github.com/brettz9/hxml) methods.
    1.  Support [JHTML](https://github.com/brettz9/jhtml).
    1.  Support `appendJSON()`/`appendDOM()` and
        `appendType('json', ...)` (allowing type extensions).
1.  Add `appendResult(function () {return result})`.
1.  Add JSON update functions (equivalent to Xquery Update Facility for
    XML ([overview](http://www.xmlplease.com/xquery-update))) and create
    JSON serialization (as with XSLT expressed itself in declarative XML)
    so one can submit and evaluate
    through [HTTPQuery](https://github.com/brettz9/httpquery) (and also
    supply to JSONEditor, etc.). Utilize updating by reference.
1.  Allow hybrid JSON/[Jamilih](https://github.com/brettz9/jamilih) or
    JSON/(X)HTML/XML so that one can add
    XPath, CSS Selectors, or query into HTML in a relevant manner (or
    even a subset/extension to JSONPath?)

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
    correct JSON file and position in the JSON file. Modify JSONPath
    to have awareness? Could use `apply-templates`, etc. (as with XSLT) by
    schema type alone, would be useful with a schema-type-info retriever
    (if we don't just pass the method the info) to construct a generic view
    of a document (e.g., turning enums into an HTML select with the chosen
    value) though would really need to iterate a schema (get schema for
    current document?) to build a general purpose form
1.  Add a [non-eval PR for JSONPath](https://github.com/s3u/JSONPath/pull/4).
    The OR condition (outside of filters) is another important feature as
    would be schema-aware path results.
1.  Support pull parsing/streaming? Pass `done()` function to templates to
    signal completion?
1.  Support Promise API in addition to callbacks (reconcile with
    current chaining; see also XQuery FLWOR to-do);
    Applying or iteration of templates in async manner (as with Promises)
1.  Add [XQuery Functions](https://code.google.com/p/jsxqueryparser/source/browse/trunk/jsxqueryparser/XQueryParser.js#1768)
    (also supporting DOM and JSON where possible) as plug-in (also any
    missing from XSLT/XQuery 3.0). Also add, if not present among these
    functions (or in XQuery), add equivalents to XSLT's
    `document()` and `unparsed-text()` for allowing non-JSON file
    retrieval (as well as variables/parameters) and also methods for
    iterating or retrieving IndexedDB, `localStorage`, and cookies
    (names, keys and values).
1.  Add `joiningTransformerClass` which uses a DOM joiner but allows
    specialized serialized output (e.g., pretty-printed HTML) so the users
    don't need to build it themselves (likewise with stringified
    JSON output).
1.  See code for other possible to-dos
