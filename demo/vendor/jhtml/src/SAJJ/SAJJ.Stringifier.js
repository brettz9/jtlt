/**
 * Provides JSON.stringifier()-like functionality (no replacer or space
 * arguments currently, however).
 * This class uses the abstract `ObjectArrayDelegator` for
 *   object/array delegating so the stringification can occur solely on
 *   the terminal methods here.
 * @todo Could implement our own stringifier for strings rather than using
 *   `JSON.stringify`
 */
import ObjectArrayDelegator from './SAJJ.ObjectArrayDelegator.js';

/**
 *
 */
export default class Stringifier extends ObjectArrayDelegator {
  // JSON terminal handler methods

  // These four methods can be overridden without affecting the logic of
  //   the objectHandler and arrayHandler to utilize reporting of the
  //   object as a whole
  /**
   * @returns {string}
   */
  beginObjectHandler (
    /* value, parentObject, parentKey, parentObjectArrayBool */
  ) {
    return '{';
  }
  /**
   * @returns {string}
   */
  endObjectHandler (
    /* value, parentObject, parentKey, parentObjectArrayBool */
  ) {
    return '}';
  }
  /**
   * @returns {string}
   */
  beginArrayHandler (
    /* value, parentObject, parentKey, parentObjectArrayBool */
  ) {
    return '[';
  }
  /**
   * @returns {string}
   */
  endArrayHandler (
    /* value, parentObject, parentKey, parentObjectArrayBool */
  ) {
    return ']';
  }

  // JSON terminal key handler methods

  /**
   * @param {string} key
   * @returns {string}
   */
  objectKeyHandler (
    key /* , parentObject, parentKey, parentObjectArrayBool, iterCt */
  ) {
    return '"' +
      key.replaceAll('\\', '\\\\').replaceAll('"', String.raw`\"`) + '":';
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
    return ',';
  }
  /**
   * @returns {string}
   */
  arrayKeyValueJoinerHandler () {
    return ',';
  }

  // JSON terminal primitive handler methods

  /**
   * @returns {string}
   */
  nullHandler (/* parentObject, parentKey, parentObjectArrayBool */) {
    return 'null';
  }

  /**
   * @param {boolean} value
   * @returns {string}
   */
  // eslint-disable-next-line @stylistic/max-len -- Long
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions -- Clearer
  booleanHandler (
    value /* , parentObject, parentKey, parentObjectArrayBool */
  ) {
    return String(value);
  }

  /**
   * @param {number} value
   * @returns {string}
   */
  // eslint-disable-next-line @stylistic/max-len -- Long
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions -- Clearer
  numberHandler (value /* , parentObject, parentKey, parentObjectArrayBool */) {
    return String(value);
  }

  /**
   * @param {string} value
   * @returns {string}
   */
  stringHandler (value /* , parentObject, parentKey, parentObjectArrayBool */) {
    return JSON.stringify(value);
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
   * @returns {string}
   */
  functionHandler (
    value /* , parentObject, parentKey, parentObjectArrayBool */
  ) {
    return value.toString(); // May not be supported everywhere
  }

  /**
   * @returns {string}
   */
  undefinedHandler (/* parentObject, parentKey, parentObjectArrayBool */) {
    return 'undefined';
  }

  /**
   * @param {bigint} value
   * @returns {string}
   */
  bigintHandler (
    value /* ,  parentObject, parentKey, parentObjectArrayBool */
  ) {
    return String(value) + 'n';
  }

  /**
   * @param {symbol} value
   * @returns {string}
   */
  // eslint-disable-next-line @stylistic/max-len -- Long
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions -- Clearer
  symbolHandler (
    value /* ,  parentObject, parentKey, parentObjectArrayBool */
  ) {
    return String(value);
  }

  /**
   * @param {number} value
   * @returns {string}
   */
  // eslint-disable-next-line @stylistic/max-len -- Long
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions -- Clearer
  nonfiniteNumberHandler (
    value /* , parentObject, parentKey, parentObjectArrayBool */
  ) {
    return String(value);
  }
}
