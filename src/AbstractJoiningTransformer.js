// Todo: Allow swapping of joining transformer types in
//    mid-transformation (e.g., building strings with
//    string transformer but adding as text node in a DOM transformer)

/**
 * @typedef {{character: string, string: string}[]} OutputCharacters
 */

/**
 * @typedef {{
 *   requireSameChildren?: boolean,
 *   JHTMLForJSON?: boolean,
 *   mode?: "JSON"|"JavaScript"
 * }} BaseTransformerConfig
 */

/**
 * @typedef {BaseTransformerConfig & {
 *   document: Document,
 *   exposeDocuments?: boolean
 * }} DOMJoiningTransformerConfig
 * When exposeDocuments is true, get() returns an array of XMLDocument
 * objects (one per root element) instead of a DocumentFragment.
 */
/**
 * @typedef {object} JSONJoiningTransformerConfig
 * @property {boolean} [requireSameChildren]
 * @property {boolean} [unwrapSingleResult]
 * @property {boolean} [exposeDocuments] - When true, get() returns an array
 * of document wrapper objects (one per root element) instead of the raw array.
 * @property {"JSON"|"JavaScript"} [mode]
 */
/**
 * @typedef {BaseTransformerConfig & {
 *   xmlElements?: boolean,
 *   preEscapedAttributes?: boolean,
 *   exposeDocuments?: boolean
 * }} StringJoiningTransformerConfig
 * When exposeDocuments is true, get() returns an array of document
 * strings (one per root element) instead of a single concatenated string.
 */
/**
 * @template T
 * @typedef {T extends "string" ? StringJoiningTransformerConfig :
 *   T extends "dom" ? DOMJoiningTransformerConfig :
 *   T extends "json" ? JSONJoiningTransformerConfig : never
 * } JoiningTransformerConfig
 */

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
 * @template T
 */
class AbstractJoiningTransformer {
  /**
   * @param {JoiningTransformerConfig<T>} [cfg] - Configuration object
   */
  constructor (cfg) {
    // Todo: Might set some reasonable defaults across all classes
    this._cfg = cfg ?? /** @type {JoiningTransformerConfig<T>} */ ({});
    /** @type {Record<string, OutputCharacters>} */
    this._characterMap = {};
    /** @type {Record<string, Record<string, string>>} */
    this._attributeSet = {};

    /** @type {Map<string, string>} */
    this._namespaceAliases = new Map();

    /**
     * @type {{
     *   onMultipleMatch?: "use-last"|"fail",
     *   warningOnMultipleMatch?: boolean,
     *   onNoMatch?: "shallow-copy"|"deep-copy"|"fail"|"apply-templates"|
     *     "shallow-skip"|"deep-skip"|"text-only-copy",
     *   warningOnNoMatch?: boolean
     * }|undefined}
     */
    this._modeConfig = undefined;

    /** @type {Set<string>} */
    this._excludeResultPrefixes = new Set();

    /** @type {Set<string>} */
    this._usedNamespacePrefixes = new Set();

    /**
     * Pending namespace declarations that may be excluded.
     * @type {Array<{
     *   prefix: string,
     *   namespaceURI: string,
     *   callback: () => void
     * }>}
     */
    this._pendingNamespaces = [];

    /**
     * Track which prefixes have pending namespace declarations.
     * @type {Map<string, {prefix: string, namespaceURI: string}>}
     */
    this._pendingNamespaceMap = new Map();

    /**
     * Registered stylesheet functions (similar to xsl:function).
     * Key format: "namespace:localName#arity".
     * @type {Map<string, {
     *   name: string,
     *   params: Array<{name: string, as?: string}>,
     *   body: (...args: any[]) => any,
     *   returnType?: string
     * }>}
     */
    this._registeredFunctions = new Map();
  }

  /**
   * @param {JoiningTransformerConfig<T>} cfg - Configuration object
   * @returns {void}
   */
  setConfig (cfg) {
    this._cfg = cfg;
  }

  /**
   * @param {import('./StringJoiningTransformer.js').OutputConfig} cfg
   * @returns {this}
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
   * Configure mode behavior (similar to xsl:mode).
   * @param {{
   *   onMultipleMatch?: "use-last"|"fail",
   *   warningOnMultipleMatch?: boolean,
   *   onNoMatch?: "shallow-copy"|"deep-copy"|"fail"|"apply-templates"|
   *     "shallow-skip"|"deep-skip"|"text-only-copy",
   *   warningOnNoMatch?: boolean
   * }} cfg - Mode configuration
   * @returns {this}
   */
  mode (cfg) {
    this._modeConfig = cfg;
    return this;
  }

  /**
   * Configure stylesheet behavior (similar to xsl:stylesheet).
   * Unlike xsl:stylesheet, this is a directive method and does not contain
   * nested content.
   * @param {{
   *   excludeResultPrefixes?: string[]
   * }} cfg - Stylesheet configuration
   * @returns {this}
   */
  stylesheet (cfg) {
    if (cfg.excludeResultPrefixes) {
      for (const prefix of cfg.excludeResultPrefixes) {
        // Normalize empty string to internal #default representation
        this._excludeResultPrefixes.add(prefix === '' ? '#default' : prefix);
      }
    }
    return this;
  }

  /**
   * Alias for stylesheet() method (XSLT compatibility).
   * @param {{
   *   excludeResultPrefixes?: string[]
   * }} cfg - Stylesheet configuration
   * @returns {this}
   */
  transform (cfg) {
    return this.stylesheet(cfg);
  }

  /**
   * Register a stylesheet function (similar to xsl:function).
   * Functions must have namespaced names and are invoked positionally.
   * @param {{
   *   name: string,
   *   params?: Array<{name: string, as?: string}>,
   *   as?: string,
   *   body: (...args: any[]) => any
   * }} cfg - Function configuration
   * @returns {this}
   */
  function (cfg) {
    const {name, params = [], as: returnType, body} = cfg;

    // Validate name has namespace
    if (!name.includes(':') && !name.startsWith('Q{')) {
      throw new Error(
        `Function name "${name}" must be in a namespace ` +
        `(use prefix:name or Q{uri}name)`
      );
    }

    // Create function key with arity
    const arity = params.length;
    const functionKey = `${name}#${arity}`;

    // Check for duplicates
    if (this._registeredFunctions.has(functionKey)) {
      throw new Error(
        `Function "${name}" with arity ${arity} is already registered`
      );
    }

    // Store function definition
    this._registeredFunctions.set(functionKey, {
      name,
      params,
      body,
      returnType
    });

    return this;
  }

  /**
   * Invoke a registered stylesheet function with positional arguments.
   * @param {string} name - Function name (with namespace)
   * @param {any[]} args - Positional arguments
   * @returns {any} Function return value
   */
  invokeFunctionByArity (name, args = []) {
    const arity = args.length;
    const functionKey = `${name}#${arity}`;

    const functionDef = this._registeredFunctions.get(functionKey);
    if (!functionDef) {
      throw new Error(
        `Function "${name}" with arity ${arity} not found`
      );
    }

    // Invoke function body with arguments
    return functionDef.body(...args);
  }

  /**
   * @param {string} name
   * @param {OutputCharacters} outputCharacters
   * @returns {void}
   */
  characterMap (name, outputCharacters) {
    this._characterMap[name] = outputCharacters;
  }

  /**
   * @param {string} name
   * @param {Record<string, string>} attributes
   * @returns {void}
   */
  attributeSet (name, attributes) {
    this._attributeSet[name] = attributes;
  }

  /**
   * @param {string} stylesheetPrefix
   * @param {string} resultPrefix
   * @returns {void}
   */
  namespaceAlias (stylesheetPrefix, resultPrefix) {
    // Convert empty string to '#default' to match _getNamespaceAlias behavior
    const key = stylesheetPrefix || '#default';
    this._namespaceAliases.set(key, resultPrefix);
  }

  /**
   * @param {string} prefix
   * @returns {string}
   */
  _getNamespaceAlias (prefix) {
    // eslint-disable-next-line @stylistic/max-len -- Long
    // eslint-disable-next-line unicorn/prefer-default-parameters -- Empty string fallback
    const lookupPrefix = prefix || '#default';
    return this._namespaceAliases.get(lookupPrefix) ?? (
      lookupPrefix
    );
  }

  /**
   * @param {string} attName
   * @returns {string}
   */
  _replaceNamespaceAliasInNamespaceDeclaration (attName) {
    if (!attName.startsWith('xmlns')) {
      return attName;
    }
    const namespacedAtt = attName.startsWith('xmlns:');

    const prefix = namespacedAtt ? attName.slice(0, 6) : '#default';
    const alias = this._getNamespaceAlias(prefix);

    return alias === '#default'
      ? 'xmlns'
      : 'xmlns:' + alias;
  }

  /**
   * @param {string} elemName
   * @returns {string}
   */
  _replaceNamespaceAliasInElement (elemName) {
    const colonIdx = elemName.indexOf(':');

    const prefix = colonIdx === -1 ? '#default' : elemName.slice(0, colonIdx);
    const alias = this._getNamespaceAlias(prefix);

    // Track that this prefix (after aliasing) is actually used
    this._usedNamespacePrefixes.add(alias);

    // If this prefix was buffered, output it now
    this._flushPendingNamespace(alias);

    if (colonIdx === -1) {
      if (alias === '#default') {
        return elemName;
      }
      return alias + ':' + elemName;
    }

    return (alias === '#default'
      ? ''
      : alias + ':'
    ) + elemName.slice(colonIdx + 1);
  }

  /**
   * Output a pending namespace declaration if it exists.
   * This method should be overridden by subclasses.
   * @param {string} _prefix
   * @returns {void}
   */
  // eslint-disable-next-line class-methods-use-this -- Abstract
  _flushPendingNamespace (_prefix) {
    // Default implementation does nothing - subclasses override
    // Using _prefix to indicate unused parameter
  }

  /**
   * Track attribute name prefix usage.
   * @param {string} attrName
   * @returns {void}
   */
  _trackAttributePrefix (attrName) {
    const colonIdx = attrName.indexOf(':');
    if (colonIdx !== -1 && !attrName.startsWith('xmlns')) {
      const prefix = attrName.slice(0, colonIdx);
      this._usedNamespacePrefixes.add(prefix);

      // If this prefix was buffered, output it now
      this._flushPendingNamespace(prefix);
    }
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  _replaceCharacterMaps (str) {
    this._outputConfig?.useCharacterMaps?.forEach((name) => {
      this._characterMap[name].forEach(({character, string}) => {
        str = str.replaceAll(character, string);
      });
    });
    return str;
  }

  /**
   * @param {string} type - Type name
   * @param {string} embedType - Embed type name
   * @returns {void}
   */
  _requireSameChildren (type, embedType) {
    const cfg = this._cfg;
    if (cfg.requireSameChildren) {
      throw new Error(
        'Cannot embed ' + embedType + ' children for a ' + type +
          ' joining transformer.'
      );
    }
  }

  /**
   * @param {string} prop - Configuration property name
   * @param {any} val - Configuration property value
   * @param {(this: AbstractJoiningTransformer<T>) => void} [cb]
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
