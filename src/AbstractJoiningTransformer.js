// Todo: Allow swapping of joining transformer types in
//    mid-transformation (e.g., building strings with
//    string transformer but adding as text node in a DOM transformer)

/**
 * Base class for joining transformers.
 */
class AbstractJoiningTransformer {
  /**
   * @param {object} cfg - Configuration object
   */
  constructor (cfg) {
    // Todo: Might set some reasonable defaults across all classes
    this.setConfig(cfg);
  }

  /**
   * @param {object} cfg - Configuration object
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
    if (this._cfg[type].requireSameChildren) {
      throw new Error(
        'Cannot embed ' + embedType + ' children for a ' + type +
          ' joining transformer.'
      );
    }
  }

  /**
   * @param {string} prop - Configuration property name
   * @param {*} val - Configuration property value
   * @param {Function} cb - Callback function
   * @returns {void}
   */
  config (prop, val, cb) {
    const oldCfgProp = this._cfg[prop];
    this._cfg[prop] = val;
    if (cb) {
      cb.call(this);
      this._cfg[prop] = oldCfgProp;
    }
  }
}

export default AbstractJoiningTransformer;
