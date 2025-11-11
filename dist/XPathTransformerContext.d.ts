export default XPathTransformerContext;
export type XPathTransformerContextConfig = {
    /**
     * - XML/DOM root to transform
     */
    data?: unknown;
    /**
     * - 1 or 2 (default 1)
     */
    xpathVersion?: number | undefined;
    /**
     * Joiner
     */
    joiningTransformer: import("./index.js").JoiningTransformer;
    errorOnEqualPriority?: boolean | undefined;
    specificityPriorityResolver?: ((path: string) => number) | undefined;
};
/**
 * @typedef {object} XPathTransformerContextConfig
 * @property {unknown} [data] - XML/DOM root to transform
 * @property {number} [xpathVersion] - 1 or 2 (default 1)
 * @property {import('./index.js').
 *   JoiningTransformer} joiningTransformer Joiner
 * @property {boolean} [errorOnEqualPriority]
 * @property {(path: string) => number} [specificityPriorityResolver]
 */
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
    static DefaultTemplateRules: {
        transformRoot: {
            /**
             * @this {XPathTransformerContext}
             * @param {unknown} node Root node
             * @param {{mode:string}} cfg Config
             * @returns {void}
             */
            template(this: XPathTransformerContext, node: unknown, cfg: {
                mode: string;
            }): void;
        };
        transformElements: {
            /**
             * @this {XPathTransformerContext}
             * @param {unknown} node Element node
             * @param {{mode?:string}} cfg Config
             * @returns {void}
             */
            template(this: XPathTransformerContext, node: unknown, cfg: {
                mode?: string;
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
            /**
             * @this {XPathTransformerContext}
             * @returns {XPathTransformerContext}
             */
            template(this: XPathTransformerContext): XPathTransformerContext;
        };
    };
    /**
     * @param {XPathTransformerContextConfig} config
     * @param {import('./index.js').XPathTemplateObject[]} templates - Template
     *   objects
     */
    constructor(config: XPathTransformerContextConfig, templates: import("./index.js").XPathTemplateObject[]);
    _config: XPathTransformerContextConfig;
    _templates: import("./index.js").XPathTemplateObject[];
    /** @type {Document|Element|Node} */
    _contextNode: Document | Element | Node;
    _origNode: Document | Element | Node;
    /** @type {Record<string, unknown>} */
    vars: Record<string, unknown>;
    /** @type {Record<string, Record<string, unknown>>} */
    propertySets: Record<string, Record<string, unknown>>;
    /** @type {Record<string, {match: string, use: string}>} */
    keys: Record<string, {
        match: string;
        use: string;
    }>;
    /** @type {boolean|undefined} */
    _initialized: boolean | undefined;
    /** @type {string|undefined} */
    _currPath: string | undefined;
    /** @returns {import('./index.js').JoiningTransformer} */
    _getJoiningTransformer(): import("./index.js").JoiningTransformer;
    /**
     * Evaluate an XPath expression against the current context node.
     * @param {string} expr - XPath expression
     * @param {boolean} [asNodes] Return nodes (array) instead of scalar
     * @returns {unknown}
     */
    _evalXPath(expr: string, asNodes?: boolean): unknown;
    /**
     * Append raw item to output.
     * @param {unknown} item
     * @returns {XPathTransformerContext}
     */
    appendOutput(item: unknown): XPathTransformerContext;
    /** @returns {unknown} */
    getOutput(): unknown;
    /**
     * Get value(s) by XPath relative to current context.
     * @param {string} select - XPath expression
     * @param {boolean} [asNodes]
     * @returns {Node[]}
     */
    get(select: string, asNodes?: boolean): Node[];
    /**
     * Set current context's parent property (for parity with JSONPath context).
     * Mostly placeholder for object-mirroring behavior.
     * @param {Document|Element|Node} v
     * @returns {XPathTransformerContext}
     */
    set(v: Document | Element | Node): XPathTransformerContext;
    /**
     * Apply templates to nodes matched by an XPath expression.
     * @param {string} [select] - XPath expression (default '.')
     * @param {string} [mode]
     * @returns {XPathTransformerContext}
     */
    applyTemplates(select?: string, mode?: string): XPathTransformerContext;
    /**
     * Iterate over nodes selected by XPath.
     * @param {string} select - XPath expression
     * @param {(this: XPathTransformerContext,
     *   node: Node
     * )=>void} cb - Callback invoked per node
     * @returns {XPathTransformerContext}
     */
    forEach(select: string, cb: (this: XPathTransformerContext, node: Node) => void): XPathTransformerContext;
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
     * Log a message (for debugging).
     * @param {unknown} json Any value
     * @returns {void}
     */
    message(json: unknown): void;
    /**
     * Append string.
     * @param {string} str String to append
     * @param {(this: XPathTransformerContext) => void} [cb] Callback
     * @returns {XPathTransformerContext}
     */
    string(str: string, cb?: (this: XPathTransformerContext) => void): XPathTransformerContext;
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
     * @param {any} val Value
     * @returns {XPathTransformerContext}
     */
    propValue(prop: string, val: any): XPathTransformerContext;
    /**
     * Append object.
     * @param {Record<string, unknown>|
     *   ((this: XPathTransformerContext) => void)} objOrCb Object or callback
     * @param {((this: XPathTransformerContext) => void)|
     *   any[]} [cbOrUsePropertySets] Callback or property sets
     * @param {any[]|
     *   Record<string, unknown>} [usePropertySetsOrPropSets]
     *   Property sets or props
     * @param {Record<string, unknown>} [propSets] Additional property sets
     * @returns {XPathTransformerContext}
     */
    object(objOrCb: Record<string, unknown> | ((this: XPathTransformerContext) => void), cbOrUsePropertySets?: ((this: XPathTransformerContext) => void) | any[], usePropertySetsOrPropSets?: any[] | Record<string, unknown>, propSets?: Record<string, unknown>): XPathTransformerContext;
    /**
     * Append array.
     * @param {any[]|
     *   ((this: XPathTransformerContext) => void)} [arrOrCb]
     *   Array or callback
     * @param {(this: XPathTransformerContext) => void} [cb] Callback
     * @returns {XPathTransformerContext}
     */
    array(arrOrCb?: any[] | ((this: XPathTransformerContext) => void), cb?: (this: XPathTransformerContext) => void): XPathTransformerContext;
    /**
     * Append text node content.
     * @param {import('./StringJoiningTransformer.js').OutputConfig} cfg Text
     * @returns {XPathTransformerContext}
     */
    output(cfg: import("./StringJoiningTransformer.js").OutputConfig): XPathTransformerContext;
    /**
     * Append element.
     * @param {string} name Tag name
     * @param {Record<string, string>|any[]|
     *   ((this: XPathTransformerContext)=>void)} [atts] Attributes
     * @param {any[]|((this: XPathTransformerContext)=>void)} [children]
     *   Children
     * @param {(this: XPathTransformerContext)=>void} [cb] Callback
     * @returns {XPathTransformerContext}
     */
    element(name: string, atts?: Record<string, string> | any[] | ((this: XPathTransformerContext) => void), children?: any[] | ((this: XPathTransformerContext) => void), cb?: (this: XPathTransformerContext) => void): XPathTransformerContext;
    /**
     * Append attribute.
     * @param {string} name Attribute name
     * @param {string|Record<string, unknown>} val Value
     * @param {boolean} [avoid] Avoid duplicates
     * @returns {XPathTransformerContext}
     */
    attribute(name: string, val: string | Record<string, unknown>, avoid?: boolean): XPathTransformerContext;
    /**
     * Append text node content.
     * @param {string} txt Text
     * @returns {XPathTransformerContext}
     */
    text(txt: string): XPathTransformerContext;
    /**
     * Append a comment.
     * @param {string} text - Comment text
     * @returns {XPathTransformerContext}
     */
    comment(text: string): XPathTransformerContext;
    /**
     * Append a processing instruction.
     * @param {string} target - Processing instruction target
     * @param {string} data - Processing instruction data
     * @returns {XPathTransformerContext}
     */
    processingInstruction(target: string, data: string): XPathTransformerContext;
    /**
     * Define a property set (optionally composed from other sets).
     * @param {string} name Property set name
     * @param {Record<string, unknown>} obj Base properties
     * @param {string[]} [use] Property set names to merge
     * @returns {XPathTransformerContext}
     */
    propertySet(name: string, obj: Record<string, unknown>, use?: string[]): XPathTransformerContext;
    /**
     * Merge properties from a named property set into obj.
     * @param {Record<string, unknown>} obj Target object
     * @param {string} name Property set name
     * @returns {Record<string, unknown>}
     */
    _usePropertySets(obj: Record<string, unknown>, name: string): Record<string, unknown>;
    /**
     * Retrieve a key-mapped node matching a value or return context.
     * @param {string} name Key name
     * @param {any} value Value to match
     * @returns {any}
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
     * @param {(this: XPathTransformerContext)
     *   => void} cb Callback invoked if condition passes
     * @returns {XPathTransformerContext}
     */
    if(select: string, cb: (this: XPathTransformerContext) => void): XPathTransformerContext;
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
     * @param {(this: XPathTransformerContext)
     *   => void} whenCb Callback when condition passes
     * @param {(this: XPathTransformerContext)
     *   => void} [otherwiseCb] Callback when condition fails
     * @returns {XPathTransformerContext}
     */
    choose(select: string, whenCb: (this: XPathTransformerContext) => void, otherwiseCb?: (this: XPathTransformerContext) => void): XPathTransformerContext;
}
//# sourceMappingURL=XPathTransformerContext.d.ts.map