# jtlt CHANGES

## ?

- feat: `characterMap` and element fixes
- fix: `valueOf` and context when no arguments to `applyTemplates()`
- fix: add childNodes argument to dom joining transformer

## 0.4.0

- feat: `number()` enhancements
- feat: `analyzeString()`
- feat: xpath 3.1
- feat: demo
- fix: set XPath default query to `//*`
- fix(types): outputType

## 0.3.0

- feat: `if()`
- feat: `choose()`
- feat: propSets for DOM
- feat: add `comment()` and `processingInstruction()`
- feat: optional `path` may be omitted when `name` present (named-only templates)
- feat: XPath `copy()` (shallow) and `copyOf(select?)` (deep cloning / scalar append)
- feat: JSONPath cloning docs expanded (existing `copy`/`copyOf` clarified)
- fix: avoid appending `undefined` from `callTemplate` when template returns nothing
- fix: parameter fallback in `valueOf` for JSONPath param access
- fix: scalar XPath `copyOf()` prevents DOM hierarchy errors when expression returns Document
 - feat: add `exposeDocuments` option
 - feat: callTemplate in XPath
 - feat: add `document()` (XSLT `xsl:document`-like) and `resultDocument()` (XSLT `xsl:result-document`-like) to all joiners
 - feat: support `output({method})` values `json` and `xhtml` across joiners
 - change: JSON joiner `$document` wrapper includes DOCTYPE only when `method` is `xml` or `xhtml`; XML declaration emitted for `xml`/`xhtml` unless `omitXmlDeclaration`

## 0.2.0

- fix: point to `types` and add `exports`

## 0.1.0

- Initial version
