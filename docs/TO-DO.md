## To-dos

1. Testing: Could adapt an XSLT/XQuery test suite

1. Document

    1.  Implement and demo equivalent to applying and calling templates, and
        root template

    2.  Demo chaining of methods, including [equivalents](https://www.saxonica.com/papers/XTech2005/mhkpaper.html#S4.)
        to XQuery's FLWOR expressions (see also Promises to-do), perhaps
        even making aliases so that XQuery's friendlier terms can be used
        instead of XSLT's.

2. Support processing of JSON documents with `$jtlt-stylesheet` to let
    documents define their own targeted stylesheets and make own
    `<?xml-stylesheet type="text/javascript" href="..."?>` for XML

3. When sufficiently documented, add as example library/tool to
    JSONPath wiki.

4. Allow alternative to `element()`, `array()`, etc. methods by just
    detecting those types from return values (and generic of each
    type like `dom()` and `json()`).

5. Allow, depending on mode, containers to contain containers of other
    types (e.g., a JS container containing DOM objects, or temporary use
    of a string container, etc.).

    1. Support XML and add [hXML](https://github.com/brettz9/hxml) methods.

    2. Support `appendJSON()`/`appendDOM()` and
        `appendType('json', ...)` (allowing type extensions).

6. Add `appendResult(function () {return result})`.

7. Add JSON update functions (equivalent to Xquery Update Facility for
    XML ([overview](http://www.xmlplease.com/xquery-update))) and create
    JSON serialization (as with XSLT expressed itself in declarative XML)
    so one can submit and evaluate
    through [HTTPQuery](https://github.com/brettz9/httpquery) (and also
    supply to JSONEditor, etc.). Utilize updating by reference.

8. Demo narrowing to subset of JavaScript (as with `jsep`) to make
    JTLT truly "declarative" as far as freedom from scripting

## Possible to-dos

1. Make schema-aware so that templates could target types. Most reusable
    application may be having a type-driven view of a JSON Schema instance
    (e.g., dates could be shown inside a calendar widget). Perhaps this
    schema-awareness could also drive a JSON editor (as with other existing
    projects) (even using same API as JSONEditor?) (or type-aware filtered
    search/raw queries). This would help not only for editors which edit a
    JSON file in full, but also for providing schema paths or other identifiers
    so that a transformed/queried subset of a file (or joining of multiple
    files) could point the way for edited contents to be saved back to the
    correct JSON file and position in the JSON file.

2. ~~Add a [non-eval PR for JSONPath](https://github.com/s3u/JSONPath/pull/4).~~
    The OR condition (outside of filters) is another important feature as
    would be schema-aware path results.

3. Allow hybrid JSON/[Jamilih](https://github.com/brettz9/jamilih) or
    JSON/(X)HTML/XML so that one can add
    XPath or query into HTML in a relevant manner

4. Support pull parsing/streaming? Pass `done()` function to templates to
    signal completion?

5. Add [XQuery Functions](https://code.google.com/p/jsxqueryparser/source/browse/trunk/jsxqueryparser/XQueryParser.js#1768)
    (also supporting DOM and JSON where possible) as plug-in (also any
    missing from XSLT/XQuery 3.0). Also add, if not present among these
    functions (or in XQuery), add equivalents to XSLT's
    `document()` and `unparsed-text()` for allowing non-JSON file
    retrieval (as well as variables/parameters) and also methods for
    iterating or retrieving IndexedDB, `localStorage`, and cookies
    (names, keys and values).

6. Add `outputType` which uses a DOM joiner but allows specialized
    serialized output (e.g., pretty-printed HTML) so the users
    don't need to build it themselves (likewise with stringified
    JSON output).

7. See code for other possible to-dos

8. Promise-based templates

9. Consider implementing the following elements from <https://www.w3.org/TR/xslt-30/>
    which are not yet implemented.

  xsl:accept
  xsl:accumulator
  xsl:accumulator-rule
  "xsl:apply-imports",
  xsl:break
  xsl:catch
  xsl:context-item
  xsl:evaluate
  xsl:expose
  "xsl:fallback",
  xsl:fork
  xsl:global-context-item
  "xsl:import",
  "xsl:import-schema",
  "xsl:include",
  xsl:iterate
  xsl:merge
  xsl:merge-action
  xsl:merge-key
  xsl:merge-source
  xsl:next-iteration
  "xsl:next-match",
  xsl:on-completion
  xsl:on-empty
  xsl:on-non-empty
  xsl:override
  xsl:package
  "xsl:perform-sort",
  "xsl:sequence",
  xsl:source-document
  xsl:try
  xsl:use-package
  xsl:where-populated

  ~~"xsl:analyze-string",~~
  ~~"xsl:apply-templates",~~
  ~~xsl:assert~~
  ~~"xsl:attribute",~~
  ~~"xsl:attribute-set",~~
  ~~"xsl:call-template",~~
  ~~"xsl:character-map",~~
  ~~"xsl:choose",~~
  ~~"xsl:comment",~~
  ~~"xsl:copy",~~
  ~~"xsl:copy-of",~~
  ~~"xsl:decimal-format",~~
  ~~"xsl:document",~~
  ~~"xsl:element",~~
  ~~"xsl:for-each",~~
  ~~"xsl:for-each-group",~~
  ~~"xsl:function",~~
  ~~"xsl:if",~~
  ~~"xsl:key",~~
  ~~xsl:map~~
  ~~xsl:map-entry~~
  ~~"xsl:matching-substring",~~
  ~~"xsl:message",~~
  ~~xsl:mode~~
  ~~"xsl:namespace",~~
  ~~"xsl:namespace-alias",~~
  ~~"xsl:non-matching-substring",~~
  ~~"xsl:number",~~
  ~~"xsl:otherwise",~~
  ~~"xsl:output",~~
  ~~"xsl:output-character",~~
  ~~"xsl:param",~~
  ~~"xsl:preserve-space",~~
  ~~"xsl:processing-instruction",~~
  ~~"xsl:result-document",~~
  ~~"xsl:sort",~~
  ~~"xsl:strip-space",~~
  ~~"xsl:stylesheet",~~
  ~~"xsl:template",~~
  ~~"xsl:text",~~
  ~~"xsl:transform",~~
  ~~"xsl:value-of",~~
  ~~"xsl:variable",~~
  ~~"xsl:when",~~
  ~~"xsl:with-param"~~
