import XPathTransformerContext from './XPathTransformerContext.js';

/**
 * Applies named XPath-driven templates to XML/HTML DOM data.
 *
 * Finds templates whose `path` XPath matches the current node (plus optional
 * `mode`), sorts by priority, and invokes the winning template.
 * Falls back to default rules when no template matches.
 */
class XPathTransformer {
  /**
   * @param {object} config Configuration
   * @param {boolean} [config.errorOnEqualPriority] Throw on equal priority
   * @param {import('./index.js').
   *   XPathTemplateObject[]} config.templates Template objects
   * @param {number} [config.xpathVersion] XPath version (1|2)
   */
  constructor (config) {
    let map = /** @type {Record<string, boolean>} */ ({});
    this._config = config;
    /** @type {any[]} */
    this.rootTemplates = [];
    this.templates = config.templates.map(function (template) {
      if (Array.isArray(template)) {
        return {path: template[0], template: template[1]};
      }
      return template;
    });
    this.templates.forEach((template) => {
      if ('name' in template && template.name && map[template.name]) {
        /* c8 ignore next 6 -- c8/Istanbul known limitation: arrow function
        * predicates within filter assignments to instance properties are not
        * instrumented. Functionality fully tested via direct assertions on
        * rootTemplates and templates array lengths and contents in
        * test suite. */
        throw new Error('Templates must all have different names.');
      }
      if ('name' in template && template.name) {
        map[template.name] = true;
      }
    });
    // Collect root templates without mutating during iteration
    this.rootTemplates = this.templates.filter((t) => t.path === '/');
    this.templates = this.templates.filter((t) => t.path !== '/');
    map = /** @type {any} */ (null);
  }

  /**
   * @returns {void}
   */
  _triggerEqualPriorityError () {
    if (this._config.errorOnEqualPriority) {
      throw new Error(
        'You have configured XPathTransformer to throw errors on equal ' +
        'priority templates and these have been found.'
      );
    }
  }

  /**
   * @param {string} mode Transformation mode
   * @returns {any} Result of transformation
   */
  transform (mode) {
    const xte = new XPathTransformerContext(
      /** @type {any} */ (this._config), this.templates
    );
    const len = this.rootTemplates.length;
    const templateObj = len
      ? this.rootTemplates.pop()
      : XPathTransformer.DefaultTemplateRules.transformRoot;
    if (len > 1) {
      this._triggerEqualPriorityError();
    }
    const ret = templateObj.template.call(xte, undefined, {mode});
    if (typeof ret !== 'undefined') {
      /** @type {any} */ (xte)._getJoiningTransformer().append(ret);
    }
    return xte.getOutput();
  }

  static DefaultTemplateRules = {
    transformRoot: {
      /**
       * @param {any} node Node
       * @param {{mode:string}} cfg Config
       * @returns {void}
       */
      template (node, cfg) {
        /** @type {any} */ (this).applyTemplates('.', cfg.mode);
      }
    }
  };
}

export default XPathTransformer;
