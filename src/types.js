/**
 * Public JSDoc typedef aggregates for jtlt. Migrated from `typings/jtlt.d.ts`
 * into a runtime JS module so declaration emit will produce `dist/types.d.ts`.
 * Consumers can import these types in TS projects; the runtime exports are
 * re-exported for convenience.
 */

/**
 * @typedef {import('./JSONPathTransformerContext.js').default}
 *   JSONPathTransformerContext
 */
/**
 * @typedef {import('./XPathTransformerContext.js').default}
 *   XPathTransformerContext
 */
/**
 * @typedef {import('./AbstractJoiningTransformer.js').default}
 *   AbstractJoiningTransformer
 */
/**
 * @typedef {import('./DOMJoiningTransformer.js').default}
 *   DOMJoiningTransformer
 */
/**
 * @typedef {import('./JSONJoiningTransformer.js').default}
 *   JSONJoiningTransformer
 */
/**
 * @typedef {import('./StringJoiningTransformer.js').default}
 *   StringJoiningTransformer
 */

/**
 * Generic template callable bound to a context type.
 * @template TCtx
 * @typedef {(this: TCtx, value?: unknown,
 *   cfg?: {mode: string}
 * ) => unknown} TemplateFunction
 */

/**
 * Template object with metadata and bound template function.
 * @template TCtx
 * @typedef {object} TemplateObject
 * @property {string} path
 * @property {(
 *   'root' |
 *   'transformRoot' |
 *   'transformElements' |
 *   'transformTextNodes' |
 *   'transformScalars' |
 *   'transformPropertyNames' |
 *   'transformArrays' |
 *   'transformObjects' |
 *   'transformFunctions' |
 *   string
 * )} [name]
 * @property {string} [mode]
 * @property {number} [priority]
 * @property {TemplateFunction<TCtx>} template
 */

/**
 * @typedef {TemplateObject<JSONPathTransformerContext>}
 *   JSONPathTemplateObject
 */
/**
 * @typedef {TemplateObject<XPathTransformerContext>}
 *   XPathTemplateObject
 */

/**
 * Options common to both engines.
 * @typedef {object} BaseJTLTOptions
 * @property {(result: unknown) => void} success Callback receiving transform
 *   result
 * @property {unknown} [data] JSON object or DOM Document/Element
 * @property {string} [ajaxData] URL for JSON retrieval
 * @property {boolean} [errorOnEqualPriority]
 * @property {boolean} [autostart]
 * @property {boolean} [preventEval]
 * @property {boolean} [unwrapSingleResult]
 * @property {string} [mode]
 * @property {'string'|'dom'|'json'} [outputType]
 * @property {(opts: JTLTOptions) => unknown} [engine]
 * @property {(path: string) => 0|0.5|-0.5} [specificityPriorityResolver]
 * @property {AbstractJoiningTransformer} [joiningTransformer]
 * @property {Record<string, unknown>} [joiningConfig]
 * @property {unknown} [parent]
 * @property {string} [parentProperty]
 * @property {unknown[]} [forQuery]
 */

/**
 * JSONPath engine options.
 * @typedef {BaseJTLTOptions & {
 *   templates?: JSONPathTemplateObject[] |
 *     TemplateFunction<JSONPathTransformerContext>,
 *   template?: JSONPathTemplateObject |
 *     TemplateFunction<JSONPathTransformerContext>,
 *   query?: TemplateFunction<JSONPathTransformerContext>,
 *   engineType?: 'jsonpath'
 * }} JSONPathJTLTOptions
 */

/**
 * XPath engine options.
 * @typedef {BaseJTLTOptions & {
 *   templates?: XPathTemplateObject[] |
 *     TemplateFunction<XPathTransformerContext>,
 *   template?: XPathTemplateObject |
 *     TemplateFunction<XPathTransformerContext>,
 *   query?: TemplateFunction<XPathTransformerContext>,
 *   engineType: 'xpath',
 *   xpathVersion?: 1|2
 * }} XPathJTLTOptions
 */

/** @typedef {JSONPathJTLTOptions | XPathJTLTOptions} JTLTOptions */

/**
 * Internal options extension adding private runtime state flags.
 * Not part of the public API surface but used for narrowing casts.
 * @typedef {JTLTOptions & {
 *   _customJoiningTransformer?: boolean
 * }} InternalJTLTOptions
 */

// Marker export to ensure module scope for declaration emit
export const typesModuleMarker = true;
