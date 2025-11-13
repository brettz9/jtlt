export default JSONJoiningTransformer;
export type ObjectCallback = (this: JSONJoiningTransformer, obj: Record<string, unknown>) => void;
export type ArrayCallback = (this: JSONJoiningTransformer, arr: any[]) => void;
export type SimpleCallback<T = "json"> = (this: T extends "json" ? JSONJoiningTransformer : T extends "string" ? import("./StringJoiningTransformer.js").default : import("./DOMJoiningTransformer.js").default) => void;
/**
 * Attributes object for element() allowing standard string attributes
 * plus special helpers: dataset (object) and $a (ordered attribute array).
 */
export type ElementAttributes = Record<string, unknown> & {
    dataset?: Record<string, string>;
    $a?: Array<[string, string]>;
};
export type ElementInfo = {
    attsObj: Record<string, unknown>;
    jmlChildren: unknown[];
};
/**
 * @callback ObjectCallback
 * @this {JSONJoiningTransformer}
 * @param {Record<string, unknown>} obj
 * @returns {void}
 */
/**
 * @callback ArrayCallback
 * @this {JSONJoiningTransformer}
 * @param {any[]} arr
 * @returns {void}
 */
/**
 * @template [T = "json"]
 * @callback SimpleCallback
 * @this {T extends "json" ? JSONJoiningTransformer :
 *   T extends "string" ? import('./StringJoiningTransformer.js').default
 *   : import('./DOMJoiningTransformer.js').default}
 * @returns {void}
 */
/**
 * Attributes object for element() allowing standard string attributes
 * plus special helpers: dataset (object) and $a (ordered attribute array).
 * @typedef {Record<string, unknown> & {
 *   dataset?: Record<string, string>,
 *   $a?: Array<[string, string]>
 * }} ElementAttributes
 */
/**
 * @typedef {{
 *   attsObj: Record<string, unknown>,
 *   jmlChildren: unknown[]
 * }} ElementInfo
 */
/**
 * JSON-based joining transformer for building JSON/JavaScript objects.
 *
 * This joiner accumulates into an in-memory JSON value (object or array).
 * append() will push to arrays or shallow-merge into objects; string/number/
 * boolean/null add primitives accordingly. It does not perform HTML escaping
 * or string serialization; it builds real JS values.
 * @extends {AbstractJoiningTransformer<"json">}
 */
declare class JSONJoiningTransformer extends AbstractJoiningTransformer<"json"> {
    /**
     * @param {any[]|Record<string, unknown>} [o] - Initial object or array
     * @param {import('./AbstractJoiningTransformer.js').
     *   JSONJoiningTransformerConfig} [cfg] - Configuration object
     */
    constructor(o?: any[] | Record<string, unknown>, cfg?: import("./AbstractJoiningTransformer.js").JSONJoiningTransformerConfig);
    /** @type {any[]|Record<string, unknown>} */
    _obj: any[] | Record<string, unknown>;
    /** @type {boolean | undefined} */
    _objPropState: boolean | undefined;
    /** @type {boolean | undefined} */
    _arrItemState: boolean | undefined;
    /** @type {ElementInfo[]} */
    _elementStack: ElementInfo[];
    /** @type {Record<string, unknown>} */
    propertySets: Record<string, unknown>;
    /** @type {any[]} */
    _docs: any[];
    /** @type {Array<{href: string, document: any, format?: string}>} */
    _resultDocuments: Array<{
        href: string;
        document: any;
        format?: string;
    }>;
    /**
     * Directly appends an item to the internal array without checks.
     * @param {any} item - Item to append
     * @returns {void}
     */
    rawAppend(item: any): void;
    /**
     * Appends an item to the current object or array.
     * @param {any} item - Item to append
     * @returns {JSONJoiningTransformer}
     */
    append(item: any): JSONJoiningTransformer;
    /**
     * Gets the current object or array. If unwrapSingleResult config option is
     * enabled and the root array contains exactly one element, returns that
     * element directly (unwrapped).
     * @returns {any[]|Record<string, unknown>|any}
     */
    get(): any[] | Record<string, unknown> | any;
    /**
     * Sets a property value on the current object.
     * @param {string} prop - Property name
     * @param {any} val - Property value
     * @returns {void}
     */
    propValue(prop: string, val: any): void;
    /**
     * @param {Record<string, unknown>|ObjectCallback} [objOrCb]
     *   Seed object or callback.
     * @param {ObjectCallback|any[]} [cbOrUsePropertySets] Callback or sets.
     * @param {any[]|Record<string, unknown>} [usePropertySetsOrPropSets]
     *   Sets or prop sets.
     * @param {Record<string, unknown>} [propSets] Key-value pairs to add.
     * @returns {JSONJoiningTransformer}
     */
    object(objOrCb?: Record<string, unknown> | ObjectCallback, cbOrUsePropertySets?: ObjectCallback | any[], usePropertySetsOrPropSets?: any[] | Record<string, unknown>, propSets?: Record<string, unknown>): JSONJoiningTransformer;
    /**
     * Creates a new array and executes a callback in its context.
     * @param {any[]|ArrayCallback} [arrOrCb] Seed array or callback.
     * @param {ArrayCallback} [cb] Callback when first arg was array.
     * @returns {JSONJoiningTransformer}
     */
    array(arrOrCb?: any[] | ArrayCallback, cb?: ArrayCallback): JSONJoiningTransformer;
    /**
     * Appends a string value.
     * @param {string} str String value.
     * @param {SimpleCallback} [cb] Unused callback.
     * @returns {JSONJoiningTransformer}
     */
    string(str: string, cb?: SimpleCallback): JSONJoiningTransformer;
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
     * @param {(...args: any[]) => any} func Function to append.
     * @returns {JSONJoiningTransformer}
     */
    function(func: (...args: any[]) => any): JSONJoiningTransformer;
    /**
     * @param {import('./StringJoiningTransformer.js').OutputConfig} cfg
     * @returns {JSONJoiningTransformer}
     */
    output(cfg: import("./StringJoiningTransformer.js").OutputConfig): JSONJoiningTransformer;
    _outputConfig: any;
    mediaType: string | undefined;
    /**
     * Build a Jamilih-style element JSON array and append to current container.
     * Result form: ['tag', {attr: 'val'}, child1, child2, ...]
     * Helpers: dataset -> data-*; $a -> ordered attributes.
     * Supported signatures mirror StringJoiningTransformer.element.
     * @param {string|Element} elName Element name or Element-like.
     * @param {ElementAttributes|any[]|SimpleCallback} [atts]
     *   Attrs, children, or cb.
     * @param {any[]|SimpleCallback} [childNodes] Children or cb.
     * @param {SimpleCallback} [cb] Builder callback.
     * @returns {JSONJoiningTransformer}
     */
    element(elName: string | Element, atts?: ElementAttributes | any[] | SimpleCallback, childNodes?: any[] | SimpleCallback, cb?: SimpleCallback): JSONJoiningTransformer;
    root: any;
    /**
     * Adds/updates an attribute for the most recently open element built via
     * a callback-driven element(). When not in an element callback context,
     * throws. Supports the same dataset/$a helpers as string joiner.
     * @param {string} name - Attribute name (or helper: dataset, $a)
     * @param {string|Record<string, unknown>|unknown[]} val
     *   Attribute value or helper object
     * @returns {JSONJoiningTransformer}
     */
    attribute(name: string, val: string | Record<string, unknown> | unknown[]): JSONJoiningTransformer;
    /**
     * Adds a comment node (string) as a child within the current
     *   element() callback context. Outside of an element callback,
     *   simply appends the comment to the current array/object like string().
     * @param {string} txt - Comment content
     * @returns {JSONJoiningTransformer}
     */
    comment(txt: string): JSONJoiningTransformer;
    /**
     * Adds a comment node (string) as a child within the current
     *   element() callback context. Outside of an element callback,
     *   simply appends the comment to the current array/object like string().
     * @param {string} target - processing instruction content
     * @param {string} data - processing instruction content
     * @returns {JSONJoiningTransformer}
     */
    processingInstruction(target: string, data: string): JSONJoiningTransformer;
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
     * Creates a new JSON document and executes a callback in its context.
     * Similar to XSLT's xsl:document, this allows templates to generate
     * multiple output documents. The created document is pushed to this._docs
     * and will be included in the result when exposeDocuments is true.
     *
     * @param {(this: JSONJoiningTransformer) => void} cb
     *   Callback that builds the document content
     * @param {import('./StringJoiningTransformer.js').OutputConfig} [cfg]
     *   Output configuration for the document (encoding, doctype, etc.)
     * @returns {JSONJoiningTransformer}
     */
    document(cb: (this: JSONJoiningTransformer) => void, cfg?: import("./StringJoiningTransformer.js").OutputConfig): JSONJoiningTransformer;
    /**
     * Creates a new result document with metadata (href, format).
     * Similar to XSLT's xsl:result-document, this allows templates to generate
     * multiple output documents with associated metadata like URIs. The created
     * document is stored in this._resultDocuments with the provided href.
     *
     * @param {string} href - URI/path for the result document
     * @param {(this: JSONJoiningTransformer) => void} cb
     *   Callback that builds the document content
     * @param {import('./StringJoiningTransformer.js').OutputConfig} [cfg]
     *   Output configuration for the document (encoding, doctype, format, etc.)
     * @returns {JSONJoiningTransformer}
     */
    resultDocument(href: string, cb: (this: JSONJoiningTransformer) => void, cfg?: import("./StringJoiningTransformer.js").OutputConfig): JSONJoiningTransformer;
    /**
     * Helper method to use property sets.
     * @param {Record<string, unknown>} obj - Object to which to apply
     *   property set
     * @param {string} psName - Property set name
     * @returns {Record<string, unknown>}
     */
    _usePropertySets(obj: Record<string, unknown>, psName: string): Record<string, unknown>;
}
import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';
//# sourceMappingURL=JSONJoiningTransformer.d.ts.map