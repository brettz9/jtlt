import * as JHTML from 'jhtml';
import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';

/**
 * This transformer expects the templates to do their own DOM building.
 */
class DOMJoiningTransformer extends AbstractJoiningTransformer {
  /**
   * @param {DocumentFragment|Element} o - Initial DOM node
   * @param {object} cfg - Configuration object
   * @param {object} [cfg.document] - Document object
   */
  constructor (o, cfg) {
    super(cfg); // Include this in any subclass of AbstractJoiningTransformer
    this._dom = o ||
    /** @type {any} */ (cfg).document.createDocumentFragment();
  }

  /**
   * @param {Node} item
   * @returns {void}
   */
  rawAppend (item) {
    this._dom.append(item);
  }

  /**
   * @param {string|Node} item - Item to append
   * @returns {void}
   */
  append (item) {
    this._dom.append(item);
  }

  /**
   * @returns {DocumentFragment|Element}
   */
  get () {
    return this._dom;
  }

  /**
   * @param {string} prop - Property name
   * @param {*} val - Property value
   * @returns {void}
   */
  // eslint-disable-next-line class-methods-use-this -- Incomplete?
  propValue (prop, val) {
    //
  }

  /**
   * @param {object} obj - Object to serialize
   * @param {Function} [cb] - Callback function.
   * @param {any[]} [usePropertySets] - Property sets to use
   * @param {object} [propSets] - Additional property sets
   * @returns {DOMJoiningTransformer}
   */
  object (obj, cb, usePropertySets, propSets) {
    this._requireSameChildren('dom', 'object');
    if (this._cfg && /** @type {any} */ (this._cfg).JHTMLForJSON) {
      this.append(JHTML.toJHTMLDOM(obj));
    } else {
      // Todo: set current position and deal with children
      this.append('');
    }
    return this;
  }

  /**
   * @param {any[]|Element} arr
   * @param {Function} [cb] - Callback function
   * @returns {DOMJoiningTransformer}
   */
  array (arr, cb) {
    this._requireSameChildren('dom', 'array');
    if (this._cfg && /** @type {any} */ (this._cfg).JHTMLForJSON) {
      this.append(JHTML.toJHTMLDOM(arr));
    } else {
      // Todo: set current position and deal with children
      this.append('');
    }
    return this;
  }

  /**
   * @param {string} str - String value
   * @param {Function} cb - Callback function (unused)
   * @returns {DOMJoiningTransformer}
   */
  string (str, cb) {
    // Todo: Conditionally add as JHTML (and in subsequent methods as well)
    this.append(str);
    return this;
  }

  /**
   * @param {number} num - Number value
   * @returns {DOMJoiningTransformer}
   */
  number (num) {
    this.append(num.toString());
    return this;
  }

  /**
   * @param {boolean} bool
   * @returns {DOMJoiningTransformer}
   */
  boolean (bool) {
    this.append(bool ? 'true' : 'false');
    return this;
  }

  /**
   * @returns {DOMJoiningTransformer}
   */
  null () {
    this.append('null');
    return this;
  }

  /**
   * @returns {DOMJoiningTransformer}
   */
  undefined () {
    if (this._cfg && /** @type {any} */ (this._cfg).mode !== 'JavaScript') {
      throw new Error(
        'undefined is not allowed unless added in JavaScript mode'
      );
    }
    this.append('undefined');
    return this;
  }

  /**
   * @param {number} num - Non-finite number (NaN, Infinity, -Infinity)
   * @returns {DOMJoiningTransformer}
   */
  nonfiniteNumber (num) {
    if (this._cfg && /** @type {any} */ (this._cfg).mode !== 'JavaScript') {
      throw new Error(
        'Non-finite numbers are not allowed unless added in JavaScript mode'
      );
    }
    this.append(num.toString());
    return this;
  }

  /**
   * @param {Function} func - Function to stringify
   * @returns {DOMJoiningTransformer}
   */
  function (func) {
    if (this._cfg && /** @type {any} */ (this._cfg).mode !== 'JavaScript') {
      throw new Error(
        'function is not allowed unless added in JavaScript mode'
      );
    }
    this.append(func.toString());
    return this;
  }

  /**
   * @param {string} elName - Element name
   * @param {object} [atts] - Attributes object
   * @param {Function} [cb] - Callback function
   * @returns {DOMJoiningTransformer}
   */
  element (elName, atts, cb) {
    // Todo: allow third argument to be array following Jamilih (also let
    //   "atts" follow Jamilih)
    // Todo: allow for cfg to produce Jamilih DOM output or hXML
    // Todo: allow separate XML DOM one with XML String and hXML conversions
    //   (HTML to XHTML is inevitably safe?)

    const el = this._cfg &&
    /** @type {any} */ (this._cfg).document.createElement(elName);
    for (const att in atts) {
      if (Object.hasOwn(atts, att)) {
        /** @type {Record<string, any>} */
        const attsObj = /** @type {any} */ (atts);
        el.setAttribute(att, attsObj[att]);
      }
    }
    this.append(el);

    const oldDOM = this._dom;

    this._dom = el;
    if (cb) {
      cb.call(this);
    }
    this._dom = oldDOM;

    return this;
  }

  /**
   * @param {string} name
   * @param {string} val
   * @returns {DOMJoiningTransformer}
   */
  attribute (name, val) {
    if (!this._dom || typeof this._dom !== 'object' ||
        this._dom.nodeType !== 1) {
      throw new Error('You may only set an attribute on an element');
    }
    this._dom.setAttribute(name, val);
    return this;
  }

  /**
   * @param {string} txt - Text content
   * @returns {DOMJoiningTransformer}
   */
  text (txt) {
    this.append(txt);
    return this;
  }

  /**
   * @param {string} str
   * @returns {DOMJoiningTransformer}
   */
  plainText (str) {
    this.text(str);
    return this;
  }
}

export default DOMJoiningTransformer;
