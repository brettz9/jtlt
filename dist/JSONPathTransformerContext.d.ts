export default JSONPathTransformerContext;
/**
 * Decimal format symbols for number formatting.
 */
export type DecimalFormatSymbols = {
    /**
     * - Character for decimal point
     */
    decimalSeparator?: string | undefined;
    /**
     * - Character for thousands
     */
    groupingSeparator?: string | undefined;
    /**
     * - Character for percent
     */
    percent?: string | undefined;
    /**
     * - Character for per-mille
     */
    perMille?: string | undefined;
    /**
     * - Character for zero
     */
    zeroDigit?: string | undefined;
    /**
     * - Character for digit placeholder
     */
    digit?: string | undefined;
    /**
     * - Character separating
     * positive/negative patterns
     */
    patternSeparator?: string | undefined;
    /**
     * - Character for minus sign
     */
    minusSign?: string | undefined;
    /**
     * - String for infinity
     */
    infinity?: string | undefined;
    /**
     * - String for NaN
     */
    NaN?: string | undefined;
};
export type NumberValue = number | string | {
    value?: number | string;
    count?: string;
    format?: string;
    decimalFormat?: string;
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
    templates?: import("./index.js").JSONPathTemplateObject<T>[] | undefined;
};
/**
 * Decimal format symbols for number formatting.
 * @typedef {object} DecimalFormatSymbols
 * @property {string} [decimalSeparator='.'] - Character for decimal point
 * @property {string} [groupingSeparator=','] - Character for thousands
 * @property {string} [percent='%'] - Character for percent
 * @property {string} [perMille='‰'] - Character for per-mille
 * @property {string} [zeroDigit='0'] - Character for zero
 * @property {string} [digit='#'] - Character for digit placeholder
 * @property {string} [patternSeparator=';'] - Character separating
 *   positive/negative patterns
 * @property {string} [minusSign='-'] - Character for minus sign
 * @property {string} [infinity='Infinity'] - String for infinity
 * @property {string} [NaN='NaN'] - String for NaN
 */
/**
 * @typedef {number|string|{
 *   value?: number|string,
 *   count?: string,
 *   format?: string,
 *   decimalFormat?: string,
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
 * @property {import('./index.js').JSONPathTemplateObject<T>[]} [templates]
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
    /** @type {Record<string, DecimalFormatSymbols>} */
    decimalFormats: Record<string, DecimalFormatSymbols>;
    /** @type {boolean | undefined} */
    _initialized: boolean | undefined;
    /** @type {string | undefined} */
    _currPath: string | undefined;
    /** @type {Record<string, any> | undefined} */
    _params: Record<string, any> | undefined;
    /** @type {string[]} */
    _preserveSpaceElements: string[];
    /** @type {string[]} */
    _stripSpaceElements: string[];
    /**
     * Triggers an error if equal priority templates are found.
     * @returns {void}
     */
    _triggerEqualPriorityError(): void;
    /**
     * Check if whitespace should be stripped for a given element name.
     * @param {string} elementName - The element name to check
     * @returns {boolean}
     */
    _shouldStripSpace(elementName: string): boolean;
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
     * Groups items and executes callback for each group.
     * Equivalent to XSLT's xsl:for-each-group.
     * @param {string} select - JSONPath selector for items to group
     * @param {object} options - Grouping options
     * @param {string} [options.groupBy] - JSONPath expression to group by value
     * @param {string} [options.groupAdjacent] - Groups adjacent items with
     *   same value
     * @param {string} [options.groupStartingWith] - Starts new group when
     *   expression matches
     * @param {string} [options.groupEndingWith] - Ends group when expression
     *   matches
     * @param {any} [options.sort] - Sort specification (same as forEach)
     * @param {(
     *   this: JSONPathTransformerContext<T>, key: any, items: any[], ctx: any
     * ) => void} cb - Callback receives (groupingKey, groupItems, context)
     * @returns {this}
     */
    forEachGroup(select: string, options: {
        groupBy?: string | undefined;
        groupAdjacent?: string | undefined;
        groupStartingWith?: string | undefined;
        groupEndingWith?: string | undefined;
        sort?: any;
    }, cb: (this: JSONPathTransformerContext<T>, key: any, items: any[], ctx: any) => void): this;
    /**
     * Helper to build comparator for sorting.
     * @param {any} sortSpec
     * @param {(expr: string, ctxVal: any) => any} evalFn
     * @returns {((a: {value: any}, b: {value: any}) => number)|null}
     * @private
     */
    private _buildComparator;
    /**
     * Returns the current group (for use within forEachGroup callback).
     * @returns {any[]|undefined}
     */
    currentGroup(): any[] | undefined;
    /**
     * Returns the current grouping key (for use within forEachGroup callback).
     * @returns {any}
     */
    currentGroupingKey(): any;
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
     * @param {string} [decimalFormatName] - Name of decimal format to use
     * @param {string} [locale] - Locale for formatting
     * @returns {string}
     */
    _formatNumber(num: number, format: string, groupingSeparator?: string, groupingSize?: number, decimalFormatName?: string, locale?: string): string;
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
     * Alias for propValue(). Set a key-value pair in the current map/object.
     * @param {string} prop - Property name
     * @param {any} val - Property value
     * @returns {this}
     */
    mapEntry(prop: string, val: any): this;
    /**
     * Declare elements for which whitespace-only text nodes should be preserved.
     * Equivalent to xsl:preserve-space.
     * @param {string|string[]} elements - Element name(s) or patterns
     * @returns {this}
     */
    preserveSpace(elements: string | string[]): this;
    /**
     * Declare elements for which whitespace-only text nodes should be stripped.
     * Equivalent to xsl:strip-space.
     * @param {string|string[]} elements - Element name(s) or patterns
     * @returns {this}
     */
    stripSpace(elements: string | string[]): this;
    /**
     * Build an object. Mirrors the joining transformer API. All joiners now
     * support both signatures: (obj, cb, usePropertySets, propSets) with seed
     * object or (cb, usePropertySets, propSets) without.
     * @param {...any} args - Arguments to pass to joiner
     * @returns {this}
     */
    object(...args: any[]): this;
    /**
     * Alias for object(). Build an object/map.
     * @param {...any} args - Arguments to pass to joiner
     * @returns {this}
     */
    map(...args: any[]): this;
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
     * Configure mode behavior (similar to xsl:mode).
     * @param {{
     *   onMultipleMatch?: "use-last"|"fail",
     *   warningOnMultipleMatch?: boolean,
     *   onNoMatch?: "shallow-copy"|"deep-copy"|"fail"|"apply-templates"|
     *     "shallow-skip"|"deep-skip"|"text-only-copy",
     *   warningOnNoMatch?: boolean
     * }} cfg - Mode configuration
     * @returns {this}
     */
    mode(cfg: {
        onMultipleMatch?: "use-last" | "fail";
        warningOnMultipleMatch?: boolean;
        onNoMatch?: "shallow-copy" | "deep-copy" | "fail" | "apply-templates" | "shallow-skip" | "deep-skip" | "text-only-copy";
        warningOnNoMatch?: boolean;
    }): this;
    /**
     * @param {string} name
     * @param {import('./AbstractJoiningTransformer.js').
     *   OutputCharacters} outputCharacters
     * @returns {this}
     */
    characterMap(name: string, outputCharacters: import("./AbstractJoiningTransformer.js").OutputCharacters): this;
    /**
     * @param {string} name
     * @param {Record<string, string>} attributes
     * @returns {this}
     */
    attributeSet(name: string, attributes: Record<string, string>): this;
    /**
     * @param {string} stylesheetPrefix
     * @param {string} resultPrefix
     * @returns {this}
     */
    namespaceAlias(stylesheetPrefix: string, resultPrefix: string): this;
    /**
     * Configure stylesheet behavior (similar to xsl:stylesheet).
     * Unlike xsl:stylesheet, this is a directive method and does not contain
     * nested content.
     * @param {{
     *   excludeResultPrefixes?: string[]
     * }} cfg - Stylesheet configuration
     * @returns {this}
     */
    stylesheet(cfg: {
        excludeResultPrefixes?: string[];
    }): this;
    /**
     * Alias for stylesheet() method (XSLT compatibility).
     * @param {{
     *   excludeResultPrefixes?: string[]
     * }} cfg - Stylesheet configuration
     * @returns {this}
     */
    transform(cfg: {
        excludeResultPrefixes?: string[];
    }): this;
    /**
     * Register a stylesheet function (similar to xsl:function).
     * @param {{
     *   name: string,
     *   params?: Array<{name: string, as?: string}>,
     *   as?: string,
     *   body?: (...args: any[]) => any,
     *   sequence?: string
     * }} cfg - Function configuration
     * @returns {this}
     */
    function(cfg: {
        name: string;
        params?: Array<{
            name: string;
            as?: string;
        }>;
        as?: string;
        body?: (...args: any[]) => any;
        sequence?: string;
    }): this;
    /**
     * Invoke a registered stylesheet function with positional arguments.
     * @param {string} name - Function name (with namespace)
     * @param {any[]} args - Positional arguments
     * @returns {any} Function return value
     */
    invokeFunctionByArity(name: string, args?: any[]): any;
    /**
     * Create an element. Mirrors the joining transformer API so templates can
     * call `this.element()`.
     * @param {string} name - Element name
     * @param {Record<string, string>|any[]|
     *   ((this: JSONPathTransformerContext<T>) => void)} [atts] -
     *   Attributes object or children or callback
     * @param {any[]|
     *   ((this: JSONPathTransformerContext<T>) => void)} [children] -
     *   Child nodes or callback
     * @param {(this: JSONPathTransformerContext<T>) => void} [cb] -
     *   Callback function
     * @param {string[]} [useAttributeSets] - Attribute set names to apply
     * @returns {this}
     */
    element(name: string, atts?: Record<string, string> | any[] | ((this: JSONPathTransformerContext<T>) => void), children?: any[] | ((this: JSONPathTransformerContext<T>) => void), cb?: (this: JSONPathTransformerContext<T>) => void, useAttributeSets?: string[]): this;
    /**
     * Adds a prefixed namespace declaration to the most recently opened
     *  element. Mirrors the joining
     * transformer API so templates can call `this.attribute()`.
     * @param {string} prefix - Prefix
     * @param {string} namespaceURI - Namespace
     * @returns {this}
     */
    namespace(prefix: string, namespaceURI: string): this;
    /**
     * Define a decimal format with custom symbols for number formatting.
     * Equivalent to xsl:decimal-format. If no name is provided, defines
     * the default format.
     * @param {string|DecimalFormatSymbols} nameOrSymbols - Format name or
     *   symbols object if defining default
     * @param {DecimalFormatSymbols} [symbols] - Format symbols
     * @returns {this}
     */
    decimalFormat(nameOrSymbols: string | DecimalFormatSymbols, symbols?: DecimalFormatSymbols): this;
    /**
     * Add an attribute to the most recently opened element. Mirrors the joining
     * transformer API so templates can call `this.attribute()`.
     * @param {string} name - Attribute name
     * @param {string|Record<string, unknown>} val - Attribute value
     * @param {boolean} [avoid] - Avoid attribute escaping
     *   (StringJoiningTransformer only)
     * @returns {this}
     */
    attribute(name: string, val: string | Record<string, unknown>, avoid?: boolean): this;
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
    /**
     * Assert that a test condition is true, throwing an error if it fails.
     * Equivalent to xsl:assert. Evaluates a JSONPath expression using the
     * same truthiness rules as if() and choose().
     * @param {string} test - JSONPath expression to test
     * @param {string} [message] - Optional error message to include
     * @returns {this}
     * @throws {Error} When the test expression evaluates to false
     */
    assert(test: string, message?: string): this;
}
//# sourceMappingURL=JSONPathTransformerContext.d.ts.map