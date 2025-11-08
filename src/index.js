import {getJSON} from 'simple-get-json';
// import JHTML from 'jhtml';
// import jsonpath from 'jsonpath-plus';
// import {jml} from 'jamilih';
import {JSDOM} from 'jsdom';

// import Stringifier from 'jhtml/SAJJ/SAJJ.Stringifier.js';

import DOMJoiningTransformer from './DOMJoiningTransformer.js';
import JSONJoiningTransformer from './JSONJoiningTransformer.js';
import JSONPathTransformer from './JSONPathTransformer.js';
import XPathTransformer from './XPathTransformer.js';
import StringJoiningTransformer from './StringJoiningTransformer.js';
import XSLTStyleJSONPathResolver from './XSLTStyleJSONPathResolver.js';

/**
 * A template declaration whose `template` executes with `this` bound
 * to the engine-specific context type `TCtx`.
 * @template TCtx
 * @typedef {object} TemplateObject
 * @property {string} path
 * @property {string} [name]
 * @property {string} [mode]
 * @property {number} [priority]
 * @property {(this: TCtx, value?: any, cfg?: {mode:string}) => any} template
 */

/**
 * @typedef {TemplateObject<
 *   import('./JSONPathTransformerContext.js').default
 * >} JSONPathTemplateObject
 */
/**
 * @typedef {TemplateObject<
 *   import('./XPathTransformerContext.js').default
 * >} XPathTemplateObject
 */

/**
 * Options common to both engines.
 * @typedef {object} BaseJTLTOptions
 * @property {Function} success A callback supplied with a single
 * argument that is the result of this instance's transform() method.
 * @property {any} [data] A JSON object or DOM document (XPath)
 * @property {string} [ajaxData] URL of a JSON file to retrieve for
 * evaluation
 * @property {boolean} [errorOnEqualPriority] Whether or not to
 * report an error when equal priority templates are found
 * @property {boolean} [autostart] Whether to begin transform()
 * immediately.
 * @property {boolean} [preventEval] Whether to prevent
 * parenthetical evaluations in JSONPath. Safer if relying on user
 * input, but reduces capabilities of JSONPath.
 * @property {boolean} [unwrapSingleResult] For JSON output, whether to
 * unwrap single-element root arrays to return just the element
 * @property {string} [mode] The mode in which to begin the transform.
 * @property {'string'|'dom'|'json'} [outputType] Output type
 * @property {Function} [engine] Will be based the
 * same config as passed to this instance. Defaults to a transforming
 * function based on JSONPath and with its own set of priorities for
 * processing templates.
 * @property {Function} [specificityPriorityResolver]
 * Callback for getting the priority by specificity
 * @property {{get: Function, append: Function, string?: Function,
 *   object?: Function, array?: Function}} [joiningTransformer] Can
 * be a singleton or class instance. Defaults to string joining for output
 * transformation.
 * @property {object} [joiningConfig] Config to pass on to the joining
 *   transformer
 * @property {any} [parent] Parent object for context
 * @property {string} [parentProperty] Parent property name for context
 */

/**
 * JSONPath engine options with context-aware template typing.
 * @typedef {BaseJTLTOptions & {
 *   templates?: JSONPathTemplateObject[] | Function,
 *   template?: JSONPathTemplateObject | ((
 *     this: import('./JSONPathTransformerContext.js').default,
 *     value?: any,
 *     cfg?: {mode:string}
 *   ) => any),
 *   query?: (
 *     this: import('./JSONPathTransformerContext.js').default,
 *     value?: any,
 *     cfg?: {mode:string}
 *   ) => any,
 *   forQuery?: any[],
 *   engineType?: 'jsonpath',
 * }} JSONPathJTLTOptions
 */

/**
 * XPath engine options with context-aware template typing.
 * @typedef {BaseJTLTOptions & {
 *   templates?: XPathTemplateObject[] | Function,
 *   template?: XPathTemplateObject | ((
 *     this: import('./XPathTransformerContext.js').default,
 *     value?: any,
 *     cfg?: {mode:string}
 *   ) => any),
 *   query?: (
 *     this: import('./XPathTransformerContext.js').default,
 *     value?: any,
 *     cfg?: {mode:string}
 *   ) => any,
 *   forQuery?: any[],
 *   engineType: 'xpath',
 *   xpathVersion?: 1|2,
 * }} XPathJTLTOptions
 */

/** @typedef {JSONPathJTLTOptions | XPathJTLTOptions} JTLTOptions */

const {window} = new JSDOM();
const {document} = window;

/**
 * High-level façade for running a JTLT transform.
 *
 * Accepts data and templates (or a root template/query), constructs a joining
 * transformer based on `outputType`, and invokes the JSONPath-based engine.
 * The result is returned to the required `success` callback and also returned
 * from transform().
 */
class JTLT {
  /**
   * For templates/queries, one may choose among config.query,
   * config.template, or config.templates, but one must be
   * present and of valid type. For the source json, one must use
   * either a valid config.ajaxData or config.data parameter.
   * @overload
   * @param {JSONPathJTLTOptions} config Options for JSONPath engine
   */
  /**
   * @overload
   * @param {XPathJTLTOptions} config Options for XPath engine
   */
  /**
   * @param {JTLTOptions} config Options
   * @todo Remove JSONPath dependency in query use of '$'?
   */
  constructor (config) {
    /** @type {JTLTOptions} */
    this.config = config || {};

    // Track if a custom joiner was provided
    /** @type {any} */ (this.config)._customJoiningTransformer =
      Boolean(this.config.joiningTransformer);

    this.setDefaults(config);

    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    if (this.config.ajaxData) {
      getJSON(this.config.ajaxData, (function (cfg) {
        return function (json) {
          that.config.data = json;
          that._autoStart(/** @type {any} */ (cfg).mode);
        };
      }(config)));
      return;
    }
    if (this.config.data === undefined) {
      throw new Error('You must supply either config.ajaxData or config.data');
    }
    this._autoStart(/** @type {any} */ (config).mode);
  }

  /**
   * @returns {DOMJoiningTransformer|JSONJoiningTransformer|
   *   StringJoiningTransformer}
   */
  _createJoiningTransformer () {
    let JT;
    switch (this.config.outputType) {
    case 'dom':
      JT = DOMJoiningTransformer;
      break;
    case 'json':
      JT = JSONJoiningTransformer;
      break;
    case 'string': default:
      JT = StringJoiningTransformer;
      break;
    }

    /** @type {any} */
    let initial;

    // Derive a document to use for joiners when running XPath engine
    /** @type {Document|undefined} */
    let docForJoiner;
    if ((/** @type {any} */ (this.config)).engineType === 'xpath') {
      const {data} = /** @type {any} */ (this.config);
      if (data && typeof data === 'object') {
        // Document
        if (data.nodeType === 9) {
          docForJoiner = data;
        // Element or Node with ownerDocument
        } else if (data.ownerDocument) {
          docForJoiner = data.ownerDocument;
        }
      }
    }
    if (JT === StringJoiningTransformer) {
      initial = '';
    } else if (JT === DOMJoiningTransformer) {
      initial = (docForJoiner || document).createDocumentFragment();
    } else {
      initial = [];
    }

    // Build config for joining transformer
    const joiningConfig = this.config.joiningConfig || {
      string: {}, json: {}, dom: {}, jamilih: {},
      document: docForJoiner || document
    };

    // Pass unwrapSingleResult to JSON joiner if configured
    if (JT === JSONJoiningTransformer &&
    /** @type {any} */ (this.config).unwrapSingleResult) {
      /** @type {any} */ (joiningConfig).unwrapSingleResult = true;
    }

    return new JT(initial, joiningConfig);
  }

  /**
   * @param {string} mode
   * @returns {void}
   */
  _autoStart (mode) {
    // We wait to set this default as we want to pass in the data
    this.config.joiningTransformer = this.config.joiningTransformer ||
      this._createJoiningTransformer();

    if (this.config.autostart === false) {
      return;
    }

    this.transform(mode);
  }

  /**
   * @param {JTLTOptions} config
   * @returns {JTLT}
   */
  setDefaults (config) {
    /** @type {JTLTOptions} */
    this.config = config || {};
    const cfg = this.config;
    const query = cfg.forQuery
      // eslint-disable-next-line @stylistic/operator-linebreak -- TS
      ? /**
       * @this {any}
       * @returns {void}
       */
      function () {
        this.forEach([].slice.call(cfg.forQuery));
      }
      : cfg.query || (
        typeof cfg.templates === 'function'
          ? cfg.templates
          : typeof cfg.template === 'function'
            ? cfg.template
            : null
      );
    this.config.templates = query
      ? /** @type {any} */ ([
        {name: 'root', path: '$', template: /** @type {any} */ (query)}
      ])
      : /** @type {any} */ (cfg.templates || [cfg.template]);
    this.config.errorOnEqualPriority = cfg.errorOnEqualPriority || false;
    this.config.engine = this.config.engine ||
      /**
       * @param {JTLTOptions} configParam
       * @returns {any}
       */
      function (configParam) {
        if ((/** @type {any} */ (configParam)).engineType === 'xpath') {
          const xt = new XPathTransformer(/** @type {any} */ (configParam));
          return xt.transform(/** @type {any} */ (configParam).mode);
        }
        const jpt = new JSONPathTransformer(/** @type {any} */ (configParam));
        return jpt.transform(/** @type {any} */ (configParam).mode);
      };
    // Todo: Let's also, unlike XSLT and the following, give options for
    //   higher priority to absolute fixed paths over recursive descent
    //   and priority to longer paths and lower to wildcard terminal points
    this.config.specificityPriorityResolver =
      this.config.specificityPriorityResolver || (function () {
        const xsjpr = new XSLTStyleJSONPathResolver();
        return function (/** @type {string} */ path) {
          return xsjpr.getPriorityBySpecificity(path);
        };
      }());
    return this;
  }

  /**
   * @param {string} mode The mode of the transformation
   * @returns {any} Result of transformation
   * @todo Allow for a success callback in case the jsonpath code is modified
   *     to work asynchronously (as with queries to access remote JSON
   *     stores)
   */
  transform (mode) {
    if (this.config.data === undefined) {
      if (this.config.ajaxData === undefined) {
        throw new Error("You must supply a 'data' or 'ajaxData' property");
      }
      throw new Error('You must wait until the ajax file is retrieved');
    }
    if (typeof this.config.success !== 'function') {
      throw new TypeError("You must supply a 'success' callback");
    }

    // Create a fresh joining transformer for each transform to avoid
    // accumulation, but only if a custom one wasn't provided
    if (!(/** @type {any} */ (this.config))._customJoiningTransformer) {
      this.config.joiningTransformer = this._createJoiningTransformer();
    }

    this.config.mode = mode;
    const ret = /** @type {Function} */ (this.config.success)(
      (/** @type {any} */ (this.config.engine))(this.config)
    );
    return ret;
  }
}

export {
  default as AbstractJoiningTransformer
} from './AbstractJoiningTransformer.js';
export {
  default as StringJoiningTransformer
} from './StringJoiningTransformer.js';
export {
  default as DOMJoiningTransformer
} from './DOMJoiningTransformer.js';
export {
  default as JSONJoiningTransformer
} from './JSONJoiningTransformer.js';
export {
  default as XSLTStyleJSONPathResolver
} from './XSLTStyleJSONPathResolver.js';
export {
  default as JSONPathTransformerContext
} from './JSONPathTransformerContext.js';
export {
  default as JSONPathTransformer
} from './JSONPathTransformer.js';
export {
  default as XPathTransformerContext
} from './XPathTransformerContext.js';
export {
  default as XPathTransformer
} from './XPathTransformer.js';

export default JTLT;
