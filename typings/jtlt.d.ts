/**
 * Public JSDoc typedef aggregates for jtlt. Converted from TS-style
 * declarations to JSDoc `@typedef` form for easier maintenance alongside
 * source JSDoc. Consumers can still import these types in TS projects.
 */

/** @typedef {import('../src/JSONPathTransformerContext.js').default} JSONPathTransformerContext */
/** @typedef {import('../src/XPathTransformerContext.js').default} XPathTransformerContext */
/** @typedef {import('../src/AbstractJoiningTransformer.js').default} AbstractJoiningTransformer */
/** @typedef {import('../src/DOMJoiningTransformer.js').default} DOMJoiningTransformer */
/** @typedef {import('../src/JSONJoiningTransformer.js').default} JSONJoiningTransformer */
/** @typedef {import('../src/StringJoiningTransformer.js').default} StringJoiningTransformer */

/**
 * Generic template callable bound to a context type.
 * @template TCtx
 * @typedef {(this: TCtx, value?: any, cfg?: {mode: string}) => any} TemplateFunction
 */

/**
 * Template object with metadata and bound template function.
 * @template TCtx
 * @typedef {object} TemplateObject
 * @property {string} path
 * @property {string} [name]
 * @property {string} [mode]
 * @property {number} [priority]
 * @property {TemplateFunction<TCtx>} template
 */

/** @typedef {TemplateObject<JSONPathTransformerContext>} JSONPathTemplateObject */
/** @typedef {TemplateObject<XPathTransformerContext>} XPathTemplateObject */

/**
 * Options common to both engines.
 * @typedef {object} BaseJTLTOptions
 * @property {(result: any) => void} success Callback receiving transform result
 * @property {any} [data] JSON object or DOM Document/Element
 * @property {string} [ajaxData] URL for JSON retrieval
 * @property {boolean} [errorOnEqualPriority]
 * @property {boolean} [autostart]
 * @property {boolean} [preventEval]
 * @property {boolean} [unwrapSingleResult]
 * @property {string} [mode]
 * @property {'string'|'dom'|'json'} [outputType]
 * @property {(opts: JTLTOptions) => any} [engine]
 * @property {(path: string) => 0|0.5|-0.5} [specificityPriorityResolver]
 * @property {AbstractJoiningTransformer} [joiningTransformer]
 * @property {Record<string, any>} [joiningConfig]
 * @property {any} [parent]
 * @property {string} [parentProperty]
 * @property {any[]} [forQuery]
 */

/**
 * JSONPath engine options.
 * @typedef {BaseJTLTOptions & {
 *   templates?: JSONPathTemplateObject[] | TemplateFunction<JSONPathTransformerContext>,
 *   template?: JSONPathTemplateObject | TemplateFunction<JSONPathTransformerContext>,
 *   query?: TemplateFunction<JSONPathTransformerContext>,
 *   engineType?: 'jsonpath'
 * }} JSONPathJTLTOptions
 */

/**
 * XPath engine options.
 * @typedef {BaseJTLTOptions & {
 *   templates?: XPathTemplateObject[] | TemplateFunction<XPathTransformerContext>,
 *   template?: XPathTemplateObject | TemplateFunction<XPathTransformerContext>,
 *   query?: TemplateFunction<XPathTransformerContext>,
 *   engineType: 'xpath',
 *   xpathVersion?: 1|2
 * }} XPathJTLTOptions
 */

/** @typedef {JSONPathJTLTOptions | XPathJTLTOptions} JTLTOptions */

// Re-export runtime classes for convenience (types infer from imported modules)
export { default as JTLT } from '../src/index.js';
export { default as AbstractJoiningTransformer } from '../src/AbstractJoiningTransformer.js';
export { default as StringJoiningTransformer } from '../src/StringJoiningTransformer.js';
export { default as DOMJoiningTransformer } from '../src/DOMJoiningTransformer.js';
export { default as JSONJoiningTransformer } from '../src/JSONJoiningTransformer.js';
export { default as JSONPathTransformerContext } from '../src/JSONPathTransformerContext.js';
export { default as XPathTransformerContext } from '../src/XPathTransformerContext.js';
export { default as JSONPathTransformer } from '../src/JSONPathTransformer.js';
export { default as XPathTransformer } from '../src/XPathTransformer.js';
export { default as XSLTStyleJSONPathResolver } from '../src/XSLTStyleJSONPathResolver.js';

