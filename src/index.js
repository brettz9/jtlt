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
  // eslint-disable-next-line @stylistic/max-len -- Long
  // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- Desired
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
 * @property {string} [match] - Alias for 'path' (XSLT compatibility)
 * @property {string} [name] - Optional name for calling via callTemplate
 * @property {string} [mode] - Optional mode for template matching
 * @property {number} [priority] - Priority for template selection
 * @property {TemplateFunction<T, U, TCtx>} template - Template function
 */

/**
 * A callable template function with an engine-specific `this`. The `this`
 * type is intersected with {@link ContextExtensions} so helpers registered
 * through the `extensions` option are visible once a consumer augments that
 * interface.
 * @template T
 * @template U
 * @template TCtx
 * @typedef {(this: TCtx &
 *     import('./context-extensions.js').ContextExtensions,
 *   value: ResultType<U>,
 *   cfg?: {mode?: string}
 * ) => ResultType<T>|void|Promise<ResultType<T>|void>} TemplateFunction
 */

/**
 * @template {"json"|"string"|"dom"} T
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
 * @template {"json"|"string"|"dom"} T
 * @typedef {JSONPathTemplateObject<T> | [string, TemplateFunction<T, "json",
 *   import('./JSONPathTransformerContext.js').default
 * >]} JSONPathTemplateArray
 */

/**
 * The output-sink surface a custom `joiningTransformer` may provide. Only
 * `append` and `get` are required; the rest are optional because the engine
 * guards each call. The built-in joiners' `append`/`string`/… signatures
 * diverge (e.g. the DOM joiner also accepts `Node`), so under
 * `strictFunctionTypes` no single structural type is a supertype of all
 * three; this contract lists the surface with `unknown` parameters, and
 * {@link JoiningTransformer} unions it with the concrete classes so real
 * joiners still type precisely.
 * @typedef {object} JoiningTransformerContract
 * @property {(item: unknown) => unknown} append
 * @property {() => unknown} get
 * @property {(txt: string) => unknown} [text]
 * @property {(str: unknown, cb?: () => void) => unknown} [string]
 * @property {(num: unknown) => unknown} [number]
 * @property {(
 *   obj: unknown, cb?: unknown, usePropertySets?: unknown, propSets?: unknown
 * ) => unknown} [object]
 * @property {(arr: unknown, cb?: unknown) => unknown} [array]
 * @property {(
 *   name: string, atts?: unknown, children?: unknown,
 *   cb?: unknown, useAttributeSets?: unknown
 * ) => unknown} [element]
 * @property {(
 *   name: string, val: unknown, avoidAttEscape?: unknown
 * ) => unknown} [attribute]
 * @property {(text: string) => unknown} [comment]
 * @property {(
 *   target: string, data: string
 * ) => unknown} [processingInstruction]
 * @property {(str: unknown) => unknown} [plainText]
 * @property {(prop: unknown, val: unknown) => unknown} [propValue]
 * @property {(item: unknown) => unknown} [rawAppend]
 * @property {(prefix: string, namespaceURI: string) => unknown} [namespace]
 * @property {(context: unknown) => unknown} [setContext]
 * @property {(cfg: unknown) => unknown} [output]
 * @property {(cfg: unknown) => unknown} [mode]
 * @property {(cfg: unknown) => unknown} [stylesheet]
 * @property {(cfg: unknown) => unknown} [function]
 * @property {(
 *   name: string, args?: unknown[]
 * ) => unknown} [invokeFunctionByArity]
 * @property {(
 *   name: string, outputCharacters: unknown
 * ) => unknown} [characterMap]
 * @property {(name: string, attributes: unknown) => unknown} [attributeSet]
 * @property {(
 *   stylesheetPrefix: string, resultPrefix: string
 * ) => unknown} [namespaceAlias]
 */

/**
 * One of the three built-in joiners. Used where engine internals rely on
 * concrete members (e.g. `_modeConfig`).
 * @typedef {(
 *   StringJoiningTransformer|
 *   DOMJoiningTransformer|
 *   JSONJoiningTransformer
 * )} BuiltinJoiningTransformer
 */

/**
 * The type accepted for a config `joiningTransformer`: a built-in joiner or
 * any object implementing {@link JoiningTransformerContract}.
 * @typedef {BuiltinJoiningTransformer | JoiningTransformerContract
 * } JoiningTransformer
 */

/**
 * @typedef {"json"|"string"|"dom"} joiningTypes
 */

/**
 * @template T
 * @template {boolean|undefined} [E=false]
 * @typedef {T extends "json" ?
 *   (E extends true ? unknown[] : unknown) :
 *   T extends "string" ?
 *   (E extends true ? string[] : string) :
 *   (E extends true ? XMLDocument[] :
 *   DocumentFragment|Element)} ResultType
 */

/**
 * Options common to both engines.
 * @template T
 * @template {boolean|undefined} [E=false]
 * @typedef {object} BaseJTLTOptions
 * @property {boolean} [sync] Off by default: the engine awaits any Promise a
 *   template returns (e.g. from `await this.indexedDB(...)`). Set `true` to
 *   forbid asynchrony — a template that returns a Promise then throws.
 * @property {(
 *   result: ResultType<T, E>
 * ) => ResultType<T, E>|void} [success] A callback supplied
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
 * @property {E} [exposeDocuments] When true, joiners return an array
 * of complete documents: XMLDocument[] for DOM, document wrapper objects[]
 * for JSON, and string[] for string joiners. Each array element corresponds
 * to a root element built during transformation.
 * @property {string} [mode] The mode in which to begin the transform.
 * @property {(opts: JTLTOptions &
 *   Required<Pick<JTLTOptions, "joiningTransformer">>
 * ) => ResultType<T, E>} [engine] Will be based on the
 * same config as passed to this instance. Defaults to a transforming
 * function based on JSONPath and with its own set of priorities for
 * processing templates.
 * @property {null|(
 *   (path: string) => 0 | 0.5 | -0.5
 * )} [specificityPriorityResolver]
 * Callback for getting the priority by specificity
 * @property {JoiningTransformer} [joiningTransformer]
 * A concrete joining transformer instance (or custom subclass) responsible
 * for accumulating output. When omitted, one is created automatically based
 * on `outputType`.
 * @property {import('./AbstractJoiningTransformer.js').
 *   JoiningTransformerConfig<T> &
 *   {exposeDocuments?: E}} [joiningConfig] Config for the joining
 *   transformer.
 * @property {object} [parent] Parent object for context
 * @property {string} [parentProperty] Parent property name for context
 */

/**
 * JSONPath engine options with context-aware template typing.
 * @template {"json"|"string"|"dom"} [T = "json"]
 * @template {boolean|undefined} [E=false]
 * @typedef {BaseJTLTOptions<T, E> & {
 *   templates?: JSONPathTemplateArray<T>[] |
 *     TemplateFunction<T, "json",
 *     import('./JSONPathTransformerContext.js').default<T>>,
 *   template?: JSONPathTemplateObject<T> | TemplateFunction<T, "json",
 *     import('./JSONPathTransformerContext.js').default
 *   >,
 *   query?: TemplateFunction<T, "json",
 *     import('./JSONPathTransformerContext.js').default
 *   >,
 *   forQuery?: [string, TemplateFunction<T, "json",
 *     import('./XPathTransformerContext.js').default
 *   >],
 *   extensions?: Record<string, unknown> & ThisType<
 *     import('./JSONPathTransformerContext.js').default<T> &
 *     import('./context-extensions.js').ContextExtensions
 *   >,
 *   engineType?: 'jsonpath',
 *   outputType?: T
 * }} JSONPathJTLTOptions
 */

/**
 * XPath engine options with context-aware template typing.
 * @template {"json"|"string"|"dom"} T
 * @template {boolean|undefined} [E=false]
 * @typedef {BaseJTLTOptions<T, E> & {
 *   templates?: XPathTemplateArray<T> |
 *     TemplateFunction<T, "dom",
 *       import('./XPathTransformerContext.js').default<T>>,
 *   template?: XPathTemplateObject<T> | TemplateFunction<T, "dom",
 *     import('./XPathTransformerContext.js').default
 *   >,
 *   query?: TemplateFunction<T, "dom",
 *     import('./XPathTransformerContext.js').default
 *   >,
 *   forQuery?: [string, TemplateFunction<T, "dom",
 *     import('./JSONPathTransformerContext.js').default
 *   >],
 *   extensions?: Record<string, unknown> & ThisType<
 *     import('./XPathTransformerContext.js').default &
 *     import('./context-extensions.js').ContextExtensions
 *   >,
 *   engineType: 'xpath',
 *   xpathVersion?: 1|2|3.1,
 *   outputType?: T
 * }} XPathJTLTOptions
 */

/**
 * @template {boolean|undefined} [E=boolean|undefined]
 * @typedef {JSONPathJTLTOptions<"json", E> |
 *   JSONPathJTLTOptions<"string", E> |
 *   JSONPathJTLTOptions<"dom", E> |
 *   XPathJTLTOptions<"json", E>|
 *   XPathJTLTOptions<"string", E>|
 *   XPathJTLTOptions<"dom", E>} JTLTOptions
 */

/**
 * High-level façade for running a JTLT transform.
 *
 * Accepts data and templates (or a root template/query), constructs a joining
 * transformer based on `outputType`, and invokes the JSONPath-based engine.
 * The result is returned to the required `success` callback and also returned
 * from transform().
 * @template {"json"|"string"|"dom"} [T="json"]
 * @template {boolean|undefined} [E=false]
 */
class JTLT {
  /**
   * @template {"json"|"string"|"dom"} [T="json"]
   * @template {boolean|undefined} [E=false]
   * @param {JSONPathJTLTOptions<T, E> | XPathJTLTOptions<T, E>} config
   * @returns {JTLT<T, E>}
   */
  static create (config) {
    return /** @type {JTLT<T, E>} */ (
      new JTLT(/** @type {any} */ (config))
    );
  }

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
   * @param {any} config Options
   * @todo Remove JSONPath dependency in query use of '$'?
   */
  constructor (config) {
    /** @type {any} */
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
      return DOMJoiningTransformer.create(initial, domConfig);
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
      return JSONJoiningTransformer.create([], jsonConfig);
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
      return StringJoiningTransformer.create('', stringConfig);
    }
    }
  }

  /**
   * @param {string|undefined} mode
   * @returns {void}
   */
  _autoStart (mode) {
    // We wait to set this default as we want to pass in the data
    this.config.joiningTransformer ||= this._createJoiningTransformer();

    if (this.config.autostart === false) {
      return;
    }

    this.transform(/** @type {string} */ (mode));
  }

  /**
   * @param {null|JTLTOptions} config
   * @returns {JTLT}
   */
  setDefaults (config) {
    /** @type {JTLTOptions} */
    this.config = config || /** @type {JTLTOptions} */ ({});
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
        this.forEach(path, (arg) => {
          // `this` carries runtime `extensions`; a consumer's
          // `ContextExtensions` augmentation would otherwise reject it here.
          const ret = fn.call(/** @type {any} */ (this), arg);
          if (typeof ret !== 'undefined') {
            // @ts-expect-error Ok?
            this._getJoiningTransformer().append(ret);
          }
        });
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
    this.config.engine ||=
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
          // eslint-disable-next-line @stylistic/max-len -- Long
          // eslint-disable-next-line sonarjs/no-duplicated-branches, unicorn/no-duplicate-if-branches -- Placeholding
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
          // eslint-disable-next-line @stylistic/max-len -- Long
          // eslint-disable-next-line sonarjs/no-duplicated-branches, unicorn/no-duplicate-if-branches -- Placeholding
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
    this.config.specificityPriorityResolver ||= (function () {
      const xsjpr = new XSLTStyleJSONPathResolver();
      return function (/** @type {string} */ path) {
        return xsjpr.getPriorityBySpecificity(path);
      };
    }());
    return /** @type {any} */ (this);
  }

  /**
   * @param {string} [mode] The mode of the transformation
   * @returns {ResultType<T, E>}
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
    const {success} = this.config;
    if (typeof success !== 'function') {
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
    // The engine returns a Promise instead when a template ran asynchronously
    // (e.g. it performed an `await this.indexedDB(...)` fetch); under
    // `config.sync` the engine throws rather than returning one.
    const maybePromise = /** @type {{then?: unknown}} */ (result);
    if (maybePromise && typeof maybePromise.then === 'function') {
      return /** @type {any} */ (
        // eslint-disable-next-line @stylistic/max-len -- Long
        // eslint-disable-next-line promise/prefer-await-to-then -- intentional dynamic sync/async
        /** @type {Promise<never>} */ (result).then((res) => {
          return /** @type {any} */ (success(res));
        })
      );
    }
    const ret = success(
      /** @type {never} */ (result)
    );
    return /** @type {any} */ (ret);
  }
}

/**
 * Create and run a JTLT instance with the appropriate engine typing.
 *
 * Overloads help TypeScript select the correct constructor signature.
 * @overload
 * @param {Omit<JSONPathJTLTOptions<"json", false>, "success">} cfg
 * @returns {Promise<ResultType<"json", false>>}
 */
/**
 * @overload
 * @param {Omit<JSONPathJTLTOptions<"json", true>, "success">} cfg
 * @returns {Promise<ResultType<"json", true>>}
 */
/**
 * @overload
 * @param {Omit<JSONPathJTLTOptions<"string", false>, "success">} cfg
 * @returns {Promise<ResultType<"string", false>>}
 */
/**
 * @overload
 * @param {Omit<JSONPathJTLTOptions<"string", true>, "success">} cfg
 * @returns {Promise<ResultType<"string", true>>}
 */
/**
 * @overload
 * @param {Omit<JSONPathJTLTOptions<"dom", false>, "success">} cfg
 * @returns {Promise<ResultType<"dom", false>>}
 */
/**
 * @overload
 * @param {Omit<JSONPathJTLTOptions<"dom", true>, "success">} cfg
 * @returns {Promise<ResultType<"dom", true>>}
 */
/**
 * @overload
 * @param {Omit<XPathJTLTOptions<"json", false>, "success">} cfg
 * @returns {Promise<ResultType<"json", false>>}
 */
/**
 * @overload
 * @param {Omit<XPathJTLTOptions<"json", true>, "success">} cfg
 * @returns {Promise<ResultType<"json", true>>}
 */
/**
 * @overload
 * @param {Omit<XPathJTLTOptions<"dom", false>, "success">} cfg
 * @returns {Promise<ResultType<"dom", false>>}
 */
/**
 * @overload
 * @param {Omit<XPathJTLTOptions<"dom", true>, "success">} cfg
 * @returns {Promise<ResultType<"dom", true>>}
 */
/**
 * @overload
 * @param {Omit<XPathJTLTOptions<"string", false>, "success">} cfg
 * @returns {Promise<ResultType<"string", false>>}
 */
/**
 * @overload
 * @param {Omit<XPathJTLTOptions<"string", true>, "success">} cfg
 * @returns {Promise<ResultType<"string", true>>}
 */
/**
 * @param {Omit<JTLTOptions, "success">} cfg Options
 * @returns {Promise<unknown>}
 */
export function jtlt (cfg) {
  // eslint-disable-next-line promise/avoid-new -- Own API
  return new Promise((resolve) => {
    // Narrow the constructor overload based on engineType
    if (cfg && cfg.engineType === 'xpath') {
      const outputType = cfg.outputType || 'string';

      if (outputType === 'json') {
        JTLT.create(
          /** @type {XPathJTLTOptions<"json">} */ ({
            ...cfg,
            outputType: 'json',
            success (val) {
              resolve(val);
            }
          })
        );
      } else if (outputType === 'dom') {
        JTLT.create(
          /** @type {XPathJTLTOptions<"dom">} */ ({
            ...cfg,
            outputType: 'dom',
            success (val) {
              resolve(val);
            }
          })
        );
      } else {
        JTLT.create(
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
      JTLT.create(
        /** @type {JSONPathJTLTOptions<"string">} */ ({
          ...cfg,
          outputType: 'string',
          success (val) {
            resolve(val);
          }
        })
      );
    } else if (outputType === 'dom') {
      JTLT.create(
        /** @type {JSONPathJTLTOptions<"dom">} */ ({
          ...cfg,
          outputType: 'dom',
          success (val) {
            resolve(val);
          }
        })
      );
    } else {
      JTLT.create(
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
