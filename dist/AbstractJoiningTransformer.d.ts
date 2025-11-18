export default AbstractJoiningTransformer;
export type OutputCharacters = {
    character: string;
    string: string;
}[];
export type BaseTransformerConfig = {
    requireSameChildren?: boolean;
    JHTMLForJSON?: boolean;
    mode?: "JSON" | "JavaScript";
};
/**
 * When exposeDocuments is true, get() returns an array of XMLDocument
 * objects (one per root element) instead of a DocumentFragment.
 */
export type DOMJoiningTransformerConfig = BaseTransformerConfig & {
    document: Document;
    exposeDocuments?: boolean;
};
export type JSONJoiningTransformerConfig = {
    requireSameChildren?: boolean | undefined;
    unwrapSingleResult?: boolean | undefined;
    /**
     * - When true, get() returns an array
     * of document wrapper objects (one per root element) instead of the raw array.
     */
    exposeDocuments?: boolean | undefined;
    mode?: "JSON" | "JavaScript" | undefined;
};
/**
 * When exposeDocuments is true, get() returns an array of document
 * strings (one per root element) instead of a single concatenated string.
 */
export type StringJoiningTransformerConfig = BaseTransformerConfig & {
    xmlElements?: boolean;
    preEscapedAttributes?: boolean;
    exposeDocuments?: boolean;
};
export type JoiningTransformerConfig<T> = T extends "string" ? StringJoiningTransformerConfig : T extends "dom" ? DOMJoiningTransformerConfig : T extends "json" ? JSONJoiningTransformerConfig : never;
/**
 * @typedef {{character: string, string: string}[]} OutputCharacters
 */
/**
 * @typedef {{
 *   requireSameChildren?: boolean,
 *   JHTMLForJSON?: boolean,
 *   mode?: "JSON"|"JavaScript"
 * }} BaseTransformerConfig
 */
/**
 * @typedef {BaseTransformerConfig & {
 *   document: Document,
 *   exposeDocuments?: boolean
 * }} DOMJoiningTransformerConfig
 * When exposeDocuments is true, get() returns an array of XMLDocument
 * objects (one per root element) instead of a DocumentFragment.
 */
/**
 * @typedef {object} JSONJoiningTransformerConfig
 * @property {boolean} [requireSameChildren]
 * @property {boolean} [unwrapSingleResult]
 * @property {boolean} [exposeDocuments] - When true, get() returns an array
 * of document wrapper objects (one per root element) instead of the raw array.
 * @property {"JSON"|"JavaScript"} [mode]
 */
/**
 * @typedef {BaseTransformerConfig & {
 *   xmlElements?: boolean,
 *   preEscapedAttributes?: boolean,
 *   exposeDocuments?: boolean
 * }} StringJoiningTransformerConfig
 * When exposeDocuments is true, get() returns an array of document
 * strings (one per root element) instead of a single concatenated string.
 */
/**
 * @template T
 * @typedef {T extends "string" ? StringJoiningTransformerConfig :
 *   T extends "dom" ? DOMJoiningTransformerConfig :
 *   T extends "json" ? JSONJoiningTransformerConfig : never
 * } JoiningTransformerConfig
 */
/**
 * Base class for joining transformers.
 *
 * A "joining transformer" is the sink that receives template outputs and
 * accumulates them into a particular representation (string, DOM, JSON).
 * Subclasses implement a consistent set of methods (string, number, object,
 * array, element, text, etc.) but may interpret them differently according
 * to their target representation.
 *
 * Common patterns supported by all joiners:
 * - append(): central method that either concatenates, pushes, or assigns
 *   based on the current state.
 * - get(): returns the accumulated result.
 * - config(): temporarily tweak a config flag for the duration of a callback.
 * @template T
 */
declare class AbstractJoiningTransformer<T> {
    /**
     * @param {JoiningTransformerConfig<T>} [cfg] - Configuration object
     */
    constructor(cfg?: JoiningTransformerConfig<T>);
    _cfg: JoiningTransformerConfig<T>;
    /** @type {Record<string, OutputCharacters>} */
    _characterMap: Record<string, OutputCharacters>;
    /** @type {Record<string, Record<string, string>>} */
    _attributeSet: Record<string, Record<string, string>>;
    /** @type {Map<string, string>} */
    _namespaceAliases: Map<string, string>;
    /**
     * @type {{
     *   onMultipleMatch?: "use-last"|"fail",
     *   warningOnMultipleMatch?: boolean,
     *   onNoMatch?: "shallow-copy"|"deep-copy"|"fail"|"apply-templates"|
     *     "shallow-skip"|"deep-skip"|"text-only-copy",
     *   warningOnNoMatch?: boolean
     * }|undefined}
     */
    _modeConfig: {
        onMultipleMatch?: "use-last" | "fail";
        warningOnMultipleMatch?: boolean;
        onNoMatch?: "shallow-copy" | "deep-copy" | "fail" | "apply-templates" | "shallow-skip" | "deep-skip" | "text-only-copy";
        warningOnNoMatch?: boolean;
    } | undefined;
    /** @type {Set<string>} */
    _excludeResultPrefixes: Set<string>;
    /** @type {Set<string>} */
    _usedNamespacePrefixes: Set<string>;
    /**
     * Pending namespace declarations that may be excluded.
     * @type {Array<{
     *   prefix: string,
     *   namespaceURI: string,
     *   callback: () => void
     * }>}
     */
    _pendingNamespaces: Array<{
        prefix: string;
        namespaceURI: string;
        callback: () => void;
    }>;
    /**
     * Track which prefixes have pending namespace declarations.
     * @type {Map<string, {prefix: string, namespaceURI: string}>}
     */
    _pendingNamespaceMap: Map<string, {
        prefix: string;
        namespaceURI: string;
    }>;
    /**
     * Registered stylesheet functions (similar to xsl:function).
     * Key format: "namespace:localName#arity".
     * @type {Map<string, {
     *   name: string,
     *   params: Array<{name: string, as?: string}>,
     *   body: (...args: any[]) => any,
     *   returnType?: string
     * }>}
     */
    _registeredFunctions: Map<string, {
        name: string;
        params: Array<{
            name: string;
            as?: string;
        }>;
        body: (...args: any[]) => any;
        returnType?: string;
    }>;
    /**
     * @param {JoiningTransformerConfig<T>} cfg - Configuration object
     * @returns {void}
     */
    setConfig(cfg: JoiningTransformerConfig<T>): void;
    /**
     * @param {import('./StringJoiningTransformer.js').OutputConfig} cfg
     * @returns {this}
     */
    output(cfg: import("./StringJoiningTransformer.js").OutputConfig): this;
    _outputConfig: import("./StringJoiningTransformer.js").OutputConfig | undefined;
    mediaType: string | undefined;
    /**
     * Configure mode behavior (similar to xsl:mode).
     * @param {{
     *   onMultipleMatch?: "use-last"|"fail",
     *   warningOnMultipleMatch?: boolean,
     *   onNoMatch?: "shallow-copy"|"deep-copy"|"fail"|"apply-templates"|
     *     "shallow-skip"|"deep-skip"|"text-only-copy",
     *   warningOnNoMatch?: boolean
     * }} cfg - Mode configuration
     * @returns {this}
     */
    mode(cfg: {
        onMultipleMatch?: "use-last" | "fail";
        warningOnMultipleMatch?: boolean;
        onNoMatch?: "shallow-copy" | "deep-copy" | "fail" | "apply-templates" | "shallow-skip" | "deep-skip" | "text-only-copy";
        warningOnNoMatch?: boolean;
    }): this;
    /**
     * Configure stylesheet behavior (similar to xsl:stylesheet).
     * Unlike xsl:stylesheet, this is a directive method and does not contain
     * nested content.
     * @param {{
     *   excludeResultPrefixes?: string[]
     * }} cfg - Stylesheet configuration
     * @returns {this}
     */
    stylesheet(cfg: {
        excludeResultPrefixes?: string[];
    }): this;
    /**
     * Alias for stylesheet() method (XSLT compatibility).
     * @param {{
     *   excludeResultPrefixes?: string[]
     * }} cfg - Stylesheet configuration
     * @returns {this}
     */
    transform(cfg: {
        excludeResultPrefixes?: string[];
    }): this;
    /**
     * Register a stylesheet function (similar to xsl:function).
     * Functions must have namespaced names and are invoked positionally.
     * @param {{
     *   name: string,
     *   params?: Array<{name: string, as?: string}>,
     *   as?: string,
     *   body: (...args: any[]) => any
     * }} cfg - Function configuration
     * @returns {this}
     */
    function(cfg: {
        name: string;
        params?: Array<{
            name: string;
            as?: string;
        }>;
        as?: string;
        body: (...args: any[]) => any;
    }): this;
    /**
     * Invoke a registered stylesheet function with positional arguments.
     * @param {string} name - Function name (with namespace)
     * @param {any[]} args - Positional arguments
     * @returns {any} Function return value
     */
    invokeFunctionByArity(name: string, args?: any[]): any;
    /**
     * @param {string} name
     * @param {OutputCharacters} outputCharacters
     * @returns {void}
     */
    characterMap(name: string, outputCharacters: OutputCharacters): void;
    /**
     * @param {string} name
     * @param {Record<string, string>} attributes
     * @returns {void}
     */
    attributeSet(name: string, attributes: Record<string, string>): void;
    /**
     * @param {string} stylesheetPrefix
     * @param {string} resultPrefix
     * @returns {void}
     */
    namespaceAlias(stylesheetPrefix: string, resultPrefix: string): void;
    /**
     * @param {string} prefix
     * @returns {string}
     */
    _getNamespaceAlias(prefix: string): string;
    /**
     * @param {string} attName
     * @returns {string}
     */
    _replaceNamespaceAliasInNamespaceDeclaration(attName: string): string;
    /**
     * @param {string} elemName
     * @returns {string}
     */
    _replaceNamespaceAliasInElement(elemName: string): string;
    /**
     * Output a pending namespace declaration if it exists.
     * This method should be overridden by subclasses.
     * @param {string} _prefix
     * @returns {void}
     */
    _flushPendingNamespace(_prefix: string): void;
    /**
     * Track attribute name prefix usage.
     * @param {string} attrName
     * @returns {void}
     */
    _trackAttributePrefix(attrName: string): void;
    /**
     * @param {string} str
     * @returns {string}
     */
    _replaceCharacterMaps(str: string): string;
    /**
     * @param {string} type - Type name
     * @param {string} embedType - Embed type name
     * @returns {void}
     */
    _requireSameChildren(type: string, embedType: string): void;
    /**
     * @param {string} prop - Configuration property name
     * @param {any} val - Configuration property value
     * @param {(this: AbstractJoiningTransformer<T>) => void} [cb]
     *   Optional callback invoked with this instance
     * @returns {void}
     */
    config(prop: string, val: any, cb?: (this: AbstractJoiningTransformer<T>) => void): void;
}
//# sourceMappingURL=AbstractJoiningTransformer.d.ts.map