export default AbstractJoiningTransformer;
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
 */
declare class AbstractJoiningTransformer {
    /**
     * @param {object} [cfg] - Configuration object
     */
    constructor(cfg?: object);
    /**
     * @param {any} [cfg] - Configuration object
     * @returns {void}
     */
    setConfig(cfg?: any): void;
    _cfg: any;
    /**
     * @param {string} type - Type name
     * @param {string} embedType - Embed type name
     * @returns {void}
     */
    _requireSameChildren(type: string, embedType: string): void;
    /**
     * @param {string} prop - Configuration property name
     * @param {any} val - Configuration property value
     * @param {(this: AbstractJoiningTransformer) => void} [cb]
     *   Optional callback invoked with this instance
     * @returns {void}
     */
    config(prop: string, val: any, cb?: (this: AbstractJoiningTransformer) => void): void;
}
//# sourceMappingURL=AbstractJoiningTransformer.d.ts.map