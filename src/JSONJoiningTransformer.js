import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';

/**
 * JSON-based joining transformer for building JSON/JavaScript objects.
 */
class JSONJoiningTransformer extends AbstractJoiningTransformer {
  /**
   * @param {Array|object} o - Initial object or array
   * @param {object} cfg - Configuration object
   */
  constructor (o, cfg) {
    super(cfg);
    this._obj = o || [];
  }

  /**
   * Directly appends an item to the internal array without checks.
   * @param {*} item - Item to append
   * @returns {void}
   */
  rawAppend (item) {
    this._obj.push(item);
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
   * Gets the current object or array.
   * @returns {Array|object}
   */
  get () {
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
    this._obj[prop] = val;
  }

  /**
   * @param {Function} cb - Callback to be executed on this transformer but
   *   with a context nested within the newly created object
   * @param {Array} usePropertySets - Array of string property set names to
   *   copy onto the new object
   * @param {object} propSets - An object of key-value pairs to copy onto
   *   the new object
   * @returns {JSONJoiningTransformer}
   */
  object (cb, usePropertySets, propSets) {
    // Todo: Conditionally add as JHTML-based jml (and in subsequent methods
    //   as well)
    const tempObj = this._obj;
    let obj = {};
    if (usePropertySets !== undefined) {
      obj = usePropertySets.reduce((o, psName) => {
        return this._usePropertySets(o, psName); // Todo: Put in right scope
      }, {});
    }
    if (propSets !== undefined) {
      Object.assign(obj, propSets);
    }

    this.append(obj);
    const oldObjPropState = this._objPropState;
    this._objPropState = true;
    // We pass the object, but user should usually use other methods
    cb.call(this, obj);
    this._obj = tempObj;
    this._objPropState = oldObjPropState;
    return this;
  }

  /**
   * Creates a new array and executes a callback in its context.
   * @param {Function} cb - Callback function
   * @returns {JSONJoiningTransformer}
   */
  array (cb) {
    const tempObj = this._obj;
    const arr = [];
    this.append(arr); // Todo: set current position and deal with children
    // We pass the array, but user should usually use other methods
    cb.call(this, arr);
    this._obj = tempObj;
    return this;
  }

  /**
   * Appends a string value.
   * @param {string} str - String value
   * @param {Function} cb - Callback function (unused)
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
    if (this._cfg.mode !== 'JavaScript') {
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
    if (this._cfg.mode !== 'JavaScript') {
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
    if (this._cfg.mode !== 'JavaScript') {
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
}

export default JSONJoiningTransformer;

