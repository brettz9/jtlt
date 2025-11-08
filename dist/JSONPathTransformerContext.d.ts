export default JSONPathTransformerContext;
/**
 * Sort spec types used by applyTemplates() and forEach().
 */
export type SortObject = {
    select?: string;
    order?: "ascending" | "descending";
    type?: "text" | "number";
    locale?: string;
    localeOptions?: any;
};
/**
 * Sort spec types used by applyTemplates() and forEach().
 */
export type SortComparator = (a: any, b: any, ctx: JSONPathTransformerContext) => number;
/**
 * Sort spec types used by applyTemplates() and forEach().
 */
export type SortSpec = string | SortObject | SortComparator | Array<string | SortObject>;
/**
 * Sort spec types used by applyTemplates() and forEach().
 * @typedef {{
 *   select?: string,
 *   order?: 'ascending'|'descending',
 *   type?: 'text'|'number',
 *   locale?: string,
 *   localeOptions?: any
 * }} SortObject
 * @typedef {(a:any, b:any,
 *   ctx: JSONPathTransformerContext
 * ) => number} SortComparator
 * @typedef {string | SortObject | SortComparator |
 *   Array<string|SortObject>} SortSpec
 */
/**
 * Execution context for JSONPath-driven template application.
 *
 * Holds the current node, parent, path, variables, and property sets while
 * running templates. Exposes helper methods that mirror the underlying
 * joining transformer (e.g., string(), object(), array()) so templates can
 * emit results without referencing the joiner directly.
 */
declare class JSONPathTransformerContext {
    /**
     * @param {object} config - Configuration object
     * @param {object} config.data - Data to transform
     * @param {object} [config.parent] - Parent object
     * @param {string} [config.parentProperty] - Parent property name
     * @param {boolean} [config.errorOnEqualPriority] - Whether to error on
     *   equal priority
     * @param {{
     *   append: (item:any)=>void,
     *   get: ()=>any,
     *   string: (str:string, cb?: (this: any)=>void)=>void,
     *   object: (...args:any[])=>void,
     *   array: (...args:any[])=>void
     * }} config.joiningTransformer -
     *   Joining transformer
     * @param {boolean} [config.preventEval] - Whether to prevent eval in
     *   JSONPath
     * @param {(path:string)=>number} [config.specificityPriorityResolver]
     *   Priority resolver function
     * @param {any[]} templates - Array of template objects
     */
    constructor(config: {
        data: object;
        parent?: object | undefined;
        parentProperty?: string | undefined;
        errorOnEqualPriority?: boolean | undefined;
        joiningTransformer: {
            append: (item: any) => void;
            get: () => any;
            string: (str: string, cb?: (this: any) => void) => void;
            object: (...args: any[]) => void;
            array: (...args: any[]) => void;
        };
        preventEval?: boolean | undefined;
        specificityPriorityResolver?: ((path: string) => number) | undefined;
    }, templates: any[]);
    _config: {
        data: object;
        parent?: object | undefined;
        parentProperty?: string | undefined;
        errorOnEqualPriority?: boolean | undefined;
        joiningTransformer: {
            append: (item: any) => void;
            get: () => any;
            string: (str: string, cb?: (this: any) => void) => void;
            object: (...args: any[]) => void;
            array: (...args: any[]) => void;
        };
        preventEval?: boolean | undefined;
        specificityPriorityResolver?: ((path: string) => number) | undefined;
    };
    _templates: any[];
    _contextObj: object;
    _origObj: object;
    _parent: object;
    _parentProperty: string;
    /** @type {Record<string, unknown>} */
    vars: Record<string, unknown>;
    /** @type {Record<string, Record<string, unknown>>} */
    propertySets: Record<string, Record<string, unknown>>;
    /** @type {Record<string, {match: string, use: string}>} */
    keys: Record<string, {
        match: string;
        use: string;
    }>;
    /** @type {boolean | undefined} */
    _initialized: boolean | undefined;
    /** @type {string | undefined} */
    _currPath: string | undefined;
    /**
     * Triggers an error if equal priority templates are found.
     * @returns {void}
     */
    _triggerEqualPriorityError(): void;
    /**
     * Gets the joining transformer from config.
     * @returns {any} The joining transformer
     */
    _getJoiningTransformer(): any;
    /**
     * @param {any} item - Item to append to output
     * @returns {JSONPathTransformerContext}
     */
    appendOutput(item: any): JSONPathTransformerContext;
    /**
     * Gets the current output.
     * @returns {any} The output from the joining transformer
     */
    getOutput(): any;
    /**
     * Get() and set() are provided as a convenience method for templates, but
     *   it should typically not be used (use valueOf or the copy methods to add
     *   to the result tree instead).
     * @param {string} select - JSONPath selector
     * @param {boolean} wrap - Whether to wrap results
     * @returns {any} The selected value(s)
     */
    get(select: string, wrap: boolean): any;
    /**
     * @param {any} v - Value to set
     * @returns {JSONPathTransformerContext}
     */
    set(v: any): JSONPathTransformerContext;
    /**
     * Apply matching templates to nodes selected by JSONPath, optionally sorted.
     *
     * Sort parameter forms:
     * - string: JSONPath relative to each match (e.g., '$.name' or '@')
     * - function: comparator (aValue, bValue, ctx) => number
     * - object: { select, order='ascending'|'descending', type='text'|'number',
     *            locale, localeOptions }
     * - array: multiple key objects/strings in priority order.
     *
     * @param {string|object} select - JSONPath selector or options object
     * @param {string} [mode] - Mode to apply
     * @param {SortSpec} [sort] - Sort spec
     * @returns {JSONPathTransformerContext}
     */
    applyTemplates(select: string | object, mode?: string, sort?: SortSpec): JSONPathTransformerContext;
    /**
     * @param {string|object} name - Template name or options object
     * @param {any[]} [withParams] - Parameters to pass to template
     * @returns {JSONPathTransformerContext}
     */
    callTemplate(name: string | object, withParams?: any[]): JSONPathTransformerContext;
    /**
     * Iterate over values selected by JSONPath, optionally sorted.
     *
     * Sort parameter forms are the same as applyTemplates().
     * @param {string} select - JSONPath selector
     * @param {(this: JSONPathTransformerContext,
     *   value:any
     * )=>void} cb - Callback function
     * @param {SortSpec} [sort] - Sort spec
     * @returns {JSONPathTransformerContext}
     */
    forEach(select: string, cb: (this: JSONPathTransformerContext, value: any) => void, sort?: SortSpec): JSONPathTransformerContext;
    /**
     * @param {string|object} [select] - JSONPath selector
     * @returns {JSONPathTransformerContext}
     */
    valueOf(select?: string | object): JSONPathTransformerContext;
    /**
     * Deep copy selection or current context when omitted.
     * @param {string} [select] - JSONPath selector
     * @returns {JSONPathTransformerContext}
     */
    copyOf(select?: string): JSONPathTransformerContext;
    /**
     * Shallow copy current context; optionally merge property set names.
     * @param {string[]} [propertySets] - Property sets to merge
     * @returns {JSONPathTransformerContext}
     */
    copy(propertySets?: string[]): JSONPathTransformerContext;
    /**
     * @param {string} name - Variable name
     * @param {string} select - JSONPath selector
     * @returns {JSONPathTransformerContext}
     */
    variable(name: string, select: string): JSONPathTransformerContext;
    /**
     * @param {any} json - JSON data to log
     * @returns {void}
     */
    message(json: any): void;
    /**
     * @param {string} str - String value
     * @param {(this: JSONPathTransformerContext)
     *   => void} [cb] - Optional callback to build nested string content
     * @returns {JSONPathTransformerContext}
     */
    string(str: string, cb?: (this: JSONPathTransformerContext) => void): JSONPathTransformerContext;
    /**
     * Append a number to JSON output. Mirrors the joining transformer API so
     *   templates can call `this.number()`.
     * @param {number} num - Number value to append
     * @returns {JSONPathTransformerContext}
     */
    number(num: number): JSONPathTransformerContext;
    /**
     * Append plain text directly to the output without escaping or JSON
     *   stringification. Mirrors the joining transformer API so templates can
     *   call `this.plainText()`.
     * @param {string} str - Plain text to append
     * @returns {JSONPathTransformerContext}
     */
    plainText(str: string): JSONPathTransformerContext;
    /**
     * Set a property value on the current object (JSON joiner). Mirrors the
     *   joining transformer API so templates can call `this.propValue()`.
     * @param {string} prop - Property name
     * @param {any} val - Property value
     * @returns {JSONPathTransformerContext}
     */
    propValue(prop: string, val: any): JSONPathTransformerContext;
    /**
     * Build an object. Mirrors the joining transformer API. All joiners now
     * support both signatures: (obj, cb, usePropertySets, propSets) with seed
     * object or (cb, usePropertySets, propSets) without.
     * @param {...any} args - Arguments to pass to joiner
     * @returns {JSONPathTransformerContext}
     */
    object(...args: any[]): JSONPathTransformerContext;
    /**
     * Build an array. Mirrors the joining transformer API. All joiners now
     * support both signatures: (arr, cb) with seed array or (cb) without.
     * @param {...any} args - Arguments to pass to joiner
     * @returns {JSONPathTransformerContext}
     */
    array(...args: any[]): JSONPathTransformerContext;
    /**
     * Create an element. Mirrors the joining transformer API so templates can
     * call `this.element()`.
     * @param {string} name - Element name
     * @param {Record<string, string>} [atts] - Attributes object
     * @param {any[]} [children] - Child nodes
     * @param {(this: JSONPathTransformerContext)
     *   => void} [cb] - Callback function
     * @returns {JSONPathTransformerContext}
     */
    element(name: string, atts?: Record<string, string>, children?: any[], cb?: (this: JSONPathTransformerContext) => void): JSONPathTransformerContext;
    /**
     * Add an attribute to the most recently opened element. Mirrors the joining
     * transformer API so templates can call `this.attribute()`.
     * @param {string} name - Attribute name
     * @param {string|Record<string, unknown>} val - Attribute value
     * @param {boolean} [avoidAttEscape] - Whether to avoid escaping
     * @returns {JSONPathTransformerContext}
     */
    attribute(name: string, val: string | Record<string, unknown>, avoidAttEscape?: boolean): JSONPathTransformerContext;
    /**
     * Append text content. Mirrors the joining transformer API so templates can
     * call `this.text()`.
     * @param {string} txt - Text content
     * @returns {JSONPathTransformerContext}
     */
    text(txt: string): JSONPathTransformerContext;
    /**
     * @param {string} name - Property set name
     * @param {Record<string, unknown>} propertySetObj - Property set object
     * @param {any[]} [usePropertySets] - Property sets to use
     * @returns {JSONPathTransformerContext}
     */
    propertySet(name: string, propertySetObj: Record<string, unknown>, usePropertySets?: any[]): JSONPathTransformerContext;
    /**
     * @param {Record<string, unknown>} obj - Object to assign properties to
     * @param {string} name - Property set name
     * @returns {Record<string, unknown>}
     */
    _usePropertySets(obj: Record<string, unknown>, name: string): Record<string, unknown>;
    /**
     * @param {string} name - Key name
     * @param {any} value - Value to match
     * @returns {any}
     */
    getKey(name: string, value: any): any;
    /**
     * @param {string} name - Key name
     * @param {string} match - Match expression
     * @param {string} use - Use expression
     * @returns {JSONPathTransformerContext}
     */
    key(name: string, match: string, use: string): JSONPathTransformerContext;
    /**
     * Conditionally execute a callback when a JSONPath selector evaluates
     * to a truthy scalar or a non-empty result set (node set analogue).
     * Mirrors XSLT's xsl:if semantics where a non-empty node set is truthy.
     *
     * Truthiness rules:
     * - If the selection (with wrap) yields an array with length > 0, the
     *   condition passes.
     * - Otherwise the (non-wrapped) scalar value is coerced with Boolean();
     *   e.g., 0, '', null, undefined => false; others => true.
     *
     * @param {string} select - JSONPath selector expression
     * @param {(this: JSONPathTransformerContext)
     *   => void} cb - Callback to invoke if condition is met
     * @returns {JSONPathTransformerContext}
     */
    if(select: string, cb: (this: JSONPathTransformerContext) => void): JSONPathTransformerContext;
    /**
     * Internal helper: determine if `select` passes truthiness test.
     * Non-empty wrapped results => true; single item: objects truthy,
     * primitives coerced via Boolean().
     * @param {string} select
     * @returns {boolean}
     */
    _passesIf(select: string): boolean;
    /**
     * Like `if()`, but also supports an optional fallback callback executed
     * when the test does not pass (similar to xsl:choose/xsl:otherwise).
     * @param {string} select JSONPath selector
     * @param {(this: JSONPathTransformerContext)
     *   => void} whenCb Callback when condition passes
     * @param {(this: JSONPathTransformerContext)
     *   => void} [otherwiseCb] Callback when condition fails
     * @returns {JSONPathTransformerContext}
     */
    choose(select: string, whenCb: (this: JSONPathTransformerContext) => void, otherwiseCb?: (this: JSONPathTransformerContext) => void): JSONPathTransformerContext;
}
//# sourceMappingURL=JSONPathTransformerContext.d.ts.map