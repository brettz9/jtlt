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
     * - For an Array `template` only:
     * the jamilih validation strictness `compileJSONTemplate` applies
     * (`isValidJamilih`'s own `format` option) — `'json'` (default) rejects
     * live values (functions, DOM nodes, …) embedded in the structure,
     * `'javascript'` allows them. Ignored for a function `template`. Falls
     * back to `config.defaultTemplateFormat`, then `'json'`, when omitted.
     */
    format?: 'json' | 'javascript';
    /**
     * -
     * Template function, or a declarative (jamilih-shaped) node array
     * compiled via `compileJSONTemplate` — detected by `Array.isArray`, since
     * a `TemplateFunction` is never an array.
     */
    template: TemplateFunction<T, U, TCtx> | JSONTemplateNode[];
};
export type TemplateFunction<T, U, TCtx> = (this: TCtx & import('./context-extensions.js').ContextExtensions, value: ResultType<U>, cfg?: {
    mode?: string;
}) => ResultType<T> | void | Promise<ResultType<T> | void>;
export type JSONPathTemplateObject<T extends "json" | "string" | "dom"> = TemplateObject<T, "json", import('./JSONPathTransformerContext.js').default<T>>;
export type XPathTemplateObject<T> = TemplateObject<T, "dom", import('./XPathTransformerContext.js').default>;
export type XPathTemplateArray<T> = (XPathTemplateObject<T> | [
    string,
    TemplateFunction<T, "dom", import('./XPathTransformerContext.js').default>
])[];
export type JSONPathTemplateArray<T extends "json" | "string" | "dom"> = JSONPathTemplateObject<T> | [
    string,
    TemplateFunction<T, "json", import('./JSONPathTransformerContext.js').default> | JSONTemplateNode[]
];
export type JSONElementNode = [string] | [
    string,
    Record<string, unknown>
] | [
    string,
    JSONTemplateNode[]
] | [
    string,
    Record<string, unknown>,
    JSONTemplateNode[]
];
export type JSONOperationNode = [{
    $text: unknown;
}] | [
    {
        $jtltText: unknown;
        $select?: string;
    }
] | [
    {
        $string: unknown;
        $select?: string;
    }
] | [
    {
        $valueOf: string;
    }
] | [
    {
        $applyTemplates: string;
        $jtltMode?: string;
        $sort?: unknown;
    }
] | [
    {
        $if: string;
    },
    JSONTemplateNode[]
] | [
    {
        $if: string;
    },
    JSONTemplateNode[],
    JSONTemplateNode[]
] | [
    {
        $forEach: string;
        $sort?: unknown;
    },
    JSONTemplateNode[]
] | [
    {
        $variable: string;
        $select: string;
    }
] | [
    {
        $indexedDB: {
            db: string;
            store: string;
            options?: import('./indexedDB.js').QueryOptions;
        };
        $as?: string;
    }
] | [
    {
        $indexedDB: {
            db: string;
            store: string;
            options?: import('./indexedDB.js').QueryOptions;
        };
        $as?: string;
    },
    JSONTemplateNode[]
] | [
    {
        $renderDefault: true;
    }
];
export type JSONTemplateNode = string | JSONElementNode | JSONOperationNode;
export type JoiningTransformerContract = {
    append: (item: unknown) => unknown;
    get: () => unknown;
    text?: (txt: string) => unknown;
    string?: (str: unknown, cb?: () => void) => unknown;
    number?: (num: unknown) => unknown;
    object?: (obj: unknown, cb?: unknown, usePropertySets?: unknown, propSets?: unknown) => unknown;
    array?: (arr: unknown, cb?: unknown) => unknown;
    element?: (name: string, atts?: unknown, children?: unknown, cb?: unknown, useAttributeSets?: unknown) => unknown;
    attribute?: (name: string, val: unknown, avoidAttEscape?: unknown) => unknown;
    comment?: (text: string) => unknown;
    processingInstruction?: (target: string, data: string) => unknown;
    plainText?: (str: unknown) => unknown;
    propValue?: (prop: unknown, val: unknown) => unknown;
    rawAppend?: (item: unknown) => unknown;
    namespace?: (prefix: string, namespaceURI: string) => unknown;
    setContext?: (context: unknown) => unknown;
    output?: (cfg: unknown) => unknown;
    mode?: (cfg: unknown) => unknown;
    stylesheet?: (cfg: unknown) => unknown;
    function?: (cfg: unknown) => unknown;
    invokeFunctionByArity?: (name: string, args?: unknown[]) => unknown;
    characterMap?: (name: string, outputCharacters: unknown) => unknown;
    attributeSet?: (name: string, attributes: unknown) => unknown;
    namespaceAlias?: (stylesheetPrefix: string, resultPrefix: string) => unknown;
};
export type BuiltinJoiningTransformer = (StringJoiningTransformer | DOMJoiningTransformer | JSONJoiningTransformer);
export type JoiningTransformer = BuiltinJoiningTransformer | JoiningTransformerContract;
export type joiningTypes = "json" | "string" | "dom";
export type ResultType<T, E extends boolean | undefined = false> = T extends "json" ? (E extends true ? unknown[] : unknown) : T extends "string" ? (E extends true ? string[] : string) : (E extends true ? XMLDocument[] : DocumentFragment | Element);
export type BaseJTLTOptions<T, E extends boolean | undefined = false> = {
    /**
     * Off by default: the engine awaits any Promise a
     * template returns (e.g. from `await this.indexedDB(...)`). Set `true` to
     * forbid asynchrony — a template that returns a Promise then throws.
     */
    sync?: boolean;
    /**
     * A callback supplied
     * with a single argument that is the result of this instance's
     * transform() method. When used in TypeScript, this can be made
     * generic as `success<T>(result: T): void`.
     */
    success?: (result: ResultType<T, E>) => ResultType<T, E> | void;
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
    exposeDocuments?: E;
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
    engine?: (opts: JTLTOptions & Required<Pick<JTLTOptions, "joiningTransformer">>) => ResultType<T, E>;
    /**
     * Callback for getting the priority by specificity
     */
    specificityPriorityResolver?: null | ((path: string) => 0 | 0.5 | -0.5);
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
    joiningConfig?: import('./AbstractJoiningTransformer.js').JoiningTransformerConfig<T> & {
        exposeDocuments?: E;
    };
    /**
     * Parent object for context
     */
    parent?: object;
    /**
     * Parent property name for context
     */
    parentProperty?: string;
    /**
     * Parameter values supplied at
     * runtime, mirroring the stylesheet parameters an XSLT processor is handed.
     * A `this.param(name, default)` declaration whose name appears here resolves
     * to this value instead of its default, and `$name` references such a
     * parameter from any template.
     */
    params?: Record<string, unknown>;
    /**
     * Config-wide
     * default for an Array `template`'s jamilih validation strictness (see
     * `TemplateObject.format`), used for any entry that doesn't specify its
     * own `format`. Defaults to `'json'` when omitted here too.
     */
    defaultTemplateFormat?: 'json' | 'javascript';
};
export type JSONPathJTLTOptions<T extends "json" | "string" | "dom" = "json", E extends boolean | undefined = false> = BaseJTLTOptions<T, E> & {
    templates?: JSONPathTemplateArray<T>[] | JSONPathTemplateArray<T> | TemplateFunction<T, "json", import('./JSONPathTransformerContext.js').default<T>>;
    template?: JSONPathTemplateObject<T> | TemplateFunction<T, "json", import('./JSONPathTransformerContext.js').default>;
    query?: TemplateFunction<T, "json", import('./JSONPathTransformerContext.js').default>;
    forQuery?: [string, TemplateFunction<T, "json", import('./XPathTransformerContext.js').default>];
    extensions?: Record<string, unknown> & ThisType<import('./JSONPathTransformerContext.js').default<T> & import('./context-extensions.js').ContextExtensions>;
    engineType?: 'jsonpath';
    outputType?: T;
};
export type XPathJTLTOptions<T extends "json" | "string" | "dom", E extends boolean | undefined = false> = BaseJTLTOptions<T, E> & {
    templates?: XPathTemplateArray<T> | TemplateFunction<T, "dom", import('./XPathTransformerContext.js').default<T>>;
    template?: XPathTemplateObject<T> | TemplateFunction<T, "dom", import('./XPathTransformerContext.js').default>;
    query?: TemplateFunction<T, "dom", import('./XPathTransformerContext.js').default>;
    forQuery?: [string, TemplateFunction<T, "dom", import('./JSONPathTransformerContext.js').default>];
    extensions?: Record<string, unknown> & ThisType<import('./XPathTransformerContext.js').default & import('./context-extensions.js').ContextExtensions>;
    engineType: 'xpath';
    xpathVersion?: 1 | 2 | 3.1;
    outputType?: T;
};
export type JTLTOptions<E extends boolean | undefined = boolean | undefined> = JSONPathJTLTOptions<"json", E> | JSONPathJTLTOptions<"string", E> | JSONPathJTLTOptions<"dom", E> | XPathJTLTOptions<"json", E> | XPathJTLTOptions<"string", E> | XPathJTLTOptions<"dom", E>;
/**
 * High-level façade for running a JTLT transform.
 *
 * Accepts data and templates (or a root template/query), constructs a joining
 * transformer based on `outputType`, and invokes the JSONPath-based engine.
 * The result is returned to the required `success` callback and also returned
 * from transform().
 * @template {"json"|"string"|"dom"} [T="json"]
 * @template {boolean|undefined} [E=false]
 */
declare class JTLT<T extends "json" | "string" | "dom" = "json", E extends boolean | undefined = false> {
    /** @type {any} */
    config: any;
    /**
     * @template {"json"|"string"|"dom"} [T="json"]
     * @template {boolean|undefined} [E=false]
     * @param {JSONPathJTLTOptions<T, E> | XPathJTLTOptions<T, E>} config
     * @returns {JTLT<T, E>}
     */
    static create<T extends "json" | "string" | "dom" = "json", E extends boolean | undefined = false>(config: JSONPathJTLTOptions<T, E> | XPathJTLTOptions<T, E>): JTLT<T, E>;
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
     * @param {null|JTLTOptions} config
     * @returns {JTLT}
     */
    setDefaults(config: null | JTLTOptions): JTLT;
    /**
     * @param {string} [mode] The mode of the transformation
     * @returns {ResultType<T, E>}
     * @todo Allow for a success callback in case the jsonpath code is modified
     *     to work asynchronously (as with queries to access remote JSON
     *     stores)
     */
    transform(mode?: string): ResultType<T, E>;
}
export declare function jtlt(cfg: Omit<JSONPathJTLTOptions<"json", false>, "success">): Promise<ResultType<"json", false>>;
export declare function jtlt(cfg: Omit<JSONPathJTLTOptions<"json", true>, "success">): Promise<ResultType<"json", true>>;
export declare function jtlt(cfg: Omit<JSONPathJTLTOptions<"string", false>, "success">): Promise<ResultType<"string", false>>;
export declare function jtlt(cfg: Omit<JSONPathJTLTOptions<"string", true>, "success">): Promise<ResultType<"string", true>>;
export declare function jtlt(cfg: Omit<JSONPathJTLTOptions<"dom", false>, "success">): Promise<ResultType<"dom", false>>;
export declare function jtlt(cfg: Omit<JSONPathJTLTOptions<"dom", true>, "success">): Promise<ResultType<"dom", true>>;
export declare function jtlt(cfg: Omit<XPathJTLTOptions<"json", false>, "success">): Promise<ResultType<"json", false>>;
export declare function jtlt(cfg: Omit<XPathJTLTOptions<"json", true>, "success">): Promise<ResultType<"json", true>>;
export declare function jtlt(cfg: Omit<XPathJTLTOptions<"dom", false>, "success">): Promise<ResultType<"dom", false>>;
export declare function jtlt(cfg: Omit<XPathJTLTOptions<"dom", true>, "success">): Promise<ResultType<"dom", true>>;
export declare function jtlt(cfg: Omit<XPathJTLTOptions<"string", false>, "success">): Promise<ResultType<"string", false>>;
export declare function jtlt(cfg: Omit<XPathJTLTOptions<"string", true>, "success">): Promise<ResultType<"string", true>>;
export { default as AbstractJoiningTransformer } from './AbstractJoiningTransformer.js';
export { default as StringJoiningTransformer } from './StringJoiningTransformer.js';
export { default as DOMJoiningTransformer } from './DOMJoiningTransformer.js';
export { default as JSONJoiningTransformer } from './JSONJoiningTransformer.js';
export { default as XSLTStyleJSONPathResolver } from './XSLTStyleJSONPathResolver.js';
export { default as JSONPathTransformerContext } from './JSONPathTransformerContext.js';
export { default as JSONPathTransformer } from './JSONPathTransformer.js';
export { default as XPathTransformerContext } from './XPathTransformerContext.js';
export { default as XPathTransformer } from './XPathTransformer.js';
export { compileJSONTemplate, extractReads, isJSONTemplateNodeArray, validateJSONTemplate } from './jsonTemplate.js';
export default JTLT;
//# sourceMappingURL=index.d.ts.map