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
import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';

/**
 * @typedef {object} TransformerContextJoiningTransformer
 * @property {(item: any) => void} append Append
 *   output
 * @property {() => any} get Get output
 * @property {(str: string,
 *   cb?: (this: any) => void
 * ) => void} string Emit string
 * @property {(...args: any[]) => void} object Emit
 *   object
 * @property {(...args: any[]) => void} array Emit
 *   array
 */

/**
 * A template declaration whose `template` executes with `this` bound
 * to the engine-specific context type `TCtx`.
 * @template TCtx
 * @typedef {object} TemplateObject
 * @property {string} path
 * @property {string} [name]
 * @property {string} [mode]
 * @property {number} [priority]
 * @property {TemplateFunction<TCtx>} template
 */

/**
 * A callable template function with an engine-specific `this`.
 * @template TCtx
 * @typedef {(this: TCtx,
 *   value?: any,
 *   cfg?: {mode?: string}
 * ) => any} TemplateFunction
 */

/**
 * @template [T = "json"]
 * @typedef {TemplateObject<
 *   import('./JSONPathTransformerContext.js').default<T>
 * >} JSONPathTemplateObject
 */
/**
 * @typedef {TemplateObject<
 *   import('./XPathTransformerContext.js').default
 * >} XPathTemplateObject
 */
/**
 * @typedef {(XPathTemplateObject | [string, TemplateFunction<
 *   import('./XPathTransformerContext.js').default
 * >])[]} XPathTemplateArray
 */
/**
 * @template T
 * @typedef {JSONPathTemplateObject<T> | [string, TemplateFunction<
 *   import('./JSONPathTransformerContext.js').default
 * >]} JSONPathTemplateArray
 */

/**
 * Options common to both engines.
 * @typedef {object} BaseJTLTOptions
 * @property {(result: any) => void} success A callback supplied
 *   with a single argument that is the result of this instance's
 *   transform() method. When used in TypeScript, this can be made
 *   generic as `success<T>(result: T): void`.
 * @property {unknown} [data] A JSON object or DOM document (XPath)
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
 * @property {(opts: JTLTOptions) => unknown} [engine] Will be based the
 * same config as passed to this instance. Defaults to a transforming
 * function based on JSONPath and with its own set of priorities for
 * processing templates.
 * @property {(path: string) => 0 | 0.5 | -0.5} [specificityPriorityResolver]
 * Callback for getting the priority by specificity
 * @property {TransformerContextJoiningTransformer & (
 *     AbstractJoiningTransformer<"string">|
 *     AbstractJoiningTransformer<"dom">|
 *     AbstractJoiningTransformer<"json">
 * )} [joiningTransformer]
 * A concrete joining transformer instance (or custom subclass) responsible
 * for accumulating output. When omitted, one is created automatically based
 * on `outputType`.
 * @property {Record<string, unknown>} [joiningConfig] Config for the joining
 *   transformer
 * @property {unknown} [parent] Parent object for context
 * @property {string} [parentProperty] Parent property name for context
 */

/**
 * JSONPath engine options with context-aware template typing.
 * @template [T = "json"]
 * @typedef {BaseJTLTOptions & {
 *   templates?: JSONPathTemplateArray<T>[],
 *   template?: JSONPathTemplateObject<T> | TemplateFunction<
 *     import('./JSONPathTransformerContext.js').default
 *   >,
 *   query?: TemplateFunction<
 *     import('./JSONPathTransformerContext.js').default
 *   >,
 *   forQuery?: unknown[],
 *   engineType?: 'jsonpath',
 *   outputType?: T
 * }} JSONPathJTLTOptions
 */

/**
 * XPath engine options with context-aware template typing.
 * @typedef {BaseJTLTOptions & {
 *   templates: XPathTemplateArray,
 *   template?: XPathTemplateObject | TemplateFunction<
 *     import('./XPathTransformerContext.js').default
 *   >,
 *   query?: TemplateFunction<
 *     import('./XPathTransformerContext.js').default
 *   >,
 *   forQuery?: unknown[],
 *   engineType?: 'xpath',
 *   xpathVersion?: 1|2,
 *   outputType?: 'string'|'dom'|'json'
 * }} XPathJTLTOptions
 */

/**
 * @typedef {JSONPathJTLTOptions |
 *   JSONPathJTLTOptions<"string"> |
 *   JSONPathJTLTOptions<"dom"> |
 *   XPathJTLTOptions} JTLTOptions
 */

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
   * @param {JSONPathJTLTOptions<"string">} config Options for JSONPath engine
   */
  /**
   * @overload
   * @param {JSONPathJTLTOptions<"dom">} config Options for JSONPath engine
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
    /**
     * @type {import('./types.js').InternalJTLTOptions}
     */
    (this.config)._customJoiningTransformer =
      Boolean(this.config.joiningTransformer);

    this.setDefaults(config);

    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    if (this.config.ajaxData) {
      getJSON(this.config.ajaxData, (function (cfg) {
        return function (json) {
          that.config.data = json;
          that._autoStart(cfg.mode);
        };
      }(config)));
      return;
    }
    if (this.config.data === undefined) {
      throw new Error('You must supply either config.ajaxData or config.data');
    }
    this._autoStart(config.mode);
  }

  /**
   * @returns {DOMJoiningTransformer|JSONJoiningTransformer|
   *   StringJoiningTransformer}
   */
  _createJoiningTransformer () {
    /**
     * @type {typeof DOMJoiningTransformer|typeof JSONJoiningTransformer|
     *   typeof StringJoiningTransformer}
     */
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
    if (this.config.engineType === 'xpath') {
      const {data} = this.config;
      if (data && typeof data === 'object') {
        const dataNode = /** @type {Document|Element} */ (data);
        // Document
        if ((/** @type {Document} */ (dataNode)).nodeType === 9) {
          docForJoiner = /** @type {Document} */ (dataNode);
        // Element or Node with ownerDocument
        } else if ((/** @type {Element} */ (dataNode)).ownerDocument) {
          docForJoiner = (/** @type {Element} */ (dataNode)).ownerDocument;
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
    if (JT === JSONJoiningTransformer && this.config.unwrapSingleResult) {
      joiningConfig.unwrapSingleResult = true;
    }

    // @ts-expect-error Ok
    return new JT(initial, joiningConfig);
  }

  /**
   * @param {string|undefined} mode
   * @returns {void}
   */
  _autoStart (mode) {
    // We wait to set this default as we want to pass in the data
    this.config.joiningTransformer = this.config.joiningTransformer ||
      this._createJoiningTransformer();

    if (this.config.autostart === false) {
      return;
    }

    this.transform(/** @type {string} */ (mode));
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
        this.forEach(...[].slice.call(cfg.forQuery));
      }
      : cfg.query || (
        typeof cfg.templates === 'function'
          ? cfg.templates
          : typeof cfg.template === 'function'
            ? cfg.template
            : null
      );
    this.config.templates = query
      ? /** @type {JSONPathTemplateObject[]|XPathTemplateObject[]} */ ([
        {name: 'root', path: '$', template: query}
      ])
      : /** @type {JSONPathTemplateObject[]|XPathTemplateObject[]} */ (
        cfg.templates || [cfg.template]
      );
    this.config.errorOnEqualPriority = cfg.errorOnEqualPriority || false;
    this.config.engine = this.config.engine ||
      /**
       * @param {JTLTOptions} configParam
       * @returns {any}
       */
      function (configParam) {
        if (configParam.engineType === 'xpath') {
          const xt = new XPathTransformer(configParam);
          return xt.transform(configParam.mode);
        }
        const jpt = new JSONPathTransformer(/** @type {any} */ (configParam));
        return jpt.transform(configParam.mode);
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
   * @param {string} [mode] The mode of the transformation
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
    if (!(
      /**
       * @type {import('./types.js').InternalJTLTOptions}
       */
      (this.config)
    )._customJoiningTransformer) {
      this.config.joiningTransformer = this._createJoiningTransformer();
    }

    this.config.mode = mode;
    const ret = this.config.success(
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
