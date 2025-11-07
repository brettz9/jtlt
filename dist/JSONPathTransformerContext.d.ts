export default JSONPathTransformerContext;
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
     * @param {{append: Function, get: Function, string: Function,
     *   object: Function, array: Function}} config.joiningTransformer -
     *   Joining transformer
     * @param {boolean} [config.preventEval] - Whether to prevent eval in
     *   JSONPath
     * @param {Function} [config.specificityPriorityResolver] - Function to
     *   resolve priority
     * @param {any[]} templates - Array of template objects
     */
    constructor(config: {
        data: object;
        parent?: object | undefined;
        parentProperty?: string | undefined;
        errorOnEqualPriority?: boolean | undefined;
        joiningTransformer: {
            append: Function;
            get: Function;
            string: Function;
            object: Function;
            array: Function;
        };
        preventEval?: boolean | undefined;
        specificityPriorityResolver?: Function | undefined;
    }, templates: any[]);
    _config: {
        data: object;
        parent?: object | undefined;
        parentProperty?: string | undefined;
        errorOnEqualPriority?: boolean | undefined;
        joiningTransformer: {
            append: Function;
            get: Function;
            string: Function;
            object: Function;
            array: Function;
        };
        preventEval?: boolean | undefined;
        specificityPriorityResolver?: Function | undefined;
    };
    _templates: any[];
    _contextObj: object;
    _origObj: object;
    _parent: object;
    _parentProperty: string;
    /** @type {Record<string, any>} */
    vars: Record<string, any>;
    /** @type {Record<string, any>} */
    propertySets: Record<string, any>;
    /** @type {Record<string, any>} */
    keys: Record<string, any>;
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
     * @param {*} item - Item to append to output
     * @returns {JSONPathTransformerContext}
     */
    appendOutput(item: any): JSONPathTransformerContext;
    /**
     * Gets the current output.
     * @returns {*} The output from the joining transformer
     */
    getOutput(): any;
    /**
     * Get() and set() are provided as a convenience method for templates, but
     *   it should typically not be used (use valueOf or the copy methods to add
     *   to the result tree instead).
     * @param {string} select - JSONPath selector
     * @param {boolean} wrap - Whether to wrap results
     * @returns {*} The selected value(s)
     */
    get(select: string, wrap: boolean): any;
    /**
     * @param {*} v - Value to set
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
     * @param {string|Function|object|Array<string|object>} [sort] - Sort spec
     * @returns {JSONPathTransformerContext}
     */
    applyTemplates(select: string | object, mode?: string, sort?: string | Function | object | Array<string | object>): JSONPathTransformerContext;
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
     * @param {Function} cb - Callback function
     * @param {string|Function|object|Array<string|object>} [sort] - Sort spec
     * @returns {JSONPathTransformerContext}
     */
    forEach(select: string, cb: Function, sort?: string | Function | object | Array<string | object>): JSONPathTransformerContext;
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
     * @param {*} json - JSON data to log
     * @returns {void}
     */
    message(json: any): void;
    /**
     * @param {string} str - String value
     * @param {Function} cb - Callback function
     * @returns {JSONPathTransformerContext}
     */
    string(str: string, cb: Function): JSONPathTransformerContext;
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
     * @param {*} val - Property value
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
     * @param {object} [atts] - Attributes object
     * @param {any[]} [children] - Child nodes
     * @param {Function} [cb] - Callback function
     * @returns {JSONPathTransformerContext}
     */
    element(name: string, atts?: object, children?: any[], cb?: Function): JSONPathTransformerContext;
    /**
     * Add an attribute to the most recently opened element. Mirrors the joining
     * transformer API so templates can call `this.attribute()`.
     * @param {string} name - Attribute name
     * @param {string|object} val - Attribute value
     * @param {boolean} [avoidAttEscape] - Whether to avoid escaping
     * @returns {JSONPathTransformerContext}
     */
    attribute(name: string, val: string | object, avoidAttEscape?: boolean): JSONPathTransformerContext;
    /**
     * Append text content. Mirrors the joining transformer API so templates can
     * call `this.text()`.
     * @param {string} txt - Text content
     * @returns {JSONPathTransformerContext}
     */
    text(txt: string): JSONPathTransformerContext;
    /**
     * @param {string} name - Property set name
     * @param {object} propertySetObj - Property set object
     * @param {any[]} [usePropertySets] - Property sets to use
     * @returns {JSONPathTransformerContext}
     */
    propertySet(name: string, propertySetObj: object, usePropertySets?: any[]): JSONPathTransformerContext;
    /**
     * @param {object} obj - Object to assign properties to
     * @param {string} name - Property set name
     * @returns {object}
     */
    _usePropertySets(obj: object, name: string): object;
    /**
     * @param {string} name - Key name
     * @param {*} value - Value to match
     * @returns {*}
     */
    getKey(name: string, value: any): any;
    /**
     * @param {string} name - Key name
     * @param {string} match - Match expression
     * @param {string} use - Use expression
     * @returns {JSONPathTransformerContext}
     */
    key(name: string, match: string, use: string): JSONPathTransformerContext;
}
//# sourceMappingURL=JSONPathTransformerContext.d.ts.map