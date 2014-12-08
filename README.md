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
    - Reshape JSONPath to return parent in results, so we can reshape