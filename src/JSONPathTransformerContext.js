import {JSONPath as jsonpath} from 'jsonpath-plus';
import JSONPathTransformer from './JSONPathTransformer.js';

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
class JSONPathTransformerContext {
  /**
   * Holds the current iteration state (for position calculations).
   * @type {{ index?: number } | undefined}
   */
  iterationState;
  /**
   * @param {JSONPathTransformerContextConfig<T>} config
   * @param {import('./index.js').JSONPathTemplateObject<T>[]} templates - Array
   *   of template objects
   */
  constructor (config, templates) {
    this._config = config;
    this._templates = templates;
    this._contextObj = this._origObj = config.data;
    this._parent = config.parent || this._config;
    this._parentProperty = config.parentProperty || 'data';
    /** @type {Record<string, unknown>} */
    this.vars = {};
    /** @type {Record<string, Record<string, unknown>>} */
    this.propertySets = {};
    /** @type {Record<string, {match: string, use: string}>} */
    this.keys = {};
    /** @type {Record<string, DecimalFormatSymbols>} */
    this.decimalFormats = {};
    /** @type {boolean | undefined} */
    this._initialized = undefined;
    /** @type {string | undefined} */
    this._currPath = undefined;
    /** @type {Record<string, any> | undefined} */
    this._params = undefined;
  }

  /**
   * Triggers an error if equal priority templates are found.
   * @returns {void}
   */
  _triggerEqualPriorityError () {
    if (this._config.errorOnEqualPriority) {
      throw new Error(
        'You have configured JSONPathTransformer to throw errors on ' +
        'finding templates of equal priority and these have been found.'
      );
    }
  }

  /**
   * Gets the joining transformer from config.
   * @returns {T extends "json" ? import('./JSONJoiningTransformer.js').
   *   default : T extends "string" ? import('./StringJoiningTransformer.js').
   *   default : import('./DOMJoiningTransformer.js').
   *   default} The joining transformer
   */
  _getJoiningTransformer () {
    return this._config.joiningTransformer;
  }

  /**
   * @param {string | Node} item - Item to append to output
   * @returns {this}
   */
  appendOutput (item) {
    this._getJoiningTransformer().append(item);
    return this;
  }

  /**
   * Gets the current output.
   * @returns {any} The output from the joining transformer
   */
  getOutput () {
    return this._getJoiningTransformer().get();
  }

  /**
   * Get() and set() are provided as a convenience method for templates, but
   *   it should typically not be used (use valueOf or the copy methods to add
   *   to the result tree instead).
   * @param {string} select - JSONPath selector
   * @param {boolean} wrap - Whether to wrap results
   * @returns {any} The selected value(s)
   */
  get (select, wrap) {
    if (select) {
      return /** @type {any} */ (jsonpath)({
        path: select, json: this._contextObj,
        preventEval: this._config.preventEval,
        wrap: wrap || false, returnType: 'value'
      });
    }
    return this._contextObj;
  }

  /**
   * @param {any} v - Value to set
   * @returns {this}
   */
  set (v) {
    (/** @type {Record<string, any>} */ (this._parent))[
      this._parentProperty
    ] = v;
    return this;
  }

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
  applyTemplates (select, mode, sort) {
    // Matches templates by (path, mode), resolves priority, and invokes each
    //   template in document order (or sorted order) for all nodes selected by
    //   `select`.
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    if (select && typeof select === 'object') {
      mode = select.mode ?? mode;
      select = select.select ?? select;
    }
    if (!this._initialized) {
      select = select || '$';
      this._currPath = '$';
      this._initialized = true;
    } else {
      select = select || '*';
    }
    // Preserve original selector to support special suffixes (e.g., "$~")
    const originalSelect = /** @type {string} */ (select);
    select = JSONPathTransformer.makeJSONPathAbsolute(originalSelect);
    const propertyNamesMode = select.endsWith('~');
    const jsonPathExpr = propertyNamesMode ? select.slice(0, -1) : select;
    // Todo: Use results here?
    /* const results = */ this._getJoiningTransformer();
    const modeMatchedTemplates = this._templates.filter((templateObj) => {
      // Exclude named-only templates (those with name but no path)
      if (templateObj.name && !templateObj.path) {
        return false;
      }
      return ((mode && mode === templateObj.mode) ||
        (!mode && !templateObj.mode));
    });

    // Collect matches first (to allow sorting), then process
    /**
     * @type {{
     *   value: any, parent: any, parentProperty?: string, path: string
     * }[]}
     */
    const matches = /** @type {any} */ (jsonpath)({
      path: jsonPathExpr,
      resultType: 'all',
      wrap: true,
      json: this._contextObj,
      preventEval: this._config.preventEval
    });

    // Sorting utilities
    /**
     * @param {string} expr
     * @param {any} ctxVal
     * @returns {any}
     */
    function evalInContext (expr, ctxVal) {
      if (!expr) {
        return undefined;
      }
      if (expr === '.' || expr === '@') {
        return ctxVal;
      }
      return /** @type {any} */ (jsonpath)({
        path: expr,
        json: ctxVal,
        preventEval: that._config.preventEval,
        wrap: false, returnType: 'value'
      });
    }
    /**
     * @param {any} aVal
     * @param {any} bVal
     * @param {{
     *   order?: 'ascending'|'descending', type?: 'text'|'number',
     *   locale?: string, localeOptions?: any
     * }|undefined} spec
     * @returns {number}
     */
    function compareBySpec (aVal, bVal, spec) {
      const order = (spec && spec.order === 'descending') ? -1 : 1;
      const type = (spec && spec.type) || 'text';
      if (type === 'number') {
        const an = Number(aVal);
        const bn = Number(bVal);
        /* c8 ignore next -- both NaN tested; short-circuit branch tracking */
        if (Number.isNaN(an) && Number.isNaN(bn)) {
          return 0;
        }
        if (Number.isNaN(an)) {
          return Number(order);
        }
        if (Number.isNaN(bn)) {
          return -1 * order;
        }
        return (an - bn) * order;
      }
      // text
      /* c8 ignore next 2 -- all null/undefined tested; OR short-circuit */
      const aStr = aVal === null || aVal === undefined ? '' : String(aVal);
      const bStr = bVal === null || bVal === undefined ? '' : String(bVal);
      if (spec && spec.locale) {
        return aStr.localeCompare(
          bStr, spec.locale, spec.localeOptions
        ) * order;
      }
      /* c8 ignore next -- all comparison outcomes tested; ternary
       * branch tracking */
      return (aStr < bStr ? -1 : (aStr > bStr ? 1 : 0)) * order;
    }
    /**
     * @param {any} sortSpec
     * @returns {((a: {value: any}, b: {value: any}) => number) | null}
     */
    function buildComparator (sortSpec) {
      if (!sortSpec) {
        return null;
      }
      if (typeof sortSpec === 'function') {
        return function (a, b) {
          return sortSpec(a.value, b.value, that);
        };
      }
      const specs = Array.isArray(sortSpec) ? sortSpec : [sortSpec];
      return function (a, b) {
        for (const s of specs) {
          if (typeof s === 'string') {
            const av = evalInContext(s, a.value);
            const bv = evalInContext(s, b.value);
            const c = compareBySpec(av, bv, {type: 'text', order: 'ascending'});
            if (c !== 0) {
              return c;
            }
          } else if (s && typeof s === 'object') {
            const av = evalInContext(s.select, a.value);
            const bv = evalInContext(s.select, b.value);
            const c = compareBySpec(av, bv, s);
            if (c !== 0) {
              return c;
            }
          }
        }
        return 0;
      };
    }

    const comparator = buildComparator(sort);
    if (comparator) {
      matches.sort(comparator);
    }

    // Preserve outer context across processing
    const prevContext = that._contextObj;
    const prevParent = that._parent;
    const prevParentProp = that._parentProperty;
    const prevCurrPath = that._currPath;

    // Process in (sorted) order
    for (const o of matches) {
      const {value, parent, parentProperty, path} = o;
      const _oldPath = that._currPath;
      that._currPath += path.replace(/^\$/v, '');
      const pathMatchedTemplates = modeMatchedTemplates.filter(
        function (templateObj) {
          // At this point, we know templateObj.path exists because we filtered
          // out named-only templates in modeMatchedTemplates
          /* c8 ignore start -- defensive check, already filtered at line 188 */
          if (!templateObj.path) {
            return false;
          }
          /* c8 ignore stop */
          const queryResult = /** @type {any[]} */ (
            (/** @type {any} */ (jsonpath))({
              path: JSONPathTransformer.makeJSONPathAbsolute(
                templateObj.path
              ),
              json: that._origObj,
              resultType: 'path',
              preventEval: that._config.preventEval,
              wrap: true
            })
          );
          return (
            /** @type {any[]} */ (queryResult)
          ).includes(that._currPath);
        }
      );

      let templateObj;
      if (!pathMatchedTemplates.length) {
        const dtr = JSONPathTransformer.DefaultTemplateRules;
        if (propertyNamesMode) {
          templateObj = dtr.transformPropertyNames;
        } else if (Array.isArray(value)) {
          templateObj = dtr.transformArrays;
        } else if (value && typeof value === 'object') {
          templateObj = dtr.transformObjects;
        } else if (value && typeof value === 'function') {
          templateObj = dtr.transformFunctions;
        } else {
          templateObj = dtr.transformScalars;
        }
      } else {
        pathMatchedTemplates.sort(function (a, b) {
          /* c8 ignore start -- Fallback to priority 0 when no numeric priority
           * and no specificityPriorityResolver is extremely rare in practice.
           * Requires: template without priority property AND no resolver AND
           * multiple templates matching same path. Equal priorities then
           * trigger error, making the `: 0` branch nearly unreachable. */
          const aPriority = typeof a.priority === 'number'
            ? a.priority
            : (that._config.specificityPriorityResolver && a.path
              ? that._config.specificityPriorityResolver(a.path)
              : 0);
          const bPriority = typeof b.priority === 'number'
            ? b.priority
            : (that._config.specificityPriorityResolver && b.path
              ? that._config.specificityPriorityResolver(b.path)
              : 0);
          /* c8 ignore stop */

          if (aPriority === bPriority) {
            that._triggerEqualPriorityError();
          }

          return (aPriority > bPriority) ? -1 : 1;
        });

        templateObj =
          /** @type {import('./index.js').JSONPathTemplateObject<T>} */ (
            pathMatchedTemplates.shift()
          );
      }

      that._contextObj = value;
      that._parent = parent;
      that._parentProperty = (parentProperty ?? that._parentProperty);

      // Set up parameter context for valueOf() access in templates
      const prevTemplateParams = that._params;
      that._params = {0: value};

      const ret =
        /** @type {import('./index.js').JSONPathTemplateObject<T>} */ (
          templateObj
        ).template.call(
          that, value, {mode, parent, parentProperty}
        );

      // Restore previous parameter context
      that._params = prevTemplateParams;
      if (typeof ret !== 'undefined') {
        // After the undefined check, ret is ResultType<T>
        that._getJoiningTransformer().append(
          /** @type {string|Node|*} */ (ret)
        );
      }

      that._contextObj = value;
      that._parent = parent;
      that._parentProperty = (parentProperty ?? that._parentProperty);
      that._currPath = _oldPath;
    }
    // Restore outer context
    that._contextObj = prevContext;
    that._parent = prevParent;
    that._parentProperty = prevParentProp;
    that._currPath = prevCurrPath;
    return this;
  }

  /**
   * @param {string|
   *   {name: string, withParam?: any[]}} name - Template name or
   *   options object
   * @param {any[]} [withParams] - Parameters to pass to template
   * @returns {this}
   */
  callTemplate (name, withParams) {
    // Invokes a named template, optionally passing values via withParam.
    if (name && typeof name === 'object') {
      withParams = name.withParam || withParams;
      ({name} = name);
    }
    withParams = withParams || [];

    // Store parameters in a temporary context for valueOf() access
    const prevParams = this._params;
    /** @type {Record<string, any>} */
    const params = {};
    this._params = params;

    withParams.forEach((withParam, index) => {
      const value = withParam.value !== undefined
        ? withParam.value
        : this.get(withParam.select, false);

      // Store by name if provided, otherwise by index
      if (withParam.name) {
        params[withParam.name] = value;
      } else {
        params[String(index)] = value;
      }
    });

    const results = this._getJoiningTransformer();
    const templateObj = this._templates.find((template) => {
      return template.name === name;
    });
    if (!templateObj) {
      throw new Error(
        'Template, ' + name + ', cannot be called as it was not found.'
      );
    }

    const result = templateObj.template.call(this, this._contextObj, {});
    if (typeof result !== 'undefined') {
      /** @type {any} */ (results).append(result);
    }

    // Restore previous parameter context
    this._params = prevParams;

    return this;
  }

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
  forEach (select, cb, sort) {
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    /** @type {{value: any}[]} */
    const matches = /** @type {any} */ (jsonpath)({
      path: select,
      json: this._contextObj,
      preventEval: this._config.preventEval,
      wrap: true,
      resultType: 'all'
    });

    /**
     * @param {string} expr
     * @param {any} ctxVal
     * @returns {any}
     */
    function feEvalInContext (expr, ctxVal) {
      if (!expr) {
        return undefined;
      }
      if (expr === '.' || expr === '@') {
        return ctxVal;
      }
      return /** @type {any} */ (jsonpath)({
        path: expr,
        json: ctxVal,
        preventEval: that._config.preventEval,
        wrap: false, returnType: 'value'
      });
    }
    /**
     * @param {any} aVal
     * @param {any} bVal
     * @param {{
     *   order?: 'ascending'|'descending', type?: 'text'|'number',
     *   locale?: string, localeOptions?: any
     * }|undefined} spec
     * @returns {number}
     */
    function feCompareBySpec (aVal, bVal, spec) {
      /* c8 ignore next 2 -- all spec combinations tested; && and || branches */
      const order = (spec && spec.order === 'descending') ? -1 : 1;
      const type = (spec && spec.type) || 'text';
      if (type === 'number') {
        const an = Number(aVal);
        const bn = Number(bVal);
        /* c8 ignore next -- both NaN tested; short-circuit branch tracking */
        if (Number.isNaN(an) && Number.isNaN(bn)) {
          return 0;
        }
        if (Number.isNaN(an)) {
          return Number(order);
        }
        if (Number.isNaN(bn)) {
          return -1 * order;
        }
        return (an - bn) * order;
      }
      /* c8 ignore next 2 -- all null/undefined tested; OR short-circuit */
      const aStr = aVal === null || aVal === undefined ? '' : String(aVal);
      const bStr = bVal === null || bVal === undefined ? '' : String(bVal);
      if (spec && spec.locale) {
        return aStr.localeCompare(
          bStr, spec.locale, spec.localeOptions
        ) * order;
      }
      /* c8 ignore next -- all comparison outcomes tested; ternary
       * branch tracking */
      return (aStr < bStr ? -1 : (aStr > bStr ? 1 : 0)) * order;
    }
    /**
     * @param {any} sortSpec
     * @returns {((a: {value: any}, b: {value: any}) => number) | null}
     */
    function feBuildComparator (sortSpec) {
      if (!sortSpec) {
        return null;
      }
      if (typeof sortSpec === 'function') {
        return function (a, b) {
          return sortSpec(a.value, b.value, that);
        };
      }
      const specs = Array.isArray(sortSpec) ? sortSpec : [sortSpec];
      return function (a, b) {
        for (const s of specs) {
          if (typeof s === 'string') {
            const av = feEvalInContext(s, a.value);
            const bv = feEvalInContext(s, b.value);
            const c = feCompareBySpec(
              av, bv, {type: 'text', order: 'ascending'}
            );
            if (c !== 0) {
              return c;
            }
          } else if (s && typeof s === 'object') {
            const av = feEvalInContext(s.select, a.value);
            const bv = feEvalInContext(s.select, b.value);
            const c = feCompareBySpec(av, bv, s);
            if (c !== 0) {
              return c;
            }
          }
        }
        return 0;
      };
    }

    const comparator = feBuildComparator(sort);
    const list = comparator ? [...matches].toSorted(comparator) : matches;
    for (const m of list) {
      // Set up parameter context for valueOf() access
      const prevParams = that._params;
      const prevContext = that._contextObj;
      that._params = {0: m.value};
      that._contextObj = m.value;
      try {
        cb.call(that, m.value);
      } finally {
        // Restore previous parameter context
        that._params = prevParams;
        that._contextObj = prevContext;
      }
    }
    return this;
  }

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
  forEachGroup (select, options, cb) {
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    const {groupBy, groupAdjacent, groupStartingWith, groupEndingWith, sort} =
      options;

    /** @type {{value: any}[]} */
    const matches = /** @type {any} */ (jsonpath)({
      path: select,
      json: this._contextObj,
      preventEval: this._config.preventEval,
      wrap: true,
      resultType: 'all'
    });

    /**
     * @param {string} expr
     * @param {any} ctxVal
     * @returns {any}
     */
    function evalInContext (expr, ctxVal) {
      if (expr === '.' || expr === '@') {
        return ctxVal;
      }
      return /** @type {any} */ (jsonpath)({
        path: expr,
        json: ctxVal,
        preventEval: that._config.preventEval,
        wrap: false,
        returnType: 'value'
      });
    }

    // Apply sorting if specified
    if (sort) {
      const comparator = this._buildComparator(sort, evalInContext);
      if (comparator) {
        matches.sort(
          /** @type {(a: {value: any}, b: {value: any}) => number} */ (
            comparator
          )
        );
      }
    }

    /** @type {Map<any, any[]>} */
    const groups = new Map();

    if (groupBy) {
      // Group by computed value
      for (const m of matches) {
        const key = evalInContext(groupBy, m.value);
        // Handle undefined by converting to null for JSON serialization
        const keyStr = JSON.stringify(key === undefined ? null : key);
        if (!groups.has(keyStr)) {
          groups.set(keyStr, []);
        }
        /** @type {any[]} */ (groups.get(keyStr)).push(m.value);
      }

      for (const [keyStr, items] of groups) {
        const key = JSON.parse(keyStr);
        // Convert null back to undefined if that was the original value
        const actualKey = key === null && keyStr === 'null' ? undefined : key;
        const prevContext = this._contextObj;
        const prevParams = this._params;
        try {
          this._contextObj = items;
          // Provide currentGroup() and currentGroupingKey() via context
          /** @type {any} */ (this)._currentGroup = items;
          /** @type {any} */ (this)._currentGroupingKey = actualKey;
          cb.call(this, actualKey, items, this);
        } finally {
          this._contextObj = prevContext;
          this._params = prevParams;
          delete /** @type {any} */ (this)._currentGroup;
          delete /** @type {any} */ (this)._currentGroupingKey;
        }
      }
    } else if (groupAdjacent) {
      // Group adjacent items with same value
      /** @type {string|null} */
      let currentKey = null;
      let currentGroup = [];

      for (const m of matches) {
        const key = evalInContext(groupAdjacent, m.value);
        const keyStr = JSON.stringify(key);

        if (currentKey === null || currentKey !== keyStr) {
          if (currentGroup.length > 0) {
            const prevContext = this._contextObj;
            const prevParams = this._params;
            try {
              this._contextObj = currentGroup;
              /** @type {any} */ (this)._currentGroup = currentGroup;
              /** @type {any} */ (this)._currentGroupingKey =
                JSON.parse(/** @type {string} */ (currentKey));
              cb.call(
                this,
                JSON.parse(/** @type {string} */ (currentKey)),
                currentGroup,
                this
              );
            } finally {
              this._contextObj = prevContext;
              this._params = prevParams;
              delete /** @type {any} */ (this)._currentGroup;
              delete /** @type {any} */ (this)._currentGroupingKey;
            }
          }
          currentKey = keyStr;
          currentGroup = [m.value];
        } else {
          currentGroup.push(m.value);
        }
      }

      // Process last group
      if (currentGroup.length > 0) {
        const prevContext = this._contextObj;
        const prevParams = this._params;
        try {
          this._contextObj = currentGroup;
          /** @type {any} */ (this)._currentGroup = currentGroup;
          /** @type {any} */ (this)._currentGroupingKey =
            JSON.parse(/** @type {string} */ (currentKey));
          cb.call(
            this,
            JSON.parse(/** @type {string} */ (currentKey)),
            currentGroup,
            this
          );
        } finally {
          this._contextObj = prevContext;
          this._params = prevParams;
          delete /** @type {any} */ (this)._currentGroup;
          delete /** @type {any} */ (this)._currentGroupingKey;
        }
      }
    } else if (groupStartingWith) {
      // Start new group when expression matches
      let currentGroup = [];

      for (const m of matches) {
        const startMatch = evalInContext(groupStartingWith, m.value);

        if (startMatch && currentGroup.length > 0) {
          const prevContext = this._contextObj;
          const prevParams = this._params;
          try {
            this._contextObj = currentGroup;
            /** @type {any} */ (this)._currentGroup = currentGroup;
            cb.call(this, null, currentGroup, this);
          } finally {
            this._contextObj = prevContext;
            this._params = prevParams;
            delete /** @type {any} */ (this)._currentGroup;
          }
          currentGroup = [];
        }
        currentGroup.push(m.value);
      }

      // Process last group
      if (currentGroup.length > 0) {
        const prevContext = this._contextObj;
        const prevParams = this._params;
        try {
          this._contextObj = currentGroup;
          /** @type {any} */ (this)._currentGroup = currentGroup;
          cb.call(this, null, currentGroup, this);
        } finally {
          this._contextObj = prevContext;
          this._params = prevParams;
          delete /** @type {any} */ (this)._currentGroup;
        }
      }
    } else if (groupEndingWith) {
      // End group when expression matches
      let currentGroup = [];

      for (const m of matches) {
        currentGroup.push(m.value);
        const endMatch = evalInContext(groupEndingWith, m.value);

        if (endMatch) {
          const prevContext = this._contextObj;
          const prevParams = this._params;
          try {
            this._contextObj = currentGroup;
            /** @type {any} */ (this)._currentGroup = currentGroup;
            cb.call(this, null, currentGroup, this);
          } finally {
            this._contextObj = prevContext;
            this._params = prevParams;
            delete /** @type {any} */ (this)._currentGroup;
          }
          currentGroup = [];
        }
      }

      // Process last group if not ended
      if (currentGroup.length > 0) {
        const prevContext = this._contextObj;
        const prevParams = this._params;
        try {
          this._contextObj = currentGroup;
          /** @type {any} */ (this)._currentGroup = currentGroup;
          cb.call(this, null, currentGroup, this);
        } finally {
          this._contextObj = prevContext;
          this._params = prevParams;
          delete /** @type {any} */ (this)._currentGroup;
        }
      }
    }

    return this;
  }

  /**
   * Helper to build comparator for sorting.
   * @param {any} sortSpec
   * @param {(expr: string, ctxVal: any) => any} evalFn
   * @returns {((a: {value: any}, b: {value: any}) => number)|null}
   * @private
   */
  _buildComparator (sortSpec, evalFn) {
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;

    if (typeof sortSpec === 'function') {
      return function (
        /** @type {{value: any}} */ a,
        /** @type {{value: any}} */ b
      ) {
        return sortSpec(a.value, b.value, that);
      };
    }

    /**
     * @param {any} aVal
     * @param {any} bVal
     * @param {{
     *   order?: 'ascending'|'descending', type?: 'text'|'number',
     *   locale?: string, localeOptions?: any
     * }|undefined} spec
     * @returns {number}
     */
    function compareBySpec (aVal, bVal, spec) {
      /* c8 ignore next 2 -- all spec combinations tested; && and || branches */
      const order = (spec && spec.order === 'descending') ? -1 : 1;
      const type = (spec && spec.type) || 'text';
      if (type === 'number') {
        const an = Number(aVal);
        const bn = Number(bVal);
        /* c8 ignore next -- both NaN tested; short-circuit branch tracking */
        if (Number.isNaN(an) && Number.isNaN(bn)) {
          return 0;
        }
        if (Number.isNaN(an)) {
          return Number(order);
        }
        if (Number.isNaN(bn)) {
          return -1 * order;
        }
        return (an - bn) * order;
      }
      /* c8 ignore next 2 -- all null/undefined tested; OR short-circuit */
      const aStr = aVal === null || aVal === undefined ? '' : String(aVal);
      const bStr = bVal === null || bVal === undefined ? '' : String(bVal);
      if (spec && spec.locale) {
        return aStr.localeCompare(
          bStr, spec.locale, spec.localeOptions
        ) * order;
      }
      /* c8 ignore next 2 -- all comparison outcomes tested; ternary
       * branch tracking */
      return (aStr < bStr ? -1 : (aStr > bStr ? 1 : 0)) * order;
    }

    const specs = Array.isArray(sortSpec) ? sortSpec : [sortSpec];
    return function (
      /** @type {{value: any}} */ a,
      /** @type {{value: any}} */ b
    ) {
      for (const s of specs) {
        if (typeof s === 'string') {
          const av = evalFn(s, a.value);
          const bv = evalFn(s, b.value);
          const c = compareBySpec(av, bv, {type: 'text', order: 'ascending'});
          if (c !== 0) {
            return c;
          }
        } else if (s && typeof s === 'object') {
          const av = evalFn(s.select, a.value);
          const bv = evalFn(s.select, b.value);
          const c = compareBySpec(av, bv, s);
          if (c !== 0) {
            return c;
          }
        }
      }
      return 0;
    };
  }

  /**
   * Returns the current group (for use within forEachGroup callback).
   * @returns {any[]|undefined}
   */
  currentGroup () {
    return /** @type {any} */ (this)._currentGroup;
  }

  /**
   * Returns the current grouping key (for use within forEachGroup callback).
   * @returns {any}
   */
  currentGroupingKey () {
    return /** @type {any} */ (this)._currentGroupingKey;
  }

  /**
   * @param {string|object} [select] - JSONPath selector
   * @returns {this}
   */
  valueOf (select) {
    // Appends the value of the given JSONPath (or the current context when
    // `{select: '.'}` is passed) to the output via the joining transformer.
    const results = this._getJoiningTransformer();
    let result;

    if (select && typeof select === 'object' &&
    /** @type {{select?: string}} */ (select).select === '.') {
      result = this._contextObj;
    } else {
      const selectStr = typeof select === 'object'
        ? /** @type {{select?: string}} */ (select).select
        : select;

      // Check for format-number() function call
      if (selectStr && selectStr.includes('format-number(')) {
        const match = (/format-number\((?<value>[^,\)]+)(?:,\s*["'](?<format>[^"']+)["'])?(?:,\s*["'](?<decimalFormat>[^"']*)["'])?\)/v).exec(selectStr);
        if (match && match.groups) {
          const {
            value: valueExpr,
            format: formatStr,
            decimalFormat: decimalFormatName
          } = match.groups;
          // Evaluate the value expression
          let numValue;
          if (valueExpr.trim().startsWith('$') &&
              !valueExpr.includes('.') && !valueExpr.includes('[')) {
            // Parameter reference (no path components)
            const paramName = valueExpr.trim().slice(1);
            numValue = this._params && paramName in this._params
              ? this._params[paramName]
              : 0;
          } else {
            // Try to parse as number or evaluate as JSONPath
            const trimmed = valueExpr.trim();
            numValue = Number.isNaN(Number(trimmed))
              ? this.get(trimmed, false)
              : Number(trimmed);
          }
          const num = typeof numValue === 'string'
            ? Number(numValue)
            : numValue;
          const format = formatStr || '1';
          const formatted = this._formatNumber(
            num,
            format,
            undefined,
            undefined,
            decimalFormatName || '',
            'en'
          );
          /** @type {any} */ (results).append(formatted);
          return this;
        }
      }

      // Check if this is a parameter reference (starts with $)
      if (selectStr && selectStr.startsWith('$')) {
        const paramName = selectStr.slice(1);
        result = (this._params && paramName in this._params)
          ? this._params[paramName]
          : this.get(/** @type {string} */ (selectStr), false);
      } else {
        result = this.get(/** @type {string} */ (select), false);
      }
    }

    /** @type {any} */ (results).append(result);
    return this;
  }

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
  analyzeString (str, regex, options = {}) {
    // Ensure we have a string
    const inputString = String(str || '');

    // If empty string, do nothing
    if (inputString.length === 0) {
      return this;
    }

    const {
      matchingSubstring,
      nonMatchingSubstring,
      flags = ''
    } = options;

    // Convert regex to RegExp if it's a string
    let regexObj;
    if (typeof regex === 'string') {
      // Ensure 'g' flag is present for global matching
      const actualFlags = flags.includes('g') ? flags : flags + 'g';
      regexObj = new RegExp(regex, actualFlags);
    } else {
      regexObj = regex;
      // Ensure global flag is set
      if (!regexObj.global) {
        regexObj = new RegExp(
          regexObj.source,
          regexObj.flags + 'g'
        );
      }
    }

    // Check for zero-length matches (error condition in XSLT)
    if (regexObj.test('')) {
      throw new Error(
        'Regular expression matches zero-length string'
      );
    }

    // Store captured groups for access during callback
    /** @type {string[] | undefined} */
    let currentCapturedGroups;

    /**
     * Get captured group by index.
     * @param {number} groupNumber - Group index
     * @returns {string} - Captured group or empty string
     */
    const getRegexGroup = (groupNumber) => {
      if (!currentCapturedGroups ||
          groupNumber < 0 ||
          groupNumber >= currentCapturedGroups.length) {
        return '';
      }
      return currentCapturedGroups[groupNumber] || '';
    };

    // Save previous context to restore later
    const prevContext = this._contextObj;

    let lastIndex = 0;
    let match;

    // Bind callbacks to this context
    const boundMatchingSubstring = matchingSubstring
      ? matchingSubstring.bind(this)
      : undefined;
    const boundNonMatchingSubstring = nonMatchingSubstring
      ? nonMatchingSubstring.bind(this)
      : undefined;

    // Find all matches
    while ((match = regexObj.exec(inputString)) !== null) {
      // Process non-matching substring before this match
      if (match.index > lastIndex) {
        const nonMatchingStr = inputString.slice(lastIndex, match.index);
        if (boundNonMatchingSubstring) {
          this._contextObj = nonMatchingStr;
          boundNonMatchingSubstring(nonMatchingStr);
        }
      }

      // Process matching substring
      if (boundMatchingSubstring) {
        const matchingStr = match[0];
        // Store captured groups: [full match, group1, group2, ...]
        currentCapturedGroups = [...match];
        this._contextObj = matchingStr;
        boundMatchingSubstring(
          matchingStr, currentCapturedGroups, getRegexGroup
        );
        currentCapturedGroups = undefined;
      }

      const {lastIndex: newLastIndex} = regexObj;
      lastIndex = newLastIndex;

      // Prevent infinite loop on zero-length matches (shouldn't happen
      // due to earlier check, but defensive)
      if (match.index === regexObj.lastIndex) {
        regexObj.lastIndex++;
      }
    }

    // Process final non-matching substring
    if (lastIndex < inputString.length) {
      const nonMatchingStr = inputString.slice(lastIndex);
      if (boundNonMatchingSubstring) {
        this._contextObj = nonMatchingStr;
        boundNonMatchingSubstring(nonMatchingStr);
      }
    }

    // Restore previous context
    this._contextObj = prevContext;

    return this;
  }

  /**
   * Deep copy selection or current context when omitted.
   * @param {string} [select] - JSONPath selector
   * @returns {this}
   */
  copyOf (select) { // Deep
    // Deeply clones the value at `select` (or current context if omitted)
    // and appends the clone to output. Cycles supported if structuredClone
    // available; otherwise falls back to JSON serialization (dropping
    // functions/undefined).
    const val = select ? this.get(select, false) : this._contextObj;
    // If JSONPath returned array of matches (wrap true not used here), we
    // just copy the raw value which should be scalar/object/array/function.
    // For functions or non-serializable values, structuredClone may throw.
    /** @type {any} */ let clone;
    if (val && typeof val === 'object') {
      /* c8 ignore try -- structuredClone existence depends on runtime */
      try {
        // Prefer native structuredClone when available.
        clone = typeof structuredClone === 'function'
          ? structuredClone(val)
          // Fall back to a (potentially shallow) spread clone when deep
          // cloning utility unavailable; better than lossy JSON stringify.
          : (Array.isArray(val) ? [...val] : {...val});
      } catch {
        /* c8 ignore start -- structuredClone error fallback attribution can
         * vary across environments; behavior covered by tests. */
        // structuredClone failed (e.g., Symbols); if any functions present
        // on own enumerable string-keyed properties, preserve via shallow.
        for (const k of Object.keys(val)) {
          const v = /** @type {any} */ (val)[k];
          if (typeof v === 'function') {
            break;
          }
        }
        // For non-functions, attempting structuredClone again would rethrow;
        // use shallow clone to retain non-serializable props like Symbols.
        clone = Array.isArray(val) ? [...val] : {...val};
        /* c8 ignore stop */
      }
    } else {
      // Primitives/functions copied by value/reference semantics naturally.
      clone = val;
    }
    this._getJoiningTransformer().append(clone);
    return this;
  }

  /**
   * Shallow copy current context; optionally merge property set names.
   * @param {string[]} [propertySets] - Property sets to merge
   * @returns {this}
   */
  copy (propertySets) { // Shallow
    // Creates a shallow clone of current context object/array (or primitive)
    // and appends it. If `propertySets` is an array of names, merges those
    // named property sets (if found) into the top-level shallow copy.
    const src = this._contextObj;
    /** @type {any} */ let clone;
    if (src && typeof src === 'object') {
      clone = Array.isArray(src) ? [...src] : {...src};
      if (Array.isArray(propertySets)) {
        for (const ps of propertySets) {
          if (this.propertySets[ps]) {
            Object.assign(clone, this.propertySets[ps]);
          }
        }
      }
    } else { /* c8 ignore start -- primitive branch attribution variance */
      clone = src; // Primitive/function - nothing to shallow clone
    } /* c8 ignore stop */
    this._getJoiningTransformer().append(clone);
    return this;
  }

  /**
   * @param {string} name - Variable name
   * @param {string} select - JSONPath selector
   * @returns {this}
   */
  variable (name, select) {
    this.vars[name] = this.get(select, false);
    return this;
  }

  /**
   * @param {unknown} json - JSON data to log
   * @returns {void}
   */
  // eslint-disable-next-line class-methods-use-this -- Convenient
  message (json) {
    // eslint-disable-next-line no-console -- Ok
    console.log(json);
  }

  /**
   * @param {string} str - String value
   * @param {import('./JSONJoiningTransformer.js').
   *   SimpleCallback<T>} [cb] - Optional callback to build nested
   *   string content
   * @returns {this}
   */
  string (str, cb) {
    /** @type {any} */ (this._getJoiningTransformer()).string(str, cb);
    return this;
  }

  /**
   * Append a number to JSON output with xsl:number-like formatting.
   * @param {NumberValue} num - Number value, "position()" string, or
   *   options object
   * @returns {this}
   */
  number (num) {
    // Handle xsl:number-like functionality
    if (typeof num === 'object' && num !== null) {
      const opts = num;
      let {value} = opts;

      // Handle position() and hierarchical numbering
      if (value === 'position()' || value === undefined) {
        const {count} = opts;
        // @ts-expect-error: dynamic property access
        const level = opts.level || 'single';

        switch (level) {
        case 'single': {
          value = this.calculatePosition(count);
          // If count is set, simulate count by returning total items
          //   in current context
          if (count) {
            const arr = Array.isArray(this.get(count, true))
              ? this.get(count, true)
              /* c8 ignore next -- defensive: get(wrap) always returns array */
              : [];
            value = arr.length;
          }

          break;
        }
        case 'multiple': {
          // Hierarchical numbering: get position for each ancestor up to root
          const positions = [];
          let state = /** @type {any} */ (this._config).iterationState;
          while (state) {
            // If count is set, use count for each ancestor if possible
            if (count) {
              const arr = Array.isArray(this.get(count, true))
                ? this.get(count, true)
                /* c8 ignore next -- defensive: get(wrap) returns array */
                : [];
              positions.unshift(arr.length);
            } else {
              positions.unshift(
                state.index !== undefined
                  ? state.index + 1
                  /* c8 ignore next -- defensive: state always has index */
                  : 1
              );
            }
            state = state.parentState;
          }
          value = positions.join('.');

          break;
        }
        case 'any': {
          // Count all matching items up to current
          value = this.calculatePosition(count);

          break;
        }
        // No default
        }
      }

      // Determine format string and locale
      let format = opts.format || '1';
      const locale = opts.lang || 'en';
      const {letterValue} = opts;

      // If letterValue is 'alphabetic', force alphabetic format
      if (letterValue === 'alphabetic') {
        format = (opts.format && (/^[aA]$/v).test(opts.format)) ? opts.format : 'a';
      }

      // Ensure value is a number or string for formatting
      let numValue = value;
      // If value is undefined, fallback to opts.value
      if (typeof numValue === 'undefined') {
        numValue = opts.value;
      }
      if (typeof numValue === 'string') {
        numValue = Number(numValue);
      }
      if (typeof numValue !== 'number' || Number.isNaN(numValue)) {
        numValue = 1;
      }
      const formatted = this._formatNumber(
        numValue,
        format,
        opts.groupingSeparator,
        opts.groupingSize,
        locale,
        opts.decimalFormat
      );

      // Output as string if formatted, otherwise as number
      if (format && format !== '1') {
        this._getJoiningTransformer().plainText(formatted);
      } else {
        this._getJoiningTransformer().number(Number(formatted));
      }
    } else if (num === 'position()') {
      // Simple position() call
      const pos = this.calculatePosition();
      this._getJoiningTransformer().number(pos);
    } else {
      // Simple number
      this._getJoiningTransformer().number(
        typeof num === 'string' ? Number(num) : num
      );
    }
    return this;
  }

  /**
   * Calculate position in current iteration context.
   * @param {string} [count] - JSONPath expression to match
   * @returns {number}
   */
  calculatePosition (count) {
    // If count is provided, return the length of the matched array from
    //   the root data
    if (count) {
      const result = jsonpath({
        path: count, json: this._origObj, resultType: 'value', wrap: true
      });
      if (Array.isArray(result)) {
        if (result.length === 0) {
          return 0;
        }
        // If the first item is an array, return its length
        if (Array.isArray(result[0])) {
          return result[0].length;
        }
        // Otherwise, return the number of matches
        return result.length;
      }
      /* c8 ignore next 3 -- defensive:
        jsonpath-plus with wrap:true always returns arrays */
      return 0;
    }
    // Get current index from iteration state
    const state = this.iterationState;
    if (state && typeof state.index === 'number') {
      return state.index + 1; // 1-indexed
    }
    return 1;
  }

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
  _formatNumber (
    num,
    format,
    groupingSeparator,
    groupingSize,
    decimalFormatName,
    locale = 'en'
  ) {
    if (Number.isNaN(num)) {
      // Check for custom NaN string in decimal format
      const fmt = decimalFormatName
        ? this.decimalFormats[decimalFormatName]
        : this.decimalFormats[''];
      return fmt?.NaN || String(num);
    }

    // Get decimal format if specified
    const decimalFormat = decimalFormatName
      ? this.decimalFormats[decimalFormatName]
      : this.decimalFormats[''];

    let result;
    const formatChar = format.charAt(0);

    switch (formatChar) {
    case 'i': {
      result = this._toRoman(num).toLowerCase();

      break;
    }
    case 'I': {
      result = this._toRoman(num);

      break;
    }
    case 'a': {
      result = this._toAlphabetic(num, false);

      break;
    }
    case 'A': {
      result = this._toAlphabetic(num, true);

      break;
    }
    case '0': {
      const width = format.length;
      const zeroDigit = decimalFormat?.zeroDigit || '0';
      result = String(num).padStart(width, zeroDigit);

      break;
    }
    default: {
      // Use Intl.NumberFormat for decimal formatting if grouping/locale
      //   options are provided
      let options = {};
      if (groupingSeparator || groupingSize) {
        options = {
          useGrouping: true
        };
      }

      try {
        result = new Intl.NumberFormat(locale, options).format(num);

        // Apply decimal format symbols if specified
        if (decimalFormat) {
          // Use placeholders to avoid conflicts during replacement
          const TEMP_GROUP = '\u0000GROUPSEP\u0000';
          const TEMP_DECIMAL = '\u0000DECIMALSEP\u0000';

          // Replace with temporary placeholders first
          result = result.replaceAll(',', TEMP_GROUP);
          result = result.replaceAll('.', TEMP_DECIMAL);

          // Now replace with actual symbols
          const effectiveGroupingSep = groupingSeparator ||
            decimalFormat.groupingSeparator || ',';
          const effectiveDecimalSep = decimalFormat.decimalSeparator || '.';

          result = result.replaceAll(TEMP_GROUP, effectiveGroupingSep);
          result = result.replaceAll(TEMP_DECIMAL, effectiveDecimalSep);
        } else if (groupingSeparator) {
          result = result.replaceAll(',', groupingSeparator);
        }
      } catch (e) {
        result = String(num);
      }
    }
    }
    return result;
  }

  /**
   * Convert number to Roman numerals.
   * @param {number} num - Number to convert (1-3999)
   * @returns {string}
   * @private
   */
  // eslint-disable-next-line class-methods-use-this -- Avoid for now
  _toRoman (num) {
    if (num < 1 || num > 3999) {
      return String(num);
    }

    const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const syms = [
      'M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'
    ];

    let result = '';
    for (const [i, val] of vals.entries()) {
      while (num >= val) {
        result += syms[i];
        num -= val;
      }
    }
    return result;
  }

  /**
   * Convert number to alphabetic sequence.
   * @param {number} num - Number to convert
   * @param {boolean} uppercase - Use uppercase letters
   * @returns {string}
   * @private
   */
  // eslint-disable-next-line class-methods-use-this -- Avoid for now
  _toAlphabetic (num, uppercase) {
    if (num < 1) {
      return String(num);
    }

    let result = '';
    const base = uppercase ? 65 : 97; // 'A' or 'a'

    while (num > 0) {
      num--; // Make 0-indexed
      result = String.fromCodePoint(base + (num % 26)) + result;
      num = Math.floor(num / 26);
    }

    return result;
  }

  /**
   * Append plain text directly to the output without escaping or JSON
   *   stringification. Mirrors the joining transformer API so templates can
   *   call `this.plainText()`.
   * @param {string} str - Plain text to append
   * @returns {this}
   */
  plainText (str) {
    this._getJoiningTransformer().plainText(str);
    return this;
  }

  /**
   * Set a property value on the current object (JSON joiner). Mirrors the
   *   joining transformer API so templates can call `this.propValue()`.
   * @param {string} prop - Property name
   * @param {any} val - Property value
   * @returns {this}
   */
  propValue (prop, val) {
    this._getJoiningTransformer().propValue(prop, val);
    return this;
  }

  /**
   * Build an object. Mirrors the joining transformer API. All joiners now
   * support both signatures: (obj, cb, usePropertySets, propSets) with seed
   * object or (cb, usePropertySets, propSets) without.
   * @param {...any} args - Arguments to pass to joiner
   * @returns {this}
   */
  object (...args) {
    /** @type {any} */ (this._getJoiningTransformer()).object(...args);
    return this;
  }

  /**
   * Build an array. Mirrors the joining transformer API. All joiners now
   * support both signatures: (arr, cb) with seed array or (cb) without.
   * @param {...any} args - Arguments to pass to joiner
   * @returns {this}
   */
  array (...args) {
    /** @type {any} */ (this._getJoiningTransformer()).array(...args);
    return this;
  }

  /**
   * Set document-level configuration.
   * @param {import('./StringJoiningTransformer.js').OutputConfig} cfg Text
   * @returns {this}
   */
  output (cfg) {
    this._getJoiningTransformer().output(cfg);
    return this;
  }

  /**
   * @param {string} name
   * @param {import('./AbstractJoiningTransformer.js').
   *   OutputCharacters} outputCharacters
   * @returns {this}
   */
  characterMap (name, outputCharacters) {
    this._getJoiningTransformer().characterMap(name, outputCharacters);
    return this;
  }

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
  element (name, atts, children, cb) {
    /** @type {any} */ (this._getJoiningTransformer()).element(
      name, atts, children, cb
    );
    return this;
  }

  /**
   * Adds a prefixed namespace declaration to the most recently opened
   *  element. Mirrors the joining
   * transformer API so templates can call `this.attribute()`.
   * @param {string} prefix - Prefix
   * @param {string} namespaceURI - Namespace
   * @returns {this}
   */
  namespace (prefix, namespaceURI) {
    /** @type {any} */ (this._getJoiningTransformer()).namespace(
      prefix, namespaceURI
    );
    return this;
  }

  /**
   * Define a decimal format with custom symbols for number formatting.
   * Equivalent to xsl:decimal-format. If no name is provided, defines
   * the default format.
   * @param {string|DecimalFormatSymbols} nameOrSymbols - Format name or
   *   symbols object if defining default
   * @param {DecimalFormatSymbols} [symbols] - Format symbols
   * @returns {this}
   */
  decimalFormat (nameOrSymbols, symbols) {
    if (typeof nameOrSymbols === 'string') {
      // Named format
      this.decimalFormats[nameOrSymbols] = symbols || {};
    } else {
      // Default format (unnamed)
      this.decimalFormats[''] = nameOrSymbols;
    }
    return this;
  }

  /**
   * Add an attribute to the most recently opened element. Mirrors the joining
   * transformer API so templates can call `this.attribute()`.
   * @param {string} name - Attribute name
   * @param {string|Record<string, unknown>} val - Attribute value
   * @returns {this}
   */
  attribute (name, val) {
    /** @type {any} */ (this._getJoiningTransformer()).attribute(
      name, val
    );
    return this;
  }

  /**
   * Append text content. Mirrors the joining transformer API so templates can
   * call `this.text()`.
   * @param {string} txt - Text content
   * @returns {this}
   */
  text (txt) {
    this._getJoiningTransformer().text(txt);
    return this;
  }

  /**
   * Add a comment to the most recently opened element. Mirrors the joining
   * transformer API so templates can call `this.comment()`.
   * @param {string} text - Comment text
   * @returns {this}
   */
  comment (text) {
    this._getJoiningTransformer().comment(
      text
    );
    return this;
  }

  /**
   * Add a processing instruction to the most recently opened element.
   *   Mirrors the joining transformer API so templates can call
   *   `this.processingInstruction()`.
   * @param {string} target - Processing instruction target
   * @param {string} data - Processing instruction data
   * @returns {this}
   */
  processingInstruction (target, data) {
    this._getJoiningTransformer().processingInstruction(
      target, data
    );
    return this;
  }

  /**
   * @param {string} name - Property set name
   * @param {Record<string, unknown>} propertySetObj - Property set object
   * @param {any[]} [usePropertySets] - Property sets to use
   * @returns {this}
   */
  propertySet (name, propertySetObj, usePropertySets) {
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    this.propertySets[name] = usePropertySets
      ? ({
        ...propertySetObj,
        ...usePropertySets.reduce((obj, psName) => {
          return that._usePropertySets(obj, psName);
        }, {})
      })
      : propertySetObj;
    return this;
  }

  /**
   * @param {Record<string, unknown>} obj - Object to assign properties to
   * @param {string} name - Property set name
   * @returns {Record<string, unknown>}
   */
  _usePropertySets (obj, name) {
    return Object.assign(obj, this.propertySets[name]);
  }

  /**
   * @param {string} name - Key name
   * @param {any} value - Value to match
   * @returns {any}
   */
  getKey (name, value) {
    const key = this.keys[name];
    const matches = this.get(key.match, true);
    for (const match of matches) { // For objects or arrays
      if (match && typeof match === 'object' &&
        match[key.use] === value) {
        return match;
      }
    }
    return this;
  }

  /**
   * @param {string} name - Key name
   * @param {string} match - Match expression
   * @param {string} use - Use expression
   * @returns {this}
   */
  key (name, match, use) {
    this.keys[name] = {match, use};
    return this;
  }

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
  if (select, cb) {
    const passes = this._passesIf(select);
    if (passes && typeof cb === 'function') {
      cb.call(this);
    }
    return this;
  }

  /**
   * Internal helper: determine if `select` passes truthiness test.
   * Non-empty wrapped results => true; single item: objects truthy,
   * primitives coerced via Boolean().
   * @param {string} select
   * @returns {boolean}
   */
  _passesIf (select) {
    // Evaluate with wrapping to detect non-empty match sets
    /** @type {any} */ const wrapped = this.get(select, true);
    if (Array.isArray(wrapped)) {
      if (wrapped.length === 0) {
        return false;
      }
      if (wrapped.length > 1) {
        // Multiple matches (node set analogue) => truthy
        return true;
      }
      // Single item; apply scalar truthiness
      const single = wrapped[0];
      // Objects (arrays) always truthy; primitives use Boolean()
      if (single && typeof single === 'object') {
        return true;
      }
      return Boolean(single);
    }
    /* c8 ignore next 3 -- unreachable defensive non-array branch:
     * jsonpath-plus with wrap:true always returns arrays. */
    // Fallback if library behavior changed in future
    return Boolean(wrapped);
  }

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
  choose (select, whenCb, otherwiseCb) {
    const passes = this._passesIf(select);
    if (passes) {
      if (typeof whenCb === 'function') {
        whenCb.call(this);
      }
    } else if (typeof otherwiseCb === 'function') {
      otherwiseCb.call(this);
    }
    return this;
  }
}

export default JSONPathTransformerContext;
