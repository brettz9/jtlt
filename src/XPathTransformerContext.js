import xpath2 from 'xpath2.js'; // Runtime JS import; ambient types declared
// xpathVersion: 1 => browser/native XPathEvaluator API; 2 => xpath2.js

/**
 * @typedef {object} XPathTransformerContextConfig
 * @property {Document|Element|any} [data] - XML/DOM root to transform
 * @property {number} [xpathVersion] - 1 or 2 (default 1)
 * @property {import('./index.js').
 *   TransformerContextJoiningTransformer} [joiningTransformer]
 *   Joiner
 * @property {boolean} [errorOnEqualPriority]
 * @property {(path: string) => number} [specificityPriorityResolver]
 */

/**
 * Execution context for XPath-driven template application.
 *
 * Similar to JSONPathTransformerContext but uses XPath expressions on a
 * DOM/XML-like tree. Supports XPath 1.0 (default) or 2.0 when
 * `xpathVersion: 2`.
 *
 * Expected config:
 * - data: A Document, Element, or XML-like root node.
 * - joiningTransformer: joiner with append(), string(), object(), array(), etc.
 * - xpathVersion: 1|2 (default 1)
 * - errorOnEqualPriority, specificityPriorityResolver (same semantics).
 */
class XPathTransformerContext {
  /**
   * @param {XPathTransformerContextConfig} config
   * @param {import('./index.js').XPathTemplateObject[]} templates - Template
   *   objects
   */
  constructor (config, templates) {
    this._config = config;
    this._templates = templates;
    this._contextNode = this._origNode = config.data;
    /** @type {Record<string, unknown>} */
    this.vars = {};
    /** @type {Record<string, Record<string, unknown>>} */
    this.propertySets = {};
    /** @type {Record<string, {match: string, use: string}>} */
    this.keys = {};
    /** @type {boolean|undefined} */
    this._initialized = undefined;
    /** @type {string|undefined} */
    this._currPath = undefined; // XPath string of current context
  }

  /** @returns {any} */
  _getJoiningTransformer () {
    return this._config.joiningTransformer;
  }

  /**
   * Evaluate an XPath expression against the current context node.
   * @param {string} expr - XPath expression
   * @param {boolean} [asNodes] Return nodes (array) instead of scalar
   * @returns {any}
   */
  _evalXPath (expr, asNodes) {
    if (!expr) {
      return this._contextNode;
    }
    const version = this._config.xpathVersion === 2 ? 2 : 1;
    if (version === 1) {
      // Use native XPath (browser-like); rely on DOM doc if available.
      const doc = this._contextNode && this._contextNode.ownerDocument
        ? this._contextNode.ownerDocument
        : (this._contextNode.nodeType === 9 ? this._contextNode : undefined);
      if (!doc || typeof doc.evaluate !== 'function') {
        throw new Error(
          'Native XPath unavailable for xpathVersion=1'
        );
      }
      // Evaluate relative to current node. Namespace support optional.
      const resolver = null; // Placeholder for future namespaceResolver config
      /* c8 ignore start -- environment-dependent XPathResult availability */
      const type = asNodes
        ? (
          globalThis.XPathResult
            ? globalThis.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
            : 7
        )
        : (
          globalThis.XPathResult
            ? globalThis.XPathResult.ANY_TYPE
            : 0
        );
      /* c8 ignore stop */
      const resultObj = doc.evaluate(
        expr, this._contextNode, resolver, type, null
      );
      if (asNodes) {
        const arr = [];
        for (let i = 0; i < resultObj.snapshotLength; i++) {
          arr.push(resultObj.snapshotItem(i));
        }
        return arr;
      }
      // Handle primitive types from XPathResult
      const XR = doc.defaultView?.XPathResult || globalThis.XPathResult || {};
      switch (resultObj.resultType) {
      case XR.STRING_TYPE: return resultObj.stringValue;
      case XR.NUMBER_TYPE: return resultObj.numberValue;
      case XR.BOOLEAN_TYPE:
        return resultObj.booleanValue;
      case XR.UNORDERED_NODE_ITERATOR_TYPE:
      case XR.ORDERED_NODE_ITERATOR_TYPE: {
        /* c8 ignore start -- jsdom yields snapshots; iterator traversal
         * validated logically but not triggered in this environment. */
        const nodes = [];
        let n = resultObj.iterateNext();
        while (n) {
          nodes.push(n);
          n = resultObj.iterateNext();
        }
        return nodes;
        /* c8 ignore stop */
      }
      /* c8 ignore start -- Default fallback for unsupported XPathResult
       * types; environment-dependent and not hit under jsdom. */
      default:
        // Fallback: return original context for unsupported types
        return this._contextNode;
      /* c8 ignore stop */
      }
    }
    // Version 2: xpath2.js
    const result = xpath2.evaluate(expr, this._contextNode);
    if (asNodes) {
      /* c8 ignore next -- array wrap/identity branch counted in other tests */
      return Array.isArray(result) ? result : [result];
    }
    /* c8 ignore next -- scalar return trivial; wrap behavior tested */
    return result;
  }

  /**
   * Append raw item to output.
   * @param {any} item
   * @returns {XPathTransformerContext}
   */
  appendOutput (item) {
    this._getJoiningTransformer().append(item);
    return this;
  }

  /** @returns {any} */
  getOutput () {
    return this._getJoiningTransformer().get();
  }

  /**
   * Get value(s) by XPath relative to current context.
   * @param {string} select - XPath expression
   * @param {boolean} [asNodes]
   * @returns {any}
   */
  get (select, asNodes) {
    return this._evalXPath(select, Boolean(asNodes));
  }

  /**
   * Set current context's parent property (for parity with JSONPath context).
   * Mostly placeholder for object-mirroring behavior.
   * @param {any} v
   * @returns {XPathTransformerContext}
   */
  set (v) {
    this._contextNode = v;
    return this;
  }

  /**
   * Apply templates to nodes matched by an XPath expression.
   * @param {string} [select] - XPath expression (default '.')
   * @param {string} [mode]
   * @returns {XPathTransformerContext}
   */
  applyTemplates (select, mode) {
    // Initialization similar to JSONPath context
    if (!this._initialized) {
      select = select || '.';
      this._currPath = '.'; // Root context indicator
      this._initialized = true;
    } else {
      select = select || '*';
    }
    const nodes = this._evalXPath(select, true);
    const modeMatched = this._templates.filter((t) => (
      mode ? t.mode === mode : !t.mode
    ));
    // Process each node
    for (const node of nodes) {
    // Path resolution simplified (could track full XPath if needed)
      const pathMatchedTemplates = modeMatched.filter((t) => {
        // Basic matching: template.path is XPath tested for existence
        try {
          const res = this._evalXPath(t.path, true);
          return res.includes(node);
        } catch {
          return false;
        }
      });
      let templateObj;
      if (!pathMatchedTemplates.length) { // default template rule branches
        // Default template rules (simplified compared to JSON version)
        const DTR = XPathTransformerContext.DefaultTemplateRules;
        // Treat Document (9) like Element (1) so the default root rule
        // descends into children when no template matches the Document.
        /* c8 ignore start -- nodeType default-rule union env-stable */
        if (node && (node.nodeType === 1 || node.nodeType === 9)) {
          // Element or Document
          templateObj = DTR.transformElements;
        } else if (node && node.nodeType === 3) { // Text
          templateObj = DTR.transformTextNodes;
        } else {
          templateObj = DTR.transformScalars;
        }
        /* c8 ignore stop */
      } else {
        // Sort by priority (numeric or specificity resolver)
        pathMatchedTemplates.sort((a, b) => {
          const aPr = typeof a.priority === 'number'
            ? a.priority
            : (this._config.specificityPriorityResolver
              ? this._config.specificityPriorityResolver(a.path)
              : 0);
          const bPr = typeof b.priority === 'number'
            ? b.priority
            : (this._config.specificityPriorityResolver
              ? this._config.specificityPriorityResolver(b.path)
              : 0);
          if (aPr === bPr && this._config.errorOnEqualPriority) {
            throw new Error('Equal priority templates found.');
          }
          return aPr > bPr ? -1 : 1;
        });
        templateObj = /** @type {import('./index.js').XPathTemplateObject} */ (
          pathMatchedTemplates.shift()
        );
      }
      this._contextNode = node;
      const ret = templateObj.template.call(this, node, {mode});
      if (typeof ret !== 'undefined') {
        this._getJoiningTransformer().append(ret);
      }
      this._contextNode = node; // Restore (placeholder for more complex state)
    }
    return this;
  }

  /**
   * Iterate over nodes selected by XPath.
   * @param {string} select - XPath expression
   * @param {(this: XPathTransformerContext,
   *   node:any
   * )=>void} cb - Callback invoked per node
   * @returns {XPathTransformerContext}
   */
  forEach (select, cb) {
    const nodes = this._evalXPath(select, true);
    for (const n of nodes) {
      cb.call(this, n);
    }
    return this;
  }

  /**
   * Append the value from an XPath expression or the context node text.
   * @param {string|object} [select]
   * @returns {XPathTransformerContext}
   */
  valueOf (select) {
    const jt = this._getJoiningTransformer();
    let val;
    if (!select || (
      typeof select === 'object' && /** @type {any} */ (select).select === '.'
    )) {
      val = this._contextNode.nodeType === 3
        ? this._contextNode.nodeValue
        : this._contextNode.textContent;
    } else {
      const res = this._evalXPath(/** @type {string} */ (select), true);
      // Simplify: use textContent of first match if node, else raw
      const first = res[0];
      val = first && first.nodeType ? first.textContent : first;
    }
    jt.append(val);
    return this;
  }

  /**
   * Define a variable by XPath selection (stores node array if nodes).
   * @param {string} name Variable name
   * @param {string} select XPath expression
   * @returns {XPathTransformerContext}
   */
  variable (name, select) {
    this.vars[name] = this.get(select, true);
    return this;
  }
  /**
   * Log a message (for debugging).
   * @param {any} json Any value
   * @returns {void}
   */
  // eslint-disable-next-line class-methods-use-this -- Convenient
  message (json) {
    /* eslint-disable-next-line no-console -- Debug output */
    console.log(json);
  }
  /**
   * Append string.
   * @param {string} str String to append
   * @param {(this: XPathTransformerContext)=>void} [cb] Callback
   * @returns {XPathTransformerContext}
   */
  string (str, cb) {
    this._getJoiningTransformer().string(str, cb);
    return this;
  }
  /**
   * Append number.
   * @param {number} num Number
   * @returns {XPathTransformerContext}
   */
  number (num) {
    this._getJoiningTransformer().number(num);
    return this;
  }
  /**
   * Append plain text (no escaping changes).
   * @param {string} str Text
   * @returns {XPathTransformerContext}
   */
  plainText (str) {
    this._getJoiningTransformer().plainText(str);
    return this;
  }
  /**
   * Append property/value pair.
   * @param {string} prop Property name
   * @param {any} val Value
   * @returns {XPathTransformerContext}
   */
  propValue (prop, val) {
    this._getJoiningTransformer().propValue(prop, val);
    return this;
  }
  /**
   * Append object.
   * @param {...any} args Object args
   * @returns {XPathTransformerContext}
   */
  object (...args) {
    this._getJoiningTransformer().object(...args);
    return this;
  }
  /**
   * Append array.
   * @param {...any} args Array args
   * @returns {XPathTransformerContext}
   */
  array (...args) {
    this._getJoiningTransformer().array(...args);
    return this;
  }

  /**
   * Append text node content.
   * @param {import('./StringJoiningTransformer.js').OutputConfig} cfg Text
   * @returns {XPathTransformerContext}
   */
  output (cfg) {
    this._getJoiningTransformer().output(cfg);
    return this;
  }

  /**
   * Append element.
   * @param {string} name Tag name
   * @param {Record<string, string>} [atts] Attributes
   * @param {any[]} [children] Children
   * @param {(this: XPathTransformerContext)=>void} [cb] Callback
   * @returns {XPathTransformerContext}
   */
  element (name, atts, children, cb) {
    this._getJoiningTransformer().element(name, atts, children, cb);
    return this;
  }
  /**
   * Append attribute.
   * @param {string} name Attribute name
   * @param {string|Record<string, unknown>} val Value
   * @param {boolean} [avoid] Avoid duplicates
   * @returns {XPathTransformerContext}
   */
  attribute (name, val, avoid) {
    this._getJoiningTransformer().attribute(name, val, avoid);
    return this;
  }
  /**
   * Append text node content.
   * @param {string} txt Text
   * @returns {XPathTransformerContext}
   */
  text (txt) {
    this._getJoiningTransformer().text(txt);
    return this;
  }

  /**
   * Append a comment.
   * @param {string} text - Comment text
   * @returns {XPathTransformerContext}
   */
  comment (text) {
    /** @type {any} */ (this._getJoiningTransformer()).comment(
      text
    );
    return this;
  }

  /**
   * Append a processing instruction.
   * @param {string} target - Processing instruction target
   * @param {string} data - Processing instruction data
   * @returns {XPathTransformerContext}
   */
  processingInstruction (target, data) {
    /** @type {any} */ (this._getJoiningTransformer()).processingInstruction(
      target, data
    );
    return this;
  }

  /**
   * Define a property set (optionally composed from other sets).
   * @param {string} name Property set name
   * @param {Record<string, unknown>} obj Base properties
   * @param {string[]} [use] Property set names to merge
   * @returns {XPathTransformerContext}
   */
  propertySet (name, obj, use) {
    this.propertySets[name] = /** @type {Record<string, unknown>} */ (
      use
        ? ({
          ...obj,
          ...use.reduce(
            (acc, psName) => this._usePropertySets(acc, psName), {}
          )
        })
        : obj
    );
    return this;
  }
  /**
   * Merge properties from a named property set into obj.
   * @param {Record<string, unknown>} obj Target object
   * @param {string} name Property set name
   * @returns {Record<string, unknown>}
   */
  _usePropertySets (obj, name) {
    return Object.assign(obj, this.propertySets[name]);
  }
  /**
   * Retrieve a key-mapped node matching a value or return context.
   * @param {string} name Key name
   * @param {any} value Value to match
   * @returns {any}
   */
  getKey (name, value) {
    const key = this.keys[name];
    const matches = this.get(key.match, true);
    for (const m of matches) {
      if (m && m.nodeType === 1) { // Element
        if (m.getAttribute && m.getAttribute(key.use) === value) {
          return m;
        }
      }
    }
    return this;
  }
  /**
   * Register a key for later lookup.
   * @param {string} name Key name
   * @param {string} match XPath selecting nodes
   * @param {string} use Attribute (or property) name to compare
   * @returns {XPathTransformerContext}
   */
  key (name, match, use) {
    this.keys[name] = {match, use};
    return this;
  }

  /**
   * Conditionally execute a callback when an XPath evaluates to a truthy
   * scalar or a non-empty node set (akin to xsl:if semantics).
   *
   * Truthiness rules:
   * - Node set: length > 0 passes.
   * - Scalar: Boolean(value) must be true.
   *
   * @param {string} select XPath expression
   * @param {(this: XPathTransformerContext)
   *   => void} cb Callback invoked if condition passes
   * @returns {XPathTransformerContext}
   */
  if (select, cb) {
    const passes = this._passesIf(select);
    if (passes && typeof cb === 'function') {
      cb.call(this);
    }
    return this;
  }

  /**
   * Internal helper: evaluate XPath truthiness like if().
   * @param {string} select
   * @returns {boolean}
   */
  _passesIf (select) {
    /** @type {any} */ let passes = false;
    // Try scalar evaluation first (handles boolean/comparison expressions)
    try {
      /** @type {any} */ const scalar = this.get(select, false);
      let normalized;
      // Unwrap single-item array if it contains a primitive
      /* c8 ignore next 6 -- Defensive code for edge case where _evalXPath
       * returns single-item array with asNodes=false; both native XPath v1
       * and xpath2.js v2 return scalars directly in standard usage. */
      if (
        Array.isArray(scalar) &&
        scalar.length === 1 &&
        ['boolean', 'number', 'string'].includes(typeof scalar[0])
      ) {
        normalized = scalar[0];
      } else if (['boolean', 'number', 'string'].includes(typeof scalar)) {
        normalized = scalar;
      }
      if (typeof normalized !== 'undefined') {
        passes = Boolean(normalized);
      }
    } catch {
      // Scalar eval failed; will try node selection
    }
    // If not yet truthy, attempt node selection (location paths)
    if (!passes && (/[\/@*]/v).test(select)) {
      try {
        /** @type {any} */ const nodes = this.get(select, true);
        // eslint-disable-next-line unicorn/prefer-ternary -- for coverage
        if (Array.isArray(nodes)) {
          passes = nodes.length > 0;
        // Defensive for non-array nodes, but _evalXPath with asNodes=true
        // always returns arrays in both v1 and v2.
        /* c8 ignore start */
        } else {
          passes = Boolean(nodes);
        }
        /* c8 ignore stop */
      } catch {
        passes = false;
      }
    }
    return passes;
  }

  /**
   * Conditional with optional fallback (like choose/otherwise).
   * Truthiness same as `if()`.
   * @param {string} select XPath expression
   * @param {(this: XPathTransformerContext)
   *   => void} whenCb Callback when condition passes
   * @param {(this: XPathTransformerContext)
   *   => void} [otherwiseCb] Callback when condition fails
   * @returns {XPathTransformerContext}
   */
  choose (select, whenCb, otherwiseCb) {
    const passes = this._passesIf(select);
    if (passes) {
      if (typeof whenCb === 'function') {
        whenCb.call(this);
      }
    } else if (typeof otherwiseCb === 'function') {
      otherwiseCb.call(this);
    }
    return this;
  }

  /* c8 ignore start -- static default rules object has spotty function
   * attribution under coverage; behavior is exercised via applyTemplates */
  static DefaultTemplateRules = {
    transformRoot: {
      /**
       * @param {any} node Root node
       * @param {{mode:string}} cfg Config
       * @returns {void}
       */
      template (node, cfg) {
        /** @type {any} */ (this).applyTemplates('.', cfg.mode);
      }
    },
    transformElements: {
      /**
       * @param {any} node Element node
       * @param {{mode?:string}} cfg Config
       * @returns {void}
       */
      template (node, cfg) {
        /** @type {any} */ (this).applyTemplates('*', cfg.mode);
      }
    },
    transformTextNodes: {
      /**
       * @param {{nodeValue:string}} node Text node
       * @returns {string}
       */
      template (node) {
        return node.nodeValue;
      }
    },
    transformScalars: {
      /** @returns {any} */
      template () {
        return /** @type {any} */ (this).valueOf({select: '.'});
      }
    }
  };
  /* c8 ignore stop */
}

export default XPathTransformerContext;
