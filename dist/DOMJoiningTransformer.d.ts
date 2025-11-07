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
     * @param {object} cfg - Configuration object
     * @param {object} [cfg.document] - Document object
     */
    constructor(o: DocumentFragment | Element, cfg: {
        document?: object | undefined;
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
     * @param {*} val - Property value
     * @returns {void}
     */
    propValue(prop: string, val: any): void;
    /**
     * @param {object} obj - Object to serialize
     * @param {Function} [cb] - Callback function.
     * @param {any[]} [usePropertySets] - Property sets to use
     * @param {object} [propSets] - Additional property sets
     * @returns {DOMJoiningTransformer}
     */
    object(obj: object, cb?: Function, usePropertySets?: any[], propSets?: object): DOMJoiningTransformer;
    /**
     * @param {any[]|Element} arr
     * @param {Function} [cb] - Callback function
     * @returns {DOMJoiningTransformer}
     */
    array(arr: any[] | Element, cb?: Function): DOMJoiningTransformer;
    /**
     * @param {string} str - String value
     * @param {Function} cb - Callback function (unused)
     * @returns {DOMJoiningTransformer}
     */
    string(str: string, cb: Function): DOMJoiningTransformer;
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
     * @param {Function} func - Function to stringify
     * @returns {DOMJoiningTransformer}
     */
    function(func: Function): DOMJoiningTransformer;
    /**
     * @param {string} elName - Element name
     * @param {object} [atts] - Attributes object
     * @param {Function} [cb] - Callback function
     * @returns {DOMJoiningTransformer}
     */
    element(elName: string, atts?: object, cb?: Function): DOMJoiningTransformer;
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