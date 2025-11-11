export default StringJoiningTransformer;
export type OutputConfig = {
    encoding?: string;
    indent?: boolean;
    omitXmlDeclaration?: boolean;
    doctypePublic?: string;
    doctypeSystem?: string;
    cdataSectionElements?: string[];
    mediaType?: string;
    version?: string;
    standalone?: boolean;
    method?: "xml" | "html" | "text";
};
export type SimpleCallback = (this: StringJoiningTransformer) => void;
/**
 * Attributes object for element() allowing standard string attributes
 * plus special helpers: dataset (object) and $a (ordered attribute array).
 */
export type ElementAttributes = Record<string, unknown> & {
    dataset?: Record<string, string>;
    $a?: Array<[string, string]>;
};
/**
 * Attributes object for element() allowing standard string attributes
 * plus special helpers: dataset (object) and $a (ordered attribute array).
 * @typedef {Record<string, unknown> & {
 *   dataset?: Record<string, string>,
 *   $a?: Array<[string, string]>
 * }} ElementAttributes
 */
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
 * @extends {AbstractJoiningTransformer<"string">}
 */
declare class StringJoiningTransformer extends AbstractJoiningTransformer<"string"> {
    /**
     * @param {string} s - Initial string
     * @param {{
     *   mode?: "JavaScript"|"JSON",
     *   JHTMLForJSON?: boolean,
     *   xmlElements?: boolean,
     *   preEscapedAttributes?: boolean
     * }} [cfg] - Configuration object
     */
    constructor(s: string, cfg?: {
        mode?: "JavaScript" | "JSON";
        JHTMLForJSON?: boolean;
        xmlElements?: boolean;
        preEscapedAttributes?: boolean;
    });
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
    /** @type {Record<string, unknown>} */
    propertySets: Record<string, unknown>;
    /**
     * @param {string|any} s - String or value to append
     * @returns {StringJoiningTransformer}
     */
    append(s: string | any): StringJoiningTransformer;
    /**
     * @returns {string}
     */
    get(): string;
    /**
     * @param {string} prop - Property name
     * @param {any} val - Property value
     * @returns {StringJoiningTransformer}
     */
    propValue(prop: string, val: any): StringJoiningTransformer;
    /**
     * @param {string} prop - Property name
     * @param {(this: StringJoiningTransformer) => void} cb - Callback function
     * @returns {StringJoiningTransformer}
     */
    propOnly(prop: string, cb: (this: StringJoiningTransformer) => void): StringJoiningTransformer;
    /**
     * @param {Record<string, unknown>|Element} obj - Object to serialize
     * @param {(this: StringJoiningTransformer) => void} cb - Callback function
     * @param {any[]} [usePropertySets] - Property sets to use
     * @param {Record<string, unknown>} [propSets] - Additional property sets
     * @returns {StringJoiningTransformer}
     */
    object(obj: Record<string, unknown> | Element, cb: (this: StringJoiningTransformer) => void, usePropertySets?: any[], propSets?: Record<string, unknown>): StringJoiningTransformer;
    /**
     * @param {any[]|Element} [arr] - Array to serialize
     * @param {(this: StringJoiningTransformer) => void} [cb] - Callback function
     * @returns {StringJoiningTransformer}
     */
    array(arr?: any[] | Element, cb?: (this: StringJoiningTransformer) => void): StringJoiningTransformer;
    /**
     * @param {string|Element|Record<string, unknown>} str
     *   String value or element
     * @param {(this: StringJoiningTransformer) => void} [cb] - Callback function
     * @returns {StringJoiningTransformer}
     */
    string(str: string | Element | Record<string, unknown>, cb?: (this: StringJoiningTransformer) => void): StringJoiningTransformer;
    /**
     * @param {number|Element|Record<string, unknown>} num
     *   Number value or element
     * @returns {StringJoiningTransformer}
     */
    number(num: number | Element | Record<string, unknown>): StringJoiningTransformer;
    /**
     * @param {boolean|Element|Record<string, unknown>} bool
     *   Boolean value or element
     * @returns {StringJoiningTransformer}
     */
    boolean(bool: boolean | Element | Record<string, unknown>): StringJoiningTransformer;
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
     * @param {((...args: any[]) => any)|Element} func - Function to stringify
     * @returns {StringJoiningTransformer}
     */
    function(func: ((...args: any[]) => any) | Element): StringJoiningTransformer;
    /**
     * @param {OutputConfig} cfg
     * @returns {StringJoiningTransformer}
     */
    output(cfg: OutputConfig): StringJoiningTransformer;
    _outputConfig: OutputConfig | undefined;
    mediaType: string | undefined;
    /**
     * @param {string|Element} elName - Element name or element object
     * @param {ElementAttributes} [atts] - Element attributes
     * @param {any[]} [childNodes] - Child nodes
     * @param {(this: StringJoiningTransformer) => void} [cb] - Callback function
     * @returns {StringJoiningTransformer}
     */
    element(elName: string | Element, atts?: ElementAttributes, childNodes?: any[], cb?: (this: StringJoiningTransformer) => void): StringJoiningTransformer;
    root: string | Element | undefined;
    _openTagState: any;
    /**
     * @param {string} name - Attribute name
     * @param {string|Record<string, unknown>|
     *   string[][]} val - Attribute value
     * @param {boolean} [avoidAttEscape] - Whether to avoid escaping the
     *   attribute value
     * @returns {StringJoiningTransformer}
     */
    attribute(name: string, val: string | Record<string, unknown> | string[][], avoidAttEscape?: boolean): StringJoiningTransformer;
    /**
     * @param {string} txt - Text content to escape and append
     * @returns {StringJoiningTransformer}
     */
    text(txt: string): StringJoiningTransformer;
    /**
     * @param {string} text
     * @returns {StringJoiningTransformer}}
     */
    comment(text: string): StringJoiningTransformer;
    /**
     * @param {string} target
     * @param {string} data
     * @returns {StringJoiningTransformer}}
     */
    processingInstruction(target: string, data: string): StringJoiningTransformer;
    /**
     * Unlike text(), does not escape for HTML; unlike string(), does not perform
     *   JSON stringification; unlike append(), does not do other checks (but
     *   still varies in its role across transformers).
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
     * Helper method to use property sets.
     * @param {Record<string, unknown>} obj - Object to apply property set to
     * @param {string} psName - Property set name
     * @returns {Record<string, unknown>}
     */
    _usePropertySets(obj: Record<string, unknown>, psName: string): Record<string, unknown>;
}
import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';
//# sourceMappingURL=StringJoiningTransformer.d.ts.map