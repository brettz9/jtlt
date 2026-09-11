import JSONPathTransformerContext from './JSONPathTransformerContext.js';
import {
  compileJSONTemplate, isJSONTemplateNodeArray
} from './jsonTemplate.js';

/**
 * Applies named JSONPath-driven templates to JSON data.
 *
 * This engine finds templates whose `path` match the current node (plus an
 * optional `mode`), sorts by priority, and invokes the winning template.
 * If no template matches, built-in default rules emulate XSLT-like behavior
 * for objects, arrays, scalars, etc.
 * @template {"json"|"string"|"dom"} [T="json"]
 */
class JSONPathTransformer {
  // To-do: Express as JSONPath expressions?
  static DefaultTemplateRules = {
    transformRoot: {
      /**
       * @template {"json"|"string"|"dom"} U
       * @this {JSONPathTransformerContext<U>}
       * @param {unknown} value - Value
       * @param {{mode?: string}} cfg - Configuration
       * @returns {void}
       */
      template (value, cfg) {
        this.applyTemplates(null, cfg.mode);
      }
    },
    transformPropertyNames: {
      /**
       * @param {unknown} value - Current context value
       * @returns {unknown}
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
       * @param {unknown} value - Value
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
       * @param {unknown} value - Value
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
       * @param {(...args: unknown[]) => unknown} value - Function at current
       *   context
       * @returns {unknown}
       */
      template (value) {
        // Call the function and return its result
        return value();
      }
    }
  };

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

  /**
   * @param {import('./JSONPathTransformerContext.js').
   *   JSONPathTransformerContextConfig<T>} config - Configuration object
   */
  constructor (config) {
    let map = /** @type {Record<string, boolean>} */ ({});
    this._config = config;
    /** @type {import('./index.js').JSONPathTemplateObject<T>[]} */
    this.rootTemplates = [];
    if (!config.templates) {
      throw new TypeError('config.templates is required');
    }
    this.templates = config.templates.map(function (template) {
      /** @type {import('./index.js').JSONPathTemplateObject<T>} */
      let normalized;
      if (Array.isArray(template)) {
        // Todo: We could allow a third argument (at beginning or
        //    end?) to represent template name
        normalized = /**
                      * @type {import('./index.js').
          JSONPathTemplateObject<T>} */ (
            {path: template[0], template: template[1]}
          );
      } else if (template.match && !template.path) {
        // Normalize 'match' to 'path' for XSLT compatibility
        normalized = {...template, path: template.match};
      } else {
        normalized = template;
      }
      // A declarative (jamilih-shaped) node array, as opposed to a
      // `TemplateFunction` — compile it once, up front, so every later
      // dispatch site (root, applyTemplates, callTemplate) only ever sees
      // a plain function.
      if (isJSONTemplateNodeArray(normalized.template)) {
        const format = normalized.format || config.defaultTemplateFormat ||
          'json';
        normalized = {
          ...normalized,
          template: compileJSONTemplate(normalized.template, {format})
        };
      }
      return normalized;
    });
    this.templates.forEach((template, i, templates) => {
      // eslint-disable-next-line @stylistic/max-len -- Long
      // eslint-disable-next-line unicorn/no-computed-property-existence-check -- Needed
      if (template.name && template.name in map) {
        throw new Error('Templates must all have different names.');
      }
      map[String(template.name)] = true;
      // Only check for root templates if path is defined
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
   * @returns {import('./index.js').ResultType<T>} The transformation result
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
    // Set up parameter context for valueOf() access in root template
    jte._params = {0: jte._contextObj};
    // `template` is always a function here: a declarative (jamilih-shaped)
    // Array is compiled to one up front, in the constructor.
    const {template: rootTemplateFn} =
      /**
       * @type {import('./index.js').JSONPathTemplateObject<T> &
       *   {template: import('./index.js').
       *     TemplateFunction<T, "json", JSONPathTransformerContext<T>>}}
       */ (
        templateObj
      );
    /**
     * The template may return a value synchronously or a Promise (e.g. from
     * `await this.indexedDB(...)`), which is awaited unless `config.sync`.
     * @type {any}
     */
    const ret = (
      // `this` carries runtime `extensions`; a consumer's `ContextExtensions`
      // augmentation would otherwise reject the bare context here.
      rootTemplateFn
    ).call(/** @type {any} */ (jte), undefined, {mode});

    if (ret !== null && typeof ret !== 'undefined' &&
        typeof ret.then === 'function') {
      if (this._config.sync) {
        throw new Error(
          'A template returned a Promise but JTLT is configured with ' +
          '`sync: true`.'
        );
      }
      return /** @type {any} */ (
        // eslint-disable-next-line @stylistic/max-len -- Long
        // eslint-disable-next-line promise/prefer-await-to-then -- intentional dynamic sync/async
        ret.then((/** @type {any} */ resolvedRet) => {
          if (typeof resolvedRet !== 'undefined') {
            const joiner = jte._getJoiningTransformer();
            if (typeof resolvedRet === 'string' ||
                (typeof resolvedRet === 'object' && resolvedRet !== null &&
                 'nodeType' in resolvedRet)) {
              joiner.append(/** @type {string|Node} */ (resolvedRet));
            } else {
              /** @type {import('./JSONJoiningTransformer.js').default} */ (
                joiner
              ).append(resolvedRet);
            }
          }
          return /** @type {import('./index.js').ResultType<T>} */ (
            jte.getOutput()
          );
        })
      );
    }

    if (typeof ret !== 'undefined') {
      // Will vary by jte._config.outputType
      // After the undefined check, ret is ResultType<T>
      const joiner = jte._getJoiningTransformer();
      if (typeof ret === 'string' ||
          (typeof ret === 'object' && ret !== null && 'nodeType' in ret)) {
        joiner.append(/** @type {string|Node} */ (ret));
      } else {
        /** @type {import('./JSONJoiningTransformer.js').default} */ (
          joiner
        ).append(ret);
      }
    }
    const result = jte.getOutput();
    return /** @type {import('./index.js').ResultType<T>} */ (result);
  }
}

export default JSONPathTransformer;
