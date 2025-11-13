# jtlt CHANGES

## 0.3.0 (unreleased)

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

## 0.2.0

- fix: point to `types` and add `exports`

## 0.1.0

- Initial version
