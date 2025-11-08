import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';

// Regex and helper for converting dataset camelCase to dash-lower
const camelCase = /[a-z][A-Z]/gv;
/**
 * @param {string} n0
 * @returns {string}
 */
function _makeDatasetAttribute (n0) {
  return n0.charAt(0) + '-' + n0.charAt(1).toLowerCase();
}

/**
 * @callback ObjectCallback
 * @this {JSONJoiningTransformer}
 * @param {Record<string, unknown>} obj
 * @returns {void}
 */
/**
 * @callback ArrayCallback
 * @this {JSONJoiningTransformer}
 * @param {any[]} arr
 * @returns {void}
 */
/**
 * @callback SimpleCallback
 * @this {JSONJoiningTransformer}
 * @returns {void}
 */

/**
 * Attributes object for element() allowing standard string attributes
 * plus special helpers: dataset (object) and $a (ordered attribute array).
 * @typedef {Record<string, unknown> & {
 *   dataset?: Record<string, string>,
 *   $a?: Array<[string, string]>
 * }} ElementAttributes
 */

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
   * @param {any[]|Record<string, unknown>} [o] - Initial object or array
   * @param {{
   *   unwrapSingleResult?: boolean,
   *   mode?: "JavaScript"|"JSON"
   * }} [cfg] - Configuration object
   */
  constructor (o, cfg) {
    super(cfg);
    /** @type {any[]|Record<string, unknown>} */
    this._obj = o || [];
    /** @type {boolean | undefined} */
    this._objPropState = undefined;
    /** @type {boolean | undefined} */
    this._arrItemState = undefined;
    /** @type {{attsObj: Record<string, unknown>, jmlChildren: unknown[]}[]} */
    this._elementStack = [];
  }

  /**
   * Directly appends an item to the internal array without checks.
   * @param {any} item - Item to append
   * @returns {void}
   */
  rawAppend (item) {
    /** @type {any[]} */ (this._obj).push(item);
  }

  /**
   * Appends an item to the current object or array.
   * @param {any} item - Item to append
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
   * @param {any} val - Property value
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
   * @param {Record<string, unknown>|ObjectCallback} [objOrCb]
   *   Seed object or callback.
   * @param {ObjectCallback|any[]} [cbOrUsePropertySets] Callback or sets.
   * @param {any[]|Record<string, unknown>} [usePropertySetsOrPropSets]
   *   Sets or prop sets.
   * @param {Record<string, unknown>} [propSets] Key-value pairs to add.
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
      propSetsToUse = /** @type {Record<string, unknown>} */ (
        usePropertySetsOrPropSets
      );
    } else {
      // Seed object provided: object(obj, cb, usePropertySets, propSets)
      // Clone seed object to avoid mutating the original
      obj = objOrCb ? {...objOrCb} : {};
      cb = /** @type {ObjectCallback} */ (cbOrUsePropertySets);
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
   * @param {any[]|ArrayCallback} [arrOrCb] Seed array or callback.
   * @param {ArrayCallback} [cb] Callback when first arg was array.
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
   * @param {string} str String value.
   * @param {SimpleCallback} [cb] Unused callback.
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
   * @param {(...args: any[]) => any} func Function to append.
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
   * Build a Jamilih-style element JSON array and append to current container.
   * Result form: ['tag', {attr: 'val'}, child1, child2, ...]
   * Helpers: dataset -> data-*; $a -> ordered attributes.
   * Supported signatures mirror StringJoiningTransformer.element.
   * @param {string|Element} elName Element name or Element-like.
   * @param {ElementAttributes|any[]|SimpleCallback} [atts]
   *   Attrs, children, or cb.
   * @param {any[]|SimpleCallback} [childNodes] Children or cb.
   * @param {SimpleCallback} [cb] Builder callback.
   * @returns {JSONJoiningTransformer}
   */
  element (elName, atts, childNodes, cb) {
    this._requireSameChildren('json', 'element');
    // Normalize arguments similarly to StringJoiningTransformer.element
    if (Array.isArray(atts)) {
      cb = /** @type {SimpleCallback} */ (childNodes);
      childNodes = atts;
      atts = {};
    } else if (typeof atts === 'function') {
      cb = /** @type {SimpleCallback} */ (atts);
      childNodes = [];
      atts = {};
    }
    if (typeof childNodes === 'function') {
      cb = /** @type {SimpleCallback} */ (childNodes);
      childNodes = [];
    }

    // Element-like object (DOM Element) -> extract attributes
    if (typeof elName === 'object' && elName && 'attributes' in elName) {
      /** @type {Record<string, string>} */
      const objAtts = {};
      // @ts-ignore - treat elName as Element-like
      [...elName.attributes].forEach((att) => {
        objAtts[att.name] = att.value;
      });
      atts = Object.assign(objAtts, atts);
      // @ts-ignore
      elName = /** @type {any} */ (elName).nodeName;
    }

    /** @type {Record<string, unknown>} */
    let attsObj = /** @type {any} */ (atts) || {};
    /** @type {any[]} */
    const jmlChildren = [];

    // Preprocess special attribute helpers present directly on attsObj
    if (attsObj.dataset && typeof attsObj.dataset === 'object' &&
      !Array.isArray(attsObj.dataset)
    ) {
      const ds = /** @type {Record<string, unknown>} */ (attsObj.dataset);
      for (const k in ds) {
        if (Object.hasOwn(ds, k)) {
          const dashed = k.replaceAll(camelCase, _makeDatasetAttribute);
          attsObj['data-' + dashed] = ds[k];
        }
      }
      delete attsObj.dataset;
    }
    if (Array.isArray(attsObj.$a)) {
      (/** @type {unknown[][]} */ (attsObj.$a)).forEach((pair) => {
        if (Array.isArray(pair) && pair.length > 1) {
          attsObj[String(pair[0])] = pair[1];
        }
      });
      delete attsObj.$a;
    }

    // If children provided as array, copy (may be primitives or nested JML)
    if (Array.isArray(childNodes) && childNodes.length) {
      jmlChildren.push(...childNodes);
    }

    // Callback-driven building (attribute/text/nested element mutate stack)
    if (cb) {
      // Push current state onto a stack
      this._elementStack.push({attsObj, jmlChildren});
      cb.call(this);
      const state = /** @type {any} */ (this._elementStack.pop());
      ({attsObj} = state);
      // Children may have been mutated by nested element()/text();
      // already in jmlChildren
    }

    // Build Jamilih array
    /** @type {any[]} */
    const jmlEl = [elName];
    if (Object.keys(attsObj).length) {
      jmlEl.push(attsObj);
    }
    jmlEl.push(...jmlChildren);

    // If inside a parent element, append as its child; otherwise append to root
    if (this._elementStack.length) {
      const top = /** @type {any} */ (this._elementStack.at(-1));
      top.jmlChildren.push(jmlEl);
    } else {
      this.append(jmlEl);
    }
    return this;
  }

  /**
   * Adds/updates an attribute for the most recently open element built via
   * a callback-driven element(). When not in an element callback context,
   * throws. Supports the same dataset/$a helpers as string joiner.
   * @param {string} name - Attribute name (or helper: dataset, $a)
   * @param {string|Record<string, unknown>|unknown[]} val
   *   Attribute value or helper object
   * @returns {JSONJoiningTransformer}
   */
  attribute (name, val) {
    if (!this._elementStack.length) {
      // No-op outside an element() callback (JSON joiner semantics)
      return this;
    }
    const top = /** @type {any} */ (this._elementStack.at(-1));
    const {attsObj} = top;
    if (name === 'dataset' && val && typeof val === 'object' &&
      !Array.isArray(val)
    ) {
      const datasetObj = /** @type {Record<string, unknown>} */ (val);
      for (const k in datasetObj) {
        if (Object.hasOwn(datasetObj, k)) {
          const dashed = k.replaceAll(camelCase, _makeDatasetAttribute);
          attsObj['data-' + dashed] = datasetObj[k];
        }
      }
      return this;
    }
    if (name === '$a' && Array.isArray(val)) {
      (/** @type {unknown[][]} */ (val)).forEach((pair) => {
        if (Array.isArray(pair) && pair.length > 1) {
          attsObj[String(pair[0])] = pair[1];
        }
      });
      return this;
    }
    attsObj[name] = val;
    return this;
  }

  /**
   * Adds a text node (string) as a child within the current element() callback
   * context. Outside of an element callback, simply appends the text to the
   * current array/object like string().
   * @param {string} txt - Text content
   * @returns {JSONJoiningTransformer}
   */
  text (txt) {
    if (this._elementStack.length) {
      const top = /** @type {any} */ (this._elementStack.at(-1));
      const {jmlChildren} = top;
      jmlChildren.push(txt);
      return this;
    }
    // No-op outside element context in JSON joiner
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
   * @param {Record<string, unknown>} obj - Object to apply property set to
   * @param {string} psName - Property set name
   * @returns {Record<string, unknown>}
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

