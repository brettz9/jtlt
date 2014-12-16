# jtlt

JavaScript Template Language Transformations (JTLT, pronounced as "Jetlet")

***Work incomplete!!***

Uses an approach similar to [XSLT](http://www.w3.org/Style/XSL/) for
declarative, linear declaration of templates, but with JSON or JavaScript
object data sources. As with XSLT, can be transformed into different
formats (e.g., HTML strings, JSON, DOM objects, etc.).

# Credits

Packaged with this [JSONPath](https://github.com/s3u/JSONPath) implementation.

The sample file is from http://goessner.net/articles/JsonPath/

# Installation

```
npm install .
```

# Todos
- Implement and demo equivalent to applying and calling templates, and root template
    - As with XSLT, have priority determined by:
        - Presence of any root template
            - Have at least basic flow direction methods like XSL's call-template/apply-templates/for-each
        - Any user-supplied priority for a given template
        - Default matching priority for user templates indicated by the template's [path specificity](http://lenzconsulting.com/how-xslt-works/#priority) (JSONPath)
        - Go by last template if match (with option to give warning, as in XSLT)
        - [Default template rules](http://docstore.mik.ua/orelly/xml/xmlnut/ch08_07.htm).
- Reconcile a [non-eval PR for JSONPath](https://github.com/s3u/JSONPath/pull/4) with my [own fork](https://github.com/brettz9/JSONPath). The OR condition (outside of filters) is another important feature as would be schema-aware path results.
