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
    method?: "xml" | "html" | "text" | "json" | "xhtml";
    useCharacterMaps?: string[];
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
     * @param {import('./AbstractJoiningTransformer.js').
     *   StringJoiningTransformerConfig} [cfg] - Configuration object
     */
    constructor(s: string, cfg?: import("./AbstractJoiningTransformer.js").StringJoiningTransformerConfig);
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
    /** @type {string[]} */
    _docs: string[];
    /** @type {boolean} */
    _insideDocument: boolean;
    /** @type {Array<{href: string, document: string, format?: string}>} */
    _resultDocuments: Array<{
        href: string;
        document: string;
        format?: string;
    }>;
    /**
     * @param {string|any} s - String or value to append
     * @returns {StringJoiningTransformer}
     */
    append(s: string | any): StringJoiningTransformer;
    /**
     * @returns {string|string[]}
     */
    get(): string | string[];
    /**
     * @param {string} prop - Property name
     * @param {any} val - Property value
     * @returns {StringJoiningTransformer}
     */
    propValue(prop: string, val: any): StringJoiningTransformer;
    /**
     * Alias for propValue(). Set a key-value pair in the current map/object.
     * @param {string} prop - Property name
     * @param {any} val - Property value
     * @returns {StringJoiningTransformer}
     */
    mapEntry(prop: string, val: any): StringJoiningTransformer;
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
     * Alias for object(). Build an object/map.
     * @param {Record<string, unknown>|Element} obj - Object to serialize
     * @param {(this: StringJoiningTransformer) => void} cb - Callback function
     * @param {any[]} [usePropertySets] - Property sets to use
     * @param {Record<string, unknown>} [propSets] - Additional property sets
     * @returns {StringJoiningTransformer}
     */
    map(obj: Record<string, unknown> | Element, cb: (this: StringJoiningTransformer) => void, usePropertySets?: any[], propSets?: Record<string, unknown>): StringJoiningTransformer;
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
     * @param {string|Element} elName - Element name or element object
     * @param {ElementAttributes} [atts] - Element attributes
     * @param {any[]} [childNodes] - Child nodes
     * @param {(this: StringJoiningTransformer) => void} [cb] - Callback function
     * @param {string[]} [useAttributeSets] - Attribute set names to apply
     * @returns {StringJoiningTransformer}
     */
    element(elName: string | Element, atts?: ElementAttributes, childNodes?: any[], cb?: (this: StringJoiningTransformer) => void, useAttributeSets?: string[]): StringJoiningTransformer;
    _openTagState: any;
    root: any;
    /**
     * @param {string} prefix
     * @param {string} namespaceURI
     * @returns {StringJoiningTransformer}
     */
    namespace(prefix: string, namespaceURI: string): StringJoiningTransformer;
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
     * Creates a new string document and executes a callback in its context.
     * Similar to XSLT's xsl:document, this allows templates to generate
     * multiple output documents. The created document is pushed to this._docs
     * and will be included in the result when exposeDocuments is true.
     *
     * @param {(this: StringJoiningTransformer) => void} cb
     *   Callback that builds the document content
     * @param {OutputConfig} [cfg]
     *   Output configuration for the document (encoding, doctype, etc.)
     * @returns {StringJoiningTransformer}
     */
    document(cb: (this: StringJoiningTransformer) => void, cfg?: OutputConfig): StringJoiningTransformer;
    /**
     * Creates a new result document with metadata (href, format).
     * Similar to XSLT's xsl:result-document, this allows templates to generate
     * multiple output documents with associated metadata like URIs. The created
     * document is stored in this._resultDocuments with the provided href.
     *
     * @param {string} href - URI/path for the result document
     * @param {(this: StringJoiningTransformer) => void} cb
     *   Callback that builds the document content
     * @param {OutputConfig} [cfg]
     *   Output configuration for the document (encoding, doctype, format, etc.)
     * @returns {StringJoiningTransformer}
     */
    resultDocument(href: string, cb: (this: StringJoiningTransformer) => void, cfg?: OutputConfig): StringJoiningTransformer;
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