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
    /** @type {{attsObj: Record<string, any>, jmlChildren: any[]}[]} */
    _elementStack: {
        attsObj: Record<string, any>;
        jmlChildren: any[];
    }[];
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
     * Gets the current object or array. If unwrapSingleResult config option is
     * enabled and the root array contains exactly one element, returns that
     * element directly (unwrapped).
     * @returns {any[]|object|any}
     */
    get(): any[] | object | any;
    /**
     * Sets a property value on the current object.
     * @param {string} prop - Property name
     * @param {*} val - Property value
     * @returns {void}
     */
    propValue(prop: string, val: any): void;
    /**
     * @param {object|Function} [objOrCb] - Seed object to start with, or
     *   callback if no seed provided
     * @param {Function|any[]} [cbOrUsePropertySets] - Callback to be executed
     *   on this transformer but with a context nested within the newly created
     *   object, or array of property set names if first arg was an object
     * @param {any[]|object} [usePropertySetsOrPropSets] - Array of string
     *   property set names to copy onto the new object, or propSets if second
     *   arg was a callback
     * @param {object} [propSets] - An object of key-value pairs to copy onto
     *   the new object
     * @returns {JSONJoiningTransformer}
     */
    object(objOrCb?: object | Function, cbOrUsePropertySets?: Function | any[], usePropertySetsOrPropSets?: any[] | object, propSets?: object): JSONJoiningTransformer;
    /**
     * Creates a new array and executes a callback in its context.
     * @param {any[]|Function} [arrOrCb] - Seed array to start with, or callback
     *   if no seed provided
     * @param {Function} [cb] - Callback function (if first arg was a seed array)
     * @returns {JSONJoiningTransformer}
     */
    array(arrOrCb?: any[] | Function, cb?: Function): JSONJoiningTransformer;
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
    * Build a Jamilih-style element JSON array and append to current container.
    * Result form: ['tag', {attr: 'val'}, child1, child2, ...]
    * Helpers: dataset -> data-*; $a -> ordered attributes.
    * Supported signatures mirror StringJoiningTransformer.element.
     * @param {string|Element|object} elName - Element name or Element-like
     * @param {object|any[]|Function} [atts] - Attributes object or children or cb
     * @param {any[]|Function} [childNodes] - Child nodes array or callback
     * @param {Function} [cb] - Callback for building children/attributes
     * @returns {JSONJoiningTransformer}
     */
    element(elName: string | Element | object, atts?: object | any[] | Function, childNodes?: any[] | Function, cb?: Function): JSONJoiningTransformer;
    /**
     * Adds/updates an attribute for the most recently open element built via
     * a callback-driven element(). When not in an element callback context,
     * throws. Supports the same dataset/$a helpers as string joiner.
     * @param {string} name - Attribute name (or helper: dataset, $a)
     * @param {string|object|any[]} val - Attribute value or helper object
     * @returns {JSONJoiningTransformer}
     */
    attribute(name: string, val: string | object | any[]): JSONJoiningTransformer;
    /**
     * Adds a text node (string) as a child within the current element() callback
     * context. Outside of an element callback, simply appends the text to the
     * current array/object like string().
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