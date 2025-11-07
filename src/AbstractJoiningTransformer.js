// Todo: Allow swapping of joining transformer types in
//    mid-transformation (e.g., building strings with
//    string transformer but adding as text node in a DOM transformer)

/**
 * Base class for joining transformers.
 *
 * A "joining transformer" is the sink that receives template outputs and
 * accumulates them into a particular representation (string, DOM, JSON).
 * Subclasses implement a consistent set of methods (string, number, object,
 * array, element, text, etc.) but may interpret them differently according
 * to their target representation.
 *
 * Common patterns supported by all joiners:
 * - append(): central method that either concatenates, pushes, or assigns
 *   based on the current state.
 * - get(): returns the accumulated result.
 * - config(): temporarily tweak a config flag for the duration of a callback.
 */
class AbstractJoiningTransformer {
  /**
   * @param {object} [cfg] - Configuration object
   */
  constructor (cfg) {
    // Todo: Might set some reasonable defaults across all classes
    this.setConfig(cfg);
    /** @type {any} */
    this._cfg = undefined;
  }

  /**
   * @param {any} [cfg] - Configuration object
   * @returns {void}
   */
  setConfig (cfg) {
    this._cfg = cfg;
  }

  /**
   * @param {string} type - Type name
   * @param {string} embedType - Embed type name
   * @returns {void}
   */
  _requireSameChildren (type, embedType) {
    if (this._cfg && /** @type {any} */ (this._cfg)[type] &&
    /** @type {any} */ (this._cfg)[type].requireSameChildren) {
      throw new Error(
        'Cannot embed ' + embedType + ' children for a ' + type +
          ' joining transformer.'
      );
    }
  }

  /**
   * @param {string} prop - Configuration property name
   * @param {*} val - Configuration property value
   * @param {Function} [cb] - Callback function
   * @returns {void}
   */
  config (prop, val, cb) {
    const oldCfgProp = this._cfg &&
    /** @type {any} */ (this._cfg)[prop];
    if (this._cfg) {
      /** @type {any} */ (this._cfg)[prop] = val;
    }
    if (cb) {
      cb.call(this);
      if (this._cfg) {
        /** @type {any} */ (this._cfg)[prop] = oldCfgProp;
      }
    }
  }
}

export default AbstractJoiningTransformer;
