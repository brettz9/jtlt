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