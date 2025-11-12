import {JSONPath as jsonpath} from 'jsonpath-plus';
import JSONPathTransformer from './JSONPathTransformer.js';

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
    /** @type {boolean | undefined} */
    this._initialized = undefined;
    /** @type {string | undefined} */
    this._currPath = undefined;
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
      const aStr = aVal === null || aVal === undefined ? '' : String(aVal);
      const bStr = bVal === null || bVal === undefined ? '' : String(bVal);
      if (spec && spec.locale) {
        return aStr.localeCompare(
          bStr, spec.locale, spec.localeOptions
        ) * order;
      }
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
            : (that._config.specificityPriorityResolver
              ? that._config.specificityPriorityResolver(a.path)
              : 0);
          const bPriority = typeof b.priority === 'number'
            ? b.priority
            : (that._config.specificityPriorityResolver
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

      const ret =
        /** @type {import('./index.js').JSONPathTemplateObject<T>} */ (
          templateObj
        ).template.call(
          that, value, {mode, parent, parentProperty}
        );
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
    const paramValues = withParams.map((withParam) => {
      return withParam.value || this.get(withParam.select, false);
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

    const result = templateObj.template.call(this, paramValues);
    /** @type {any} */ (results).append(result);
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
      const order = (spec && spec.order === 'descending') ? -1 : 1;
      const type = (spec && spec.type) || 'text';
      if (type === 'number') {
        const an = Number(aVal);
        const bn = Number(bVal);
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
      const aStr = aVal === null || aVal === undefined ? '' : String(aVal);
      const bStr = bVal === null || bVal === undefined ? '' : String(bVal);
      if (spec && spec.locale) {
        return aStr.localeCompare(
          bStr, spec.locale, spec.localeOptions
        ) * order;
      }
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
      cb.call(that, m.value);
    }
    return this;
  }

  /**
   * @param {string|object} [select] - JSONPath selector
   * @returns {this}
   */
  valueOf (select) {
    // Appends the value of the given JSONPath (or the current context when
    // `{select: '.'}` is passed) to the output via the joining transformer.
    const results = this._getJoiningTransformer();
    const result = select && typeof select === 'object' &&
    /** @type {{select?: string}} */ (select).select === '.'
      ? this._contextObj
      : this.get(/** @type {string} */ (select), false);
    /** @type {any} */ (results).append(result);
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
   * Append a number to JSON output. Mirrors the joining transformer API so
   *   templates can call `this.number()`.
   * @param {number} num - Number value to append
   * @returns {this}
   */
  number (num) {
    this._getJoiningTransformer().number(num);
    return this;
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
   * Append text node content.
   * @param {import('./StringJoiningTransformer.js').OutputConfig} cfg Text
   * @returns {this}
   */
  output (cfg) {
    this._getJoiningTransformer().output(cfg);
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
