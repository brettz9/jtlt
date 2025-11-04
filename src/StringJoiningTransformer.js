import {jml} from 'jamilih';
import JHTML from 'jhtml';
import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';
import Stringifier from 'jhtml/SAJJ/SAJJ.Stringifier.js';

const camelCase = /[a-z][A-Z]/gv;

/**
 * @param {any} item
 * @returns {boolean}
 */
function _isElement (item) {
  return item && typeof item === 'object' && item.nodeType === 1;
}

/**
 * @param {string} n0
 * @returns {string}
 */
function _makeDatasetAttribute (n0) {
  return n0.charAt(0) + '-' + n0.charAt(1).toLowerCase();
}

/**
 *
 */
class StringJoiningTransformer extends AbstractJoiningTransformer {
  /**
   * @param {string} s - Initial string
   * @param {object} cfg - Configuration object
   */
  constructor (s, cfg) {
    super(cfg); // Include this in any subclass of AbstractJoiningTransformer
    this._str = s || '';
  }

  /**
   * @param {string|*} s - String or value to append
   * @returns {StringJoiningTransformer}
   */
  append (s) {
    // Todo: Could allow option to disallow elements within arrays, etc.
    //   (add states and state checking)

    if (this.propOnlyState) {
      this._obj[this._objPropTemp] = s;
      this.propOnlyState = false;
      this._objPropTemp = undefined;
    } else if (this._arrItemState) {
      this._arr.push(s);
    } else if (this._objPropState) {
      throw new Error(
        'Object values must be added via propValue() or after ' +
          'propOnly() when in an object state.'
      );
    } else {
      this._str += s;
    }
    return this;
  }

  /**
   * @returns {string}
   */
  get () {
    return this._str;
  }

  /**
   * @param {string} prop - Property name
   * @param {*} val - Property value
   * @returns {StringJoiningTransformer}
   */
  propValue (prop, val) {
    if (!this._objPropState) {
      throw new Error(
        'propValue() can only be called after an object state has been set up.'
      );
    }
    this._obj[prop] = val;
    return this;
  }

  /**
   * @param {string} prop - Property name
   * @param {Function} cb - Callback function
   * @returns {StringJoiningTransformer}
   */
  propOnly (prop, cb) {
    if (!this._objPropState) {
      throw new Error(
        'propOnly() can only be called after an object state has been set up.'
      );
    }
    if (this.propOnlyState) {
      throw new Error(
        'propOnly() can only be called again after a value is set'
      );
    }
    this.propOnlyState = true;
    const oldPropTemp = this._objPropTemp;
    this._objPropTemp = prop;
    cb.call(this);
    this._objPropTemp = oldPropTemp;
    if (this.propOnlyState) {
      throw new Error('propOnly() must be followed up with setting a value.');
    }
    return this;
  }

  /**
   * @param {object} obj - Object to serialize
   * @param {Function} cb - Callback function
   * @param {Array} usePropertySets - Property sets to use
   * @param {object} propSets - Additional property sets
   * @returns {StringJoiningTransformer}
   */
  object (obj, cb, usePropertySets, propSets) {
    this._requireSameChildren('string', 'object');
    const oldObjPropState = this._objPropState;
    const oldObj = this._obj;
    this._obj = obj || {};
    if (_isElement(obj)) {
      this._obj = JHTML.toJSONObject(this._obj);
    }

    // Todo: Allow in this and subsequent JSON methods ability to create
    //   jml-based JHTML

    if (usePropertySets !== undefined) {
      usePropertySets.reduce(function (o, psName) {
        return this._usePropertySets(o, psName); // Todo: Put in right scope
      }.bind(this), {});
    }
    if (propSets !== undefined) {
      Object.assign(this._obj, propSets);
    }

    if (cb) {
      this._objPropState = true;
      cb.call(this);
      this._objPropState = oldObjPropState;
    }

    // Not ready to serialize yet as still inside another array or object
    if (oldObjPropState || this._arrItemState) {
      this.append(this._obj);
    } else if (this._cfg.JHTMLForJSON) {
      this.append(JHTML.toJHTMLString(this._obj));
    } else if (this._cfg.mode !== 'JavaScript') {
      // Allow this method to operate on non-finite numbers and functions
      const stringifier = new Stringifier({mode: 'JavaScript'});
      this.append(stringifier.walkJSONObject(this._obj));
    } else {
      this.append(JSON.stringify(this._obj));
    }
    this._obj = oldObj;
    return this;
  }

  /**
   * @param {Array} arr - Array to serialize
   * @param {Function} cb - Callback function
   * @returns {StringJoiningTransformer}
   */
  array (arr, cb) {
    this._requireSameChildren('string', 'array');
    const oldArr = this._arr;
    // Todo: copy array?
    this._arr = arr || [];
    if (_isElement(arr)) {
      this._arr = JHTML.toJSONObject(this._arr);
    }

    const oldArrItemState = this._arrItemState;

    if (cb) {
      const oldObjPropState = this._objPropState;
      this._objPropState = false;
      this._arrItemState = true;
      cb.call(this);
      this._arrItemState = oldArrItemState;
      this._objPropState = oldObjPropState;
    }

    // Not ready to serialize yet as still inside another array or object
    if (oldArrItemState || this._objPropState) {
      this.append(this._arr);
    } else if (this._cfg.JHTMLForJSON) {
      this.append(JHTML.toJHTMLString(this._arr));
    } else if (this._cfg.mode !== 'JavaScript') {
      // Allow this method to operate on non-finite numbers and functions
      const stringifier = new Stringifier({mode: 'JavaScript'});
      this.append(stringifier.walkJSONObject(this._obj));
    } else {
      this.append(JSON.stringify(this._arr));
    }
    this._arr = oldArr;
    return this;
  }

  /**
   * @param {string|object} str - String value or element
   * @param {Function} cb - Callback function
   * @returns {StringJoiningTransformer}
   */
  string (str, cb) {
    if (_isElement(str)) {
      str = JHTML.toJSONObject(str);
    }

    let tmpStr = '';
    const _oldStrTemp = this._strTemp;
    if (cb) {
      this._strTemp = '';
      cb.call(this);
      tmpStr = this._strTemp;
      this._strTemp = _oldStrTemp;
    }
    if (_oldStrTemp !== undefined) {
      this._strTemp += str;
    /*
    // What was this for?
    } else if (this._cfg.mode !== 'JavaScript') {
      // Allow this method to operate on non-finite numbers and functions
      var stringifier = new Stringifier({mode: 'JavaScript'});
      this.append(stringifier.walkJSONObject(this._obj));
    */
    } else {
      // argument had been wrapped in JSON.stringify()
      this.append(tmpStr + str);
    }
    return this;
  }

  /**
   * @param {number|object} num - Number value or element
   * @returns {StringJoiningTransformer}
   */
  number (num) {
    if (_isElement(num)) {
      num = JHTML.toJSONObject(num);
    }
    this.append(num.toString());
    return this;
  }

  /**
   * @param {boolean|object} bool - Boolean value or element
   * @returns {StringJoiningTransformer}
   */
  boolean (bool) {
    if (_isElement(bool)) {
      bool = JHTML.toJSONObject(bool);
    }
    this.append(bool ? 'true' : 'false');
    return this;
  }

  /**
   * @returns {StringJoiningTransformer}
   */
  null () {
    this.append('null');
    return this;
  }

  /**
   * @returns {StringJoiningTransformer}
   */
  undefined () {
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'undefined is not allowed unless added in JavaScript mode'
      );
    }
    this.append('undefined');
    return this;
  }

  /**
   * @param {number} num - Non-finite number (NaN, Infinity, -Infinity)
   * @returns {StringJoiningTransformer}
   */
  nonfiniteNumber (num) {
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'Non-finite numbers are not allowed unless added in JavaScript mode'
      );
    }
    if (_isElement(num)) {
      num = JHTML.toJSONObject(num);
    }
    this.append(num.toString());
    return this;
  }

  /**
   * @param {Function} func - Function to stringify
   * @returns {StringJoiningTransformer}
   */
  function (func) {
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'function is not allowed unless added in JavaScript mode'
      );
    }
    if (_isElement(func)) {
      func = JHTML.toJSONObject(func);
    }
    this.append(func.toString());
    return this;
  }

  /**
   * @param {string|object} elName - Element name or element object
   * @param {object} atts - Element attributes
   * @param {Array} childNodes - Child nodes
   * @param {Function} cb - Callback function
   * @returns {StringJoiningTransformer}
   */
  element (elName, atts, childNodes, cb) {
    if (Array.isArray(atts)) {
      cb = childNodes;
      childNodes = atts;
      atts = {};
    } else if (typeof atts === 'function') {
      cb = atts;
      childNodes = undefined;
      atts = {};
    }
    if (typeof childNodes === 'function') {
      cb = childNodes;
      childNodes = undefined;
    }

    // Todo: allow for cfg to produce Jamilih string output or hXML
    //   string output
    const method = this._cfg.xmlElements ? 'toXML' : 'toHTML';
    if (!cb) {
      // Note that Jamilih currently has an issue with 'selected', 'checked',
      //  'value', 'defaultValue', 'for', 'on*', 'style' (workaround: pass
      //   an empty callback as the last argument to element())
      this.append(jml[method](elName, atts, childNodes));
      return this;
    }

    if (typeof elName === 'object') {
      const objAtts = {};
      [...elName.attributes].forEach(function (att, i) {
        objAtts[att.name] = att.value;
      });
      atts = Object.assign(objAtts, atts);
      elName = elName.nodeName;
    }

    this.append('<' + elName);
    const oldTagState = this._openTagState;
    this._openTagState = true;
    if (atts) {
      Object.keys(atts).forEach((att) => {
        this.attribute(att, atts[att]);
      });
    }
    if (childNodes && childNodes.length) {
      this._openTagState = false;
      this.append(jml[method]({'#': childNodes}));
    }
    cb.call(this);

    // Todo: Depending on an this._cfg.xmlElements option, allow for
    //    XML self-closing when empty or as per the tag, HTML
    //    self-closing tags (or polyglot-friendly self-closing)
    if (this._openTagState) {
      this.append('>');
    }
    this.append('</' + elName + '>');
    this._openTagState = oldTagState;
    return this;
  }

  /**
   * @param {string} name - Attribute name
   * @param {string|object} val - Attribute value
   * @param {boolean} avoidAttEscape - Whether to avoid escaping the
   *   attribute value
   * @returns {StringJoiningTransformer}
   */
  attribute (name, val, avoidAttEscape) {
    if (!this._openTagState) {
      throw new Error(
        'An attribute cannot be added after an opening tag has been closed ' +
        '(name: ' + name + '; value: ' + val + ')'
      );
    }

    if (!this._cfg.xmlElements) {
      if (typeof val === 'object') {
        switch (name) {
        case 'dataset':
          Object.keys(val).forEach(function (att) {
            this.attribute(
              'data-' + att.replaceAll(
                camelCase, _makeDatasetAttribute
              ), val[att]
            );
          });
          break;
        case '$a': // Ordered attributes
          val.forEach(function (attArr) {
            this.attribute(attArr[0], attArr[1]);
          });
          break;
        default:
          break;
        }
        return this;
      }
      name = {className: 'class', htmlFor: 'for'}[name] || name;
    }

    val = (this._cfg.preEscapedAttributes || avoidAttEscape)
      ? val
      : val.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    this.append(' ' + name + '="' + val + '"');
    return this;
  }

  /**
   * @param {string} txt - Text content to escape and append
   * @returns {StringJoiningTransformer}
   */
  text (txt) {
    if (this._openTagState) {
      this.append('>');
      this._openTagState = false;
    }
    this.append(txt.replaceAll('&', '&amp;').replaceAll('<', '&lt;'));
    return this;
  }

  /**
  * Unlike text(), does not escape for HTML; unlike string(), does not perform
  *   JSON stringification; unlike append(), does not do other checks (but still
  *   varies in its role across transformers).
  * @param {string} str
  * @returns {StringJoiningTransformer}
  */
  rawAppend (str) {
    this._str += str;
    return this;
  }

  /**
   * @param {string} str - Plain text to append without escaping
   * @returns {StringJoiningTransformer}
   */
  plainText (str) {
    this._str += str;
    return this;
  }
}

// Todo: Implement comment(), processingInstruction(), etc.

export default StringJoiningTransformer;
