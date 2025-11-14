export default JSONPathTransformerContext;
export type NumberValue = number | string | {
    value?: number | string;
    count?: string;
    format?: string;
    groupingSeparator?: string;
    groupingSize?: number;
    lang?: string;
    letterValue?: string;
};
/**
 * Sort spec types used by applyTemplates() and forEach().
 */
export type SortObject = {
    select?: string;
    order?: "ascending" | "descending";
    type?: "text" | "number";
    locale?: string;
    localeOptions?: unknown;
};
/**
 * Sort spec types used by applyTemplates() and forEach().
 */
export type SortComparator = (a: unknown, b: unknown, ctx: JSONPathTransformerContext) => number;
/**
 * Sort spec types used by applyTemplates() and forEach().
 */
export type SortSpec = string | SortObject | SortComparator | Array<string | SortObject>;
export type JSONPathTransformerContextConfig<T = "json"> = {
    /**
     * - Data to transform
     */
    data: null | boolean | number | string | object;
    /**
     * - Parent object
     */
    parent?: object | undefined;
    /**
     * - Parent property name
     */
    parentProperty?: string | undefined;
    /**
     * - Whether to error on
     * equal priority
     */
    errorOnEqualPriority?: boolean | undefined;
    /**
     * - Joining transformer
     */
    joiningTransformer: T extends "json" ? import("./JSONJoiningTransformer.js").default : T extends "string" ? import("./StringJoiningTransformer.js").default : import("./DOMJoiningTransformer.js").default;
    /**
     * - Whether to prevent eval in
     * JSONPath
     */
    preventEval?: boolean | undefined;
    /**
     * Priority resolver function
     */
    specificityPriorityResolver?: ((path: string) => number) | undefined;
    templates: import("./index.js").JSONPathTemplateObject<T>[];
};
/**
 * @typedef {number|string|{
 *   value?: number|string,
 *   count?: string,
 *   format?: string,
 *   groupingSeparator?: string,
 *   groupingSize?: number,
 *   lang?: string,
 *   letterValue?: string
 * }} NumberValue
 */
/**
 * Sort spec types used by applyTemplates() and forEach().
 * @typedef {{
 *   select?: string,
 *   order?: 'ascending' | 'descending',
 *   type?: 'text'|'number',
 *   locale?: string,
 *   localeOptions?: unknown
 * }} SortObject
 * @typedef {(a: unknown, b: unknown,
 *   ctx: JSONPathTransformerContext
 * ) => number} SortComparator
 * @typedef {string | SortObject | SortComparator |
 *   Array<string|SortObject>} SortSpec
 */
/**
 * @template [T = "json"]
 * @typedef {object} JSONPathTransformerContextConfig
 * @property {null|boolean|number|string|object} data - Data to transform
 * @property {object} [parent] - Parent object
 * @property {string} [parentProperty] - Parent property name
 * @property {boolean} [errorOnEqualPriority] - Whether to error on
 *   equal priority
 * @property {T extends "json" ? import('./JSONJoiningTransformer.js').
 *   default : T extends "string" ? import('./StringJoiningTransformer.js').
 *   default : import('./DOMJoiningTransformer.js').
 *   default} joiningTransformer - Joining transformer
 * @property {boolean} [preventEval] - Whether to prevent eval in
 *   JSONPath
 * @property {(path: string) => number} [specificityPriorityResolver]
 *   Priority resolver function
 * @property {import('./index.js').JSONPathTemplateObject<T>[]} templates
 */
/**
 * Execution context for JSONPath-driven template application.
 *
 * Holds the current node, parent, path, variables, and property sets while
 * running templates. Exposes helper methods that mirror the underlying
 * joining transformer (e.g., string(), object(), array()) so templates can
 * emit results without referencing the joiner directly.
 * @template [T = "json"]
 */
declare class JSONPathTransformerContext<T = "json"> {
    /**
     * @param {JSONPathTransformerContextConfig<T>} config
     * @param {import('./index.js').JSONPathTemplateObject<T>[]} templates - Array
     *   of template objects
     */
    constructor(config: JSONPathTransformerContextConfig<T>, templates: import("./index.js").JSONPathTemplateObject<T>[]);
    /**
     * Holds the current iteration state (for position calculations).
     * @type {{ index?: number } | undefined}
     */
    iterationState: {
        index?: number;
    } | undefined;
    _config: JSONPathTransformerContextConfig<T>;
    _templates: import("./index.js").JSONPathTemplateObject<T>[];
    _contextObj: string | number | boolean | object | null;
    _origObj: string | number | boolean | object | null;
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
    /** @type {Record<string, any> | undefined} */
    _params: Record<string, any> | undefined;
    /**
     * Triggers an error if equal priority templates are found.
     * @returns {void}
     */
    _triggerEqualPriorityError(): void;
    /**
     * Gets the joining transformer from config.
     * @returns {T extends "json" ? import('./JSONJoiningTransformer.js').
     *   default : T extends "string" ? import('./StringJoiningTransformer.js').
     *   default : import('./DOMJoiningTransformer.js').
     *   default} The joining transformer
     */
    _getJoiningTransformer(): T extends "json" ? import("./JSONJoiningTransformer.js").default : T extends "string" ? import("./StringJoiningTransformer.js").default : import("./DOMJoiningTransformer.js").default;
    /**
     * @param {string | Node} item - Item to append to output
     * @returns {this}
     */
    appendOutput(item: string | Node): this;
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
     * @returns {this}
     */
    set(v: any): this;
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
     * @param {string|null|
     *   {mode?: string, select?: string}
     * } [select] - JSONPath selector or options object
     * @param {string} [mode] - Mode to apply
     * @param {SortSpec} [sort] - Sort spec
     * @returns {this}
     */
    applyTemplates(select?: string | null | {
        mode?: string;
        select?: string;
    }, mode?: string, sort?: SortSpec): this;
    /**
     * @param {string|
     *   {name: string, withParam?: any[]}} name - Template name or
     *   options object
     * @param {any[]} [withParams] - Parameters to pass to template
     * @returns {this}
     */
    callTemplate(name: string | {
        name: string;
        withParam?: any[];
    }, withParams?: any[]): this;
    /**
     * Iterate over values selected by JSONPath, optionally sorted.
     *
     * Sort parameter forms are the same as applyTemplates().
     * @param {string} select - JSONPath selector
     * @param {(this: JSONPathTransformerContext<T>,
     *   value: any
     * ) => void} cb - Callback function
     * @param {SortSpec} [sort] - Sort spec
     * @returns {this}
     */
    forEach(select: string, cb: (this: JSONPathTransformerContext<T>, value: any) => void, sort?: SortSpec): this;
    /**
     * @param {string|object} [select] - JSONPath selector
     * @returns {this}
     */
    valueOf(select?: string | object): this;
    /**
     * Analyze a string with a regular expression, equivalent to
     * xsl:analyze-string. Processes matching and non-matching substrings
     * with separate callbacks.
     * @param {string} str - The string to analyze
     * @param {string|RegExp} regex - Regular expression to match against
     * @param {{
     *   matchingSubstring?: (
     *     this: JSONPathTransformerContext<T>,
     *     substring: string,
     *     groups: string[],
     *     regexGroup: (n: number) => string
     *   ) => void,
     *   nonMatchingSubstring?: (
     *     this: JSONPathTransformerContext<T>,
     *     substring: string
     *   ) => void,
     *   flags?: string
     * }} options - Options object
     * @returns {this}
     */
    analyzeString(str: string, regex: string | RegExp, options?: {
        matchingSubstring?: (this: JSONPathTransformerContext<T>, substring: string, groups: string[], regexGroup: (n: number) => string) => void;
        nonMatchingSubstring?: (this: JSONPathTransformerContext<T>, substring: string) => void;
        flags?: string;
    }): this;
    /**
     * Deep copy selection or current context when omitted.
     * @param {string} [select] - JSONPath selector
     * @returns {this}
     */
    copyOf(select?: string): this;
    /**
     * Shallow copy current context; optionally merge property set names.
     * @param {string[]} [propertySets] - Property sets to merge
     * @returns {this}
     */
    copy(propertySets?: string[]): this;
    /**
     * @param {string} name - Variable name
     * @param {string} select - JSONPath selector
     * @returns {this}
     */
    variable(name: string, select: string): this;
    /**
     * @param {unknown} json - JSON data to log
     * @returns {void}
     */
    message(json: unknown): void;
    /**
     * @param {string} str - String value
     * @param {import('./JSONJoiningTransformer.js').
     *   SimpleCallback<T>} [cb] - Optional callback to build nested
     *   string content
     * @returns {this}
     */
    string(str: string, cb?: import("./JSONJoiningTransformer.js").SimpleCallback<T>): this;
    /**
     * Append a number to JSON output with xsl:number-like formatting.
     * @param {NumberValue} num - Number value, "position()" string, or
     *   options object
     * @returns {this}
     */
    number(num: NumberValue): this;
    /**
     * Calculate position in current iteration context.
     * @param {string} [count] - JSONPath expression to match
     * @returns {number}
     */
    calculatePosition(count?: string): number;
    /**
     * Format a number according to format string.
     * @param {number} num - Number to format
     * @param {string} format - Format string (1, a, A, i, I, 01, etc.)
     * @param {string} [groupingSeparator] - Separator for grouping
     * @param {number} [groupingSize] - Size of groups
     * @param {string} [locale]
     * @returns {string}
     */
    _formatNumber(num: number, format: string, groupingSeparator?: string, groupingSize?: number, locale?: string): string;
    /**
     * Convert number to Roman numerals.
     * @param {number} num - Number to convert (1-3999)
     * @returns {string}
     * @private
     */
    private _toRoman;
    /**
     * Convert number to alphabetic sequence.
     * @param {number} num - Number to convert
     * @param {boolean} uppercase - Use uppercase letters
     * @returns {string}
     * @private
     */
    private _toAlphabetic;
    /**
     * Append plain text directly to the output without escaping or JSON
     *   stringification. Mirrors the joining transformer API so templates can
     *   call `this.plainText()`.
     * @param {string} str - Plain text to append
     * @returns {this}
     */
    plainText(str: string): this;
    /**
     * Set a property value on the current object (JSON joiner). Mirrors the
     *   joining transformer API so templates can call `this.propValue()`.
     * @param {string} prop - Property name
     * @param {any} val - Property value
     * @returns {this}
     */
    propValue(prop: string, val: any): this;
    /**
     * Build an object. Mirrors the joining transformer API. All joiners now
     * support both signatures: (obj, cb, usePropertySets, propSets) with seed
     * object or (cb, usePropertySets, propSets) without.
     * @param {...any} args - Arguments to pass to joiner
     * @returns {this}
     */
    object(...args: any[]): this;
    /**
     * Build an array. Mirrors the joining transformer API. All joiners now
     * support both signatures: (arr, cb) with seed array or (cb) without.
     * @param {...any} args - Arguments to pass to joiner
     * @returns {this}
     */
    array(...args: any[]): this;
    /**
     * Set document-level configuration.
     * @param {import('./StringJoiningTransformer.js').OutputConfig} cfg Text
     * @returns {this}
     */
    output(cfg: import("./StringJoiningTransformer.js").OutputConfig): this;
    /**
     * Create an element. Mirrors the joining transformer API so templates can
     * call `this.element()`.
     * @param {string} name - Element name
     * @param {Record<string, string>} [atts] - Attributes object
     * @param {any[]} [children] - Child nodes
     * @param {import('./JSONJoiningTransformer.js').
     *   SimpleCallback<T>} [cb] - Callback function
     * @returns {this}
     */
    element(name: string, atts?: Record<string, string>, children?: any[], cb?: import("./JSONJoiningTransformer.js").SimpleCallback<T>): this;
    /**
     * Add an attribute to the most recently opened element. Mirrors the joining
     * transformer API so templates can call `this.attribute()`.
     * @param {string} name - Attribute name
     * @param {string|Record<string, unknown>} val - Attribute value
     * @returns {this}
     */
    attribute(name: string, val: string | Record<string, unknown>): this;
    /**
     * Append text content. Mirrors the joining transformer API so templates can
     * call `this.text()`.
     * @param {string} txt - Text content
     * @returns {this}
     */
    text(txt: string): this;
    /**
     * Add a comment to the most recently opened element. Mirrors the joining
     * transformer API so templates can call `this.comment()`.
     * @param {string} text - Comment text
     * @returns {this}
     */
    comment(text: string): this;
    /**
     * Add a processing instruction to the most recently opened element.
     *   Mirrors the joining transformer API so templates can call
     *   `this.processingInstruction()`.
     * @param {string} target - Processing instruction target
     * @param {string} data - Processing instruction data
     * @returns {this}
     */
    processingInstruction(target: string, data: string): this;
    /**
     * @param {string} name - Property set name
     * @param {Record<string, unknown>} propertySetObj - Property set object
     * @param {any[]} [usePropertySets] - Property sets to use
     * @returns {this}
     */
    propertySet(name: string, propertySetObj: Record<string, unknown>, usePropertySets?: any[]): this;
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
     * @returns {this}
     */
    key(name: string, match: string, use: string): this;
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
     * @param {(this: JSONPathTransformerContext<T>)
     *   => void} cb - Callback to invoke if condition is met
     * @returns {this}
     */
    if(select: string, cb: (this: JSONPathTransformerContext<T>) => void): this;
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
     * @param {(this: JSONPathTransformerContext<T>)
     *   => void} whenCb Callback when condition passes
     * @param {(this: JSONPathTransformerContext<T>)
     *   => void} [otherwiseCb] Callback when condition fails
     * @returns {this}
     */
    choose(select: string, whenCb: (this: JSONPathTransformerContext<T>) => void, otherwiseCb?: (this: JSONPathTransformerContext<T>) => void): this;
}
//# sourceMappingURL=JSONPathTransformerContext.d.ts.map