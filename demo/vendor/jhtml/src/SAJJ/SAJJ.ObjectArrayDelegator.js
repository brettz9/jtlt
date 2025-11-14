import SAJJ from './SAJJ.js';

/* eslint-disable jsdoc/reject-any-type -- Arbitrary */
/**
 * @typedef {any} AnyDelegated
 */
/* eslint-enable jsdoc/reject-any-type -- Arbitrary */

/**
* @abstract
* @class
* @todo Might add an add() method which defines how to combine result values
*  (so as to allow for other means besides string concatenation)
*/
class ObjectArrayDelegator extends SAJJ {
  /* eslint-disable jsdoc/require-returns-check -- Abstract */
  /**
   * @returns {AnyDelegated}
   */
  objectKeyValueJoinerHandler () {
    throw new Error('Abstract');
  }
  /**
   * @param {object} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {AnyDelegated}
   */
  beginObjectHandler (
    // eslint-disable-next-line no-unused-vars -- Not used here
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }
  /**
   * @param {object} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {AnyDelegated}
   */
  endObjectHandler (
    // eslint-disable-next-line no-unused-vars -- Not used here
    value, parentObject, parentKey, parentObjectArrayBool
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {AnyDelegated[]} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @param {number} arrLength
   * @returns {AnyDelegated}
   */
  beginArrayHandler (
    // eslint-disable-next-line no-unused-vars -- Not used here
    value, parentObject, parentKey, parentObjectArrayBool, arrLength
  ) {
    throw new Error('Abstract');
  }

  /**
   * @param {AnyDelegated[]} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @param {number} arrLength
   * @returns {AnyDelegated}
   */
  endArrayHandler (
    // eslint-disable-next-line no-unused-vars -- Not used here
    value, parentObject, parentKey, parentObjectArrayBool, arrLength
  ) {
    throw new Error('Abstract');
  }
  /* eslint-enable jsdoc/require-returns-check -- Abstract */

  // It is probably not necessary to override the defaults for the following
  //   two methods and perhaps not any of the others either
  /**
   * @param {AnyDelegated} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  objectHandler (value, parentObject, parentKey, parentObjectArrayBool) {
    const ret = this.beginObjectHandler(
        value, parentObject, parentKey, parentObjectArrayBool
      ),
      keyVals = [];
    if (this.iterateObjects) {
      let i = 0;
      if (this.iterateObjectPrototype) {
        // eslint-disable-next-line @stylistic/max-len -- Long
        // eslint-disable-next-line guard-for-in -- Deliberately iterating prototype
        for (const key in value) {
          this.currentKey = key;
          this.currentObject = value[key];
          keyVals.push(
            this.keyValueHandler(
              value[key], key, value, parentKey, parentObjectArrayBool, false, i
            )
          );
          i++;
        }
      } else {
        for (const key in value) {
          if (Object.hasOwn(value, key)) {
            this.currentKey = key;
            this.currentObject = value[key];
            keyVals.push(
              this.keyValueHandler(
                value[key], key, value, parentKey,
                parentObjectArrayBool, false, i
              )
            );
            i++;
          }
        }
      }
    }
    return ret + keyVals.join(
      this.objectKeyValueJoinerHandler()
    ) + this.endObjectHandler(
      value, parentObject, parentKey, parentObjectArrayBool
    );
  }

  /**
   * @param {AnyDelegated[]} value
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {string}
   */
  arrayHandler (value, parentObject, parentKey, parentObjectArrayBool) {
    const arrLength = value.length,
      ret = this.beginArrayHandler(
        value, parentObject, parentKey, parentObjectArrayBool, arrLength
      ),
      keyVals = [];

    if (this.iterateArrays) {
      if (this.iterateArrayPrototype) {
        // eslint-disable-next-line @stylistic/max-len -- Long
        // eslint-disable-next-line guard-for-in -- Deliberately iterating prototype
        for (const key in value) {
          this.currentKey = key;
          this.currentObject = value[key];
          // Ambiguous about whether array value is being iterated or
          //   array object value
          keyVals.push(
            this.keyValueHandler(
              value[key], key, value, parentKey, parentObjectArrayBool, true
            )
          );
        }
      } else {
        const arrl = value.length;
        for (let key = 0; key < arrl; key++) {
          this.currentKey = key;
          this.currentObject = value[key];
          keyVals.push(
            this.keyValueHandler(
              value[key], key, value, parentKey, parentObjectArrayBool, true
            )
          );
        }
      }
    }
    return ret + keyVals.join(
      this.arrayKeyValueJoinerHandler()
    ) + this.endArrayHandler(
      value, parentObject, parentKey, parentObjectArrayBool, arrLength
    );
  }

  /**
   * Can override to avoid delegating to separate array/object handlers; see
   *   `isArrayType` notes for a means to treat `objectHandler`/`arrayHandler`
   *   as the same; overridden optionally in constructor by
   *   `keyValueDistinguishedHandler`.
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
    value, key, parentObject, parentKey,
    parentObjectArrayBool, arrayBool, iterCt
  ) {
    const objectRet = this.keyHandler(
      key, parentObject, parentKey, parentObjectArrayBool, arrayBool, iterCt
    );
    if (arrayBool) {
      return this.arrayKeyValueHandler(
        value, key, parentObject, parentKey, parentObjectArrayBool
      );
    }
    return objectRet + this.objectKeyValueHandler(
      value, key, parentObject, parentKey, parentObjectArrayBool, iterCt
    );
  }

  /**
   * @param {AnyDelegated} value
   * @param {string|number} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {AnyDelegated}
   */
  arrayKeyValueHandler (
    value, key, parentObject, parentKey, parentObjectArrayBool
  ) {
    return this.delegateHandlersByType(
      value, parentObject, parentKey, parentObjectArrayBool
    );
  }

  /**
   * @param {AnyDelegated} value
   * @param {string|number} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @param {number} [iterCt]
   * @returns {AnyDelegated}
   */
  objectKeyValueHandler (
    value, key, parentObject, parentKey, parentObjectArrayBool,
    // eslint-disable-next-line no-unused-vars -- Signature
    iterCt
  ) {
    return this.delegateHandlersByType(
      value, parentObject, parentKey, parentObjectArrayBool
    );
  }

  // OPTIONAL DISTINGUISHING OF KEY AND VALUE HANDLERS

  /**
   * Constructor may use this to override `keyValueHandler`.
   * @param {AnyDelegated} value
   * @param {string} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @param {boolean} arrayBool
   * @param {number} iterCt
   * @returns {string}
   */
  keyValueDistinguishedHandler (
    value, key, parentObject, parentKey,
    parentObjectArrayBool, arrayBool, iterCt
  ) {
    const ret = this.keyHandler(
      key, parentObject, parentKey, parentObjectArrayBool, arrayBool, iterCt
    );
    return ret + this.valueHandler(
      value, key, parentObject, parentKey,
      parentObjectArrayBool, arrayBool, iterCt
    );
  }

  /**
   * @param {string|number} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @param {boolean} arrayBool
   * @param {number} [iterCt]
   * @returns {AnyDelegated}
   */
  keyHandler (
    key, parentObject, parentKey, parentObjectArrayBool, arrayBool, iterCt
  ) {
    if (arrayBool) {
      return this.arrayKeyHandler(
        key, parentObject, parentKey, parentObjectArrayBool
      );
    }
    return this.objectKeyHandler(
      key, parentObject, parentKey, parentObjectArrayBool, iterCt
    );
  }
  /**
   * @param {AnyDelegated} value
   * @param {string} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @param {boolean} arrayBool
   * @param {number} iterCt
   * @returns {AnyDelegated}
   */
  valueHandler (
    value, key, parentObject, parentKey,
    parentObjectArrayBool, arrayBool,
    iterCt
  ) {
    if (arrayBool) {
      return this.arrayValueHandler(
        value, key, parentObject, parentKey, parentObjectArrayBool
      );
    }
    return this.objectValueHandler(
      value, key, parentObject, parentKey, parentObjectArrayBool, iterCt
    );
  }

  /**
   * @param {AnyDelegated} value
   * @param {string} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @param {number} [iterCt]
   * @returns {AnyDelegated}
   */
  objectValueHandler (
    value, key, parentObject, parentKey, parentObjectArrayBool,
    // eslint-disable-next-line no-unused-vars -- Placeholder?
    iterCt
  ) {
    return this.delegateHandlersByType(
      value, parentObject, parentKey, parentObjectArrayBool
    );
  }

  /**
   * @param {AnyDelegated[]} value
   * @param {string} key
   * @param {object|undefined} parentObject
   * @param {string|undefined} parentKey
   * @param {boolean|undefined} parentObjectArrayBool
   * @returns {AnyDelegated}
   */
  arrayValueHandler (
    value, key, parentObject, parentKey, parentObjectArrayBool
  ) {
    return this.delegateHandlersByType(
      value, parentObject, parentKey, parentObjectArrayBool
    );
  }
}

export default ObjectArrayDelegator;
