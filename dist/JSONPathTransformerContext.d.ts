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
     * @todo implement sort (allow as callback or as object)
     * @param {string|object} select - JSONPath selector or options object
     * @param {string} [mode] - Mode to apply
     * @param {*} [sort] - Sort parameter (not yet implemented)
     * @returns {JSONPathTransformerContext}
     */
    applyTemplates(select: string | object, mode?: string, sort?: any): JSONPathTransformerContext;
    /**
     * @param {string|object} name - Template name or options object
     * @param {any[]} [withParams] - Parameters to pass to template
     * @returns {JSONPathTransformerContext}
     */
    callTemplate(name: string | object, withParams?: any[]): JSONPathTransformerContext;
    /**
     * @param {string} select - JSONPath selector
     * @param {Function} cb - Callback function
     * @param {*} sort - Sort parameter (not yet implemented)
     * @returns {JSONPathTransformerContext}
     */
    forEach(select: string, cb: Function, sort: any): JSONPathTransformerContext;
    /**
     * @param {string|object} [select] - JSONPath selector
     * @returns {JSONPathTransformerContext}
     */
    valueOf(select?: string | object): JSONPathTransformerContext;
    /**
     * Deep copy (not yet implemented).
     * @param {string} select - JSONPath selector
     * @returns {JSONPathTransformerContext}
     */
    copyOf(select: string): JSONPathTransformerContext;
    /**
     * Shallow copy (not yet implemented).
     * @param {*} propertySets - Property sets
     * @returns {JSONPathTransformerContext}
     */
    copy(propertySets: any): JSONPathTransformerContext;
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
     * Append plain text directly to the output without escaping or JSON
     *   stringification. Mirrors the joining transformer API so templates can
     *   call `this.plainText()`.
     * @param {string} str - Plain text to append
     * @returns {JSONPathTransformerContext}
     */
    plainText(str: string): JSONPathTransformerContext;
    /**
     * @param {Function} cb - Callback function
     * @param {*} usePropertySets - Property sets to use
     * @param {*} propSets - Property sets
     * @returns {JSONPathTransformerContext}
     */
    object(cb: Function, usePropertySets: any, propSets: any): JSONPathTransformerContext;
    /**
     * @param {Function} cb - Callback function
     * @returns {JSONPathTransformerContext}
     */
    array(cb: Function): JSONPathTransformerContext;
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