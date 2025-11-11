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
 * @typedef {import('./AbstractJoiningTransformer.js').default<"string">|
 *   import('./AbstractJoiningTransformer.js').default<"json">|
 *   import('./AbstractJoiningTransformer.js').default<"dom">}
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
 *   cfg?: {mode?: string}
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
export const typesModuleMarker: true;
export type JSONPathTransformerContext = import("./JSONPathTransformerContext.js").default;
export type XPathTransformerContext = import("./XPathTransformerContext.js").default;
export type AbstractJoiningTransformer = import("./AbstractJoiningTransformer.js").default<"string"> | import("./AbstractJoiningTransformer.js").default<"json"> | import("./AbstractJoiningTransformer.js").default<"dom">;
export type DOMJoiningTransformer = import("./DOMJoiningTransformer.js").default;
export type JSONJoiningTransformer = import("./JSONJoiningTransformer.js").default;
export type StringJoiningTransformer = import("./StringJoiningTransformer.js").default;
/**
 * Generic template callable bound to a context type.
 */
export type TemplateFunction<TCtx> = (this: TCtx, value?: unknown, cfg?: {
    mode?: string;
}) => unknown;
/**
 * Template object with metadata and bound template function.
 */
export type TemplateObject<TCtx> = {
    path: string;
    name?: string | undefined;
    mode?: string | undefined;
    priority?: number | undefined;
    template: TemplateFunction<TCtx>;
};
export type JSONPathTemplateObject = TemplateObject<JSONPathTransformerContext>;
export type XPathTemplateObject = TemplateObject<XPathTransformerContext>;
/**
 * Options common to both engines.
 */
export type BaseJTLTOptions = {
    /**
     * Callback receiving transform
     * result
     */
    success: (result: unknown) => void;
    /**
     * JSON object or DOM Document/Element
     */
    data?: unknown;
    /**
     * URL for JSON retrieval
     */
    ajaxData?: string | undefined;
    errorOnEqualPriority?: boolean | undefined;
    autostart?: boolean | undefined;
    preventEval?: boolean | undefined;
    unwrapSingleResult?: boolean | undefined;
    mode?: string | undefined;
    outputType?: "string" | "dom" | "json" | undefined;
    engine?: ((opts: JTLTOptions) => unknown) | undefined;
    specificityPriorityResolver?: ((path: string) => 0 | 0.5 | -0.5) | undefined;
    joiningTransformer?: AbstractJoiningTransformer | undefined;
    joiningConfig?: Record<string, unknown> | undefined;
    parent?: unknown;
    parentProperty?: string | undefined;
    forQuery?: unknown[] | undefined;
};
/**
 * JSONPath engine options.
 */
export type JSONPathJTLTOptions = BaseJTLTOptions & {
    templates?: JSONPathTemplateObject[] | TemplateFunction<JSONPathTransformerContext>;
    template?: JSONPathTemplateObject | TemplateFunction<JSONPathTransformerContext>;
    query?: TemplateFunction<JSONPathTransformerContext>;
    engineType?: "jsonpath";
};
/**
 * XPath engine options.
 */
export type XPathJTLTOptions = BaseJTLTOptions & {
    templates?: XPathTemplateObject[] | TemplateFunction<XPathTransformerContext>;
    template?: XPathTemplateObject | TemplateFunction<XPathTransformerContext>;
    query?: TemplateFunction<XPathTransformerContext>;
    engineType: "xpath";
    xpathVersion?: 1 | 2;
};
export type JTLTOptions = JSONPathJTLTOptions | XPathJTLTOptions;
/**
 * Internal options extension adding private runtime state flags.
 * Not part of the public API surface but used for narrowing casts.
 */
export type InternalJTLTOptions = JTLTOptions & {
    _customJoiningTransformer?: boolean;
};
//# sourceMappingURL=types.d.ts.map