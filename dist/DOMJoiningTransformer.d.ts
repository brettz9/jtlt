export default DOMJoiningTransformer;
/**
 * Joining transformer that accumulates into a DOM tree.
 *
 * This transformer appends strings and nodes to a DocumentFragment/Element.
 * It expects templates to build DOM nodes explicitly (e.g., via element(),
 * attribute(), and text()), though string/number/boolean will append text
 * nodes for convenience.
 */
declare class DOMJoiningTransformer extends AbstractJoiningTransformer {
    /**
     * @param {DocumentFragment|Element} o - Initial DOM node
     * @param {{document?: Document}} cfg - Configuration object
     */
    constructor(o: DocumentFragment | Element, cfg: {
        document?: Document;
    });
    _dom: DocumentFragment | Element;
    /**
     * @param {Node} item
     * @returns {void}
     */
    rawAppend(item: Node): void;
    /**
     * @param {string|Node} item - Item to append
     * @returns {void}
     */
    append(item: string | Node): void;
    /**
     * @returns {DocumentFragment|Element}
     */
    get(): DocumentFragment | Element;
    /**
     * @param {string} prop - Property name
     * @param {any} val - Property value
     * @returns {void}
     */
    propValue(prop: string, val: any): void;
    /**
     * @param {Record<string, unknown>} obj - Object to serialize
     * @param {(this: DOMJoiningTransformer) => void} [cb] - Callback function.
     * @param {any[]} [usePropertySets] - Property sets to use
     * @param {Record<string, unknown>} [propSets] - Additional property sets
     * @returns {DOMJoiningTransformer}
     */
    object(obj: Record<string, unknown>, cb?: (this: DOMJoiningTransformer) => void, usePropertySets?: any[], propSets?: Record<string, unknown>): DOMJoiningTransformer;
    /**
     * @param {any[]|Element} arr
     * @param {(this: DOMJoiningTransformer) => void} [cb] - Callback function
     * @returns {DOMJoiningTransformer}
     */
    array(arr: any[] | Element, cb?: (this: DOMJoiningTransformer) => void): DOMJoiningTransformer;
    /**
     * @param {string} str - String value
     * @param {(this: DOMJoiningTransformer) => void} cb - Callback
     *   function (unused)
     * @returns {DOMJoiningTransformer}
     */
    string(str: string, cb: (this: DOMJoiningTransformer) => void): DOMJoiningTransformer;
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
    function(func: (...args: any[]) => any): DOMJoiningTransformer;
    /**
     * @param {string} elName - Element name
     * @param {Record<string, string>} [atts] - Attributes object
     * @param {(this: DOMJoiningTransformer) => void} [cb] - Callback function
     * @returns {DOMJoiningTransformer}
     */
    element(elName: string, atts?: Record<string, string>, cb?: (this: DOMJoiningTransformer) => void): DOMJoiningTransformer;
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
     * @param {string} str
     * @returns {DOMJoiningTransformer}
     */
    plainText(str: string): DOMJoiningTransformer;
}
import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';
//# sourceMappingURL=DOMJoiningTransformer.d.ts.map