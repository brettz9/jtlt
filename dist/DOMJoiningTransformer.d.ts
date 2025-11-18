export default DOMJoiningTransformer;
export type SimpleCallback = (this: DOMJoiningTransformer) => void;
/**
 * @callback SimpleCallback
 * @this {DOMJoiningTransformer}
 * @returns {void}
 */
/**
 * Joining transformer that accumulates into a DOM tree.
 *
 * This transformer appends strings and nodes to a DocumentFragment/Element.
 * It expects templates to build DOM nodes explicitly (e.g., via element(),
 * attribute(), and text()), though string/number/boolean will append text
 * nodes for convenience.
 * @extends {AbstractJoiningTransformer<"dom">}
 */
declare class DOMJoiningTransformer extends AbstractJoiningTransformer<"dom"> {
    /**
     * @param {DocumentFragment|Element} o - Initial DOM node
     * @param {import('./AbstractJoiningTransformer.js').
     *   DOMJoiningTransformerConfig} cfg - Configuration object
     */
    constructor(o: DocumentFragment | Element, cfg: import("./AbstractJoiningTransformer.js").DOMJoiningTransformerConfig);
    _dom: Element | DocumentFragment;
    /** @type {any} */
    _context: any;
    /** @type {XMLDocument[]} */
    _docs: XMLDocument[];
    /** @type {Array<{href: string, document: XMLDocument, format?: string}>} */
    _resultDocuments: Array<{
        href: string;
        document: XMLDocument;
        format?: string;
    }>;
    /** @type {Record<string, unknown>} */
    propertySets: Record<string, unknown>;
    /**
     * @param {Node} item
     * @returns {void}
     */
    rawAppend(item: Node): void;
    /**
     * Set the transformer context for callback invocations.
     * @param {any} context - The transformer context object
     * @returns {DOMJoiningTransformer}
     */
    setContext(context: any): DOMJoiningTransformer;
    /**
     * @param {string|Node} item - Item to append
     * @returns {void}
     */
    append(item: string | Node): void;
    /**
     * @returns {DocumentFragment|Element|XMLDocument[]}
     */
    get(): DocumentFragment | Element | XMLDocument[];
    /**
     * @param {string} prop - Property name
     * @param {any} val - Property value
     * @returns {void}
     */
    propValue(prop: string, val: any): void;
    /**
     * Alias for propValue(). Set a key-value pair in the current map/object.
     * @param {string} prop - Property name
     * @param {any} val - Property value
     * @returns {void}
     */
    mapEntry(prop: string, val: any): void;
    /**
     * @param {Record<string, unknown>} obj - Object to serialize
     * @param {(this: DOMJoiningTransformer) => void} [cb] - Callback function.
     * @param {any[]} [usePropertySets] - Property sets to use
     * @param {Record<string, unknown>} [propSets] - Additional property sets
     * @returns {DOMJoiningTransformer}
     */
    object(obj: Record<string, unknown>, cb?: (this: DOMJoiningTransformer) => void, usePropertySets?: any[], propSets?: Record<string, unknown>): DOMJoiningTransformer;
    /**
     * Alias for object(). Build an object/map.
     * @param {Record<string, unknown>} obj - Object to serialize
     * @param {(this: DOMJoiningTransformer) => void} [cb] - Callback function.
     * @param {any[]} [usePropertySets] - Property sets to use
     * @param {Record<string, unknown>} [propSets] - Additional property sets
     * @returns {DOMJoiningTransformer}
     */
    map(obj: Record<string, unknown>, cb?: (this: DOMJoiningTransformer) => void, usePropertySets?: any[], propSets?: Record<string, unknown>): DOMJoiningTransformer;
    /**
     * @param {any[]|Element} arr
     * @param {(this: DOMJoiningTransformer) => void} [cb] - Callback function
     * @returns {DOMJoiningTransformer}
     */
    array(arr: any[] | Element, cb?: (this: DOMJoiningTransformer) => void): DOMJoiningTransformer;
    /**
     * @param {string} str - String value
     * @param {(this: DOMJoiningTransformer) => void} [cb] - Callback
     *   function (unused)
     * @returns {DOMJoiningTransformer}
     */
    string(str: string, cb?: (this: DOMJoiningTransformer) => void): DOMJoiningTransformer;
    /**
     * @param {number} num - Number value
     * @returns {DOMJoiningTransformer}
     */
    number(num: number): DOMJoiningTransformer;
    /**
     * @param {boolean} bool
     * @returns {DOMJoiningTransformer}
     */
    boolean(bool: boolean): DOMJoiningTransformer;
    /**
     * @returns {DOMJoiningTransformer}
     */
    null(): DOMJoiningTransformer;
    /**
     * @returns {DOMJoiningTransformer}
     */
    undefined(): DOMJoiningTransformer;
    /**
     * @param {number} num - Non-finite number (NaN, Infinity, -Infinity)
     * @returns {DOMJoiningTransformer}
     */
    nonfiniteNumber(num: number): DOMJoiningTransformer;
    /**
     * @param {(...args: any[]) => any} func - Function to stringify
     * @returns {DOMJoiningTransformer}
     */
    outputFunction(func: (...args: any[]) => any): DOMJoiningTransformer;
    /**
     * @overload
     * @param {Element|string} elName
     * @param {Record<string, string>} atts
     * @param {(Node|string)[]} childNodes
     * @param {(this: DOMJoiningTransformer) => void} cb
     * @returns {DOMJoiningTransformer}
     */
    element(elName: Element | string, atts: Record<string, string>, childNodes: (Node | string)[], cb: (this: DOMJoiningTransformer) => void): DOMJoiningTransformer;
    /**
     * @overload
     * @param {Element|string} elName
     * @param {Record<string, string>} atts
     * @param {(Node|string)[]} childNodes
     * @returns {DOMJoiningTransformer}
     */
    element(elName: Element | string, atts: Record<string, string>, childNodes: (Node | string)[]): DOMJoiningTransformer;
    /**
     * @overload
     * @param {Element|string} elName
     * @param {Record<string, string>} atts
     * @param {(this: DOMJoiningTransformer) => void} cb
     * @returns {DOMJoiningTransformer}
     */
    element(elName: Element | string, atts: Record<string, string>, cb: (this: DOMJoiningTransformer) => void): DOMJoiningTransformer;
    /**
     * @overload
     * @param {Element|string} elName
     * @param {Record<string, string>} atts
     * @returns {DOMJoiningTransformer}
     */
    element(elName: Element | string, atts: Record<string, string>): DOMJoiningTransformer;
    /**
     * @overload
     * @param {Element|string} elName
     * @param {(Node|string)[]} childNodes
     * @param {(this: DOMJoiningTransformer) => void} cb
     * @returns {DOMJoiningTransformer}
     */
    element(elName: Element | string, childNodes: (Node | string)[], cb: (this: DOMJoiningTransformer) => void): DOMJoiningTransformer;
    /**
     * @overload
     * @param {Element|string} elName
     * @param {(Node|string)[]} childNodes
     * @returns {DOMJoiningTransformer}
     */
    element(elName: Element | string, childNodes: (Node | string)[]): DOMJoiningTransformer;
    /**
     * @overload
     * @param {Element|string} elName
     * @param {(this: DOMJoiningTransformer) => void} cb
     * @returns {DOMJoiningTransformer}
     */
    element(elName: Element | string, cb: (this: DOMJoiningTransformer) => void): DOMJoiningTransformer;
    /**
     * @overload
     * @param {Element|string} elName
     * @returns {DOMJoiningTransformer}
     */
    element(elName: Element | string): DOMJoiningTransformer;
    root: any;
    /**
     * @param {string} prefix
     * @param {string} namespaceURI
     * @returns {DOMJoiningTransformer}
     */
    namespace(prefix: string, namespaceURI: string): DOMJoiningTransformer;
    /**
     * @param {string} name
     * @param {string} val
     * @returns {DOMJoiningTransformer}
     */
    attribute(name: string, val: string): DOMJoiningTransformer;
    /**
     * @param {string} txt - Text content
     * @returns {DOMJoiningTransformer}
     */
    text(txt: string): DOMJoiningTransformer;
    /**
     * @param {string} text
     * @returns {DOMJoiningTransformer}}
     */
    comment(text: string): DOMJoiningTransformer;
    /**
     * @param {string} target
     * @param {string} data
     * @returns {DOMJoiningTransformer}}
     */
    processingInstruction(target: string, data: string): DOMJoiningTransformer;
    /**
     * @param {string} str
     * @returns {DOMJoiningTransformer}
     */
    plainText(str: string): DOMJoiningTransformer;
    /**
     * Creates a new XML document and executes a callback in its context.
     * Similar to XSLT's xsl:document, this allows templates to generate
     * multiple output documents. The created document is pushed to this._docs
     * and will be included in the result when exposeDocuments is true.
     *
     * @param {(this: DOMJoiningTransformer) => void} cb
     *   Callback that builds the document content
     * @param {import('./StringJoiningTransformer.js').OutputConfig} [cfg]
     *   Output configuration for the document (encoding, doctype, etc.)
     * @returns {DOMJoiningTransformer}
     */
    document(cb: (this: DOMJoiningTransformer) => void, cfg?: import("./StringJoiningTransformer.js").OutputConfig): DOMJoiningTransformer;
    /**
     * Creates a new result document with metadata (href, format).
     * Similar to XSLT's xsl:result-document, this allows templates to generate
     * multiple output documents with associated metadata like URIs. The created
     * document is stored in this._resultDocuments with the provided href.
     *
     * @param {string} href - URI/path for the result document
     * @param {(this: DOMJoiningTransformer) => void} cb
     *   Callback that builds the document content
     * @param {import('./StringJoiningTransformer.js').OutputConfig} [cfg]
     *   Output configuration for the document (encoding, doctype, format, etc.)
     * @returns {DOMJoiningTransformer}
     */
    resultDocument(href: string, cb: (this: DOMJoiningTransformer) => void, cfg?: import("./StringJoiningTransformer.js").OutputConfig): DOMJoiningTransformer;
    /**
     * Helper method to use property sets.
     * @param {Record<string, unknown>} obj - Object to apply property set to
     * @param {string} psName - Property set name
     * @returns {Record<string, unknown>}
     */
    _usePropertySets(obj: Record<string, unknown>, psName: string): Record<string, unknown>;
}
import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';
//# sourceMappingURL=DOMJoiningTransformer.d.ts.map