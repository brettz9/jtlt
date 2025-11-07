import {JSONPath as jsonpath} from 'jsonpath-plus';
import JSONPathTransformer from './JSONPathTransformer.js';

/**
 * Execution context for JSONPath-driven template application.
 *
 * Holds the current node, parent, path, variables, and property sets while
 * running templates. Exposes helper methods that mirror the underlying
 * joining transformer (e.g., string(), object(), array()) so templates can
 * emit results without referencing the joiner directly.
 */
class JSONPathTransformerContext {
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
  constructor (config, templates) {
    this._config = config;
    this._templates = templates;
    this._contextObj = this._origObj = config.data;
    this._parent = config.parent || this._config;
    this._parentProperty = config.parentProperty || 'data';
    /** @type {Record<string, any>} */
    this.vars = {};
    /** @type {Record<string, any>} */
    this.propertySets = {};
    /** @type {Record<string, any>} */
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
   * @returns {any} The joining transformer
   */
  _getJoiningTransformer () {
    return this._config.joiningTransformer;
  }

  /**
   * @param {*} item - Item to append to output
   * @returns {JSONPathTransformerContext}
   */
  appendOutput (item) {
    /** @type {any} */ (this._getJoiningTransformer()).append(item);
    return this;
  }

  /**
   * Gets the current output.
   * @returns {*} The output from the joining transformer
   */
  getOutput () {
    return /** @type {any} */ (this._getJoiningTransformer()).get();
  }

  /**
   * Get() and set() are provided as a convenience method for templates, but
   *   it should typically not be used (use valueOf or the copy methods to add
   *   to the result tree instead).
   * @param {string} select - JSONPath selector
   * @param {boolean} wrap - Whether to wrap results
   * @returns {*} The selected value(s)
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
   * @param {*} v - Value to set
   * @returns {JSONPathTransformerContext}
   */
  set (v) {
    (/** @type {Record<string, any>} */ (this._parent))[this._parentProperty] = v;
    return this;
  }

  /**
   * @todo implement sort (allow as callback or as object)
   * @param {string|object} select - JSONPath selector or options object
   * @param {string} [mode] - Mode to apply
   * @param {*} [sort] - Sort parameter (not yet implemented)
   * @returns {JSONPathTransformerContext}
   */
  applyTemplates (select, mode, sort) {
    // Matches templates by (path, mode), resolves priority, and invokes each
    // template in document order for all nodes selected by `select`.
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    if (select && typeof select === 'object') {
      /** @type {{mode?: string, select?: string}} */
      const selectObj = /** @type {any} */ (select);
      mode = selectObj.mode ?? mode;
      select = selectObj.select ?? select;
    }
    if (!this._initialized) {
      select = select || '$';
      this._currPath = '$';
      this._initialized = true;
    } else {
      select = select || '*';
    }
  select = JSONPathTransformer.makeJSONPathAbsolute(/** @type {string} */ (select));
    // Todo: Use results here?
    /* const results = */ this._getJoiningTransformer();
    const modeMatchedTemplates = this._templates.filter(function (templateObj) {
      return ((mode && mode === templateObj.mode) ||
        (!mode && !templateObj.mode));
    });

    // s(select);
    // s(this._contextObj);
    /** @type {any} */ (jsonpath)({
      path: select,
      resultType: 'all',
      wrap: false,
      json: this._contextObj,
      preventEval: this._config.preventEval,
  callback (/** @type {any} */ o /* {value, parent, parentProperty, path} */) {
        const {value} = o,
          {parent, parentProperty, path} = o;
        // Todo: For remote JSON stores, could optimize this to first get
        //    template paths and cache by template (and then query
        //    the remote JSON and transform as results arrive)
        // s(value + '::' + parent + '::' + parentProperty + '::' + path);
        const _oldPath = that._currPath;
        that._currPath += path.replace(/^\$/v, '');
        // Todo: Normalize templateObj.path's
        const pathMatchedTemplates = modeMatchedTemplates.filter(
          function (templateObj) {
            const queryResult = /** @type {any[]} */ ((/** @type {any} */ (jsonpath))({
              path: JSONPathTransformer.makeJSONPathAbsolute(templateObj.path),
              json: that._origObj,
              resultType: 'path',
              preventEval: that._config.preventEval,
              wrap: true
            }));
            // s(queryResult);
            // s('currPath:'+that._currPath);
            return (/** @type {any[]} */ (queryResult)).includes(that._currPath);
          }
        );

        let templateObj;
        if (!pathMatchedTemplates.length) {
          const dtr = JSONPathTransformer.DefaultTemplateRules;
          // Default rules in XSLT, although expressible as different
          //   kind of paths, are really about result types, so we check the
          //   resulting value more than the select expression
          if (select.endsWith('~')) {
            templateObj = dtr.transformPropertyNames;
          } else if (Array.isArray(value)) {
            templateObj = dtr.transformArrays;
          } else if (value && typeof value === 'object') {
            templateObj = dtr.transformObjects;
          // Todo: provide parameters to jsonpath based on config on whether to
          //   allow non-JSON JS results
          } else if (value && typeof value === 'function') {
            templateObj = dtr.transformFunctions;
          } else {
            templateObj = dtr.transformScalars;
          }
          /*
          Todo: If Jamilih support Jamilih, could add equivalents more like XSL,
          including processing-instruction(), comment(), and namespace nodes
          (whose default templates do not add to the result tree in XSLT) as
          well as elements, attributes, text nodes (see
          https://lenzconsulting.com/how-xslt-works/#built-in_template_rules )
          */
        } else {
          // Todo: Could perform this first and cache by template
          pathMatchedTemplates.sort(function (a, b) {
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

            if (aPriority === bPriority) {
              that._triggerEqualPriorityError();
            }

            // We want equal conditions to go in favor of the later (b)
            return (aPriority > bPriority) ? -1 : 1;
          });

          templateObj = pathMatchedTemplates.shift();
        }

        that._contextObj = value;
        that._parent = parent;
        that._parentProperty = parentProperty;

        const ret = templateObj.template.call(
          that, value, {mode, parent, parentProperty}
        );
        if (typeof ret !== 'undefined') {
          // Will vary by that._config.outputType
          that._getJoiningTransformer().append(ret);
        }

        // Child templates may have changed the context
        that._contextObj = value;
        that._parent = parent;
        that._parentProperty = parentProperty;
        that._currPath = _oldPath;
      }
    });
    return this;
  }

  /**
   * @param {string|object} name - Template name or options object
   * @param {any[]} [withParams] - Parameters to pass to template
   * @returns {JSONPathTransformerContext}
   */
  callTemplate (name, withParams) {
    // Invokes a named template, optionally passing values via withParam.
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    if (name && typeof name === 'object') {
      /** @type {{name?: string, withParam?: any[]}} */
      const nameObj = /** @type {any} */ (name);
      withParams = nameObj.withParam || withParams;
  name = nameObj.name ?? name;
    }
    withParams = withParams || [];
    const paramValues = withParams.map(function (withParam) {
      return withParam.value || that.get(withParam.select, false);
    });
    const results = this._getJoiningTransformer();
    const templateObj = this._templates.find(function (template) {
      return template.name === name;
    });
    if (!templateObj) {
      throw new Error(
        'Template, ' + name + ', cannot be called as it was not found.'
      );
    }

    const result = templateObj.template.apply(this, paramValues);
    /** @type {any} */ (results).append(result);
    return this;
  }

  /**
   * @param {string} select - JSONPath selector
   * @param {Function} cb - Callback function
   * @param {*} sort - Sort parameter (not yet implemented)
   * @returns {JSONPathTransformerContext}
   */
  // Todo: Implement sort (allow as callback or as object)
  // Todo: If making changes in return values, be sure to update
  //    `forQuery` as well
  forEach (select, cb, sort) {
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    /** @type {any} */ (jsonpath)({
      path: select, json: this._contextObj,
      preventEval: this._config.preventEval, wrap: false,
      returnType: 'value',
      callback (/** @type {any} */ value) {
        cb.call(that, value);
      }
    });
    return this;
  }

  /**
   * @param {string|object} [select] - JSONPath selector
   * @returns {JSONPathTransformerContext}
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
   * Deep copy (not yet implemented).
   * @param {string} select - JSONPath selector
   * @returns {JSONPathTransformerContext}
   */
  copyOf (select) { // Deep
    return this;
  }

  /**
   * Shallow copy (not yet implemented).
   * @param {*} propertySets - Property sets
   * @returns {JSONPathTransformerContext}
   */
  copy (propertySets) { // Shallow
    return this;
  }

  /**
   * @param {string} name - Variable name
   * @param {string} select - JSONPath selector
   * @returns {JSONPathTransformerContext}
   */
  variable (name, select) {
    this.vars[name] = this.get(select, false);
    return this;
  }

  /**
   * @param {*} json - JSON data to log
   * @returns {void}
   */
  // eslint-disable-next-line class-methods-use-this -- Convenient
  message (json) {
    // eslint-disable-next-line no-console -- Ok
    console.log(json);
  }

  /**
   * @param {string} str - String value
   * @param {Function} cb - Callback function
   * @returns {JSONPathTransformerContext}
   */
  // Todo: Add other methods from the joining transformers
  string (str, cb) {
    /** @type {any} */ (this._getJoiningTransformer()).string(str, cb);
    return this;
  }

  /**
   * Append plain text directly to the output without escaping or JSON
   *   stringification. Mirrors the joining transformer API so templates can
   *   call `this.plainText()`.
   * @param {string} str - Plain text to append
   * @returns {JSONPathTransformerContext}
   */
  plainText (str) {
    /** @type {any} */ (this._getJoiningTransformer()).plainText(str);
    return this;
  }

  /**
   * @param {Function} cb - Callback function
   * @param {*} usePropertySets - Property sets to use
   * @param {*} propSets - Property sets
   * @returns {JSONPathTransformerContext}
   */
  object (cb, usePropertySets, propSets) {
    /** @type {any} */ (this._getJoiningTransformer()).object(
      cb, usePropertySets, propSets
    );
    return this;
  }

  /**
   * @param {Function} cb - Callback function
   * @returns {JSONPathTransformerContext}
   */
  array (cb) {
    /** @type {any} */ (this._getJoiningTransformer()).array(cb);
    return this;
  }

  /**
   * @param {string} name - Property set name
   * @param {object} propertySetObj - Property set object
   * @param {any[]} [usePropertySets] - Property sets to use
   * @returns {JSONPathTransformerContext}
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
   * @param {object} obj - Object to assign properties to
   * @param {string} name - Property set name
   * @returns {object}
   */
  _usePropertySets (obj, name) {
    return Object.assign(obj, this.propertySets[name]);
  }

  /**
   * @param {string} name - Key name
   * @param {*} value - Value to match
   * @returns {*}
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
   * @returns {JSONPathTransformerContext}
   */
  key (name, match, use) {
    this.keys[name] = {match, use};
    return this;
  }
}

export default JSONPathTransformerContext;
