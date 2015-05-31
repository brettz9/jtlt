# jtlt

JavaScript Template Language Transformations (JTLT, pronounced as "Jetlet")

***Work incomplete!!***

Uses an approach similar to [XSLT](http://www.w3.org/Style/XSL/) for
declarative, linear declaration of templates, but with JSON or JavaScript
object data sources. As with XSLT, can be transformed into different
formats (e.g., HTML strings, JSON, DOM objects, etc.).

# Credits

Packaged with this [JSONPath](https://github.com/s3u/JSONPath)
implementation.

The sample file is from http://goessner.net/articles/JsonPath/

# Installation

```
npm install .
```

# Differences between an exact equivalence with XSLT

JTLT, having the freedom to start a new pattern from XSLT, and though
seeking to learn from it, deviates somewhat from making an exact
equivalence with XSLT (to the extent JTLT and JSONPath implement
what could possibly be transferred to JSON-based transformations
from XSLT).

1. Although the option is given for throwing errors upon finding templates of equal priority, the default behavior is to give preference to the last template (unlike XSLT which makes it an error by default).


# Todos

1. Finish existing code to get it to work!
1. Allow alternative to `element()`, `array()`, etc. methods by just detecting those types from return values (and generic of each type like `dom()` and `json()`).
1. Allow, depending on mode, containers to contain containers of other
types (e.g., a JS container containing DOM objects, or temporary use
of a string container, etc.).
    1. Support XML and add hXML methods.
    1. Support JHTML.
    1. Support `appendJSON()`/`appendDOM()` and `appendType('json', ...)`.
1. Add `appendResult(function () {return result})`.
1. Add JSON update functions (equivalent to Xquery Update Facility for
XML ([overview](http://www.xmlplease.com/xquery-update))) and create
JSON serialization (as with XSLT expressed itself in declarative XML)
so one can submit and evaluate
through [HTTPQuery](https://github.com/brettz9/httpquery). Utilize updating by reference.

# Possible todos

1. Make schema-aware so that templates could target types. Most reusable application may be having a type-driven view of a JSON Schema instance (e.g., dates could be shown inside a calendar widget). Perhaps this schema-awareness could also drive a JSON editor (as with other existing projects) (even using same API as JSONEditor?) (or type-aware filtered search/raw queries). This would help not only for editors which edit a JSON file in full, but also for providing schema paths or other identifiers so that a transformed/queried subset of a file (or joining of multiple files) could point the way for edited contents to be saved back to the correct JSON file and position in the JSON file.
1. Implement and demo equivalent to applying and calling templates, and root template
1. Reconcile a [non-eval PR for JSONPath](https://github.com/s3u/JSONPath/pull/4) with my [own fork](https://github.com/brettz9/JSONPath). The OR condition (outside of filters) is another important feature as would be schema-aware path results.
1. Allow hybrid JSON/Jamilih or JSON/(X)HTML/XML so that one can add XPath or query into HTML in a relevant manner
1. Document API here!
1. See code for other possible todos
1. Support Promise API in addition to callbacks
