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
    this.setConfig(cfg ?? {});
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
    const cfg = /** @type {Record<string, unknown>} */ (this._cfg);
    if (cfg[type] &&
    (/** @type {Record<string, unknown>} */ (cfg[type])).requireSameChildren) {
      throw new Error(
        'Cannot embed ' + embedType + ' children for a ' + type +
          ' joining transformer.'
      );
    }
  }

  /**
   * @param {string} prop - Configuration property name
   * @param {any} val - Configuration property value
   * @param {(this: AbstractJoiningTransformer) => void} [cb]
   *   Optional callback invoked with this instance
   * @returns {void}
   */
  config (prop, val, cb) {
    const cfg = /** @type {Record<string, unknown>} */ (this._cfg);
    const oldCfgProp = cfg[prop];
    cfg[prop] = val;
    if (cb) {
      cb.call(this);
      cfg[prop] = oldCfgProp;
    }
  }
}

export default AbstractJoiningTransformer;
