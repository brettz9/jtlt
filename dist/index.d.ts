export { default as AbstractJoiningTransformer } from "./AbstractJoiningTransformer.js";
export { default as StringJoiningTransformer } from "./StringJoiningTransformer.js";
export { default as DOMJoiningTransformer } from "./DOMJoiningTransformer.js";
export { default as JSONJoiningTransformer } from "./JSONJoiningTransformer.js";
export { default as XSLTStyleJSONPathResolver } from "./XSLTStyleJSONPathResolver.js";
export { default as JSONPathTransformerContext } from "./JSONPathTransformerContext.js";
export { default as JSONPathTransformer } from "./JSONPathTransformer.js";
export { default as XPathTransformerContext } from "./XPathTransformerContext.js";
export { default as XPathTransformer } from "./XPathTransformer.js";
export default JTLT;
/**
 * A template declaration whose `template` executes with `this` bound
 * to the engine-specific context type `TCtx`.
 */
export type TemplateObject<TCtx> = {
    path: string;
    name?: string | undefined;
    mode?: string | undefined;
    priority?: number | undefined;
    template: (this: TCtx, value?: any, cfg?: {
        mode: string;
    }) => any;
};
/**
 * A callable template function with an engine-specific `this`.
 */
export type TemplateFunction<TCtx> = (this: TCtx, value?: any, cfg?: {
    mode: string;
}) => any;
export type JSONPathTemplateObject = TemplateObject<import("./JSONPathTransformerContext.js").default>;
export type XPathTemplateObject = TemplateObject<import("./XPathTransformerContext.js").default>;
/**
 * Options common to both engines.
 */
export type BaseJTLTOptions = {
    /**
     * A callback supplied with a single
     * argument that is the result of this instance's transform() method. When
     * used in TypeScript, this can be made generic as
     * `success<T>(result: T): void`.
     */
    success: (result: any) => void;
    /**
     * A JSON object or DOM document (XPath)
     */
    data?: any;
    /**
     * URL of a JSON file to retrieve for
     * evaluation
     */
    ajaxData?: string | undefined;
    /**
     * Whether or not to
     * report an error when equal priority templates are found
     */
    errorOnEqualPriority?: boolean | undefined;
    /**
     * Whether to begin transform()
     * immediately.
     */
    autostart?: boolean | undefined;
    /**
     * Whether to prevent
     * parenthetical evaluations in JSONPath. Safer if relying on user
     * input, but reduces capabilities of JSONPath.
     */
    preventEval?: boolean | undefined;
    /**
     * For JSON output, whether to
     * unwrap single-element root arrays to return just the element
     */
    unwrapSingleResult?: boolean | undefined;
    /**
     * The mode in which to begin the transform.
     */
    mode?: string | undefined;
    /**
     * Output type
     */
    outputType?: "string" | "dom" | "json" | undefined;
    /**
     * Will be based the
     * same config as passed to this instance. Defaults to a transforming
     * function based on JSONPath and with its own set of priorities for
     * processing templates.
     */
    engine?: ((opts: JTLTOptions) => any) | undefined;
    /**
     * Callback for getting the priority by specificity
     */
    specificityPriorityResolver?: ((path: string) => 0 | 0.5 | -0.5) | undefined;
    /**
     * A concrete joining transformer instance (or custom subclass) responsible
     * for accumulating output. When omitted, one is created automatically based
     * on `outputType`.
     */
    joiningTransformer?: AbstractJoiningTransformer | undefined;
    /**
     * Config to pass on to the joining
     * transformer
     */
    joiningConfig?: object | undefined;
    /**
     * Parent object for context
     */
    parent?: any;
    /**
     * Parent property name for context
     */
    parentProperty?: string | undefined;
};
/**
 * JSONPath engine options with context-aware template typing.
 */
export type JSONPathJTLTOptions = BaseJTLTOptions & {
    templates?: JSONPathTemplateObject[] | TemplateFunction<import("./JSONPathTransformerContext.js").default>;
    template?: JSONPathTemplateObject | TemplateFunction<import("./JSONPathTransformerContext.js").default>;
    query?: TemplateFunction<import("./JSONPathTransformerContext.js").default>;
    forQuery?: any[];
    engineType?: "jsonpath";
};
/**
 * XPath engine options with context-aware template typing.
 */
export type XPathJTLTOptions = BaseJTLTOptions & {
    templates?: XPathTemplateObject[] | TemplateFunction<import("./XPathTransformerContext.js").default>;
    template?: XPathTemplateObject | TemplateFunction<import("./XPathTransformerContext.js").default>;
    query?: TemplateFunction<import("./XPathTransformerContext.js").default>;
    forQuery?: any[];
    engineType: "xpath";
    xpathVersion?: 1 | 2;
};
export type JTLTOptions = JSONPathJTLTOptions | XPathJTLTOptions;
/**
 * High-level façade for running a JTLT transform.
 *
 * Accepts data and templates (or a root template/query), constructs a joining
 * transformer based on `outputType`, and invokes the JSONPath-based engine.
 * The result is returned to the required `success` callback and also returned
 * from transform().
 */
declare class JTLT {
    /**
     * For templates/queries, one may choose among config.query,
     * config.template, or config.templates, but one must be
     * present and of valid type. For the source json, one must use
     * either a valid config.ajaxData or config.data parameter.
     * @overload
     * @param {JSONPathJTLTOptions} config Options for JSONPath engine
     */
    constructor(config: JSONPathJTLTOptions);
    /**
     * @overload
     * @param {XPathJTLTOptions} config Options for XPath engine
     */
    constructor(config: XPathJTLTOptions);
    /** @type {JTLTOptions} */
    config: JTLTOptions;
    /**
     * @returns {DOMJoiningTransformer|JSONJoiningTransformer|
     *   StringJoiningTransformer}
     */
    _createJoiningTransformer(): DOMJoiningTransformer | JSONJoiningTransformer | StringJoiningTransformer;
    /**
     * @param {string} mode
     * @returns {void}
     */
    _autoStart(mode: string): void;
    /**
     * @param {JTLTOptions} config
     * @returns {JTLT}
     */
    setDefaults(config: JTLTOptions): JTLT;
    /**
     * @param {string} mode The mode of the transformation
     * @returns {any} Result of transformation
     * @todo Allow for a success callback in case the jsonpath code is modified
     *     to work asynchronously (as with queries to access remote JSON
     *     stores)
     */
    transform(mode: string): any;
}
import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';
import DOMJoiningTransformer from './DOMJoiningTransformer.js';
import JSONJoiningTransformer from './JSONJoiningTransformer.js';
import StringJoiningTransformer from './StringJoiningTransformer.js';
//# sourceMappingURL=index.d.ts.map