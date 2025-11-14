/**
 * SAJJ Simple API for JSON/JavaScript objects
 * This is not intended as a streaming string parser, though `walkJSONString()`
 * is provided for whole strings;
 *  Clarinet (https://github.com/dscape/clarinet ) is more likely the better choice for such cases.
 *  SAJJ, as with SAX, could be adapted to allow DOM TreeWalker-style parsing
 *   (pull or automatic cycling: todo) along with
 *  XSL-style iteration (though optional whether to ultimately replace original
 *   content), e.g., for use with Jamilih or JsonML style (see JTLT project)
 *   templates (or enhanced via full JS with event handlers).
 * SampleUseCases
 * 1) Converting JavaScript structures to JSON
 * 2) Implementing a SAX-like parser over XML-as-JSON solutions like Jamilih
 *     or JsonML
 * 3) XSL-like transformations of JSON (or XML-as-JSON), e.g., to JHTML
 * SampleImplementations
 * 1. Conversion of JSON to JHTML
 * 2. JSON.stringify() (Todo: support replacer and space arguments)
 * DesignGoals
 * 1. Accurate, easy to use, small, fast, memory-efficient, universal in
 *     coverage, clean code
 * 2. Convenient (e.g., with overridable methods) but not auto-creating
 *    likely useful polyfills like Object.keys(), Object.getOwnPropertyNames(),
 *    JSON, etc. Might reconsider
 *   optionally auto-exporting them, or adding as handler arguments, in the
 *    future, but not planning for now.
 * 3. Context-aware (handlers to include parent objects as well as values
 *     or JSONPaths)
 * 4. Customizable: Ability to override/customize any functionality and allow
 *     custom types but without need for reimplementing iteration routines
 * 5. Offer optional support of regular JavaScript objects (including those
 *     potentially representing XML/HTML with events)
 * 6. Allow pull or auto-push reporting
 * 7. Configuration vis-a-vis Clarinet/sax-js options:
 *   a) Decided for now against trim/normalize options as in Clarinet as
 *     seemed not very useful, though could be allowed easily in stringHandler
 *   b) lowercase and xmlns seem too XML-specific
 *   c) position has analogue in JSONPath goal
 * 8. Decided against causing conversion to string and feeding into Clarinet
 *    (or `JSON.parse(obj, reviver);`) as use cases of beginning with JSON
 *    rather than merely converting to it were too great (toward JS as main
 *    environment or even content-type).
 * 9. Decided against Clarinet handler names as considered ugly relative to
 *     CamelCase (despite JS-event-style-familiarity) though
 * I may provide adapters later (todo)
 * 10. Decided against passing Object.keys (or other exports of Object
 *    properties like getOwnPropertyNames) to
 *    beginObjectHandler/beginArrayHandler (and corresponding end methods) as
 *    auto-iteration of keys/values ought to address most use cases for
 *    obtaining all keys and user can do it themselves if needed. We did pass
 *    length of array to begin and endArrayHandler, however.
 * 11. Have module support standard export formats
 * 12. Demonstrate functionality by implementing JSON.stringify though provide
 *      empty version
 *
 * PossibleFutureTodos
 * 1. Add references to jml() in docs along with JsonML references
 * 2. Integrate with allowing stream input as in Clarinet?
 * 3. TreeWalker/NodeIterator equivalents?
 * 4. Add array-extra methods along with functional join?
 *
 * @todo
 *
 * 1. Infinity, NaN, String, Number, Date, etc.
 * 2. Add depth level `@property` (which could be used, e.g., by a
 *     JSON.stringify implementation)
 *   a) Implement JSON.stringify (without calling JSON.stringify!); if
 *      not, fix SampleImplementations above
 *     i) Finish array/object (call delegateHandlersByType inside
 *         keyValueHandler or in object/arrayHandler?; change keyValueHandlers
 *         to return commas, etc.)
 *     ii) avoid functions/undefined/prototype completely, and converting
 *          nonfinite to null
 * 3. Add JSONPaths (or implement JSONPath reporting in SAJJ as in
 *     jsonPath())? XPath to string SAX XML? .getXPath on DOM node prototype?
 */

/* eslint-disable jsdoc/reject-any-type -- Arbitrary */
/**
 * @typedef {any} AnyValue
 */
/* eslint-enable jsdoc/reject-any-type -- Arbitrary */

/* eslint-disable jsdoc/reject-function-type -- Generic */
/**
 * @typedef {Function} GenericFunction
 */
/* eslint-enable jsdoc/reject-function-type -- Generic */

/**
 * @typedef {undefined | null | boolean | number | string |
 *   GenericFunction} NonObject
 */

/**
 * @typedef {{
 *   [key: string]: NonObject | NestedObject | NestedObject[]
 * }} NestedObject
 */

/**
 * @typedef {"undefined"|"null"|"boolean"|"symbol"|
 *   "number"|"nonfiniteNumber"|"bigint"|
 *   "string"|"function"|"array"|"object"|"ignore"} SAJJType
 */

// PRIVATE STATIC UTILITIES

/**
 * Make a shallow or deep copy of an object.
 * @private
 * @constant
 * @param {NestedObject} obj Object to copy
 * @param {boolean} [deep] Whether or not to make a deep copy. Defaults to false
 * @returns {NestedObject|NonObject} Copied object
 */
function _copyObject (obj, deep) {
  /** @type {NestedObject} */
  const copyObj = {};
  // eslint-disable-next-line guard-for-in -- Deliberate iterating of prototype
  for (const prop in obj) {
    copyObj[prop] = deep && obj[prop] && typeof obj[prop] === 'object'
      ? _copyObject(/** @type {NestedObject} */ (obj[prop]))
      : obj[prop];
  }
  return copyObj;
}

// GENERIC JSON/JS CONSTRUCTOR

/**
 * @typedef {{
 *   mode?: "JSON"|"JavaScript",
 *   distinguishKeysValues?: boolean,
 *   iterateArrays?: boolean,
 *   iterateObjects?: boolean,
 *   iterateObjectPrototype?: boolean,
 *   iterateArrayPrototype?: boolean,
 *   delegateHandlers?: DelegateHandlers
 *   parentKey?: string,
 *   parentObject?: object,
 *   parentObjectArrayBool?: boolean,
 * }} SAJJOptions
 */

/**
 * @todo Support object + JSONPath as first argument for iteration within
 *   a larger tree
 */
class SAJJ {
  ret = '';

  /* eslint-disable jsdoc/require-returns-check -- Abstract */
  /**
   * Could override for logging; meant for allowing dropping of
   *   properties/methods, e.g., undefined/functions, as done, for
   *   example, by `JSON.stringify`.
   * @param {AnyValue} obj
   * @param {object|undefined} parentObj
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  ignoreHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    obj, parentObj, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {string} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  stringHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {number} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  numberHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {bigint} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  bigintHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {boolean} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  booleanHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {symbol} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  symbolHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {undefined} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  undefinedHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {AnyValue} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  objectHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {null} obj
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  nullHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    obj, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {number} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  nonfiniteNumberHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {AnyValue[]} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  arrayHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {GenericFunction} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  functionHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * Constructor may use this to override `keyValueHandler`.
   * @param {AnyValue} value
   * @param {string} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @param {boolean} arrayBool
   * @param {number} iterCt
   * @returns {string}
   */
  keyValueDistinguishedHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, key, parentObject, parentKey,
    // eslint-disable-next-line no-unused-vars -- Signature
    parentObjectArrayBool, arrayBool, iterCt
  ) {
    throw new Error('Abstract');
  }

  /**
   * @returns {string}
   */
  arrayKeyValueJoinerHandler () {
    throw new Error('Abstract');
  }

  /**
   * @param {object} value
   * @param {string|number} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @param {boolean} arrayBool
   * @param {number} [iterCt]
   * @returns {string}
   */
  keyValueHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, key, parentObject, parentKey,
    // eslint-disable-next-line no-unused-vars -- Signature
    parentObjectArrayBool, arrayBool, iterCt
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {string|number} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {AnyValue}
   */
  arrayKeyHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    key, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {string|number} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @param {number} [iterCt]
   * @returns {AnyValue}
   */
  objectKeyHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    key, parentObject, parentKey, parentObjectArrayBool, iterCt
  ) {
    throw new Error('Abstract');
  }
  /* eslint-enable jsdoc/require-returns-check -- Abstract */

  /**
   * @param {SAJJOptions} options See setDefaultOptions() function body for
   *   some possibilities
   */
  constructor (options) {
    /** @type {SAJJOptions} */
    // eslint-disable-next-line no-unused-expressions -- TS
    this.options;

    this.setDefaultOptions(options);
  }

  // OPTIONS
  /**
   * @param {SAJJOptions} [options]
   * @returns {void}
   */
  setDefaultOptions (options) {
    const newOptions = options || {};

    this.options = newOptions;

    // Todo: to make properties read-only, etc., use https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/defineProperties

    // CUSTOM PROPERTIES
    // Whether to support full JavaScript objects (with functions,
    //   undefined, nonfiniteNumbers) or JSON; will not distinguish
    //   object literals from other objects, but neither does JSON.stringify
    //   which ignores prototype and drops functions/undefined and
    //   converts nonfinite to null
    this.mode = newOptions.mode || 'JSON';

    this.distinguishKeysValues = newOptions.distinguishKeysValues || false;

    this.iterateArrays = newOptions.iterateArrays !== undefined
      ? newOptions.iterateArrays
      : true;
    this.iterateObjects = newOptions.iterateObjects !== undefined
      ? newOptions.iterateObjects
      : true;

    this.iterateObjectPrototype = newOptions.iterateObjectPrototype || false;
    this.iterateArrayPrototype = newOptions.iterateArrayPrototype || false;

    // This must be called after options are set
    this.alterDefaultHandlers(newOptions);
  }

  /**
  * Rather than use the strategy design pattern, we'll override our prototype
  *   selectively.
  * @param {SAJJOptions} options
  * @returns {void}
  */
  alterDefaultHandlers (options) {
    if (this.distinguishKeysValues) {
      this.keyValueHandler = this.keyValueDistinguishedHandler;
    }
    if (options.delegateHandlers) {
      this.delegateHandlers = options.delegateHandlers;
    }
  }

  // PUBLIC METHODS TO INITIATE PARSING

  /**
  * For strings, one may wish to use Clarinet (<https://github.com/dscape/clarinet>) to
  *   avoid extra overhead or parsing twice.
  * @param {string} str The JSON string to be walked (after complete conversion
  *   to an object)
  * @param {object|object[]} [parentObject] The parent object or array
  *   containing the string
  * @param {string} [parentKey] The parent object or array's key
  * @param {boolean} [parentObjectArrayBool] Whether the parent object is an
  *   array (not another object)
  * @returns {AnyValue}
  */
  walkJSONString (str, parentObject, parentKey, parentObjectArrayBool) {
    return this.walkJSONObject(
      JSON.parse(str), parentObject, parentKey, parentObjectArrayBool
    );
  }

  /**
  *
  * @param {import('../jhtml.js').JSONObject} obj The JSON object to walk
  * @param {object|object[]} [parentObject] The parent object or array
  *   containing the string
  * @param {string} [parentKey] The parent object or array's key
  * @param {boolean} [parentObjectArrayBool] Whether the parent object is an
  *   array (not another object)
  * @property {string|AnyValue} ret The intermediate return value (if any) from
  *   beginHandler and delegateHandlersByType delegation
  * @returns {string} The final return value including beginHandler and
  *   delegateHandlersByType delegation plus any endHandler additions;
  *   one may build one's own intermediate values, but "ret" should be
  *   set to return the value
  */
  walkJSONObject (obj, parentObject, parentKey, parentObjectArrayBool) {
    this.root = obj;
    const parObj = parentObject || this.options.parentObject,
      parKey = parentKey || this.options.parentKey,
      parObjArrBool = parentObjectArrayBool ||
        this.options.parentObjectArrayBool ||
          (parObj && this.isArrayType(parObj));
    this.ret = this.beginHandler(obj, parObj, parKey, parObjArrBool);
    this.ret += this.delegateHandlersByType(obj, parObj, parKey, parObjArrBool);
    this.ret += this.endHandler(obj, parObj, parKey, parObjArrBool);
    return this.ret;
  }

  // BEGIN AND END HANDLERS

  /**
   * @param {AnyValue} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean} [parentObjectArrayBool]
   * @returns {string}
   */
  beginHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    return '';
  }

  /**
   * We just make available the passed in arguments.
   * @param {AnyValue} obj
   * @param {AnyValue} parObj
   * @param {string|undefined} parKey
   * @param {boolean} [parObjArrBool]
   * @returns {string}
   */
  endHandler (
    // eslint-disable-next-line no-unused-vars -- Signature
    obj, parObj, parKey, parObjArrBool
  ) {
    return '';
  }

  // HANDLER DELEGATION BY TYPE

  // Todo: override this (or separate out and override secondary method)
  //     to delegate objects/arrays separately but for others, pass type
  //     as arg, not within method name

  /**
   * @param {import('../jhtml.js').JSONObject} obj
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean} [parentObjectArrayBool]
   * @returns {string}
   */
  delegateHandlersByType (obj, parentObject, parentKey, parentObjectArrayBool) {
    const suffix = 'Handler',
      type = this.detectBasicType(
        obj, parentObject, parentKey, parentObjectArrayBool
      );

    switch (type) {
    case 'null': case 'undefined':
    case 'array': case 'object':
    case 'ignore': // Will delegate by default so that handler can log, etc.
      // Fallthrough
    default:
      return this.delegateHandlers(
        /**
         * @type {`${SAJJType}Handler`}
         */
        (type + suffix), parentObject, parentKey, parentObjectArrayBool, obj
      );
    }
  }

  /**
   * @callback DelegateHandlers
   * Allows override to allow for immediate or delayed execution; should handle
   *   both null/undefined types (which require no first value argument since
   *   only one is possible) and other types.
   * @param {`${SAJJType}Handler`} type
   * @param {object|undefined} parentObj
   * @param {string|undefined} parentKey
   * @param {boolean} [parentObjectArrayBool]
   * @param {AnyValue} [obj]
   * @returns {string}
   */

  /** @type {DelegateHandlers} */
  delegateHandlers (type, parentObj, parentKey, parentObjectArrayBool, obj) {
    return this[type](
      // @ts-ignore Ok
      obj,
      parentObj, parentKey, parentObjectArrayBool
    );
  }

  // DETECT TYPES
  /**
   * @param {AnyValue} obj
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean} [parentObjectArrayBool]
   * @returns {SAJJType}
   */
  detectBasicType (obj, parentObject, parentKey, parentObjectArrayBool) {
    const type = typeof obj,
      JSMode = this.mode === 'JavaScript';
    switch (type) {
    // JavaScript-only
    case 'symbol':
      if (JSMode) {
        return type;
      }
      return this.typeErrorHandler(
        'symbol', obj, parentObject, parentKey, parentObjectArrayBool
      );
    case 'bigint':
      if (JSMode) {
        return type;
      }
      return this.typeErrorHandler(
        'bigint', obj, parentObject, parentKey, parentObjectArrayBool
      );
    case 'number':
      if (!Number.isFinite(obj)) {
        if (JSMode) {
          return 'nonfiniteNumber';
          // Can return a custom type and add that handler to the object to
          //  convert to JSON
        }
        return this.typeErrorHandler(
          'nonfiniteNumber', obj, parentObject, parentKey, parentObjectArrayBool
        );
      }
      return type;
    case 'function': case 'undefined':
      if (!JSMode) {
        // Can return a custom type and add that handler to the object to
        //   convert to JSON
        return this.typeErrorHandler(
          type, obj, parentObject, parentKey, parentObjectArrayBool
        );
      }
      // Fallthrough
    case 'boolean': case 'string':
      return type;
    case 'object':
      return obj
        ? (this.isArrayType(obj)
          ? 'array'
          : (JSMode ? this.detectObjectType(obj) : 'object')
        )
        : 'null';
    /* c8 ignore next 4 -- Should not reach here */
    default:
      break;
    }
    throw new Error('Unexpected type');
  }

  /**
  * Could override to always return false if one wished to merge
  *   arrayHandler/objectHandler or, if in JSMode, to merge detectObjectType
  *   and this isArrayType method. To merge arrayKeyValueHandler and
  *   objectKeyValueHandler, see keyValueHandler.
  * @param {AnyValue} obj
  * @returns {boolean}
  */
  isArrayType (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  /**
  * Allow overriding to detect `Date`, `RegExp`, or other types (which will in
  *   turn route to corresponding names).
  * @param {AnyValue} obj
  * @returns {"object"}
  */
  detectObjectType (
    // eslint-disable-next-line no-unused-vars -- Signature
    obj
  ) {
    return 'object';
  }

  // ERROR HANDLING
  /**
   * May throw or return type string (can be custom type if handler present).
   * @param {SAJJType} type
   * @param {AnyValue} obj
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean} [parentObjectArrayBool]
   * @returns {"null"}
   */
  typeErrorHandler (
    type,
    // eslint-disable-next-line no-unused-vars -- Signature
    obj, parentObject, parentKey, parentObjectArrayBool
  ) {
    switch (type) {
    // Could utilize commented out portions as below to allow JSON mode to
    //   still handle certain non-JSON types (though may be better to use JS
    //   mode in such a case)
    /*
    case 'function':
      return 'ignore';
      // return type;
    case 'undefined':
      return 'ignore';
      // return type;
      // Or maybe this:
      // return 'null';
    */
    case 'nonfiniteNumber': // We'll behave by default as does JSON.stringify
      return 'null';
    default:
      throw new Error(
        'Values of type "' + type +
          '" are only allowed in JavaScript mode, not JSON.'
      );
    }
  }
}

// SPECIALIZED CONSTRUCTORS (JS)

/**
 * @class
 * @param {SAJJOptions} options
 */
function SAJJ_JS (options) {
  // We don't make a deep copy, as we only need to overwrite the mode
  const newOpts = /** @type {SAJJOptions} */ (_copyObject(
    // @ts-expect-error Ok
    options
  ));
  newOpts.mode = 'JavaScript';
  return new SAJJ(newOpts);
}

export {SAJJ_JS};

export default SAJJ;
