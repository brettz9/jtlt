/**
 * JHTML is a format which can represent arbitrary JSON structures in a
 *  faithful, human-readable, and portable manner.
 * It is also round-trippable except in the case when converting *from*
 *   object-containing JSON to JHTML when the
 * ECMAScript/JSON interpreter does not iterate the properties in
 *   definition order (as it is not required to do).
 * @namespace Contains methods for conversions between JSON and
 *   JHTML (as strings or objects)
 * @todo Add polyfills, e.g., https://github.com/termi/Microdata-JS/
 * @todo Add option for stringification (JSON or JHTML) to provide
 *   indentation, etc.
 * @todo Make SAJJ as separate repo and require
 */

import ObjectArrayDelegator from './SAJJ/SAJJ.ObjectArrayDelegator.js';
import Stringifier from './SAJJ/SAJJ.Stringifier.js';

/* eslint-disable jsdoc/reject-function-type -- Generic */
/**
 * @typedef {Function} GenericFunction
 */
/* eslint-enable jsdoc/reject-function-type -- Generic */

/**
 * @param {Node} node
 * @param {Element} item
 * @throws {Error}
 * @returns {boolean}
 */
function ignoreHarmlessNonelementNodes (node, item) {
  if (
    (node.nodeType === 3 || node.nodeType === 4) && // Text or CDATA node
    (/\S/v).test(/** @type {string} */ (node.nodeValue))
  ) {
    throw new Error(
      'Non-whitespace text or CDATA nodes are not allowed directly within <' +
      item.nodeName.toLowerCase() + '>'
    );
  }
  // Todo: also ignore nodes like comments or processing instructions?
  //   (A mistake of JSON?); we might even convert comments into JavaScript
  //   comments if this is used in a non-JSON-restricted JavaScript environment
  // Not an element (ignore comments, whitespace text nodes, etc.)
  return node.nodeType !== 1;
}

/**
 * @typedef {undefined|null|boolean|number|bigint|symbol|string|GenericFunction|
 *   Date|RegExp} NonObject
 */

/**
 * @typedef {{
 *   [key: string]: NonObject | JSONObject | JSONObject[]
 * }} JSONObjectPlain
 */

/**
 * @typedef {(NonObject|JSONObject)[]} JSONObjectArray
 */

/**
 * @typedef {NonObject|JSONObjectPlain|JSONObjectArray} JSONObject
 */

/**
 * @param {Element} item
 * @param {boolean} allowJS
 * @param {boolean} [throwOnSpan]
 * @throws {Error}
 * @returns {JSONObject}
 */
function item2JSONObject (item, allowJS, throwOnSpan) {
  /** @type {JSONObject} */
  let ret;

  /** @type {"dt"|"dd"} */
  let state;
  const {textContent} = item,
    topLevelJSONElement = item.nodeName.toLowerCase();
  switch (topLevelJSONElement) {
  case 'span':
    if (throwOnSpan) {
      throw new Error('A <span> element is not allowed in this context');
    }
    return textContent;
  // null, boolean, number (or undefined, function, non-finite
  //   number, Date or RegExp object)
  case 'i':
    switch (textContent) {
    case 'null':
      return null;
    case 'true':
      return true;
    case 'false':
      return false;
    // Non-JSON
    case 'undefined':
      ret = undefined;
      break;
    case 'Infinity':
      ret = Infinity;
      break;
    case '-Infinity':
      ret = -Infinity;
      break;
    case 'NaN':
      ret = Number.NaN;
      break;
    default: {
      // number
      if ((/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e(?:[+\-])?\d+)?$/vi).test(textContent)) {
        return Number.parseFloat(textContent);
      }
      // function
      const funcMatch = textContent.match(/^function \w*\s*\(([\w, ]*)\) \{([\s\S]*)\}$/v);
      // Todo: Add config to prevent this
      if (funcMatch) {
        // eslint-disable-next-line no-new-func -- Deliberate
        ret = new Function(...funcMatch[1].split(/, /v).
          // eslint-disable-next-line unicorn/prefer-spread -- Convenient
          concat(funcMatch[2]));
        break;
      }
      // Date
      if ((/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) /v).test(textContent)) {
        ret = new Date(Date.parse(textContent));
        break;
      }
      // RegExp
      const regexMatch = textContent.match(/^\/([\s\S]*)\/([gimydsuv]+)?$/v);
      if (regexMatch) {
        const flags = (regexMatch[2] ?? '');
        ret = new RegExp(regexMatch[1], flags);
        break;
      }

      // BigInt

      const bigintMatch = textContent.match(/^\d+n$/v);
      if (bigintMatch) {
        ret = BigInt(bigintMatch[0].slice(0, -1));
        break;
      }

      const symbolMatch = textContent.match(/^Symbol\(('\w+')\)$/v);
      if (symbolMatch) {
        ret = Symbol(symbolMatch[1]);
        break;
      }

      throw new Error('Unrecognized type');
    }
    }
    if (!allowJS) {
      throw new Error(
        'The value type (' + String(ret) + ') cannot be used in JSON mode'
      );
    }
    return ret;
  case 'dl': { // object
    // JSON allows empty objects (and HTML allows empty <dl>'s) so we do also
    state = 'dt';
    ret = {};
    /** @type {string} */
    let key;
    [...item.childNodes].forEach(function (node) {
      if (ignoreHarmlessNonelementNodes(node, item)) {
        return;
      }
      const nodeName = node.nodeName.toLowerCase();
      if (state !== nodeName) {
        throw new Error(
          `Unexpected element ${nodeName} encountered where ${state} expected`
        );
      }
      if (nodeName === 'dt') {
        if (/** @type {Element} */ (node).children.length) {
          throw new Error('<dt> should not have any children');
        }
        state = 'dd';
        key = /** @type {string} */ (node.textContent);
        return;
      }
      // Can now only be a <dd>
      state = 'dt';
      if (/** @type {Element} */ (node).children.length > 1) {
        throw new Error(
          '<dd> should not have more than one element ' +
            'child (<ol>, <dl>, or <i>)'
        );
      }
      if (!(/** @type {Element} */ (node)).children.length) { // String
        /** @type {JSONObjectPlain} */
        (ret)[key] = node.textContent;
        return;
      }

      /** @type {JSONObjectPlain} */
      (ret)[key] = item2JSONObject(/** @type {Element} */ (
        node
      ).children[0], allowJS, true);
    });
    if (state !== 'dt') {
      throw new Error(
        'Ended a definition list without a final <dd> to ' +
          'match the previous <dt>.'
      );
    }
    return ret;
  } case 'ol': // array
    if (item.getAttribute('start') !== '0') {
      throw new Error(
        'For the sake of readability, <ol> must include a ' +
          'start="0" attribute within JHTML.'
      );
    }

    ret = [];
    // JSON allows empty arrays (and HTML allows empty <ol>'s) so we do also
    [...item.childNodes].forEach(function (node) {
      if (ignoreHarmlessNonelementNodes(node, item)) {
        return;
      }
      const nodeName = node.nodeName.toLowerCase();
      if (nodeName !== 'li') {
        throw new Error('Unexpected child of <ol> element: ' + nodeName);
      }
      if (/** @type {Element} */ (node).children.length > 1) {
        throw new Error(
          '<li> should not have more than a single element ' +
            'child (<ol>, <dl>, or <i>)'
        );
      }
      if (!(/** @type {Element} */ (node)).children.length) { // String
        /** @type {JSONObjectArray} */
        (ret).push(node.textContent);
      } else {
        /** @type {JSONObjectArray} */
        (ret).push(item2JSONObject(
          /** @type {Element} */ (node).children[0], allowJS, true
        ));
      }
    });
    return ret;
  default:
    break;
  }
  throw new Error('Unexpected element');
}

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHTMLText (str) {
  return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
}

// eslint-disable-next-line sonarjs/no-clear-text-protocols -- NS
const jhtmlNs = 'http://brett-zamir.me/ns/microdata/json-as-html/2';

/**
 *
 */
class JHTMLStringifier extends ObjectArrayDelegator {
  // JSON terminal handler methods

  // These four methods can be overridden without affecting the logic of the
  //   objectHandler and arrayHandler to utilize reporting of the object
  //   as a whole
  /**
   * @param {object} value
   * @param {object|undefined} parentObject
   * @returns {string}
   */
  beginObjectHandler (
    value, parentObject /* , parentKey, parentObjectArrayBool */
  ) {
    return '<dl' + (
      parentObject ? '' : ' itemscope="" itemtype="' + jhtmlNs + '"'
    ) + '>';
  }
  /**
   * @returns {string}
   */
  endObjectHandler (
    /* value, parentObject, parentKey, parentObjectArrayBool */
  ) {
    return '</dl>';
  }

  /**
   * @param {JSONObjectArray} value
   * @param {object|undefined} parentObject
   * @returns {string}
   */
  beginArrayHandler (
    value, parentObject /* , parentKey, parentObjectArrayBool */
  ) {
    return '<ol start="0"' + (
      parentObject ? '' : ' itemscope="" itemtype="' + jhtmlNs + '"'
    ) + '>';
  }

  /**
   * @returns {string}
   */
  endArrayHandler (
    /* value, parentObject, parentKey, parentObjectArrayBool */
  ) {
    return '</ol>';
  }

  // JSON terminal key handler methods

  /**
   * @param {string} key
   * @returns {string}
   */
  objectKeyHandler (
    key /* , parentObject, parentKey, parentObjectArrayBool, iterCt */
  ) {
    return '<dt>' + escapeHTMLText(key) + '</dt>';
  }

  /**
   * @returns {string}
   */
  arrayKeyHandler (/* key, parentObject, parentKey, parentObjectArrayBool */) {
    return '';
  }

  // JSON terminal joiner handler methods

  /**
   * @returns {string}
   */
  objectKeyValueJoinerHandler () {
    return '';
  }

  /**
   * @returns {string}
   */
  arrayKeyValueJoinerHandler () {
    return '';
  }

  // JSON terminal primitive handler methods

  /**
   * @param {null} obj
   * @param {object|undefined} parentObject
   * @returns {string}
   */
  nullHandler (obj, parentObject /* , parentKey, parentObjectArrayBool */) {
    if (!parentObject) {
      return 'null';
    }
    return '<i>null</i>';
  }

  /**
   * @param {boolean} value
   * @param {object|undefined} parentObject
   * @returns {string}
   */
  booleanHandler (
    value, parentObject /* , parentKey, parentObjectArrayBool */
  ) {
    if (!parentObject) {
      return String(value);
    }
    return '<i>' + String(value) + '</i>';
  }

  /**
   * @param {number} value
   * @param {object|undefined} parentObject
   * @returns {string}
   */
  numberHandler (value, parentObject /* , parentKey, parentObjectArrayBool */) {
    if (!parentObject) {
      return String(value);
    }
    return '<i>' + String(value) + '</i>';
  }

  /**
   * @param {string} value
   * @param {object|undefined} parentObject
   * @returns {string}
   */
  stringHandler (value, parentObject /* , parentKey, parentObjectArrayBool */) {
    if (!parentObject) {
      return escapeHTMLText(value);
    }
    return escapeHTMLText(value);
  }

  /* eslint-disable jsdoc/reject-function-type -- Generic */
  /**
   * @typedef {Function} GenericFunction
   */
  /* eslint-enable jsdoc/reject-function-type -- Generic */

  // JavaScript-only (non-JSON) (terminal) handler methods (not used or
  //   required for JSON mode)
  /**
   * @param {GenericFunction} value
   * @param {object|undefined} parentObject
   * @returns {string}
   */
  functionHandler (
    value, parentObject /* , parentKey, parentObjectArrayBool */
  ) {
    // May not be supported everywhere
    const str = escapeHTMLText(value.toString());
    if (!parentObject) {
      return str;
    }
    return '<i>' + str + '</i>';
  }

  /**
   * @param {undefined} value
   * @param {object|undefined} parentObject
   * @returns {string}
   */
  undefinedHandler (
    value, parentObject /* , parentKey, parentObjectArrayBool */
  ) {
    if (!parentObject) {
      return 'undefined';
    }
    return '<i>undefined</i>';
  }
  /**
   * @param {number} value
   * @param {object|undefined} parentObject
   * @returns {string}
   */
  nonfiniteNumberHandler (
    value, parentObject /* , parentKey, parentObjectArrayBool */
  ) {
    if (!parentObject) {
      return String(value);
    }
    return '<i>' + String(value) + '</i>';
  }

  /**
   * @param {JSONObject} value
   * @param {string} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  objectValueHandler (
    value, key, parentObject, parentKey, parentObjectArrayBool /* , iterCt */
  ) {
    return '<dd>' + this.delegateHandlersByType(
      value, parentObject, parentKey, parentObjectArrayBool
    ) + '</dd>';
  }

  /**
   * @param {JSONObjectArray} value
   * @param {string} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  arrayValueHandler (
    value, key, parentObject, parentKey, parentObjectArrayBool
  ) {
    return '<li>' + this.delegateHandlersByType(
      value, parentObject, parentKey, parentObjectArrayBool
    ) + '</li>';
  }

  /**
   * @param {JSONObject} obj
   * @returns {string}
   */
  beginHandler (obj /* , parObj, parKey, parObjArrBool */) {
    const objType = typeof obj;
    return obj && objType === 'object'
      ? ''
      : '<' + (
        [
          'boolean', 'object', 'number', 'function', 'undefined'
        ].includes(objType)
          ? 'i'
          : 'span'
      ) + ' itemscope="" itemtype="' + jhtmlNs + '">';
  }

  /**
   * @param {JSONObject} obj
   * @returns {string}
   */
  endHandler (obj /* , parObj, parKey, parObjArrBool */) {
    const objType = typeof obj;
    return obj && objType === 'object'
      ? ''
      : '</' + (
        [
          'boolean', 'object', 'number', 'function', 'undefined'
        ].includes(objType)
          ? 'i'
          : 'span'
      ) + '>';
  }
}

/** @type {import('jsdom').DOMWindow | Window & typeof globalThis} */
let _win;
/**
 * Set the window object for DOM operations.
 * @param {import('jsdom').DOMWindow |
 *   Window & typeof globalThis} win - The window object.
 * @returns {void}
 */
export const setWindow = (win) => {
  _win = win;
};

/**
 * @param {Element|Element[]} [items]
 * @param {{
 *   mode?: "JSON"|"JavaScript"
 * }} [options]
 * @returns {JSONObject}
 */
export const toJSONObject = function (items, options) {
  options = options || {};
  const isElement = items && !Array.isArray(items) && items.nodeType === 1;
  const jsonHtml = isElement
    ? [items]
    : (/** @type {Element[]} */ (items) ||
      _win.document.querySelectorAll(`[itemtype=${_win.CSS.escape(jhtmlNs)}]`));
  const ret = [...jsonHtml].map((item) => {
    return item2JSONObject(item, options.mode === 'JavaScript');
  });
  return isElement ? ret[0] : ret;
};

/**
 * We don't validate that other attributes are not present, but they
 *   should not be.
 * @todo Could make more efficient option
 * @param {Element|Element[]} [items]
 * @param {{
 *   mode?: "JSON"|"JavaScript"
 * }} [options]
 * @returns {string|string[]}
 */
export const toJSONString = function (items, options) {
  options = options || {};
  const isElement = items && !Array.isArray(items) && items.nodeType === 1;
  const jsonHtml = isElement
    ? [items]
    : (/** @type {Element[]} */ (items) ||
      _win.document.querySelectorAll(`[itemtype=${_win.CSS.escape(jhtmlNs)}]`));
  const ret = [...jsonHtml].map((item) => {
    const jsonObj = item2JSONObject(item, options.mode === 'JavaScript');
    const stringifier = new Stringifier(options);
    return stringifier.walkJSONObject(jsonObj);
  });
  return isElement ? ret[0] : ret;
};

/**
 * @param {JSONObject} jsonObj
 * @param {import('./SAJJ/SAJJ.js').SAJJOptions} [options]
 * @returns {string}
 */
export const toJHTMLString = function (jsonObj, options) {
  options = options || {};
  options.distinguishKeysValues = true;
  const jhtmlStringifier = new JHTMLStringifier(options);
  return jhtmlStringifier.walkJSONObject(jsonObj);
};

/**
 * @param {JSONObject} jsonObj
 * @param {import('./SAJJ/SAJJ.js').SAJJOptions} [options]
 * @returns {Element}
 */
export const toJHTMLDOM = function (jsonObj, options) {
  const jhtmlStr = toJHTMLString(jsonObj, options);
  return /** @type {Element} */ (new _win.DOMParser().parseFromString(
    jhtmlStr, 'text/html'
  ).body.firstElementChild);
};

export {Stringifier};
