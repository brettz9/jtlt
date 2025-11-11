export default AbstractJoiningTransformer;
export type BaseTransformerConfig = {
    JHTMLForJSON?: boolean;
    mode?: "JSON" | "JavaScript";
};
export type DOMJoiningTransformerConfig = BaseTransformerConfig & {
    document: Document;
};
export type JSONJoiningTransformerConfig = {
    unwrapSingleResult?: boolean | undefined;
    mode?: "JSON" | "JavaScript" | undefined;
};
export type StringJoiningTransformerConfig = BaseTransformerConfig & {
    xmlElements?: boolean;
    preEscapedAttributes?: boolean;
};
export type JoiningTransformerConfig<T> = T extends "string" ? StringJoiningTransformerConfig : T extends "dom" ? DOMJoiningTransformerConfig : T extends "json" ? JSONJoiningTransformerConfig : never;
/**
 * @typedef {{
 *   JHTMLForJSON?: boolean,
 *   mode?: "JSON"|"JavaScript"
 * }} BaseTransformerConfig
 */
/**
 * @typedef {BaseTransformerConfig & {
 *   document: Document
 * }} DOMJoiningTransformerConfig
 */
/**
 * @typedef {object} JSONJoiningTransformerConfig
 * @property {boolean} [unwrapSingleResult]
 * @property {"JSON"|"JavaScript"} [mode]
 */
/**
 * @typedef {BaseTransformerConfig & {
 *   xmlElements?: boolean,
 *   preEscapedAttributes?: boolean
 * }} StringJoiningTransformerConfig
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
    /**
     * @param {JoiningTransformerConfig<T>} cfg - Configuration object
     * @returns {void}
     */
    setConfig(cfg: JoiningTransformerConfig<T>): void;
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