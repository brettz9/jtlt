export default JSONJoiningTransformer;
/**
 * JSON-based joining transformer for building JSON/JavaScript objects.
 *
 * This joiner accumulates into an in-memory JSON value (object or array).
 * append() will push to arrays or shallow-merge into objects; string/number/
 * boolean/null add primitives accordingly. It does not perform HTML escaping
 * or string serialization; it builds real JS values.
 */
declare class JSONJoiningTransformer extends AbstractJoiningTransformer {
    /**
     * @param {any[]|object} [o] - Initial object or array
     * @param {object} [cfg] - Configuration object
     */
    constructor(o?: any[] | object, cfg?: object);
    /** @type {any[]|object} */
    _obj: any[] | object;
    /** @type {boolean | undefined} */
    _objPropState: boolean | undefined;
    /** @type {boolean | undefined} */
    _arrItemState: boolean | undefined;
    /**
     * Directly appends an item to the internal array without checks.
     * @param {*} item - Item to append
     * @returns {void}
     */
    rawAppend(item: any): void;
    /**
     * Appends an item to the current object or array.
     * @param {*} item - Item to append
     * @returns {JSONJoiningTransformer}
     */
    append(item: any): JSONJoiningTransformer;
    /**
     * Gets the current object or array.
     * @returns {any[]|object}
     */
    get(): any[] | object;
    /**
     * Sets a property value on the current object.
     * @param {string} prop - Property name
     * @param {*} val - Property value
     * @returns {void}
     */
    propValue(prop: string, val: any): void;
    /**
     * @param {Function} [cb] - Callback to be executed on this transformer but
     *   with a context nested within the newly created object
     * @param {any[]} [usePropertySets] - Array of string property set names to
     *   copy onto the new object
     * @param {object} [propSets] - An object of key-value pairs to copy onto
     *   the new object
     * @returns {JSONJoiningTransformer}
     */
    object(cb?: Function, usePropertySets?: any[], propSets?: object): JSONJoiningTransformer;
    /**
     * Creates a new array and executes a callback in its context.
     * @param {Function} [cb] - Callback function
     * @returns {JSONJoiningTransformer}
     */
    array(cb?: Function): JSONJoiningTransformer;
    /**
     * Appends a string value.
     * @param {string} str - String value
    * @param {Function} [cb] - Callback function (unused)
     * @returns {JSONJoiningTransformer}
     */
    string(str: string, cb?: Function): JSONJoiningTransformer;
    /**
     * Appends a number value.
     * @param {number} num - Number value
     * @returns {JSONJoiningTransformer}
     */
    number(num: number): JSONJoiningTransformer;
    /**
     * Appends a boolean value.
     * @param {boolean} bool - Boolean value
     * @returns {JSONJoiningTransformer}
     */
    boolean(bool: boolean): JSONJoiningTransformer;
    /**
     * Appends a null value.
     * @returns {JSONJoiningTransformer}
     */
    null(): JSONJoiningTransformer;
    /**
     * Appends an undefined value (JavaScript mode only).
     * @returns {JSONJoiningTransformer}
     */
    undefined(): JSONJoiningTransformer;
    /**
     * Appends a non-finite number (JavaScript mode only).
     * @param {number} num - Non-finite number (NaN, Infinity, -Infinity)
     * @returns {JSONJoiningTransformer}
     */
    nonfiniteNumber(num: number): JSONJoiningTransformer;
    /**
     * Appends a function value (JavaScript mode only).
     * @param {Function} func - Function to append
     * @returns {JSONJoiningTransformer}
     */
    function(func: Function): JSONJoiningTransformer;
    /**
     * Placeholder for element method (not implemented for JSON).
     * @param {string} elName - Element name
     * @param {object} atts - Attributes
     * @param {Function} cb - Callback function
     * @returns {JSONJoiningTransformer}
     */
    element(elName: string, atts: object, cb: Function): JSONJoiningTransformer;
    /**
     * Placeholder for attribute method (not implemented for JSON).
     * @param {string} name - Attribute name
     * @param {*} val - Attribute value
     * @returns {JSONJoiningTransformer}
     */
    attribute(name: string, val: any): JSONJoiningTransformer;
    /**
     * Placeholder for text method (not implemented for JSON).
     * @param {string} txt - Text content
     * @returns {JSONJoiningTransformer}
     */
    text(txt: string): JSONJoiningTransformer;
    /**
     * Appends plain text as a string.
     * @param {string} str - Plain text string
     * @returns {JSONJoiningTransformer}
     */
    plainText(str: string): JSONJoiningTransformer;
    /**
     * Helper method to use property sets (to be implemented).
     * @param {object} obj - Object to apply property set to
     * @param {string} psName - Property set name
     * @returns {object}
     */
    _usePropertySets(obj: object, psName: string): object;
}
import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';
//# sourceMappingURL=JSONJoiningTransformer.d.ts.map