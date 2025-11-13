import xpath2 from 'xpath2.js'; // Runtime JS import; ambient types declared
// xpathVersion: 1 => browser/native XPathEvaluator API; 2 => xpath2.js

/**
 * @typedef {object} XPathTransformerContextConfig
 * @property {unknown} [data] - XML/DOM root to transform
 * @property {number} [xpathVersion] - 1 or 2 (default 1)
 * @property {import('./index.js').
 *   JoiningTransformer} joiningTransformer Joiner
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
   * @param {import('./index.js').
   *   XPathTemplateObject<any>[]} templates - Template objects
   */
  constructor (config, templates) {
    this._config = config;
    this._templates = templates;
    if (!config.data) {
      throw new Error('XPathTransformerContext requires config.data');
    }
    /** @type {Document|Element|Node} */
    this._contextNode = this._origNode = /** @type {Document|Element|Node} */ (
      config.data
    );
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
    /** @type {Record<string, any> | undefined} */
    this._params = undefined;
  }

  /** @returns {import('./index.js').JoiningTransformer} */
  _getJoiningTransformer () {
    return this._config.joiningTransformer;
  }

  /**
   * Evaluate an XPath expression against the current context node.
   * @param {string} expr - XPath expression
   * @param {boolean} [asNodes] Return nodes (array) instead of scalar
   * @returns {unknown}
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
      if (!doc || doc.nodeType !== 9) {
        throw new Error(
          'Native XPath unavailable for xpathVersion=1'
        );
      }
      /** @type {Document} */
      const docTyped = /** @type {Document} */ (doc);
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
      const resultObj = docTyped.evaluate(
        expr, this._contextNode, resolver, type, null
      );
      if (asNodes) {
        /** @type {Node[]} */
        const arr = [];
        for (let i = 0; i < resultObj.snapshotLength; i++) {
          const item = resultObj.snapshotItem(i);
          if (item) {
            arr.push(item);
          }
        }
        return arr;
      }
      // Handle primitive types from XPathResult
      const XR = docTyped.defaultView?.XPathResult ||
        globalThis.XPathResult || {};
      switch (resultObj.resultType) {
      case XR.STRING_TYPE: return resultObj.stringValue;
      case XR.NUMBER_TYPE: return resultObj.numberValue;
      case XR.BOOLEAN_TYPE:
        return resultObj.booleanValue;
      case XR.UNORDERED_NODE_ITERATOR_TYPE:
      case XR.ORDERED_NODE_ITERATOR_TYPE: {
        /* c8 ignore start -- jsdom yields snapshots; iterator traversal
         * validated logically but not triggered in this environment. */
        /** @type {Node[]} */
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
   * @param {unknown} item
   * @returns {XPathTransformerContext}
   */
  appendOutput (item) {
    // Cast item since we trust the caller provides valid append types
    this._getJoiningTransformer().append(
      /** @type {string | Node} */ (item)
    );
    return this;
  }

  /** @returns {unknown} */
  getOutput () {
    return this._getJoiningTransformer().get();
  }

  /**
   * Get value(s) by XPath relative to current context.
   * @param {string} select - XPath expression
   * @param {boolean} [asNodes]
   * @returns {Node[]}
   */
  get (select, asNodes) {
    return /** @type {Node[]} */ (this._evalXPath(select, Boolean(asNodes)));
  }

  /**
   * Set current context's parent property (for parity with JSONPath context).
   * Mostly placeholder for object-mirroring behavior.
   * @param {Document|Element|Node} v
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
    const nodesResult = this._evalXPath(select, true);
    const nodes = /** @type {Node[]} */ (nodesResult);
    const modeMatched = this._templates.filter((t) => {
      // Exclude named-only templates (those with name but no path)
      if (t.name && !t.path) {
        return false;
      }
      return mode ? t.mode === mode : !t.mode;
    });
    // Process each node
    for (const node of nodes) {
    // Path resolution simplified (could track full XPath if needed)
      const pathMatchedTemplates = modeMatched.filter((t) => {
        // Basic matching: template.path is XPath tested for existence
        // At this point, we know t.path exists because we filtered
        // out named-only templates in modeMatched
        if (!t.path) {
          return false;
        }
        try {
          const resResult = this._evalXPath(t.path, true);
          const res = /** @type {Node[]} */ (resResult);
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
            : (this._config.specificityPriorityResolver && a.path
              ? this._config.specificityPriorityResolver(a.path)
              : 0);
          const bPr = typeof b.priority === 'number'
            ? b.priority
            : (this._config.specificityPriorityResolver && b.path
              ? this._config.specificityPriorityResolver(b.path)
              : 0);
          if (aPr === bPr && this._config.errorOnEqualPriority) {
            throw new Error('Equal priority templates found.');
          }
          return aPr > bPr ? -1 : 1;
        });
        templateObj =
          /**
           * @type {import('./index.js').XPathTemplateObject<any>}
           */ (
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
   * @param {string|
   *   {name: string, withParam?: any[]}} name - Template name or
   *   options object
   * @param {any[]} [withParams] - Parameters to pass to template
   * @returns {this}
   */
  callTemplate (name, withParams) {
    // Invokes a named template, optionally passing values via withParam.
    if (name && typeof name === 'object') {
      withParams = name.withParam || withParams;
      ({name} = name);
    }
    withParams = withParams || [];

    // Store parameters in a temporary context for valueOf() access
    const prevParams = this._params;
    /** @type {Record<string, any>} */
    const params = {};
    this._params = params;

    withParams.forEach((withParam, index) => {
      const value = withParam.value !== undefined
        ? withParam.value
        : this.get(withParam.select, false);

      // Store by name if provided, otherwise by index
      if (withParam.name) {
        params[withParam.name] = value;
      } else {
        params[String(index)] = value;
      }
    });

    const results = this._getJoiningTransformer();
    const templateObj = this._templates.find((template) => {
      return template.name === name;
    });
    if (!templateObj) {
      throw new Error(
        'Template, ' + name + ', cannot be called as it was not found.'
      );
    }

    // @ts-expect-error Todo: Fix
    const result = templateObj.template.call(this, this._contextNode, {});
    if (typeof result !== 'undefined') {
      /** @type {any} */ (results).append(result);
    }

    // Restore previous parameter context
    this._params = prevParams;

    return this;
  }


  /**
   * Iterate over nodes selected by XPath.
   * @param {string} select - XPath expression
   * @param {(this: XPathTransformerContext,
   *   node: Node
   * )=>void} cb - Callback invoked per node
   * @returns {XPathTransformerContext}
   */
  forEach (select, cb) {
    const nodesResult = this._evalXPath(select, true);
    const nodes = /** @type {Node[]} */ (nodesResult);
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

    const selectStr = typeof select === 'object'
      ? /** @type {{select?: string}} */ (select).select
      : select;

    // Check if this is a parameter reference (starts with $)
    if (selectStr && selectStr.startsWith('$')) {
      const paramName = selectStr.slice(1);
      if (this._params && paramName in this._params) {
        val = this._params[paramName];
      } else {
        // Fall back to normal XPath evaluation
        const resResult = this._evalXPath(selectStr, true);
        const res = /** @type {Node[]} */ (resResult);
        const first = res[0];
        val = first && first.nodeType ? first.textContent : first;
      }
    } else if (!selectStr || selectStr === '.') {
      val = this._contextNode.nodeType === 3
        ? this._contextNode.nodeValue
        : this._contextNode.textContent;
    } else {
      const resResult = this._evalXPath(selectStr, true);
      const res = /** @type {Node[]} */ (resResult);
      // Simplify: use textContent of first match if node, else raw
      const first = res[0];
      val = first && first.nodeType ? first.textContent : first;
    }
    // Ensure val is not null before appending
    if (val !== null) {
      jt.append(val);
    }
    return this;
  }

  /**
   * @returns {void}
   */
  // eslint-disable-next-line class-methods-use-this -- Todo
  copyOf () {
    // Todo
  }

  /**
   * @returns {void}
   */
  // eslint-disable-next-line class-methods-use-this -- Todo
  copy () {
    // Todo
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
   * @param {unknown} json Any value
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
   * @param {(this: XPathTransformerContext) => void} [cb] Callback
   * @returns {XPathTransformerContext}
   */
  string (str, cb) {
    // We don't pass the callback because it has incompatible 'this' type
    // The callback is mainly used for context-building in string transformers
    this._getJoiningTransformer().string(str);
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
   * @param {Record<string, unknown>|
   *   ((this: XPathTransformerContext) => void)} objOrCb Object or callback
   * @param {((this: XPathTransformerContext) => void)|
   *   any[]} [cbOrUsePropertySets] Callback or property sets
   * @param {any[]|
   *   Record<string, unknown>} [usePropertySetsOrPropSets]
   *   Property sets or props
   * @param {Record<string, unknown>} [propSets] Additional property sets
   * @returns {XPathTransformerContext}
   */
  object (objOrCb, cbOrUsePropertySets, usePropertySetsOrPropSets, propSets) {
    const jt = this._getJoiningTransformer();
    // Union of transformers creates intersection types
    // @ts-expect-error
    jt.object(objOrCb, cbOrUsePropertySets, usePropertySetsOrPropSets,
      propSets);
    return this;
  }
  /**
   * Append array.
   * @param {any[]|
   *   ((this: XPathTransformerContext) => void)} [arrOrCb]
   *   Array or callback
   * @param {(this: XPathTransformerContext) => void} [cb] Callback
   * @returns {XPathTransformerContext}
   */
  array (arrOrCb, cb) {
    const jt = this._getJoiningTransformer();
    // Union of transformers creates intersection types
    // @ts-expect-error
    jt.array(arrOrCb, cb);
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
   * @param {Record<string, string>|any[]|
   *   ((this: XPathTransformerContext)=>void)} [atts] Attributes
   * @param {any[]|((this: XPathTransformerContext)=>void)} [children]
   *   Children
   * @param {(this: XPathTransformerContext)=>void} [cb] Callback
   * @returns {XPathTransformerContext}
   */
  element (name, atts, children, cb) {
    // @ts-expect-error - Union of transformers creates intersection types
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
    const jt = this._getJoiningTransformer();
    // Only StringJoiningTransformer supports the third parameter
    if (typeof avoid !== 'undefined') {
      // Union of transformers creates intersection types
      // @ts-expect-error
      jt.attribute(name, /** @type {string} */ (val), avoid);
    } else {
      jt.attribute(name, /** @type {string} */ (val));
    }
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
    const jt = this._getJoiningTransformer();
    if (jt.comment) {
      jt.comment(text);
    }
    return this;
  }

  /**
   * Append a processing instruction.
   * @param {string} target - Processing instruction target
   * @param {string} data - Processing instruction data
   * @returns {XPathTransformerContext}
   */
  processingInstruction (target, data) {
    const jt = this._getJoiningTransformer();
    if (jt.processingInstruction) {
      jt.processingInstruction(target, data);
    }
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
    // When asNodes=true, get() returns Node[]
    /** @type {Node[]} */
    const nodesArray = /** @type {Node[]} */ (matches);
    for (const m of nodesArray) {
      if (m && m.nodeType === 1) { // Element
        const elem = /** @type {Element} */ (m);
        if (elem.getAttribute(key.use) === value) {
          return elem;
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
    let passes = false;
    // Try scalar evaluation first (handles boolean/comparison expressions)
    try {
      const scalar = this.get(select, false);
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
        const nodes = this.get(select, true);
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
       * @this {XPathTransformerContext}
       * @param {unknown} node Root node
       * @param {{mode:string}} cfg Config
       * @returns {void}
       */
      template (node, cfg) {
        this.applyTemplates('.', cfg.mode);
      }
    },
    transformElements: {
      /**
       * @this {XPathTransformerContext}
       * @param {unknown} node Element node
       * @param {{mode?:string}} cfg Config
       * @returns {void}
       */
      template (node, cfg) {
        this.applyTemplates('*', cfg.mode);
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
      /**
       * @this {XPathTransformerContext}
       * @returns {XPathTransformerContext}
       */
      template () {
        return this.valueOf({select: '.'});
      }
    }
  };
  /* c8 ignore stop */
}

export default XPathTransformerContext;
