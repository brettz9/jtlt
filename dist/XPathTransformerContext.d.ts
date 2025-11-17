export default XPathTransformerContext;
export type XPathTransformerContextConfig = {
    /**
     * - XML/DOM root to transform
     */
    data?: unknown;
    /**
     * - 1, 2, 3.1 (default 1)
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
 * @property {number} [xpathVersion] - 1, 2, 3.1 (default 1)
 * @property {import('./index.js').
 *   JoiningTransformer} joiningTransformer Joiner
 * @property {boolean} [errorOnEqualPriority]
 * @property {(path: string) => number} [specificityPriorityResolver]
 */
/**
 * Execution context for XPath-driven template application.
 *
 * Similar to JSONPathTransformerContext but uses XPath expressions on a
 * DOM/XML-like tree. Supports XPath 1.0 (default), 2.0 when
 * `xpathVersion: 2`, or 3.1 when `xpathVersion: 3.1`.
 *
 * Expected config:
 * - data: A Document, Element, or XML-like root node.
 * - joiningTransformer: joiner with append(), string(), object(), array(), etc.
 * - xpathVersion: 1|2|3.1 (default 1)
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
     * @param {import('./index.js').
     *   XPathTemplateObject<any>[]} templates - Template objects
     */
    constructor(config: XPathTransformerContextConfig, templates: import("./index.js").XPathTemplateObject<any>[]);
    _config: XPathTransformerContextConfig;
    _templates: import("./index.js").XPathTemplateObject<any>[];
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
    /**
     * @type {Record<string,
     *   import('./JSONPathTransformerContext.js').DecimalFormatSymbols>}
     */
    decimalFormats: Record<string, import("./JSONPathTransformerContext.js").DecimalFormatSymbols>;
    /** @type {boolean|undefined} */
    _initialized: boolean | undefined;
    /** @type {string|undefined} */
    _currPath: string | undefined;
    /** @type {Record<string, any> | undefined} */
    _params: Record<string, any> | undefined;
    /** @type {string[]} */
    _preserveSpaceElements: string[];
    /** @type {string[]} */
    _stripSpaceElements: string[];
    /** @returns {import('./index.js').JoiningTransformer} */
    _getJoiningTransformer(): import("./index.js").JoiningTransformer;
    /**
     * Check if whitespace should be stripped for a given element.
     * @param {Node} node - The node to check
     * @returns {boolean}
     */
    _shouldStripSpace(node: Node): boolean;
    /**
     * Clone the DOM and strip whitespace-only text nodes from elements
     * marked for stripping.
     * @param {Node} node - The node to clone
     * @returns {Node} The cloned node with whitespace stripped
     */
    _cloneAndStripWhitespace(node: Node): Node;
    /**
     * Apply whitespace stripping to the context node based on strip-space
     * declarations. This clones the DOM and updates the context.
     * @returns {this}
     */
    applyWhitespaceStripping(): this;
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
     * Iterate over nodes selected by XPath.
     * @param {string} select - XPath expression
     * @param {(this: XPathTransformerContext,
     *   node: Node
     * )=>void} cb - Callback invoked per node
     * @returns {XPathTransformerContext}
     */
    forEach(select: string, cb: (this: XPathTransformerContext, node: Node) => void): XPathTransformerContext;
    /**
     * Groups items and executes callback for each group.
     * Equivalent to XSLT's xsl:for-each-group.
     * @param {string} select - XPath selector for items to group
     * @param {object} options - Grouping options
     * @param {string} [options.groupBy] - XPath expression to group by value
     * @param {string} [options.groupAdjacent] - Groups adjacent items with
     *   same value
     * @param {string} [options.groupStartingWith] - Starts new group when
     *   expression matches
     * @param {string} [options.groupEndingWith] - Ends group when expression
     *   matches
     * @param {(
     *   this: XPathTransformerContext, key: any, items: Node[], ctx: any
     * ) => void} cb - Callback receives (groupingKey, groupItems, context)
     * @returns {this}
     */
    forEachGroup(select: string, options: {
        groupBy?: string | undefined;
        groupAdjacent?: string | undefined;
        groupStartingWith?: string | undefined;
        groupEndingWith?: string | undefined;
    }, cb: (this: XPathTransformerContext, key: any, items: Node[], ctx: any) => void): this;
    /**
     * Returns the current group (for use within forEachGroup callback).
     * @returns {Node[]|undefined}
     */
    currentGroup(): Node[] | undefined;
    /**
     * Returns the current grouping key (for use within forEachGroup callback).
     * @returns {any}
     */
    currentGroupingKey(): any;
    /**
     * Append the value from an XPath expression or the context node text.
     * @param {string|object} [select]
     * @returns {XPathTransformerContext}
     */
    valueOf(select?: string | object): XPathTransformerContext;
    /**
     * Deep copy selection or current context when omitted.
     * For DOM nodes uses cloneNode(true); for scalars copies the value.
     * @param {string} [select] XPath expression selecting nodes (optional)
     * @returns {XPathTransformerContext}
     */
    copyOf(select?: string): XPathTransformerContext;
    /**
     * Shallow copy current context node (cloneNode(false)); scalars copied
     * directly. Provided for parity with JSONPath copy().
     * @param {string[]} [_propertySets] Ignored in XPath variant (parity only)
     * @returns {XPathTransformerContext}
     */
    copy(_propertySets?: string[]): XPathTransformerContext;
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
     * Append number with xsl:number-like formatting.
     * @param {number|string|{
     *   value?: number|string,
     *   count?: string,
     *   level?: 'single'|'multiple'|'any',
     *   from?: string,
     *   format?: string,
     *   decimalFormat?: string,
     *   groupingSeparator?: string,
     *   groupingSize?: number
     * }} num - Number value, "position()" string, or options object
     * @returns {XPathTransformerContext}
     */
    number(num: number | string | {
        value?: number | string;
        count?: string;
        level?: "single" | "multiple" | "any";
        from?: string;
        format?: string;
        decimalFormat?: string;
        groupingSeparator?: string;
        groupingSize?: number;
    }): XPathTransformerContext;
    /**
     * Calculate position of current node.
     * @param {string} [count] - XPath pattern to match
     * @param {string} [from] - XPath pattern for ancestor
     * @returns {number}
     * @private
     */
    private _calculatePosition;
    /**
     * Calculate position counting all ancestors (level=any).
     * @param {string} [count] - XPath pattern to match
     * @param {string} [from] - XPath pattern for ancestor
     * @returns {number}
     * @private
     */
    private _calculatePositionAny;
    /**
     * Format a number according to format string.
     * @param {number} num - Number to format
     * @param {string} format - Format string (1, a, A, i, I, 01, etc.)
     * @param {string} [groupingSeparator] - Separator for grouping (e.g., ',')
     * @param {number} [groupingSize] - Size of groups (e.g., 3 for 1,000)
     * @param {string} [decimalFormatName] - Named decimal format to use
     * @param {string} [locale]
     * @returns {string}
     * @private
     */
    private _formatNumber;
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
     * Alias for propValue(). Append a key-value pair to the current map/object.
     * @param {string} prop Property name
     * @param {any} val Value
     * @returns {XPathTransformerContext}
     */
    mapEntry(prop: string, val: any): XPathTransformerContext;
    /**
     * Declare elements for which whitespace-only text nodes should be preserved.
     * Equivalent to xsl:preserve-space.
     * @param {string|string[]} elements - Element name(s) or patterns
     * @returns {XPathTransformerContext}
     */
    preserveSpace(elements: string | string[]): XPathTransformerContext;
    /**
     * Declare elements for which whitespace-only text nodes should be stripped.
     * Equivalent to xsl:strip-space.
     * This automatically clones the DOM and removes whitespace-only text nodes.
     * @param {string|string[]} elements - Element name(s) or patterns
     * @returns {XPathTransformerContext}
     */
    stripSpace(elements: string | string[]): XPathTransformerContext;
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
     * Alias for object(). Append an object/map.
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
    map(objOrCb: Record<string, unknown> | ((this: XPathTransformerContext) => void), cbOrUsePropertySets?: ((this: XPathTransformerContext) => void) | any[], usePropertySetsOrPropSets?: any[] | Record<string, unknown>, propSets?: Record<string, unknown>): XPathTransformerContext;
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
     * Append element.
     * @param {string} name Tag name
     * @param {Record<string, string>|any[]|
     *   ((this: XPathTransformerContext)=>void)} [atts] Attributes,
     *   children, or callback
     * @param {any[]|
     *   ((this: XPathTransformerContext)=>void)} [children]
     *   Children or callback
     * @param {(this: XPathTransformerContext)=>void} [cb] Callback
     * @param {string[]} [useAttributeSets] - Attribute set names to apply
     * @returns {XPathTransformerContext}
     */
    element(name: string, atts?: Record<string, string> | any[] | ((this: XPathTransformerContext) => void), children?: any[] | ((this: XPathTransformerContext) => void), cb?: (this: XPathTransformerContext) => void, useAttributeSets?: string[]): XPathTransformerContext;
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
     * @param {string|import('./JSONPathTransformerContext.js').
     *   DecimalFormatSymbols} nameOrSymbols - Format name or symbols object
     *   if defining default
     * @param {import('./JSONPathTransformerContext.js').
     *   DecimalFormatSymbols} [symbols] - Format symbols
     * @returns {this}
     */
    decimalFormat(nameOrSymbols: string | import("./JSONPathTransformerContext.js").DecimalFormatSymbols, symbols?: import("./JSONPathTransformerContext.js").DecimalFormatSymbols): this;
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
    /**
     * Assert that a test condition is true, throwing an error if it fails.
     * Equivalent to xsl:assert. Evaluates an XPath expression using the
     * same truthiness rules as if() and choose().
     * @param {string} test - XPath expression to test
     * @param {string} [message] - Optional error message to include
     * @returns {XPathTransformerContext}
     * @throws {Error} When the test expression evaluates to false
     */
    assert(test: string, message?: string): XPathTransformerContext;
    /**
     * Analyze a string with a regular expression, equivalent to
     * xsl:analyze-string. Processes matching and non-matching substrings
     * with separate callbacks.
     * @param {string} str - The string to analyze
     * @param {string|RegExp} regex - Regular expression to match against
     * @param {{
     *   matchingSubstring?: (
     *     this: XPathTransformerContext,
     *     substring: string,
     *     groups: string[],
     *     regexGroup: (n: number) => string
     *   ) => void,
     *   nonMatchingSubstring?: (
     *     this: XPathTransformerContext,
     *     substring: string
     *   ) => void,
     *   flags?: string
     * }} options - Options object
     * @returns {XPathTransformerContext}
     */
    analyzeString(str: string, regex: string | RegExp, options?: {
        matchingSubstring?: (this: XPathTransformerContext, substring: string, groups: string[], regexGroup: (n: number) => string) => void;
        nonMatchingSubstring?: (this: XPathTransformerContext, substring: string) => void;
        flags?: string;
    }): XPathTransformerContext;
}
//# sourceMappingURL=XPathTransformerContext.d.ts.map