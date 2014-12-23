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
learning from it, deviates somewhat from making an exact
equivalence with XSLT (to the extent JTLT and JSONPath implement
what could possibly be transferred to JSON-based transformations
from XSLT).

1. Although the option is given for throwing errors upon finding templates of equal priority, the default behavior is to give preference to the last template (unlike XSLT which makes it an error by default).
1. Unlike XSLT, JTLT gives higher priority to:
    1. absolute fixed paths over recursive descent
    1. longer paths
    1. Non-wildcard terminal points (not only lower priority to raw wildcards)

# Immediate todos
- Call template: context node
- forEach
- valueOf

# Possible todos
- Implement and demo equivalent to applying and calling templates, and root template
- Reconcile a [non-eval PR for JSONPath](https://github.com/s3u/JSONPath/pull/4) with my [own fork](https://github.com/brettz9/JSONPath). The OR condition (outside of filters) is another important feature as would be schema-aware path results.
- Allow hybrid JSON/Jamilih or JSON/(X)HTML/XML so that one can add XPath or query into HTML in a relevant manner
- Document API here!
- See code for other possible todos
