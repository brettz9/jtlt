export default XPathTransformerContext;
/**
 * Execution context for XPath-driven template application.
 *
 * Similar to JSONPathTransformerContext but uses XPath expressions on a
 * DOM/XML-like tree. Supports XPath 1.0 (default) or 2.0 when
 * `xpathVersion: 2`.
 *
 * Expected config:
 * - data: A Document, Element, or XML-like root node.
 * - joiningTransformer: joiner with append(), string(), object(), array(), etc.
 * - xpathVersion: 1|2 (default 1)
 * - errorOnEqualPriority, specificityPriorityResolver (same semantics).
 */
declare class XPathTransformerContext {
    /**
     * Log a message (for debugging).
     * @param {*} json Any value
     * @returns {void}
     */
    static message(json: any): void;
    static DefaultTemplateRules: {
        transformRoot: {
            /**
             * @param {*} node Root node
             * @param {{mode:string}} cfg Config
             * @returns {void}
             */
            template(node: any, cfg: {
                mode: string;
            }): void;
        };
        transformElements: {
            /**
             * @param {*} node Element node
             * @param {{mode:string}} cfg Config
             * @returns {void}
             */
            template(node: any, cfg: {
                mode: string;
            }): void;
        };
        transformTextNodes: {
            /**
             * @param {{nodeValue:string}} node Text node
             * @returns {string}
             */
            template(node: {
                nodeValue: string;
            }): string;
        };
        transformScalars: {
            /** @returns {*} */
            template(): any;
        };
    };
    /**
     * @param {object} config - Configuration object
     * @param {Document|Element|any} config.data - XML/DOM root to transform
     * @param {number} [config.xpathVersion] - 1 or 2 (default 1)
    * @param {object} config.joiningTransformer Joiner
    * @param {Function} config.joiningTransformer.append Append output
    * @param {Function} config.joiningTransformer.get Get output
    * @param {Function} config.joiningTransformer.string Emit string
    * @param {Function} config.joiningTransformer.object Emit object
    * @param {Function} config.joiningTransformer.array Emit array
     * @param {boolean} [config.errorOnEqualPriority]
     * @param {Function} [config.specificityPriorityResolver]
     * @param {any[]} templates - Template objects
     */
    constructor(config: {
        data: Document | Element | any;
        xpathVersion?: number | undefined;
        joiningTransformer: {
            append: Function;
            get: Function;
            string: Function;
            object: Function;
            array: Function;
        };
        errorOnEqualPriority?: boolean | undefined;
        specificityPriorityResolver?: Function | undefined;
    }, templates: any[]);
    _config: {
        data: Document | Element | any;
        xpathVersion?: number | undefined;
        joiningTransformer: {
            append: Function;
            get: Function;
            string: Function;
            object: Function;
            array: Function;
        };
        errorOnEqualPriority?: boolean | undefined;
        specificityPriorityResolver?: Function | undefined;
    };
    _templates: any[];
    _contextNode: any;
    _origNode: any;
    /** @type {Record<string, any>} */
    vars: Record<string, any>;
    /** @type {Record<string, any>} */
    propertySets: Record<string, any>;
    /** @type {Record<string, any>} */
    keys: Record<string, any>;
    /** @type {boolean|undefined} */
    _initialized: boolean | undefined;
    /** @type {string|undefined} */
    _currPath: string | undefined;
    /** @returns {any} */
    _getJoiningTransformer(): any;
    /**
     * Evaluate an XPath expression against the current context node.
     * @param {string} expr - XPath expression
    * @param {boolean} [asNodes] Return nodes (array) instead of scalar
     * @returns {any}
     */
    _evalXPath(expr: string, asNodes?: boolean): any;
    /**
     * Append raw item to output.
     * @param {*} item
     * @returns {XPathTransformerContext}
     */
    appendOutput(item: any): XPathTransformerContext;
    /** @returns {*} */
    getOutput(): any;
    /**
     * Get value(s) by XPath relative to current context.
     * @param {string} select - XPath expression
     * @param {boolean} [asNodes]
     * @returns {*}
     */
    get(select: string, asNodes?: boolean): any;
    /**
     * Set current context's parent property (for parity with JSONPath context).
     * Mostly placeholder for object-mirroring behavior.
     * @param {*} v
     * @returns {XPathTransformerContext}
     */
    set(v: any): XPathTransformerContext;
    /**
     * Apply templates to nodes matched by an XPath expression.
     * @param {string} select - XPath expression (default '.')
     * @param {string} [mode]
     * @returns {XPathTransformerContext}
     */
    applyTemplates(select: string, mode?: string): XPathTransformerContext;
    /**
     * Iterate over nodes selected by XPath.
     * @param {string} select - XPath expression
     * @param {Function} cb - Callback invoked per node
     * @returns {XPathTransformerContext}
     */
    forEach(select: string, cb: Function): XPathTransformerContext;
    /**
     * Append the value from an XPath expression or the context node text.
     * @param {string|object} [select]
     * @returns {XPathTransformerContext}
     */
    valueOf(select?: string | object): XPathTransformerContext;
    /**
     * Define a variable by XPath selection (stores node array if nodes).
     * @param {string} name Variable name
     * @param {string} select XPath expression
     * @returns {XPathTransformerContext}
     */
    variable(name: string, select: string): XPathTransformerContext;
    /**
     * Append string.
     * @param {string} str String to append
     * @param {Function} [cb] Callback
     * @returns {XPathTransformerContext}
     */
    string(str: string, cb?: Function): XPathTransformerContext;
    /**
     * Append number.
     * @param {number} num Number
     * @returns {XPathTransformerContext}
     */
    number(num: number): XPathTransformerContext;
    /**
     * Append plain text (no escaping changes).
     * @param {string} str Text
     * @returns {XPathTransformerContext}
     */
    plainText(str: string): XPathTransformerContext;
    /**
     * Append property/value pair.
     * @param {string} prop Property name
     * @param {*} val Value
     * @returns {XPathTransformerContext}
     */
    propValue(prop: string, val: any): XPathTransformerContext;
    /**
     * Append object.
     * @param {...any} args Object args
     * @returns {XPathTransformerContext}
     */
    object(...args: any[]): XPathTransformerContext;
    /**
     * Append array.
     * @param {...any} args Array args
     * @returns {XPathTransformerContext}
     */
    array(...args: any[]): XPathTransformerContext;
    /**
     * Append element.
     * @param {string} name Tag name
     * @param {object} [atts] Attributes
     * @param {any[]} [children] Children
     * @param {Function} [cb] Callback
     * @returns {XPathTransformerContext}
     */
    element(name: string, atts?: object, children?: any[], cb?: Function): XPathTransformerContext;
    /**
     * Append attribute.
     * @param {string} name Attribute name
     * @param {string|object} val Value
     * @param {boolean} [avoid] Avoid duplicates
     * @returns {XPathTransformerContext}
     */
    attribute(name: string, val: string | object, avoid?: boolean): XPathTransformerContext;
    /**
     * Append text node content.
     * @param {string} txt Text
     * @returns {XPathTransformerContext}
     */
    text(txt: string): XPathTransformerContext;
    /**
     * Define a property set (optionally composed from other sets).
     * @param {string} name Property set name
     * @param {object} obj Base properties
     * @param {string[]} [use] Property set names to merge
     * @returns {XPathTransformerContext}
     */
    propertySet(name: string, obj: object, use?: string[]): XPathTransformerContext;
    /**
     * Merge properties from a named property set into obj.
     * @param {object} obj Target object
     * @param {string} name Property set name
     * @returns {object}
     */
    _usePropertySets(obj: object, name: string): object;
    /**
     * Retrieve a key-mapped node matching a value or return context.
     * @param {string} name Key name
     * @param {*} value Value to match
     * @returns {*}
     */
    getKey(name: string, value: any): any;
    /**
     * Register a key for later lookup.
     * @param {string} name Key name
     * @param {string} match XPath selecting nodes
     * @param {string} use Attribute (or property) name to compare
     * @returns {XPathTransformerContext}
     */
    key(name: string, match: string, use: string): XPathTransformerContext;
    /**
     * Conditionally execute a callback when an XPath evaluates to a truthy
     * scalar or a non-empty node set (akin to xsl:if semantics).
     *
     * Truthiness rules:
     * - Node set: length > 0 passes.
     * - Scalar: Boolean(value) must be true.
     *
     * @param {string} select XPath expression
     * @param {Function} cb Callback invoked if condition passes
     * @returns {XPathTransformerContext}
     */
    if(select: string, cb: Function): XPathTransformerContext;
    /**
     * Internal helper: evaluate XPath truthiness like if().
     * @param {string} select
     * @returns {boolean}
     */
    _passesIf(select: string): boolean;
    /**
     * Conditional with optional fallback (like choose/otherwise).
     * Truthiness same as `if()`.
     * @param {string} select XPath expression
     * @param {Function} whenCb Callback when condition passes
     * @param {Function} [otherwiseCb] Callback when condition fails
     * @returns {XPathTransformerContext}
     */
    choose(select: string, whenCb: Function, otherwiseCb?: Function): XPathTransformerContext;
}
//# sourceMappingURL=XPathTransformerContext.d.ts.map