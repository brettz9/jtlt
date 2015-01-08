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

# Possible todos

1. Make schema-aware so that templates could target types. Most reusable application may be having a type-driven view of a JSON Schema instance (e.g., dates could be shown inside a calendar widget). Perhaps this schema-awareness could also drive a JSON editor (as with other existing projects).
1. Implement and demo equivalent to applying and calling templates, and root template
1. Reconcile a [non-eval PR for JSONPath](https://github.com/s3u/JSONPath/pull/4) with my [own fork](https://github.com/brettz9/JSONPath). The OR condition (outside of filters) is another important feature as would be schema-aware path results.
1. Allow hybrid JSON/Jamilih or JSON/(X)HTML/XML so that one can add XPath or query into HTML in a relevant manner
1. Document API here!
1. See code for other possible todos
