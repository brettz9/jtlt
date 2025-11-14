import {getJSON} from 'simple-get-json';

import DOMJoiningTransformer from './DOMJoiningTransformer.js';
import JSONJoiningTransformer from './JSONJoiningTransformer.js';
import JSONPathTransformer from './JSONPathTransformer.js';
import XPathTransformer from './XPathTransformer.js';
import StringJoiningTransformer from './StringJoiningTransformer.js';
import XSLTStyleJSONPathResolver from './XSLTStyleJSONPathResolver.js';

/** @type {import('jsdom').DOMWindow | typeof globalThis} */
let _win;
/**
 * @param {import('jsdom').DOMWindow | typeof globalThis} win
 */
export const setWindow = (win) => {
  _win = win;
};

/**
 * Internal options extension adding private runtime state flags.
 * Not part of the public API surface but used for narrowing casts.
 * @typedef {JTLTOptions & {
 *   _customJoiningTransformer?: boolean
 * }} InternalJTLTOptions
 */

/**
 * A template declaration whose `template` executes with `this` bound
 * to the engine-specific context type `TCtx`.
 * Either `path` must be provided (for pattern matching), or `name` must be
 * provided (for named templates callable via callTemplate), or both.
 * @template T
 * @template U
 * @template TCtx
 * @typedef {object} TemplateObject
 * @property {string} [path] - JSONPath or XPath selector for matching nodes
 * @property {string} [name] - Optional name for calling via callTemplate
 * @property {string} [mode] - Optional mode for template matching
 * @property {number} [priority] - Priority for template selection
 * @property {TemplateFunction<T, U, TCtx>} template - Template function
 */

/**
 * A callable template function with an engine-specific `this`.
 * @template T
 * @template U
 * @template TCtx
 * @typedef {(this: TCtx,
 *   value: ResultType<U>,
 *   cfg?: {mode?: string}
 * ) => ResultType<T>|void} TemplateFunction
 */

/**
 * @template T
 * @typedef {TemplateObject<T, "json",
 *   import('./JSONPathTransformerContext.js').default<T>
 * >} JSONPathTemplateObject
 */
/**
 * @template T
 * @typedef {TemplateObject<T, "dom",
 *   import('./XPathTransformerContext.js').default
 * >} XPathTemplateObject
 */
/**
 * @template T
 * @typedef {(XPathTemplateObject<T> | [string, TemplateFunction<T, "dom",
 *   import('./XPathTransformerContext.js').default
 * >])[]} XPathTemplateArray
 */
/**
 * @template T
 * @typedef {JSONPathTemplateObject<T> | [string, TemplateFunction<T, "json",
 *   import('./JSONPathTransformerContext.js').default
 * >]} JSONPathTemplateArray
 */

/**
 * @typedef {(
 *   StringJoiningTransformer|
 *   DOMJoiningTransformer|
 *   JSONJoiningTransformer
 * )} JoiningTransformer
 */

/**
 * @typedef {"json"|"string"|"dom"} joiningTypes
 */

/**
 * @template T
 * @typedef {T extends "json" ? unknown : T extends "string" ? string :
 *   DocumentFragment|Element} ResultType
 */

/**
 * Options common to both engines.
 * @template T
 * @typedef {object} BaseJTLTOptions
 * @property {(
 *   result: ResultType<T>
 * ) => void} success A callback supplied
 *   with a single argument that is the result of this instance's
 *   transform() method. When used in TypeScript, this can be made
 *   generic as `success<T>(result: T): void`.
 * @property {null|boolean|number|string|object} [data] A JSON
 *   object or DOM document (XPath)
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
 * @property {boolean} [exposeDocuments] When true, joiners return an array
 * of complete documents: XMLDocument[] for DOM, document wrapper objects[]
 * for JSON, and string[] for string joiners. Each array element corresponds
 * to a root element built during transformation.
 * @property {string} [mode] The mode in which to begin the transform.
 * @property {(opts: JTLTOptions &
 *   Required<Pick<JTLTOptions, "joiningTransformer">>
 * ) => ResultType<T>} [engine] Will be based on the
 * same config as passed to this instance. Defaults to a transforming
 * function based on JSONPath and with its own set of priorities for
 * processing templates.
 * @property {(path: string) => 0 | 0.5 | -0.5} [specificityPriorityResolver]
 * Callback for getting the priority by specificity
 * @property {JoiningTransformer} [joiningTransformer]
 * A concrete joining transformer instance (or custom subclass) responsible
 * for accumulating output. When omitted, one is created automatically based
 * on `outputType`.
 * @property {import('./AbstractJoiningTransformer.js').
 *   JoiningTransformerConfig<T>} [joiningConfig] Config for the joining
 *   transformer.
 * @property {object} [parent] Parent object for context
 * @property {string} [parentProperty] Parent property name for context
 */

/**
 * JSONPath engine options with context-aware template typing.
 * @template [T = "json"]
 * @typedef {BaseJTLTOptions<T> & {
 *   templates?: JSONPathTemplateArray<T>[],
 *   template?: JSONPathTemplateObject<T> | TemplateFunction<T, "json",
 *     import('./JSONPathTransformerContext.js').default
 *   >,
 *   query?: TemplateFunction<T, "json",
 *     import('./JSONPathTransformerContext.js').default
 *   >,
 *   forQuery?: [string, TemplateFunction<T, "json",
 *     import('./XPathTransformerContext.js').default
 *   >],
 *   engineType?: 'jsonpath',
 *   outputType?: T
 * }} JSONPathJTLTOptions
 */

/**
 * XPath engine options with context-aware template typing.
 * @template T
 * @typedef {BaseJTLTOptions<T> & {
 *   templates?: XPathTemplateArray<T>,
 *   template?: XPathTemplateObject<T> | TemplateFunction<T, "dom",
 *     import('./XPathTransformerContext.js').default
 *   >,
 *   query?: TemplateFunction<T, "dom",
 *     import('./XPathTransformerContext.js').default
 *   >,
 *   forQuery?: [string, TemplateFunction<T, "dom",
 *     import('./JSONPathTransformerContext.js').default
 *   >],
 *   engineType: 'xpath',
 *   xpathVersion?: 1|2|3.1,
 *   outputType?: T
 * }} XPathJTLTOptions
 */

/**
 * @typedef {JSONPathJTLTOptions |
 *   JSONPathJTLTOptions<"string"> |
 *   JSONPathJTLTOptions<"dom"> |
 *   XPathJTLTOptions<"json">|
 *   XPathJTLTOptions<"string">|
 *   XPathJTLTOptions<"dom">} JTLTOptions
 */

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
   * @param {XPathJTLTOptions<"json">} config Options for XPath engine
   */
  /**
   * @overload
   * @param {XPathJTLTOptions<"string">} config Options for XPath engine
   */
  /**
   * @overload
   * @param {XPathJTLTOptions<"dom">} config Options for XPath engine
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
     * @type {InternalJTLTOptions}
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

    // Build config, supporting both direct config or nested structure
    const baseConfig = this.config.joiningConfig || {};

    switch (this.config.outputType) {
    case 'dom': {
      /**
       * @type {import('./AbstractJoiningTransformer.js').
       *   DOMJoiningTransformerConfig}
       */
      const domConfig = /** @type {typeof domConfig} */ ({
        ...baseConfig,
        document: docForJoiner || _win.document
      });
      if (this.config.exposeDocuments) {
        domConfig.exposeDocuments = true;
      }
      const initial = (docForJoiner || _win.document).createDocumentFragment();
      return new DOMJoiningTransformer(initial, domConfig);
    }
    case 'json': {
      /**
       * @type {import('./AbstractJoiningTransformer.js').
       *   JSONJoiningTransformerConfig}
       */
      const jsonConfig = /** @type {typeof jsonConfig} */ ({
        ...baseConfig
      });
      // Pass unwrapSingleResult to JSON joiner if configured
      if (this.config.unwrapSingleResult) {
        jsonConfig.unwrapSingleResult = true;
      }
      // Pass exposeDocuments to JSON joiner if configured
      if (this.config.exposeDocuments) {
        jsonConfig.exposeDocuments = true;
      }
      return new JSONJoiningTransformer([], jsonConfig);
    }
    case 'string': default: {
      /**
       * @type {import('./AbstractJoiningTransformer.js').
       *   StringJoiningTransformerConfig}
       */
      const stringConfig = /** @type {typeof stringConfig} */ ({
        ...baseConfig
      });
      if (this.config.exposeDocuments) {
        stringConfig.exposeDocuments = true;
      }
      return new StringJoiningTransformer('', stringConfig);
    }
    }
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
         * @this {import('./JSONPathTransformerContext.js').default |
         *   import('./XPathTransformerContext.js').default}
         * @returns {void}
         */
      function () {
        const [path, fn] =
          /**
           * @type {[string, TemplateFunction<
           *   joiningTypes,
           *   "dom"|"json",
           *   import('./JSONPathTransformerContext.js').default |
           *   import('./XPathTransformerContext.js').default
           * >]}
           */ (
            cfg.forQuery
          );
        // eslint-disable-next-line @stylistic/max-len -- Long
        // eslint-disable-next-line unicorn/no-array-method-this-argument -- Not array
        this.forEach(path, fn);
      }
      : cfg.query || (
        typeof cfg.templates === 'function'
          ? cfg.templates
          : typeof cfg.template === 'function'
            ? cfg.template
            : null
      );
    this.config.templates = query
      ? this.config.engineType === 'xpath'
        ? /** @type {XPathTemplateObject<joiningTypes>[]} */ ([
          {name: 'root', path: '//*', template: query}
        ])
        : /** @type {JSONPathTemplateObject<joiningTypes>[]} */ ([
          {name: 'root', path: '$', template: query}
        ])
      // eslint-disable-next-line @stylistic/max-len -- Long
      : /** @type {JSONPathTemplateObject<joiningTypes>[]|XPathTemplateObject<joiningTypes>[]} */ (
        cfg.templates || [cfg.template]
      );
    this.config.errorOnEqualPriority = cfg.errorOnEqualPriority || false;
    this.config.engine = this.config.engine ||
      /**
       * @param {JTLTOptions &
       *   Required<Pick<JTLTOptions, "joiningTransformer">>} configParam
       * @returns {ResultType<joiningTypes>}
       */
      function (configParam) {
        if (configParam.engineType === 'xpath') {
          let xt;
          /* c8 ignore next -- Defensive: outputType set in setDefaults */
          const outputType = cfg.outputType || 'json';
          // eslint-disable-next-line sonarjs/no-all-duplicated-branches -- TS
          if (outputType === 'string') {
            xt = new (/** @type {typeof XPathTransformer<"string">} */ (
              XPathTransformer
            ))(
              /**
               * @type {import('./XPathTransformer.js').
               *   XPathTransformerConfig<"string"> &
               *   import('./XPathTransformerContext.js').
               *   XPathTransformerContextConfig}
               */
              (configParam)
            );
          // eslint-disable-next-line sonarjs/no-duplicated-branches -- TS
          } else if (outputType === 'json') {
            xt = new (/** @type {typeof XPathTransformer<"json">} */ (
              XPathTransformer
            ))(
              /**
               * @type {import('./XPathTransformer.js').
               *   XPathTransformerConfig<"json"> &
               *   import('./XPathTransformerContext.js').
               *   XPathTransformerContextConfig}
               */
              (configParam)
            );
          // eslint-disable-next-line sonarjs/no-duplicated-branches -- TS
          } else {
            xt = new (/** @type {typeof XPathTransformer<"dom">} */ (
              XPathTransformer
            ))(
              /**
               * @type {import('./XPathTransformer.js').
               *   XPathTransformerConfig<"dom"> &
               *   import('./XPathTransformerContext.js').
               *   XPathTransformerContextConfig}
               */
              (configParam)
            );
          }
          return xt.transform(configParam.mode);
        }

        // Type assertion is safe here because _createJoiningTransformer
        // ensures the joiningTransformer type matches outputType
        const outputType = configParam.outputType || 'json';

        // Branch based on outputType to help TypeScript narrow the type
        if (outputType === 'string') {
          const jpt = new JSONPathTransformer(
            /**
             * @type {import('./JSONPathTransformerContext.js').
             *   JSONPathTransformerContextConfig<"string">}
             */
            (configParam)
          );
          return jpt.transform(configParam.mode);
        }
        if (outputType === 'dom') {
          const jpt = new JSONPathTransformer(
            /**
             * @type {import('./JSONPathTransformerContext.js').
             *   JSONPathTransformerContextConfig<"dom">}
             */
            (configParam)
          );
          return jpt.transform(configParam.mode);
        }
        const jpt = new JSONPathTransformer(
          /**
           * @type {import('./JSONPathTransformerContext.js').
           *   JSONPathTransformerContextConfig<"json">}
           */
          (configParam)
        );
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
   * @returns {void}
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
       * @type {InternalJTLTOptions}
       */
      (this.config)
    )._customJoiningTransformer) {
      this.config.joiningTransformer = this._createJoiningTransformer();
    }

    this.config.mode = mode;
    const {engine} = this.config;
    /* c8 ignore next 3 -- Defensive: always configured by setDefaults */
    if (!engine) {
      throw new Error('Engine is not configured');
    }
    const result = engine(
      // eslint-disable-next-line @stylistic/max-len -- Long type
      /** @type {JTLTOptions & Required<Pick<JTLTOptions, "joiningTransformer">>} */ (
        this.config
      )
    );
    // The engine returns ResultType<T>. We cast through never to bypass
    // the impossible intersection type that TypeScript infers for the union.
    const ret = this.config.success(
      /** @type {never} */ (result)
    );
    return ret;
  }
}

/**
 * Create and run a JTLT instance with the appropriate engine typing.
 *
 * Overloads help TypeScript select the correct constructor signature.
 * @overload
 * @param {Omit<JSONPathJTLTOptions<"json">, "success">} cfg
 * @returns {Promise<ResultType<"json">>}
 */
/**
 * @overload
 * @param {Omit<JSONPathJTLTOptions<"string">, "success">} cfg
 * @returns {Promise<ResultType<"string">>}
 */
/**
 * @overload
 * @param {Omit<JSONPathJTLTOptions<"dom">, "success">} cfg
 * @returns {Promise<ResultType<"dom">>}
 */
/**
 * @overload
 * @param {Omit<XPathJTLTOptions<"json">, "success">} cfg
 * @returns {Promise<ResultType<"json">>}
 */
/**
 * @overload
 * @param {Omit<XPathJTLTOptions<"dom">, "success">} cfg
 * @returns {Promise<ResultType<"dom">>}
 */
/**
 * @overload
 * @param {Omit<XPathJTLTOptions<"string">, "success">} cfg
 * @returns {Promise<ResultType<"string">>}
 */
/**
 * @param {Omit<JTLTOptions, "success">} cfg Options
 */
export function jtlt (cfg) {
  // eslint-disable-next-line promise/avoid-new -- Own API
  return new Promise((resolve) => {
    // Narrow the constructor overload based on engineType
    if (cfg && cfg.engineType === 'xpath') {
      const outputType = cfg.outputType || 'string';

      if (outputType === 'json') {
        // eslint-disable-next-line no-new -- API
        new JTLT(
          /** @type {XPathJTLTOptions<"json">} */ ({
            ...cfg,
            outputType: 'json',
            success (val) {
              resolve(val);
            }
          })
        );
      } else if (outputType === 'dom') {
        // eslint-disable-next-line no-new -- API
        new JTLT(
          /** @type {XPathJTLTOptions<"dom">} */ ({
            ...cfg,
            outputType: 'dom',
            success (val) {
              resolve(val);
            }
          })
        );
      } else {
        // eslint-disable-next-line no-new -- API
        new JTLT(
          /** @type {XPathJTLTOptions<"string">} */ ({
            ...cfg,
            outputType: 'string',
            success (val) {
              resolve(val);
            }
          })
        );
      }
      return;
    }

    const outputType = cfg.outputType || 'json';

    if (outputType === 'string') {
      // eslint-disable-next-line no-new -- API
      new JTLT(
        /** @type {JSONPathJTLTOptions<"string">} */ ({
          ...cfg,
          outputType: 'string',
          success (val) {
            resolve(val);
          }
        })
      );
    } else if (outputType === 'dom') {
      // eslint-disable-next-line no-new -- API
      new JTLT(
        /** @type {JSONPathJTLTOptions<"dom">} */ ({
          ...cfg,
          outputType: 'dom',
          success (val) {
            resolve(val);
          }
        })
      );
    } else {
      // eslint-disable-next-line no-new -- API
      new JTLT(
        /** @type {JSONPathJTLTOptions<"json">} */ ({
          ...cfg,
          outputType: 'json',
          success (val) {
            resolve(val);
          }
        })
      );
    }
  });
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
