export type DecimalFormatSymbols = {
    /**
     * - Character for decimal point
     */
    decimalSeparator?: string;
    /**
     * - Character for thousands
     */
    groupingSeparator?: string;
    /**
     * - Character for percent
     */
    percent?: string;
    /**
     * - Character for per-mille
     */
    perMille?: string;
    /**
     * - Character for zero
     */
    zeroDigit?: string;
    /**
     * - Character for digit placeholder
     */
    digit?: string;
    /**
     * - Character separating
     * positive/negative patterns
     */
    patternSeparator?: string;
    /**
     * - Character for minus sign
     */
    minusSign?: string;
    /**
     * - String for infinity
     */
    infinity?: string;
    /**
     * - String for NaN
     */
    NaN?: string;
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
export type SortObject<V = unknown> = {
    select?: string;
    order?: 'ascending' | 'descending';
    type?: 'text' | 'number';
    locale?: string;
    localeOptions?: unknown;
};
export type SortComparator<V = unknown> = (a: V, b: V, ctx: JSONPathTransformerContext) => number;
export type SortSpec<V = unknown> = string | SortObject | SortComparator | Array<string | SortObject> | null;
export type JoiningTransformerMap = {
    json: import('./JSONJoiningTransformer.js').default;
    string: import('./StringJoiningTransformer.js').default;
    dom: import('./DOMJoiningTransformer.js').default;
};
export type AppendItemMap = {
    json: unknown;
    string: string | unknown;
    dom: string | Node;
};
export type ElementAttsMap = {
    json: import('./JSONJoiningTransformer.js').ElementAttributes;
    string: import('./StringJoiningTransformer.js').ElementAttributes;
    dom: Record<string, string>;
};
export type JSONPathTransformerContextConfig<T extends "json" | "string" | "dom" = "json"> = {
    /**
     * - Data to transform
     */
    data: null | boolean | number | string | object;
    /**
     * - Parent object
     */
    parent?: object;
    /**
     * - Parent property name
     */
    parentProperty?: string;
    /**
     * - Whether to error on
     * equal priority
     */
    errorOnEqualPriority?: boolean;
    /**
     * - Output type
     */
    outputType?: T;
    /**
     * - Joining transformer
     */
    joiningTransformer: JoiningTransformerMap[T];
    /**
     * - Whether to prevent eval in
     * JSONPath
     */
    preventEval?: boolean;
    /**
     * - When true, throw if a template returns a
     * Promise instead of awaiting it (disables `indexedDB()`)
     */
    sync?: boolean;
    /**
     * Priority resolver function
     */
    specificityPriorityResolver?: (path: string) => number;
    templates?: import('./index.js').JSONPathTemplateObject<T>[] | import('./index.js').JSONPathTemplateArray<T>[];
    /**
     * Config-wide
     * default for the jamilih validation strictness `compileJSONTemplate`
     * applies to a declarative (Array) `template`, used when an entry has no
     * `format` of its own
     */
    defaultTemplateFormat?: 'json' | 'javascript';
    /**
     * Runtime parameter values
     * (like an XSLT processor's stylesheet parameters); a `param()` with a
     * matching name uses this value instead of its declared default
     */
    params?: Record<string, unknown>;
    /**
     * Extra methods/values
     * merged onto this context so templates can call `this.myHelper()`
     */
    extensions?: Record<string, unknown> & ThisType<import('./JSONPathTransformerContext.js').default<T> & import('./context-extensions.js').ContextExtensions>;
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
 * @template [V=unknown]
 * @typedef {(a: V, b: V,
 *   ctx: JSONPathTransformerContext
 * ) => number} SortComparator
 * @typedef {string | SortObject | SortComparator |
 *   Array<string|SortObject> | null} SortSpec
 */
/**
 * @typedef {object} JoiningTransformerMap
 * @property {import('./JSONJoiningTransformer.js').default} json
 * @property {import('./StringJoiningTransformer.js').default} string
 * @property {import('./DOMJoiningTransformer.js').default} dom
 */
/**
 * @typedef {object} AppendItemMap
 * @property {unknown} json
 * @property {string|unknown} string
 * @property {string|Node} dom
 */
/**
 * @typedef {object} ElementAttsMap
 * @property {import('./JSONJoiningTransformer.js').ElementAttributes} json
 * @property {import('./StringJoiningTransformer.js').ElementAttributes} string
 * @property {Record<string, string>} dom
 */
/**
 * @template {"json"|"string"|"dom"} [T="json"]
 * @typedef {object} JSONPathTransformerContextConfig
 * @property {null|boolean|number|string|object} data - Data to transform
 * @property {object} [parent] - Parent object
 * @property {string} [parentProperty] - Parent property name
 * @property {boolean} [errorOnEqualPriority] - Whether to error on
 *   equal priority
 * @property {T} [outputType] - Output type
 * @property {JoiningTransformerMap[T]} joiningTransformer - Joining transformer
 * @property {boolean} [preventEval] - Whether to prevent eval in
 *   JSONPath
 * @property {boolean} [sync] - When true, throw if a template returns a
 *   Promise instead of awaiting it (disables `indexedDB()`)
 * @property {(path: string) => number} [specificityPriorityResolver]
 *   Priority resolver function
 * @property {import('./index.js').JSONPathTemplateObject<T>[]|
 *   import('./index.js').JSONPathTemplateArray<T>[]} [templates]
 * @property {'json'|'javascript'} [defaultTemplateFormat] Config-wide
 *   default for the jamilih validation strictness `compileJSONTemplate`
 *   applies to a declarative (Array) `template`, used when an entry has no
 *   `format` of its own
 * @property {Record<string, unknown>} [params] Runtime parameter values
 *   (like an XSLT processor's stylesheet parameters); a `param()` with a
 *   matching name uses this value instead of its declared default
 * @property {Record<string, unknown> & ThisType<
 *   import('./JSONPathTransformerContext.js').default<T> &
 *   import('./context-extensions.js').ContextExtensions
 * >} [extensions] Extra methods/values
 *   merged onto this context so templates can call `this.myHelper()`
 */
/**
 * Execution context for JSONPath-driven template application.
 *
 * Holds the current node, parent, path, variables, and property sets while
 * running templates. Exposes helper methods that mirror the underlying
 * joining transformer (e.g., string(), object(), array()) so templates can
 * emit results without referencing the joiner directly.
 * @template {"json"|"string"|"dom"} [T="json"]
 * @template [V=unknown]
 */
declare class JSONPathTransformerContext<T extends "json" | "string" | "dom" = "json", V = unknown> {
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
    /**
     * Parameter values supplied at runtime via `config.params`, mirroring the
     * stylesheet parameters an XSLT processor is handed. A `param()` whose
     * name appears here takes this value instead of its declared default.
     * @type {Record<string, unknown>}
     */
    _runtimeParams: Record<string, unknown>;
    /**
     * Parameters staged by `withParam()` and consumed (then cleared) by the
     * next `callTemplate()` or `applyTemplates()` call.
     * @type {{name: string, select?: string, value?: unknown}[] | undefined}
     */
    _pendingParams: {
        name: string;
        select?: string;
        value?: unknown;
    }[] | undefined;
    /** @type {string[]} */
    _preserveSpaceElements: string[];
    /** @type {string[]} */
    _stripSpaceElements: string[];
    /**
     * Holds the current iteration state (for position calculations).
     * @type {{ index?: number } | undefined}
     */
    iterationState: {
        index?: number;
    } | undefined;
    /**
     * @param {JSONPathTransformerContextConfig<T>} config
     * @param {import('./index.js').JSONPathTemplateObject<T>[]} templates - Array
     *   of template objects
     */
    constructor(config: JSONPathTransformerContextConfig<T>, templates: import('./index.js').JSONPathTemplateObject<T>[]);
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
     * @returns {JoiningTransformerMap[T]} The joining transformer
     */
    _getJoiningTransformer(): JoiningTransformerMap[T];
    /**
     * @param {AppendItemMap[T]} item - Item to append to output
     * @returns {this}
     */
    appendOutput(item: AppendItemMap[T]): this;
    /**
     * Gets the current output.
     * @returns {unknown} The output from the joining transformer
     */
    getOutput(): unknown;
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
     * @param {unknown} v - Value to set
     * @returns {this}
     */
    set(v: unknown): this;
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
     * @param {SortSpec<V>} [sort] - Sort spec
     * @returns {this}
     */
    applyTemplates(select?: string | null | {
        mode?: string;
        select?: string;
    }, mode?: string, sort?: SortSpec<V>): this;
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
     *   value: unknown
     * ) => void} cb - Callback function; may be async, in which case
     *   `forEach()` itself returns a `Promise<this>` instead of `this` from
     *   the iteration where that first happens onward. (Typed as plain
     *   `void`, not `void|Promise<void>` — see the note on `SimpleCallback`
     *   in JSONJoiningTransformer.js.)
     * @param {SortSpec<V>} [sort] - Sort spec
     * @returns {this|Promise<this>}
     */
    forEach(select: string, cb: (this: JSONPathTransformerContext<T>, value: unknown) => void, sort?: SortSpec<V>): this | Promise<this>;
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
     * @param {SortSpec<V>} [options.sort] - Sort specification (same as forEach)
     * @param {(
     *   this: JSONPathTransformerContext<T>,
     *   key: unknown,
     *   items: unknown[],
     *   ctx: JSONPathTransformerContext<T>
     * ) => void} cb - Callback receives (groupingKey, groupItems, context)
     * @returns {this}
     */
    forEachGroup(select: string, options: {
        groupBy?: string;
        groupAdjacent?: string;
        groupStartingWith?: string;
        groupEndingWith?: string;
        sort?: SortSpec<V>;
    }, cb: (this: JSONPathTransformerContext<T>, key: unknown, items: unknown[], ctx: JSONPathTransformerContext<T>) => void): this;
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
     * @returns {unknown[]|undefined}
     */
    currentGroup(): unknown[] | undefined;
    /**
     * Returns the current grouping key (for use within forEachGroup callback).
     * @returns {unknown}
     */
    currentGroupingKey(): unknown;
    /**
     * Directly query IndexedDB from within a template, e.g.
     * `await this.indexedDB('myDB', 'myStore', {index: 'byAge'})`.
     *
     * Since IndexedDB access is asynchronous, this is unavailable when JTLT is
     * configured with `sync: true`.
     * @param {string} dbName - Database name
     * @param {string} storeName - Object store name
     * @param {import('./indexedDB.js').QueryOptions} [options] - Query options
     * @returns {Promise<unknown[]>} The matching records
     */
    indexedDB(dbName: string, storeName: string, options?: import('./indexedDB.js').QueryOptions): Promise<unknown[]>;
    /**
     * Await a parsed `indexedDB(...)` expression and append its (stringified)
     * value to the output. Used by {@link valueOf}. Callers reject `config.sync`.
     * @param {import('./indexedDB.js').ParsedIndexedDBExpression} parsed
     * @param {any} results - The joining transformer
     * @returns {Promise<this>}
     */
    _appendIndexedDBValue(parsed: import('./indexedDB.js').ParsedIndexedDBExpression, results: any): Promise<this>;
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
     * Bind a variable, equivalent to `xsl:variable`. Accepts the same default/
     * value forms as `param()`/`withParam()`: a bare string (a JSONPath
     * expression), an explicit `{select}`, or a literal `{value}` — the last
     * for binding an already-computed value (e.g. `this.indexedDB(...)`'s
     * result) directly, with no selector round-trip.
     * @param {string} name - Variable name
     * @param {string|{select: string}|{value: unknown}} select - A JSONPath
     *   expression string, an explicit `{select}`, or a literal `{value}`.
     * @returns {this}
     */
    variable(name: string, select: string | {
        select: string;
    } | {
        value: unknown;
    }): this;
    /**
     * Normalize a `param()`/`withParam()` default/value argument to `{select}`
     * or `{value}`: a bare string is a JSONPath expression, `{value}` is a
     * literal, and `{select}` (or an omitted argument) is an expression.
     * @param {string|{select?: string, value?: unknown}|undefined} arg
     * @returns {{select?: string, value?: unknown}}
     * @private
     */
    private _paramSpec;
    /**
     * Look up a parameter by name across the active with-param scope, any
     * `variable()`-set value, and the runtime `config.params`, so a bare
     * `$name` reference resolves the same way from `if()`/`choose()`/
     * comparisons/`valueOf()` regardless of which of those set it. Runtime
     * params act like XSLT global parameters (visible to every template and
     * expression); `vars` is more local, matching `xsl:variable` scoping.
     * @param {string} name
     * @returns {{has: boolean, value: any}}
     * @private
     */
    private _lookupParam;
    /**
     * Resolve a `{select}` or `{value}` parameter spec to its value in the
     * current context.
     * @param {{select?: string, value?: unknown}} spec
     * @returns {any}
     * @private
     */
    private _resolveParam;
    /**
     * Resolve staged `withParam()` entries into `target` (in the calling
     * context) and clear the staged set. Shared by `callTemplate()` and
     * `applyTemplates()`.
     * @param {Record<string, unknown>} target
     * @returns {void}
     * @private
     */
    private _drainPendingParams;
    /**
     * Declare a template parameter, equivalent to `xsl:param`. Binds `name` to
     * the given default, unless a value was supplied by the caller (via
     * `this.withParam()` or `callTemplate`'s `withParam`) or at runtime (via
     * `config.params`), in which case the supplied value wins.
     * @param {string} name - Parameter name
     * @param {string|{select: string}|{value: unknown}} [select] - The default:
     *   a JSONPath expression string, an explicit `{select}`, or a literal
     *   `{value}`. Omitted means a default of `undefined`.
     * @returns {this}
     */
    param(name: string, select?: string | {
        select: string;
    } | {
        value: unknown;
    }): this;
    /**
     * Stage a parameter for the next `callTemplate()` or `applyTemplates()`
     * call, equivalent to `xsl:with-param`. The staged set is consumed and
     * cleared by that call; entries are evaluated in the current (calling)
     * context.
     * @param {string} name - Parameter name
     * @param {string|{select: string}|{value: unknown}} [select] - A JSONPath
     *   expression string, an explicit `{select}`, or a literal `{value}`.
     * @returns {this}
     */
    withParam(name: string, select?: string | {
        select: string;
    } | {
        value: unknown;
    }): this;
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
    string(str: string, cb?: import('./JSONJoiningTransformer.js').SimpleCallback<T>): this;
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
    output(cfg: import('./StringJoiningTransformer.js').OutputConfig): this;
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
    characterMap(name: string, outputCharacters: import('./AbstractJoiningTransformer.js').OutputCharacters): this;
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
     * @param {unknown[]} args - Positional arguments
     * @returns {unknown} Function return value
     */
    invokeFunctionByArity(name: string, args?: unknown[]): unknown;
    /**
     * Create an element. Mirrors the joining transformer API so templates can
     * call `this.element()`.
     * @param {string|Node} name - Element name or Node (if DOM)
     * @param {ElementAttsMap[T]|any[]|
     *   ((this: JSONPathTransformerContext<T>) => void)} [atts] -
     *   Attributes object or children or callback
     * @param {any[]|
     *   ((this: JSONPathTransformerContext<T>) => void)} [children] -
     *   Child nodes or callback
     * @param {(this: JSONPathTransformerContext<T>) => void
     *   } [cb] - Callback function; may be async (e.g. to `await` a
     *   `$indexedDB` fetch), in which case `element()` itself returns a
     *   `Promise<this>` instead of `this` — check for `.then` (or `await`)
     *   rather than assuming a synchronous return. (Typed as plain `void`,
     *   not `void|Promise<void>` — see the note on `SimpleCallback` in
     *   JSONJoiningTransformer.js.)
     * @param {string[]} [useAttributeSets] - Attribute set names to apply
     * @returns {this|Promise<this>}
     */
    element(name: string | Node, atts?: ElementAttsMap[T] | any[] | ((this: JSONPathTransformerContext<T>) => void), children?: any[] | ((this: JSONPathTransformerContext<T>) => void), cb?: (this: JSONPathTransformerContext<T>) => void, useAttributeSets?: string[]): this | Promise<this>;
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
     * @param {unknown} value - Value to match
     * @returns {unknown}
     */
    getKey(name: string, value: unknown): unknown;
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
     * A bare `$name` reference (not `$.path`) tests a parameter — one declared
     * with `param()`, supplied via `withParam()`, or provided at runtime as
     * `config.params` — rather than a JSONPath expression.
     *
     * The test may also be a simple binary comparison of a reference against a
     * literal, evaluated without `eval`, e.g. `this.if('$name === "x"')` or
     * `this.if('$.count < 50')`. The left side is a bare `$name` parameter or a
     * plain dotted/indexed `$...` path; the operator is one of `===`, `!==`,
     * `==`, `!=`, `<`, `<=`, `>`, `>=`; the right side is a string, number,
     * boolean, `null`, or `undefined` literal. Anything more complex (filter
     * expressions, function calls) is left to the JSONPath engine.
     *
     * Truthiness rules:
     * - If the selection (with wrap) yields an array with length > 0, the
     *   condition passes.
     * - Otherwise the (non-wrapped) scalar value is coerced with Boolean();
     *   e.g., 0, '', null, undefined => false; others => true.
     *
     * @param {string} select - JSONPath selector expression
     * @param {(this: JSONPathTransformerContext<T>)
     *   => void} cb - Callback to invoke if condition is met; may be async,
     *   in which case `if()` itself returns a `Promise<this>` instead of
     *   `this`. (Typed as plain `void`, not `void|Promise<void>` — see the
     *   note on `SimpleCallback` in JSONJoiningTransformer.js.)
     * @returns {this|Promise<this>}
     */
    if(select: string, cb: (this: JSONPathTransformerContext<T>) => void): this | Promise<this>;
    /**
     * Apply `if()`/`choose()`/`assert()` truthiness to an already-resolved
     * value: a non-empty result set (or single non-empty item) is truthy, a
     * scalar is coerced with `Boolean()`.
     * @param {any} val
     * @returns {boolean}
     * @private
     */
    private _isTruthyResult;
    /**
     * Internal helper: determine if `select` passes the truthiness test. A
     * bare `$name` reference resolves against the parameter scope (local
     * with-param then runtime `config.params`); anything else is evaluated as
     * a JSONPath expression.
     * @param {string} select
     * @returns {boolean}
     */
    _passesIf(select: string): boolean;
    /**
     * Parse a simple `<ref> <op> <literal>` comparison test (no `eval`), such
     * as `$name === "x"` or `$.a.b < 50`. The left side must be a bare `$name`
     * parameter reference or a plain dotted/indexed `$...` path — no filter
     * expressions or function calls; the right side a string, number, boolean,
     * `null`, or `undefined` literal. Returns `null` when the string is not
     * such a comparison, so richer JSONPath expressions fall through untouched.
     * @param {string} str
     * @returns {{left: string, op: string, right: unknown}|null}
     * @private
     */
    private _parseComparison;
    /**
     * Parse a JSON-ish scalar literal: a double- or single-quoted string, a
     * number, or `true` / `false` / `null` / `undefined`. Returns `null` when
     * `str` is none of these.
     * @param {string} str
     * @returns {{value: unknown}|null}
     * @private
     */
    private _parseLiteral;
    /**
     * Resolve the left side of a simple comparison: a bare `$name` parameter
     * reference (local, with-param, then runtime `config.params`), otherwise a
     * plain `$...` path evaluated (unwrapped) in the current context.
     * @param {string} ref
     * @returns {unknown}
     * @private
     */
    private _resolveComparand;
    /**
     * Apply a comparison operator to two already-resolved values.
     * @param {any} a - Left operand
     * @param {string} op - One of `===`, `!==`, `==`, `!=`, `<`, `<=`, `>`, `>=`
     * @param {any} b - Right operand
     * @returns {boolean}
     * @private
     */
    private _compareValues;
    /**
     * Like `if()`, but also supports an optional fallback callback executed
     * when the test does not pass (similar to xsl:choose/xsl:otherwise).
     * @param {string} select JSONPath selector
     * @param {(this: JSONPathTransformerContext<T>)
     *   => void} whenCb Callback when condition passes; may be async, in
     *   which case `choose()` itself returns a `Promise<this>` instead of
     *   `this`. (Typed as plain `void`, not `void|Promise<void>` — see the
     *   note on `SimpleCallback` in JSONJoiningTransformer.js.)
     * @param {(this: JSONPathTransformerContext<T>)
     *   => void} [otherwiseCb] Callback when condition fails; may likewise
     *   be async.
     * @returns {this|Promise<this>}
     */
    choose(select: string, whenCb: (this: JSONPathTransformerContext<T>) => void, otherwiseCb?: (this: JSONPathTransformerContext<T>) => void): this | Promise<this>;
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
export default JSONPathTransformerContext;
//# sourceMappingURL=JSONPathTransformerContext.d.ts.map