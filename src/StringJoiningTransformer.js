import {jml} from 'jamilih';
import * as JHTML from 'jhtml';
import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';

/**
 * @typedef {{
 *   encoding?: string,
 *   indent?: boolean,
 *   omitXmlDeclaration?: boolean,
 *   doctypePublic?: string,
 *   doctypeSystem?: string,
 *   cdataSectionElements?: string[]
 *   mediaType?: string,
 *   version?: string,
 *   standalone?: boolean,
 *   method?: "xml"|"html"|"text"
 * }} OutputConfig
 */

/**
 * @callback SimpleCallback
 * @this {StringJoiningTransformer}
 * @returns {void}
 */

const camelCase = /[a-z][A-Z]/gv;

/**
 * Type guard to detect DOM Elements.
 * @param {any} item
 * @returns {item is Element}
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
 * Attributes object for element() allowing standard string attributes
 * plus special helpers: dataset (object) and $a (ordered attribute array).
 * @typedef {Record<string, unknown> & {
 *   dataset?: Record<string, string>,
 *   $a?: Array<[string, string]>
 * }} ElementAttributes
 */

/**
 *
 */
/**
 * Joining transformer that builds a string result.
 *
 * This transformer provides a fluent API to compose strings while supporting
 * object/array-building semantics similar to template languages. Most methods
 * funnel through append(), which is state-aware:
 *
 * - Inside object(): values go to object properties via propOnly()/propValue().
 * - Inside array(): values are pushed to the current array.
 * - Otherwise: values are concatenated into the internal string buffer.
 *
 * Escaping rules:
 * - text(): escapes HTML special chars (& and <) and will close an open tag.
 * - string(): no HTML escaping or JSON stringification; context-aware.
 * - plainText(): raw append to the top-level string buffer (bypasses state).
 * - rawAppend(): like plainText() but documented as lower-level.
 *
 * HTML/XML helpers:
 * - element() and attribute() allow building tags with optional auto-escaping
 *   for attribute values unless cfg.preEscapedAttributes is set.
 *
 * Configuration hints (see joiningConfig in JTLT):
 * - cfg.xmlElements: switch element() serializer to XML mode (self-closing,
 *   name mapping rules differ, etc.).
 * - cfg.preEscapedAttributes: skip escaping attribute values.
 * - cfg.JHTMLForJSON / cfg.mode: affect how object()/array() serialize.
 * @extends {AbstractJoiningTransformer<"string">}
 */
class StringJoiningTransformer extends AbstractJoiningTransformer {
  /**
   * @param {string} s - Initial string
   * @param {import('./AbstractJoiningTransformer.js').
   *   StringJoiningTransformerConfig} [cfg] - Configuration object
   */
  constructor (s, cfg) {
    super(cfg); // Include this in any subclass of AbstractJoiningTransformer

    this._str = s || '';
    /** @type {any} */
    this._objPropTemp = undefined;
    /** @type {boolean | undefined} */
    this.propOnlyState = undefined;
    /** @type {boolean | undefined} */
    this._arrItemState = undefined;
    /** @type {boolean | undefined} */
    this._objPropState = undefined;
    /** @type {any} */
    this._obj = undefined;
    /** @type {any[]} */
    this._arr = [];
    /** @type {string | undefined} */
    this._strTemp = undefined;
    /** @type {Record<string, unknown>} */
    this.propertySets = {};
    /** @type {string[]} */
    this._docs = [];
    /** @type {boolean} */
    this._insideDocument = false;
  }

  /**
   * @param {string|any} s - String or value to append
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
   * @returns {string|string[]}
   */
  get () {
    if (this._cfg.exposeDocuments) {
      // If we built a document outside of document() calls and haven't
      // pushed it yet, push the current string
      if (this.root && !this._insideDocument && this._str &&
          !this._docs.includes(this._str)) {
        this._docs.push(this._str);
      }
      return this._docs;
    }
    return this._str;
  }

  /**
   * @param {string} prop - Property name
   * @param {any} val - Property value
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
   * @param {(this: StringJoiningTransformer) => void} cb - Callback function
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
    /** @type {any} */
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
   * @param {Record<string, unknown>|Element} obj - Object to serialize
   * @param {(this: StringJoiningTransformer) => void} cb - Callback function
   * @param {any[]} [usePropertySets] - Property sets to use
   * @param {Record<string, unknown>} [propSets] - Additional property sets
   * @returns {StringJoiningTransformer}
   */
  object (obj, cb, usePropertySets, propSets) {
    // Builds up an internal object (or converts a supplied Element via JHTML)
    // and, depending on context, either appends the object to the current
    // array/object or serializes it into the output string (JSON, JavaScript,
    // or JHTML), based on cfg.
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    this._requireSameChildren('string', 'object');
    /** @type {any} */
    const oldObjPropState = this._objPropState;
    /** @type {any} */
    const oldObj = this._obj;
    this._obj = _isElement(obj)
      ? JHTML.toJSONObject(obj, {mode: this._cfg.mode})
      : obj || {};

    // Todo: Allow in this and subsequent JSON methods ability to create
    //   jml-based JHTML

    if (usePropertySets !== undefined) {
      this._obj = usePropertySets.reduce(function (o, psName) {
        return that._usePropertySets(o, psName);
      }, this._obj);
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
      const stringifier = new JHTML.Stringifier({mode: 'JavaScript'});
      this.append(stringifier.walkJSONObject(this._obj));
    } else {
      this.append(JSON.stringify(this._obj));
    }
    this._obj = oldObj;
    return this;
  }

  /**
   * @param {any[]|Element} [arr] - Array to serialize
   * @param {(this: StringJoiningTransformer) => void} [cb] - Callback function
   * @returns {StringJoiningTransformer}
   */
  array (arr, cb) {
    // Similar to object(), but for arrays. Context determines whether to
    // append the array structure or to serialize into the string.
    this._requireSameChildren('string', 'array');
    /** @type {any} */
    const oldArr = this._arr;
    // Todo: copy array?
    this._arr = _isElement(arr)
      ? /** @type {any[]} */ (JHTML.toJSONObject(arr, {mode: this._cfg.mode}))
      : arr || [];

    /** @type {any} */
    const oldArrItemState = this._arrItemState;

    /* c8 ignore next 8 -- Callback handling for nested array building.
     * Requires specific state combinations with nested objects/arrays. */
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
    /* c8 ignore next 2 -- JHTMLForJSON is a specialized output mode rarely used
     * in combination with nested array building at the root level. */
    } else if (this._cfg.JHTMLForJSON) {
      this.append(JHTML.toJHTMLString(this._arr));
    } else if (this._cfg.mode !== 'JavaScript') {
      // Allow this method to operate on non-finite numbers and functions
      const stringifier = new JHTML.Stringifier({mode: 'JavaScript'});
      this.append(stringifier.walkJSONObject(this._arr));
    } else {
      this.append(JSON.stringify(this._arr));
    }
    this._arr = oldArr;
    return this;
  }

  /**
   * @param {string|Element|Record<string, unknown>} str
   *   String value or element
   * @param {(this: StringJoiningTransformer) => void} [cb] - Callback function
   * @returns {StringJoiningTransformer}
   */
  string (str, cb) {
    // Context-aware string emission. If inside object/array/propOnly states,
    // the produced string participates in those structures via append().
    // If a callback is provided, it composes a nested string value first.
    if (_isElement(str)) {
      str = /** @type {any} */ (
        JHTML.toJSONObject(str, {mode: this._cfg.mode})
      );
    }

    let tmpStr = '';
    /** @type {any} */
    const _oldStrTemp = this._strTemp;
    if (cb) {
      this._strTemp = '';
      cb.call(this);
      tmpStr = this._strTemp;
      this._strTemp = _oldStrTemp;
    }
    if (_oldStrTemp !== undefined) {
      this._strTemp = (this._strTemp || '') + str;
    } else {
      // Append to the output (or current container via append()).
      this.append(tmpStr + str);
    }
    return this;
  }

  /**
   * @param {number|Element|Record<string, unknown>} num
   *   Number value or element
   * @returns {StringJoiningTransformer}
   */
  number (num) {
    // Appends the number as a string; no localization/formatting is applied.
    if (_isElement(num)) {
      num = /** @type {any} */ (
        JHTML.toJSONObject(num, {mode: this._cfg.mode})
      );
    }
    this.append(num.toString());
    return this;
  }

  /**
   * @param {boolean|Element|Record<string, unknown>} bool
   *   Boolean value or element
   * @returns {StringJoiningTransformer}
   */
  boolean (bool) {
    // Appends 'true' or 'false'.
    if (_isElement(bool)) {
      bool = /** @type {any} */ (
        JHTML.toJSONObject(bool, {mode: this._cfg.mode})
      );
    }
    this.append(bool ? 'true' : 'false');
    return this;
  }

  /**
   * @returns {StringJoiningTransformer}
   */
  null () {
    // Appends the literal 'null'.
    this.append('null');
    return this;
  }

  /**
   * @returns {StringJoiningTransformer}
   */
  undefined () {
    // Appends the literal 'undefined' (only in JavaScript mode).
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'undefined is not allowed unless added in JavaScript mode'
      );
    }
    this.append('undefined');
    return this;
  }

  /**
   * @param {number|Element} num - Non-finite number (NaN, Infinity, -Infinity)
   * @returns {StringJoiningTransformer}
   */
  nonfiniteNumber (num) {
    // Appends NaN/Infinity/-Infinity as-is (only in JavaScript mode).
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'Non-finite numbers are not allowed unless added in JavaScript mode'
      );
    }
    if (_isElement(num)) {
      num = /** @type {any} */ (
        JHTML.toJSONObject(num, {mode: this._cfg.mode})
      );
    }
    this.append(num.toString());
    return this;
  }

  /**
   * @param {((...args: any[]) => any)|Element} func - Function to stringify
   * @returns {StringJoiningTransformer}
   */
  function (func) {
    // Appends function source (only in JavaScript mode).
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'function is not allowed unless added in JavaScript mode'
      );
    }
    if (_isElement(func)) {
      func = /** @type {any} */ (
        JHTML.toJSONObject(func, {mode: this._cfg.mode})
      );
    }
    this.append(func.toString());
    return this;
  }

  /**
   * @param {OutputConfig} cfg
   * @returns {StringJoiningTransformer}
   */
  output (cfg) {
    // We wait until first element is set in `element()` to add
    //   XML declaration and DOCTYPE as latter depends on root element
    this._outputConfig = cfg;

    // Use for file extension if making downloadable?
    this.mediaType = cfg.mediaType;
    return this;
  }

  /**
   * @param {string|Element} elName - Element name or element object
   * @param {ElementAttributes} [atts] - Element attributes
   * @param {any[]} [childNodes] - Child nodes
   * @param {(this: StringJoiningTransformer) => void} [cb] - Callback function
   * @returns {StringJoiningTransformer}
   */
  element (elName, atts, childNodes, cb) {
    // If a parent element's start tag is still open, close it before
    // starting a new element to ensure valid nesting.
    if (this._openTagState) {
      this.append('>');
      this._openTagState = false;
    }

    if (!this.root) {
      this.root = elName;

      // todo: indent, cdataSectionElements
      const {
        omitXmlDeclaration, doctypePublic, doctypeSystem, method
      } = this._outputConfig ?? {};

      let xmlDeclaration = '';
      if (!omitXmlDeclaration && (
        method === 'xml' || omitXmlDeclaration === false)
      ) {
        const {version, encoding, standalone} = this._outputConfig ?? {};
        xmlDeclaration = `<?xml${
          version ? ` version="${version}"` : ''
        }${
          encoding ? ` encoding="${encoding}"` : ''
        }${
          standalone ? ` standalone="${standalone ? 'yes' : 'no'}"` : ''
        }?>\n`;
      }

      let doctype = '';
      if (doctypePublic !== undefined || doctypeSystem !== undefined) {
        doctype = `<!DOCTYPE ${elName}${
          doctypePublic
            ? ` PUBLIC "${doctypePublic}" "${doctypeSystem}"`
            : doctypeSystem
              ? ` SYSTEM "${doctypeSystem}"`
              : ''
        }>\n`;
      }

      this._str = xmlDeclaration + doctype + this._str;
      // Document pushing is handled by document() method or get()
    }

    // Emits an HTML/XML element using Jamilih under the hood, or allows a
    // callback to build attributes/children incrementally. Attribute values
    // are escaped unless cfg.preEscapedAttributes is true. When a callback is
    // provided, this manages open-tag state so text() can close it safely.
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    if (Array.isArray(atts)) {
      cb = /** @type {(this: StringJoiningTransformer) => void} */ (
        /** @type {unknown} */ (childNodes)
      );
      childNodes = atts;
      atts = {};
    } else if (typeof atts === 'function') {
      cb = /** @type {(this: StringJoiningTransformer) => void} */ (atts);
      childNodes = [];
      atts = {};
    }
    if (typeof childNodes === 'function') {
      cb = /** @type {(this: StringJoiningTransformer) => void} */ (childNodes);
      childNodes = [];
    }

    // Todo: allow for cfg to produce Jamilih string output or hXML
    //   string output
    const method = this._cfg.xmlElements ? 'toXML' : 'toHTML';
    if (!cb) {
      // Ensure any open parent start tag was closed (handled above)
      // Note that Jamilih currently has an issue with 'selected', 'checked',
      //  'value', 'defaultValue', 'for', 'on*', 'style' (workaround: pass
      //   an empty callback as the last argument to element())
      this.append(
        // Casts to satisfy TS when using JS + JSDoc
        /** @type {any} */ (jml[method])(elName,
          /** @type {any} */ (atts), /** @type {any} */ (childNodes))
      );
      return this;
    }

    if (typeof elName === 'object') {
      /** @type {Record<string, string>} */
      const objAtts = {};
      /** @type {any} */
      const elObj = elName;
      [...elObj.attributes].forEach(function (att, i) {
        objAtts[att.name] = att.value;
      });
      atts = Object.assign(objAtts, atts);
      elName = elObj.nodeName;
    }

    this.append('<' + elName);
    /** @type {any} */
    const oldTagState = this._openTagState;
    this._openTagState = true;
    if (atts) {
      const attsObj = /** @type {Record<string, unknown>} */ (atts);
      Object.keys(attsObj).forEach((att) => {
        that.attribute(
          att,
          /** @type {string|Record<string, unknown>} */ (attsObj[att]),
          false
        );
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
   * @param {string|Record<string, unknown>|
   *   string[][]} val - Attribute value
   * @param {boolean} [avoidAttEscape] - Whether to avoid escaping the
   *   attribute value
   * @returns {StringJoiningTransformer}
   */
  attribute (name, val, avoidAttEscape) {
    // Adds an attribute to the most recently opened start tag. Supports
    // special objects for dataset and ordered attributes ($a). Escapes '&'
    // and '"' unless cfg.preEscapedAttributes or avoidAttEscape are set.
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    if (!this._openTagState) {
      throw new Error(
        'An attribute cannot be added after an opening tag has been closed ' +
        '(name: ' + name + '; value: ' + val + ')'
      );
    }

    if (!this._cfg.xmlElements) {
      if (typeof val === 'object') {
        /** @type {Record<string, unknown>} */
        const valObj = /** @type {any} */ (val);
        switch (name) {
        case 'dataset': {
          Object.keys(valObj).forEach(function (att) {
            that.attribute(
              'data-' + att.replaceAll(
                camelCase, _makeDatasetAttribute
              ),
              /** @type {string|Record<string, unknown>} */ (valObj[att]),
              false
            );
          });
          break;
        }
        case '$a': { // Ordered attributes
          /** @type {unknown[][]} */
          const valArr = /** @type {any} */ (val);
          valArr.forEach(function (attArr) {
            that.attribute(
              String(attArr[0]),
              /** @type {string|Record<string, unknown>} */ (attArr[1]),
              false
            );
          });
          break;
        }
        default:
          break;
        }
        return this;
      }
      name = {className: 'class', htmlFor: 'for'}[name] || name;
    }

    /** @type {string} */
    const valStr = /** @type {any} */ (val);
    val = (this._cfg.preEscapedAttributes || avoidAttEscape)
      ? valStr
      : valStr.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    this.append(' ' + name + '="' + val + '"');
    return this;
  }

  /**
   * @param {string} txt - Text content to escape and append
   * @returns {StringJoiningTransformer}
   */
  text (txt) {
    // Adds escaped text content. If currently within an unclosed start tag,
    // it will first close the tag ('>'). Escapes '&' and '<'.
    if (this._openTagState) {
      this.append('>');
      this._openTagState = false;
    }
    this.append(txt.replaceAll('&', '&amp;').replaceAll('<', '&lt;'));
    return this;
  }

  /**
   * @param {string} text
   * @returns {StringJoiningTransformer}}
   */
  comment (text) {
    this.append(`<!--${text}-->`);
    return this;
  }

  /**
   * @param {string} target
   * @param {string} data
   * @returns {StringJoiningTransformer}}
   */
  processingInstruction (target, data) {
    this.append(`<?${target} ${data}?>`);
    return this;
  }

  /**
   * Unlike text(), does not escape for HTML; unlike string(), does not perform
   *   JSON stringification; unlike append(), does not do other checks (but
   *   still varies in its role across transformers).
   * @param {string} str
   * @returns {StringJoiningTransformer}
   */
  rawAppend (str) {
    // Lowest-level append: bypasses append() semantics and state checks.
    this._str += str;
    return this;
  }

  /**
   * @param {string} str - Plain text to append without escaping
   * @returns {StringJoiningTransformer}
   */
  plainText (str) {
    // Bypasses append() semantics: always writes directly to the top-level
    // string buffer with no escaping. Prefer string() when you want the value
    // to participate in object/array contexts.
    this._str += str;
    return this;
  }

  /**
   * Creates a new string document and executes a callback in its context.
   * Similar to XSLT's xsl:document, this allows templates to generate
   * multiple output documents. The created document is pushed to this._docs
   * and will be included in the result when exposeDocuments is true.
   *
   * @param {(this: StringJoiningTransformer) => void} cb
   *   Callback that builds the document content
   * @param {OutputConfig} [cfg]
   *   Output configuration for the document (encoding, doctype, etc.)
   * @returns {StringJoiningTransformer}
   */
  document (cb, cfg) {
    // If there's a current document being built (this.root is set and _str
    // has content), save it to _docs before starting a new document
    if (this._cfg.exposeDocuments && this.root && this._str &&
        !this._docs.includes(this._str)) {
      this._docs.push(this._str);
    }

    // Save current state
    /** @type {any} */
    const oldRoot = this.root;
    /** @type {any} */
    const oldOutputConfig = this._outputConfig;
    const oldStr = this._str;
    /** @type {any} */
    const oldOpenTagState = this._openTagState;

    // Reset state for new document
    this.root = undefined;
    /** @type {any} */
    this._outputConfig = cfg;
    this._str = '';
    this._openTagState = false;
    this._insideDocument = true;

    // Execute callback to build document content
    cb.call(this);

    // Save the newly created document string
    const newDoc = this._str;
    this._docs.push(newDoc);

    // Restore previous state
    this.root = oldRoot;
    this._outputConfig = oldOutputConfig;
    this._str = oldStr;
    this._openTagState = oldOpenTagState;
    this._insideDocument = false;

    return this;
  }

  /**
   * Helper method to use property sets.
   * @param {Record<string, unknown>} obj - Object to apply property set to
   * @param {string} psName - Property set name
   * @returns {Record<string, unknown>}
   */
  _usePropertySets (obj, psName) {
    // Merge named property set from this.propertySets into obj
    if (this.propertySets && this.propertySets[psName]) {
      return {
        ...obj,
        ...this.propertySets[psName]
      };
    }
    return obj;
  }
}

export default StringJoiningTransformer;
