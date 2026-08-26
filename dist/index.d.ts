import DOMJoiningTransformer from './DOMJoiningTransformer.js';
import JSONJoiningTransformer from './JSONJoiningTransformer.js';
import StringJoiningTransformer from './StringJoiningTransformer.js';
/**
 * @param {import('jsdom').DOMWindow | typeof globalThis} win
 */
export declare const setWindow: (win: import('jsdom').DOMWindow | typeof globalThis) => void;
export type InternalJTLTOptions = JTLTOptions & {
    _customJoiningTransformer?: boolean;
};
export type TemplateObject<T, U, TCtx> = {
    /**
     * - JSONPath or XPath selector for matching nodes
     */
    path?: string;
    /**
     * - Alias for 'path' (XSLT compatibility)
     */
    match?: string;
    /**
     * - Optional name for calling via callTemplate
     */
    name?: string;
    /**
     * - Optional mode for template matching
     */
    mode?: string;
    /**
     * - Priority for template selection
     */
    priority?: number;
    /**
     * - Template function
     */
    template: TemplateFunction<T, U, TCtx>;
};
export type TemplateFunction<T, U, TCtx> = (this: TCtx, value: ResultType<U>, cfg?: {
    mode?: string;
}) => ResultType<T> | void;
export type JSONPathTemplateObject<T> = TemplateObject<T, "json", import('./JSONPathTransformerContext.js').default<T>>;
export type XPathTemplateObject<T> = TemplateObject<T, "dom", import('./XPathTransformerContext.js').default>;
export type XPathTemplateArray<T> = (XPathTemplateObject<T> | [
    string,
    TemplateFunction<T, "dom", import('./XPathTransformerContext.js').default>
])[];
export type JSONPathTemplateArray<T> = JSONPathTemplateObject<T> | [
    string,
    TemplateFunction<T, "json", import('./JSONPathTransformerContext.js').default>
];
export type JoiningTransformer = (StringJoiningTransformer | DOMJoiningTransformer | JSONJoiningTransformer);
export type joiningTypes = "json" | "string" | "dom";
export type ResultType<T> = T extends "json" ? unknown : T extends "string" ? string : DocumentFragment | Element;
export type BaseJTLTOptions<T> = {
    /**
     * A callback supplied
     * with a single argument that is the result of this instance's
     * transform() method. When used in TypeScript, this can be made
     * generic as `success<T>(result: T): void`.
     */
    success: (result: ResultType<T>) => void;
    /**
     * A JSON
     * object or DOM document (XPath)
     */
    data?: null | boolean | number | string | object;
    /**
     * URL of a JSON file to retrieve for
     * evaluation
     */
    ajaxData?: string;
    /**
     * Whether or not to
     * report an error when equal priority templates are found
     */
    errorOnEqualPriority?: boolean;
    /**
     * Whether to begin transform()
     * immediately.
     */
    autostart?: boolean;
    /**
     * Whether to prevent
     * parenthetical evaluations in JSONPath. Safer if relying on user
     * input, but reduces capabilities of JSONPath.
     */
    preventEval?: boolean;
    /**
     * For JSON output, whether to
     * unwrap single-element root arrays to return just the element
     */
    unwrapSingleResult?: boolean;
    /**
     * When true, joiners return an array
     * of complete documents: XMLDocument[] for DOM, document wrapper objects[]
     * for JSON, and string[] for string joiners. Each array element corresponds
     * to a root element built during transformation.
     */
    exposeDocuments?: boolean;
    /**
     * The mode in which to begin the transform.
     */
    mode?: string;
    /**
     * Will be based on the
     * same config as passed to this instance. Defaults to a transforming
     * function based on JSONPath and with its own set of priorities for
     * processing templates.
     */
    engine?: (opts: JTLTOptions & Required<Pick<JTLTOptions, "joiningTransformer">>) => ResultType<T>;
    /**
     * Callback for getting the priority by specificity
     */
    specificityPriorityResolver?: (path: string) => 0 | 0.5 | -0.5;
    /**
     * A concrete joining transformer instance (or custom subclass) responsible
     * for accumulating output. When omitted, one is created automatically based
     * on `outputType`.
     */
    joiningTransformer?: JoiningTransformer;
    /**
     * Config for the joining
     * transformer.
     */
    joiningConfig?: import('./AbstractJoiningTransformer.js').JoiningTransformerConfig<T>;
    /**
     * Parent object for context
     */
    parent?: object;
    /**
     * Parent property name for context
     */
    parentProperty?: string;
};
export type JSONPathJTLTOptions<T = "json"> = BaseJTLTOptions<T> & {
    templates?: JSONPathTemplateArray<T>[];
    template?: JSONPathTemplateObject<T> | TemplateFunction<T, "json", import('./JSONPathTransformerContext.js').default>;
    query?: TemplateFunction<T, "json", import('./JSONPathTransformerContext.js').default>;
    forQuery?: [string, TemplateFunction<T, "json", import('./XPathTransformerContext.js').default>];
    engineType?: 'jsonpath';
    outputType?: T;
};
export type XPathJTLTOptions<T> = BaseJTLTOptions<T> & {
    templates?: XPathTemplateArray<T>;
    template?: XPathTemplateObject<T> | TemplateFunction<T, "dom", import('./XPathTransformerContext.js').default>;
    query?: TemplateFunction<T, "dom", import('./XPathTransformerContext.js').default>;
    forQuery?: [string, TemplateFunction<T, "dom", import('./JSONPathTransformerContext.js').default>];
    engineType: 'xpath';
    xpathVersion?: 1 | 2 | 3.1;
    outputType?: T;
};
export type JTLTOptions = JSONPathJTLTOptions | JSONPathJTLTOptions<"string"> | JSONPathJTLTOptions<"dom"> | XPathJTLTOptions<"json"> | XPathJTLTOptions<"string"> | XPathJTLTOptions<"dom">;
/**
 * Internal options extension adding private runtime state flags.
 * Not part of the public API surface but used for narrowing casts.
 * @typedef {JTLTOptions & {
 *   _customJoiningTransformer?: boolean
 * }} InternalJTLTOptions
 */
/**
 * A template declaration whose `template` executes with `this` bound
 * to the engine-specific context type `TCtx`.
 * Either `path` must be provided (for pattern matching), or `name` must be
 * provided (for named templates callable via callTemplate), or both.
 * @template T
 * @template U
 * @template TCtx
 * @typedef {object} TemplateObject
 * @property {string} [path] - JSONPath or XPath selector for matching nodes
 * @property {string} [match] - Alias for 'path' (XSLT compatibility)
 * @property {string} [name] - Optional name for calling via callTemplate
 * @property {string} [mode] - Optional mode for template matching
 * @property {number} [priority] - Priority for template selection
 * @property {TemplateFunction<T, U, TCtx>} template - Template function
 */
/**
 * A callable template function with an engine-specific `this`.
 * @template T
 * @template U
 * @template TCtx
 * @typedef {(this: TCtx,
 *   value: ResultType<U>,
 *   cfg?: {mode?: string}
 * ) => ResultType<T>|void} TemplateFunction
 */
/**
 * @template T
 * @typedef {TemplateObject<T, "json",
 *   import('./JSONPathTransformerContext.js').default<T>
 * >} JSONPathTemplateObject
 */
/**
 * @template T
 * @typedef {TemplateObject<T, "dom",
 *   import('./XPathTransformerContext.js').default
 * >} XPathTemplateObject
 */
/**
 * @template T
 * @typedef {(XPathTemplateObject<T> | [string, TemplateFunction<T, "dom",
 *   import('./XPathTransformerContext.js').default
 * >])[]} XPathTemplateArray
 */
/**
 * @template T
 * @typedef {JSONPathTemplateObject<T> | [string, TemplateFunction<T, "json",
 *   import('./JSONPathTransformerContext.js').default
 * >]} JSONPathTemplateArray
 */
/**
 * @typedef {(
 *   StringJoiningTransformer|
 *   DOMJoiningTransformer|
 *   JSONJoiningTransformer
 * )} JoiningTransformer
 */
/**
 * @typedef {"json"|"string"|"dom"} joiningTypes
 */
/**
 * @template T
 * @typedef {T extends "json" ? unknown : T extends "string" ? string :
 *   DocumentFragment|Element} ResultType
 */
/**
 * Options common to both engines.
 * @template T
 * @typedef {object} BaseJTLTOptions
 * @property {(
 *   result: ResultType<T>
 * ) => void} success A callback supplied
 *   with a single argument that is the result of this instance's
 *   transform() method. When used in TypeScript, this can be made
 *   generic as `success<T>(result: T): void`.
 * @property {null|boolean|number|string|object} [data] A JSON
 *   object or DOM document (XPath)
 * @property {string} [ajaxData] URL of a JSON file to retrieve for
 * evaluation
 * @property {boolean} [errorOnEqualPriority] Whether or not to
 * report an error when equal priority templates are found
 * @property {boolean} [autostart] Whether to begin transform()
 * immediately.
 * @property {boolean} [preventEval] Whether to prevent
 * parenthetical evaluations in JSONPath. Safer if relying on user
 * input, but reduces capabilities of JSONPath.
 * @property {boolean} [unwrapSingleResult] For JSON output, whether to
 * unwrap single-element root arrays to return just the element
 * @property {boolean} [exposeDocuments] When true, joiners return an array
 * of complete documents: XMLDocument[] for DOM, document wrapper objects[]
 * for JSON, and string[] for string joiners. Each array element corresponds
 * to a root element built during transformation.
 * @property {string} [mode] The mode in which to begin the transform.
 * @property {(opts: JTLTOptions &
 *   Required<Pick<JTLTOptions, "joiningTransformer">>
 * ) => ResultType<T>} [engine] Will be based on the
 * same config as passed to this instance. Defaults to a transforming
 * function based on JSONPath and with its own set of priorities for
 * processing templates.
 * @property {(path: string) => 0 | 0.5 | -0.5} [specificityPriorityResolver]
 * Callback for getting the priority by specificity
 * @property {JoiningTransformer} [joiningTransformer]
 * A concrete joining transformer instance (or custom subclass) responsible
 * for accumulating output. When omitted, one is created automatically based
 * on `outputType`.
 * @property {import('./AbstractJoiningTransformer.js').
 *   JoiningTransformerConfig<T>} [joiningConfig] Config for the joining
 *   transformer.
 * @property {object} [parent] Parent object for context
 * @property {string} [parentProperty] Parent property name for context
 */
/**
 * JSONPath engine options with context-aware template typing.
 * @template [T = "json"]
 * @typedef {BaseJTLTOptions<T> & {
 *   templates?: JSONPathTemplateArray<T>[],
 *   template?: JSONPathTemplateObject<T> | TemplateFunction<T, "json",
 *     import('./JSONPathTransformerContext.js').default
 *   >,
 *   query?: TemplateFunction<T, "json",
 *     import('./JSONPathTransformerContext.js').default
 *   >,
 *   forQuery?: [string, TemplateFunction<T, "json",
 *     import('./XPathTransformerContext.js').default
 *   >],
 *   engineType?: 'jsonpath',
 *   outputType?: T
 * }} JSONPathJTLTOptions
 */
/**
 * XPath engine options with context-aware template typing.
 * @template T
 * @typedef {BaseJTLTOptions<T> & {
 *   templates?: XPathTemplateArray<T>,
 *   template?: XPathTemplateObject<T> | TemplateFunction<T, "dom",
 *     import('./XPathTransformerContext.js').default
 *   >,
 *   query?: TemplateFunction<T, "dom",
 *     import('./XPathTransformerContext.js').default
 *   >,
 *   forQuery?: [string, TemplateFunction<T, "dom",
 *     import('./JSONPathTransformerContext.js').default
 *   >],
 *   engineType: 'xpath',
 *   xpathVersion?: 1|2|3.1,
 *   outputType?: T
 * }} XPathJTLTOptions
 */
/**
 * @typedef {JSONPathJTLTOptions |
 *   JSONPathJTLTOptions<"string"> |
 *   JSONPathJTLTOptions<"dom"> |
 *   XPathJTLTOptions<"json">|
 *   XPathJTLTOptions<"string">|
 *   XPathJTLTOptions<"dom">} JTLTOptions
 */
/**
 * High-level façade for running a JTLT transform.
 *
 * Accepts data and templates (or a root template/query), constructs a joining
 * transformer based on `outputType`, and invokes the JSONPath-based engine.
 * The result is returned to the required `success` callback and also returned
 * from transform().
 */
declare class JTLT {
    /** @type {JTLTOptions} */
    config: JTLTOptions;
    constructor(config: JSONPathJTLTOptions);
    constructor(config: JSONPathJTLTOptions<"string">);
    constructor(config: JSONPathJTLTOptions<"dom">);
    constructor(config: XPathJTLTOptions<"json">);
    constructor(config: XPathJTLTOptions<"string">);
    constructor(config: XPathJTLTOptions<"dom">);
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
     * @returns {void}
     * @todo Allow for a success callback in case the jsonpath code is modified
     *     to work asynchronously (as with queries to access remote JSON
     *     stores)
     */
    transform(mode?: string): void;
}
export declare function jtlt(cfg: Omit<JSONPathJTLTOptions<"json">, "success">): Promise<ResultType<"json">>;
export declare function jtlt(cfg: Omit<JSONPathJTLTOptions<"string">, "success">): Promise<ResultType<"string">>;
export declare function jtlt(cfg: Omit<JSONPathJTLTOptions<"dom">, "success">): Promise<ResultType<"dom">>;
export declare function jtlt(cfg: Omit<XPathJTLTOptions<"json">, "success">): Promise<ResultType<"json">>;
export declare function jtlt(cfg: Omit<XPathJTLTOptions<"dom">, "success">): Promise<ResultType<"dom">>;
export declare function jtlt(cfg: Omit<XPathJTLTOptions<"string">, "success">): Promise<ResultType<"string">>;
export { default as AbstractJoiningTransformer } from './AbstractJoiningTransformer.js';
export { default as StringJoiningTransformer } from './StringJoiningTransformer.js';
export { default as DOMJoiningTransformer } from './DOMJoiningTransformer.js';
export { default as JSONJoiningTransformer } from './JSONJoiningTransformer.js';
export { default as XSLTStyleJSONPathResolver } from './XSLTStyleJSONPathResolver.js';
export { default as JSONPathTransformerContext } from './JSONPathTransformerContext.js';
export { default as JSONPathTransformer } from './JSONPathTransformer.js';
export { default as XPathTransformerContext } from './XPathTransformerContext.js';
export { default as XPathTransformer } from './XPathTransformer.js';
export default JTLT;
//# sourceMappingURL=index.d.ts.map