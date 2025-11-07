import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';

/**
 * JSON-based joining transformer for building JSON/JavaScript objects.
 *
 * This joiner accumulates into an in-memory JSON value (object or array).
 * append() will push to arrays or shallow-merge into objects; string/number/
 * boolean/null add primitives accordingly. It does not perform HTML escaping
 * or string serialization; it builds real JS values.
 */
class JSONJoiningTransformer extends AbstractJoiningTransformer {
  /**
   * @param {any[]|object} [o] - Initial object or array
   * @param {object} [cfg] - Configuration object
   */
  constructor (o, cfg) {
    super(cfg);
    /** @type {any[]|object} */
    this._obj = o || [];
    /** @type {boolean | undefined} */
    this._objPropState = undefined;
    /** @type {boolean | undefined} */
    this._arrItemState = undefined;
  }

  /**
   * Directly appends an item to the internal array without checks.
   * @param {*} item - Item to append
   * @returns {void}
   */
  rawAppend (item) {
    /** @type {any[]} */ (this._obj).push(item);
  }

  /**
   * Appends an item to the current object or array.
   * @param {*} item - Item to append
   * @returns {JSONJoiningTransformer}
   */
  append (item) {
    // Todo: allow for first time
    if (!this._obj || typeof this._obj !== 'object') {
      throw new Error('You cannot append to a scalar or empty value.');
    }
    if (Array.isArray(this._obj)) {
      this._obj.push(item);
    } else {
      Object.assign(this._obj, item);
    }
    return this;
  }

  /**
   * Gets the current object or array. If unwrapSingleResult config option is
   * enabled and the root array contains exactly one element, returns that
   * element directly (unwrapped).
   * @returns {any[]|object|any}
   */
  get () {
    // Unwrap single-element arrays at the root level if configured
    if (this._cfg && /** @type {any} */ (this._cfg).unwrapSingleResult &&
        Array.isArray(this._obj) && this._obj.length === 1) {
      return this._obj[0];
    }
    return this._obj;
  }

  /**
   * Sets a property value on the current object.
   * @param {string} prop - Property name
   * @param {*} val - Property value
   * @returns {void}
   */
  propValue (prop, val) {
    if (!this._objPropState) {
      throw new Error(
        'propValue() can only be called after an object state has been set up.'
      );
    }
    (/** @type {Record<string, any>} */ (this._obj))[prop] = val;
  }

  /* c8 ignore next 13 -- JSDoc block incorrectly counted as coverable by c8 */
  /**
   * @param {object|Function} [objOrCb] - Seed object to start with, or
   *   callback if no seed provided
   * @param {Function|any[]} [cbOrUsePropertySets] - Callback to be executed
   *   on this transformer but with a context nested within the newly created
   *   object, or array of property set names if first arg was an object
   * @param {any[]|object} [usePropertySetsOrPropSets] - Array of string
   *   property set names to copy onto the new object, or propSets if second
   *   arg was a callback
   * @param {object} [propSets] - An object of key-value pairs to copy onto
   *   the new object
   * @returns {JSONJoiningTransformer}
   */
  object (objOrCb, cbOrUsePropertySets, usePropertySetsOrPropSets, propSets) {
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    // Todo: Conditionally add as JHTML-based jml (and in subsequent methods
    //   as well)
    const tempObj = this._obj;

    // Determine if first arg is a seed object or callback
    let obj;
    let cb;
    let usePropertySets;
    let propSetsToUse;

    if (typeof objOrCb === 'function') {
      // No seed object: object(cb, usePropertySets, propSets)
      obj = {};
      cb = objOrCb;
      usePropertySets = /** @type {any[]} */ (cbOrUsePropertySets);
      propSetsToUse = /** @type {object} */ (usePropertySetsOrPropSets);
    } else {
      // Seed object provided: object(obj, cb, usePropertySets, propSets)
      // Clone seed object to avoid mutating the original
      obj = objOrCb ? {...objOrCb} : {};
      cb = /** @type {Function} */ (cbOrUsePropertySets);
      usePropertySets = /** @type {any[]} */ (usePropertySetsOrPropSets);
      propSetsToUse = propSets;
    }

    if (usePropertySets !== undefined) {
      const merged = usePropertySets.reduce((o, psName) => {
        return that._usePropertySets(o, psName); // Todo: Put in right scope
      }, {});
      Object.assign(obj, merged);
    }
    if (propSetsToUse !== undefined) {
      Object.assign(obj, propSetsToUse);
    }

    /** @type {any} */
    const oldObjPropState = this._objPropState;
    this._objPropState = true;
    this._obj = obj; // Set current object so propValue() works
    // We pass the object, but user should usually use other methods
    if (cb) {
      cb.call(this, obj);
    }
    // Append after callback so object has all properties, but before
    // restoring tempObj
    this._obj = tempObj;
    this.append(obj);
    this._objPropState = oldObjPropState;
    return this;
  }

  /**
   * Creates a new array and executes a callback in its context.
   * @param {any[]|Function} [arrOrCb] - Seed array to start with, or callback
   *   if no seed provided
   * @param {Function} [cb] - Callback function (if first arg was a seed array)
   * @returns {JSONJoiningTransformer}
   */
  array (arrOrCb, cb) {
    const tempObj = this._obj;

    // Determine if first arg is a seed array or callback
    /** @type {any[]} */
    let arr;
    let callback;

    if (typeof arrOrCb === 'function') {
      // No seed array: array(cb)
      arr = [];
      callback = arrOrCb;
    } else {
      // Seed array provided: array(arr, cb)
      // Clone seed array to avoid mutating the original
      arr = arrOrCb ? [...arrOrCb] : [];
      callback = cb;
    }

    this._obj = arr; // Set current array so append() works
    // We pass the array, but user should usually use other methods
    if (callback) {
      callback.call(this, arr);
    }
    // Append after callback so array has all items, but before
    // restoring tempObj
    this._obj = tempObj;
    this.append(arr); // Todo: set current position and deal with children
    return this;
  }

  /**
   * Appends a string value.
   * @param {string} str - String value
  * @param {Function} [cb] - Callback function (unused)
   * @returns {JSONJoiningTransformer}
   */
  string (str, cb) {
    this._requireSameChildren('json', 'string');
    this.append(str);
    return this;
  }

  /**
   * Appends a number value.
   * @param {number} num - Number value
   * @returns {JSONJoiningTransformer}
   */
  number (num) {
    this.append(num);
    return this;
  }

  /**
   * Appends a boolean value.
   * @param {boolean} bool - Boolean value
   * @returns {JSONJoiningTransformer}
   */
  boolean (bool) {
    this.append(bool);
    return this;
  }

  /**
   * Appends a null value.
   * @returns {JSONJoiningTransformer}
   */
  null () {
    this.append(null);
    return this;
  }

  /**
   * Appends an undefined value (JavaScript mode only).
   * @returns {JSONJoiningTransformer}
   */
  undefined () {
    if (this._cfg && /** @type {any} */ (this._cfg).mode !== 'JavaScript') {
      throw new Error(
        'undefined is not allowed unless added in JavaScript mode'
      );
    }
    this.append(undefined);
    return this;
  }

  /**
   * Appends a non-finite number (JavaScript mode only).
   * @param {number} num - Non-finite number (NaN, Infinity, -Infinity)
   * @returns {JSONJoiningTransformer}
   */
  nonfiniteNumber (num) {
    if (this._cfg && /** @type {any} */ (this._cfg).mode !== 'JavaScript') {
      throw new Error(
        'Non-finite numbers are not allowed unless added in JavaScript mode'
      );
    }
    this.append(num);
    return this;
  }

  /**
   * Appends a function value (JavaScript mode only).
   * @param {Function} func - Function to append
   * @returns {JSONJoiningTransformer}
   */
  function (func) {
    if (this._cfg && /** @type {any} */ (this._cfg).mode !== 'JavaScript') {
      throw new Error(
        'function is not allowed unless added in JavaScript mode'
      );
    }
    this.append(func);
    return this;
  }

  /**
   * Placeholder for element method (not implemented for JSON).
   * @param {string} elName - Element name
   * @param {object} atts - Attributes
   * @param {Function} cb - Callback function
   * @returns {JSONJoiningTransformer}
   */
  element (elName, atts, cb) {
    return this;
  }

  /**
   * Placeholder for attribute method (not implemented for JSON).
   * @param {string} name - Attribute name
   * @param {*} val - Attribute value
   * @returns {JSONJoiningTransformer}
   */
  attribute (name, val) {
    return this;
  }

  /**
   * Placeholder for text method (not implemented for JSON).
   * @param {string} txt - Text content
   * @returns {JSONJoiningTransformer}
   */
  text (txt) {
    return this;
  }

  /**
   * Appends plain text as a string.
   * @param {string} str - Plain text string
   * @returns {JSONJoiningTransformer}
   */
  plainText (str) {
    this.string(str);
    return this;
  }

  /**
   * Helper method to use property sets (to be implemented).
   * @param {object} obj - Object to apply property set to
   * @param {string} psName - Property set name
   * @returns {object}
   */
  _usePropertySets (obj, psName) {
    // Merge the named property set (if present) into the provided object
    if (this && /** @type {any} */ (this).propertySets &&
    /** @type {any} */ (this).propertySets[psName]
    ) {
      return Object.assign(obj, /** @type {any} */ (this).propertySets[psName]);
    }
    return obj;
  }
}

export default JSONJoiningTransformer;

