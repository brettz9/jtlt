export default StringJoiningTransformer;
/**
 *
 */
/**
 * Joining transformer that builds a string result.
 *
 * This transformer provides a fluent API to compose strings while supporting
 * object/array-building semantics similar to template languages. Most methods
 * funnel through append(), which is state-aware:
 *
 * - Inside object(): values go to object properties via propOnly()/propValue().
 * - Inside array(): values are pushed to the current array.
 * - Otherwise: values are concatenated into the internal string buffer.
 *
 * Escaping rules:
 * - text(): escapes HTML special chars (& and <) and will close an open tag.
 * - string(): no HTML escaping or JSON stringification; context-aware.
 * - plainText(): raw append to the top-level string buffer (bypasses state).
 * - rawAppend(): like plainText() but documented as lower-level.
 *
 * HTML/XML helpers:
 * - element() and attribute() allow building tags with optional auto-escaping
 *   for attribute values unless cfg.preEscapedAttributes is set.
 *
 * Configuration hints (see joiningConfig in JTLT):
 * - cfg.xmlElements: switch element() serializer to XML mode (self-closing,
 *   name mapping rules differ, etc.).
 * - cfg.preEscapedAttributes: skip escaping attribute values.
 * - cfg.JHTMLForJSON / cfg.mode: affect how object()/array() serialize.
 */
declare class StringJoiningTransformer extends AbstractJoiningTransformer {
    /**
     * @param {string} s - Initial string
     * @param {object} cfg - Configuration object
     */
    constructor(s: string, cfg: object);
    /**
     * @type {{
     *   JHTMLForJSON?: boolean,
    *   mode?: "JavaScript"|"JSON",
    *   xmlElements?: boolean,
    *   preEscapedAttributes?: boolean
     * }}
     */
    _cfg: {
        JHTMLForJSON?: boolean;
        mode?: "JavaScript" | "JSON";
        xmlElements?: boolean;
        preEscapedAttributes?: boolean;
    };
    _str: string;
    /** @type {any} */
    _objPropTemp: any;
    /** @type {boolean | undefined} */
    propOnlyState: boolean | undefined;
    /** @type {boolean | undefined} */
    _arrItemState: boolean | undefined;
    /** @type {boolean | undefined} */
    _objPropState: boolean | undefined;
    /** @type {any} */
    _obj: any;
    /** @type {any[]} */
    _arr: any[];
    /** @type {string | undefined} */
    _strTemp: string | undefined;
    /**
     * @param {string|*} s - String or value to append
     * @returns {StringJoiningTransformer}
     */
    append(s: string | any): StringJoiningTransformer;
    /**
     * @returns {string}
     */
    get(): string;
    /**
     * @param {string} prop - Property name
     * @param {*} val - Property value
     * @returns {StringJoiningTransformer}
     */
    propValue(prop: string, val: any): StringJoiningTransformer;
    /**
     * @param {string} prop - Property name
     * @param {Function} cb - Callback function
     * @returns {StringJoiningTransformer}
     */
    propOnly(prop: string, cb: Function): StringJoiningTransformer;
    /**
     * @param {object|Element} obj - Object to serialize
     * @param {Function} cb - Callback function
     * @param {any[]} [usePropertySets] - Property sets to use
     * @param {object} [propSets] - Additional property sets
     * @returns {StringJoiningTransformer}
     */
    object(obj: object | Element, cb: Function, usePropertySets?: any[], propSets?: object): StringJoiningTransformer;
    /**
     * @param {any[]|Element} [arr] - Array to serialize
     * @param {Function} [cb] - Callback function
     * @returns {StringJoiningTransformer}
     */
    array(arr?: any[] | Element, cb?: Function): StringJoiningTransformer;
    /**
     * @param {string|Element|object} str - String value or element
     * @param {Function} [cb] - Callback function
     * @returns {StringJoiningTransformer}
     */
    string(str: string | Element | object, cb?: Function): StringJoiningTransformer;
    /**
     * @param {number|Element|object} num - Number value or element
     * @returns {StringJoiningTransformer}
     */
    number(num: number | Element | object): StringJoiningTransformer;
    /**
     * @param {boolean|Element|object} bool - Boolean value or element
     * @returns {StringJoiningTransformer}
     */
    boolean(bool: boolean | Element | object): StringJoiningTransformer;
    /**
     * @returns {StringJoiningTransformer}
     */
    null(): StringJoiningTransformer;
    /**
     * @returns {StringJoiningTransformer}
     */
    undefined(): StringJoiningTransformer;
    /**
     * @param {number|Element} num - Non-finite number (NaN, Infinity, -Infinity)
     * @returns {StringJoiningTransformer}
     */
    nonfiniteNumber(num: number | Element): StringJoiningTransformer;
    /**
     * @param {Function|Element} func - Function to stringify
     * @returns {StringJoiningTransformer}
     */
    function(func: Function | Element): StringJoiningTransformer;
    /**
     * @param {string|object} elName - Element name or element object
     * @param {object} [atts] - Element attributes
     * @param {any[]} [childNodes] - Child nodes
     * @param {Function} [cb] - Callback function
     * @returns {StringJoiningTransformer}
     */
    element(elName: string | object, atts?: object, childNodes?: any[], cb?: Function): StringJoiningTransformer;
    _openTagState: any;
    /**
     * @param {string} name - Attribute name
     * @param {string|object} val - Attribute value
     * @param {boolean} [avoidAttEscape] - Whether to avoid escaping the
     *   attribute value
     * @returns {StringJoiningTransformer}
     */
    attribute(name: string, val: string | object, avoidAttEscape?: boolean): StringJoiningTransformer;
    /**
     * @param {string} txt - Text content to escape and append
     * @returns {StringJoiningTransformer}
     */
    text(txt: string): StringJoiningTransformer;
    /**
    * Unlike text(), does not escape for HTML; unlike string(), does not perform
    *   JSON stringification; unlike append(), does not do other checks (but still
    *   varies in its role across transformers).
    * @param {string} str
    * @returns {StringJoiningTransformer}
    */
    rawAppend(str: string): StringJoiningTransformer;
    /**
     * @param {string} str - Plain text to append without escaping
     * @returns {StringJoiningTransformer}
     */
    plainText(str: string): StringJoiningTransformer;
    /**
     * Helper method to use property sets (to be implemented).
     * @param {object} obj - Object to apply property set to
     * @param {string} psName - Property set name
     * @returns {object}
     */
    _usePropertySets(obj: object, psName: string): object;
}
import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';
//# sourceMappingURL=StringJoiningTransformer.d.ts.map