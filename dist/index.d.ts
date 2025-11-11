/**
 * Create and run a JTLT instance with the appropriate engine typing.
 *
 * Overloads help TypeScript select the correct constructor signature.
 * @overload
 * @param {JSONPathJTLTOptions} cfg
 * @returns {Promise<any>}
 */
export function jtlt(cfg: JSONPathJTLTOptions): Promise<any>;
/**
 * @overload
 * @param {JSONPathJTLTOptions<"string">} cfg
 * @returns {Promise<any>}
 */
export function jtlt(cfg: JSONPathJTLTOptions<"string">): Promise<any>;
/**
 * @overload
 * @param {JSONPathJTLTOptions<"dom">} cfg
 * @returns {Promise<any>}
 */
export function jtlt(cfg: JSONPathJTLTOptions<"dom">): Promise<any>;
/**
 * @overload
 * @param {XPathJTLTOptions} cfg
 * @returns {Promise<any>}
 */
export function jtlt(cfg: XPathJTLTOptions): Promise<any>;
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
    template: TemplateFunction<TCtx>;
};
/**
 * A callable template function with an engine-specific `this`.
 */
export type TemplateFunction<TCtx> = (this: TCtx, value?: any, cfg?: {
    mode?: string;
}) => any;
export type JSONPathTemplateObject<T = "json"> = TemplateObject<import("./JSONPathTransformerContext.js").default<T>>;
export type XPathTemplateObject = TemplateObject<import("./XPathTransformerContext.js").default>;
export type XPathTemplateArray = (XPathTemplateObject | [string, TemplateFunction<import("./XPathTransformerContext.js").default>])[];
export type JSONPathTemplateArray<T> = JSONPathTemplateObject<T> | [string, TemplateFunction<import("./JSONPathTransformerContext.js").default>];
export type JoiningTransformer = (StringJoiningTransformer | DOMJoiningTransformer | JSONJoiningTransformer);
/**
 * Options common to both engines.
 */
export type BaseJTLTOptions = {
    /**
     * A callback supplied
     * with a single argument that is the result of this instance's
     * transform() method. When used in TypeScript, this can be made
     * generic as `success<T>(result: T): void`.
     */
    success: (result: any) => void;
    /**
     * A JSON
     * object or DOM document (XPath)
     */
    data?: string | number | boolean | object | null | undefined;
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
     * Will be based the
     * same config as passed to this instance. Defaults to a transforming
     * function based on JSONPath and with its own set of priorities for
     * processing templates.
     */
    engine?: ((opts: JTLTOptions & Required<Pick<JTLTOptions, "joiningTransformer">>) => unknown) | undefined;
    /**
     * Callback for getting the priority by specificity
     */
    specificityPriorityResolver?: ((path: string) => 0 | 0.5 | -0.5) | undefined;
    /**
     * A concrete joining transformer instance (or custom subclass) responsible
     * for accumulating output. When omitted, one is created automatically based
     * on `outputType`.
     */
    joiningTransformer?: JoiningTransformer | undefined;
    /**
     * Config for the joining
     * transformer
     */
    joiningConfig?: Record<string, unknown> | undefined;
    /**
     * Parent object for context
     */
    parent?: object | undefined;
    /**
     * Parent property name for context
     */
    parentProperty?: string | undefined;
};
/**
 * JSONPath engine options with context-aware template typing.
 */
export type JSONPathJTLTOptions<T = "json"> = BaseJTLTOptions & {
    templates?: JSONPathTemplateArray<T>[];
    template?: JSONPathTemplateObject<T> | TemplateFunction<import("./JSONPathTransformerContext.js").default>;
    query?: TemplateFunction<import("./JSONPathTransformerContext.js").default>;
    forQuery?: unknown[];
    engineType?: "jsonpath";
    outputType?: T;
};
/**
 * XPath engine options with context-aware template typing.
 */
export type XPathJTLTOptions = BaseJTLTOptions & {
    templates?: XPathTemplateArray;
    template?: XPathTemplateObject | TemplateFunction<import("./XPathTransformerContext.js").default>;
    query?: TemplateFunction<import("./XPathTransformerContext.js").default>;
    forQuery?: unknown[];
    engineType: "xpath";
    xpathVersion?: 1 | 2;
    outputType?: "string" | "dom" | "json";
};
export type JTLTOptions = JSONPathJTLTOptions | JSONPathJTLTOptions<"string"> | JSONPathJTLTOptions<"dom"> | XPathJTLTOptions;
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
     * @param {JSONPathJTLTOptions<"string">} config Options for JSONPath engine
     */
    constructor(config: JSONPathJTLTOptions<"string">);
    /**
     * @overload
     * @param {JSONPathJTLTOptions<"dom">} config Options for JSONPath engine
     */
    constructor(config: JSONPathJTLTOptions<"dom">);
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
     * @param {string|undefined} mode
     * @returns {void}
     */
    _autoStart(mode: string | undefined): void;
    /**
     * @param {JTLTOptions} config
     * @returns {JTLT}
     */
    setDefaults(config: JTLTOptions): JTLT;
    /**
     * @param {string} [mode] The mode of the transformation
     * @returns {void} Result of transformation
     * @todo Allow for a success callback in case the jsonpath code is modified
     *     to work asynchronously (as with queries to access remote JSON
     *     stores)
     */
    transform(mode?: string): void;
}
import StringJoiningTransformer from './StringJoiningTransformer.js';
import DOMJoiningTransformer from './DOMJoiningTransformer.js';
import JSONJoiningTransformer from './JSONJoiningTransformer.js';
//# sourceMappingURL=index.d.ts.map