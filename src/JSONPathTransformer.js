import JSONPathTransformerContext from './JSONPathTransformerContext.js';

/**
 * Applies named JSONPath-driven templates to JSON data.
 *
 * This engine finds templates whose `path` match the current node (plus an
 * optional `mode`), sorts by priority, and invokes the winning template.
 * If no template matches, built-in default rules emulate XSLT-like behavior
 * for objects, arrays, scalars, etc.
 * @template T
 */
class JSONPathTransformer {
  /**
   * @param {import('./JSONPathTransformerContext.js').
   *   JSONPathTransformerContextConfig<T>} config - Configuration object
   */
  constructor (config) {
    let map = /** @type {Record<string, boolean>} */ ({});
    this._config = config;
    /** @type {any[]} */
    this.rootTemplates = [];
    this.templates = config.templates.map(function (template) {
      if (Array.isArray(template)) {
        // Todo: We could allow a third argument (at beginning or
        //    end?) to represent template name
        return /** @type {import('./index.js').JSONPathTemplateObject<T>} */ (
          {path: template[0], template: template[1]}
        );
      }
      return template;
    });
    this.templates.forEach((template, i, templates) => {
      if (template.name && map[template.name]) {
        throw new Error('Templates must all have different names.');
      }
      map[String(template.name)] = true;
      if (template.path === '$') {
        // eslint-disable-next-line unicorn/prefer-spread -- Refactor
        this.rootTemplates = this.rootTemplates.concat(templates.splice(i, 1));
      }
    });
    map = /** @type {any} */ (null);
  }

  /**
   * @returns {void}
   */
  _triggerEqualPriorityError () {
    if (this._config.errorOnEqualPriority) {
      throw new Error(
        'You have configured JSONPathTransformer to throw errors on finding ' +
        'templates of equal priority and these have been found.'
      );
    }
  }

  /**
   * @param {string} [mode] - Transformation mode
   * @returns {any} The transformation result
   */
  transform (mode) {
    const jte = new JSONPathTransformerContext(
      this._config, this.templates
    );
    const len = this.rootTemplates.length;
    const templateObj = len
      ? this.rootTemplates.pop()
      : JSONPathTransformer.DefaultTemplateRules.transformRoot;
    if (len > 1) {
      this._triggerEqualPriorityError();
    }
    const ret = templateObj.template.call(jte, undefined, {mode});
    if (typeof ret !== 'undefined') {
      // Will vary by jte._config.outputType
      jte._getJoiningTransformer().append(ret);
    }
    const result = jte.getOutput();
    return result;
  }

  /**
   * @param {string} select - JSONPath selector
   * @returns {string} Absolute JSONPath
   */
  static makeJSONPathAbsolute (select) {
    // See todo in JSONPath to avoid need for '$' (but may still need
    //   to add ".")
    return select[0] !== '$'
      ? ((select[0] === '[' ? '$' : '$.') + select)
      : select;
  }

  // To-do: Express as JSONPath expressions?
  static DefaultTemplateRules = {
    transformRoot: {
      /**
       * @this {JSONPathTransformerContext}
       * @param {any} value - Value
       * @param {{mode?: string}} cfg - Configuration
       * @returns {void}
       */
      template (value, cfg) {
        this.applyTemplates(null, cfg.mode);
      }
    },
    transformPropertyNames: {
      /**
       * @param {any} value - Current context value
       * @returns {any}
       */
      template (value) {
        // Emit property names for the current object context
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return Object.keys(value).join('');
        }
        return '';
      }
    },
    transformObjects: {
      /**
       * @this {JSONPathTransformerContext}
       * @param {any} value - Value
       * @param {{mode?: string}} cfg - Configuration
       * @returns {void}
       */
      template (value, cfg) {
        this.applyTemplates(null, cfg.mode);
      }
    },
    transformArrays: {
      /**
       * @this {JSONPathTransformerContext}
       * @param {any} value - Value
       * @param {{mode?: string}} cfg - Configuration
       * @returns {void}
       */
      template (value, cfg) {
        this.applyTemplates(null, cfg.mode);
      }
    },
    transformScalars: {
      /**
       * @this {JSONPathTransformerContext}
       * @returns {JSONPathTransformerContext}
       */
      template () {
        return this.valueOf({select: '.'});
      }
    },
    transformFunctions: {
      /**
       * @param {( ...args: any[]) => any} value - Function at current context
       * @returns {any}
       */
      template (value) {
        // Call the function and return its result
        return value();
      }
    }
  };
}

export default JSONPathTransformer;
