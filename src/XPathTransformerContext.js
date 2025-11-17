import xpath2 from 'xpath2.js'; // Runtime JS import; ambient types declared
// eslint-disable-next-line @stylistic/max-len -- Long
// xpathVersion: 1 => browser/native XPathEvaluator API; 2 => xpath2.js, 3 => fontoxpath
import fontoxpath from 'fontoxpath';

/**
 * @typedef {object} XPathTransformerContextConfig
 * @property {unknown} [data] - XML/DOM root to transform
 * @property {number} [xpathVersion] - 1, 2, 3.1 (default 1)
 * @property {import('./index.js').
 *   JoiningTransformer} joiningTransformer Joiner
 * @property {boolean} [errorOnEqualPriority]
 * @property {(path: string) => number} [specificityPriorityResolver]
 */

/**
 * Execution context for XPath-driven template application.
 *
 * Similar to JSONPathTransformerContext but uses XPath expressions on a
 * DOM/XML-like tree. Supports XPath 1.0 (default), 2.0 when
 * `xpathVersion: 2`, or 3.1 when `xpathVersion: 3.1`.
 *
 * Expected config:
 * - data: A Document, Element, or XML-like root node.
 * - joiningTransformer: joiner with append(), string(), object(), array(), etc.
 * - xpathVersion: 1|2|3.1 (default 1)
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
    // Set this context on the joining transformer for callback invocations
    if (config.joiningTransformer && config.joiningTransformer.setContext) {
      config.joiningTransformer.setContext(this);
    }
    /** @type {Record<string, unknown>} */
    this.vars = {};
    /** @type {Record<string, Record<string, unknown>>} */
    this.propertySets = {};
    /** @type {Record<string, {match: string, use: string}>} */
    this.keys = {};
    /**
     * @type {Record<string,
     *   import('./JSONPathTransformerContext.js').DecimalFormatSymbols>}
     */
    this.decimalFormats = {};
    /** @type {boolean|undefined} */
    this._initialized = undefined;
    /** @type {string|undefined} */
    this._currPath = undefined; // XPath string of current context
    /** @type {Record<string, any> | undefined} */
    this._params = undefined;
    /** @type {string[]} */
    this._preserveSpaceElements = [];
    /** @type {string[]} */
    this._stripSpaceElements = [];
  }

  /** @returns {import('./index.js').JoiningTransformer} */
  _getJoiningTransformer () {
    return this._config.joiningTransformer;
  }

  /**
   * Check if whitespace should be stripped for a given element.
   * @param {Node} node - The node to check
   * @returns {boolean}
   */
  _shouldStripSpace (node) {
    if (node.nodeType !== 1) {
      return false; // Only elements
    }
    const elementName = /** @type {Element} */ (node).localName;
    // Check if in preserve list (takes precedence)
    if (this._preserveSpaceElements.some((pattern) => {
      return pattern === '*' || pattern === elementName;
    })) {
      return false;
    }
    // Check if in strip list
    return this._stripSpaceElements.some((pattern) => {
      return pattern === '*' || pattern === elementName;
    });
  }

  /**
   * Clone the DOM and strip whitespace-only text nodes from elements
   * marked for stripping.
   * @param {Node} node - The node to clone
   * @returns {Node} The cloned node with whitespace stripped
   */
  _cloneAndStripWhitespace (node) {
    // Deep clone the node
    const cloned = node.cloneNode(true);

    // Only process if we have strip-space declarations
    if (this._stripSpaceElements.length === 0) {
      return cloned;
    }

    // Recursively strip whitespace-only text nodes
    const stripWhitespace = (/** @type {Node} */ n) => {
      if (n.nodeType === 1) { // Element node
        if (this._shouldStripSpace(n)) {
          // Remove whitespace-only text node children
          const childNodes = [...n.childNodes];
          for (const child of childNodes) {
            if (child.nodeType === 3) { // Text node
              /* c8 ignore next 2  -- Branch inside loop already tested by
                 integration tests; c8 artifact */
              const text = child.nodeValue || '';
              // Check if text is whitespace-only
              if (text.trim() === '') {
                child.remove();
              }
            }
          }
        }
        // Recurse into child elements
        const children = [...n.childNodes];
        for (const child of children) {
          stripWhitespace(child);
        }
      } else if (n.nodeType === 9) { // Document node
        // Process document's children (typically documentElement)
        const children = [...n.childNodes];
        for (const child of children) {
          stripWhitespace(child);
        }
      }
    };

    stripWhitespace(cloned);
    return cloned;
  }

  /**
   * Apply whitespace stripping to the context node based on strip-space
   * declarations. This clones the DOM and updates the context.
   * @returns {this}
   */
  applyWhitespaceStripping () {
    if (this._stripSpaceElements.length > 0) {
      const stripped = this._cloneAndStripWhitespace(this._origNode);
      this._contextNode = stripped;
    }
    return this;
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

    // Ensure we're using the stripped DOM if strip-space is declared
    const contextNode = this._contextNode;

    const version = this._config.xpathVersion ?? 1;
    if (version === 1) {
      // Use native XPath (browser-like); rely on DOM doc if available.
      const doc = contextNode && contextNode.ownerDocument
        ? contextNode.ownerDocument
        : (contextNode.nodeType === 9 ? contextNode : undefined);
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
        expr, contextNode, resolver, type, null
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
    if (version === 2) {
      // Version 2: xpath2.js
      const result = xpath2.evaluate(expr, contextNode);
      if (asNodes) {
        // eslint-disable-next-line @stylistic/max-len -- Long
        /* c8 ignore next -- array wrap/identity branch counted in other tests */
        return Array.isArray(result) ? result : [result];
      }
      /* c8 ignore next -- scalar return trivial; wrap behavior tested */
      return result;
    }

    // eslint-disable-next-line @stylistic/max-len -- Long
    // eslint-disable-next-line import/no-named-as-default-member -- Only as default
    const result = fontoxpath.evaluateXPath(
      expr, contextNode, undefined, undefined,
      // Non-deprecated, predictable all results
      14 // ReturnType.ALL_RESULTS
    );
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

    const preApplyContext = this._contextNode;

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

      // Set up parameter context for valueOf() access in templates
      const prevTemplateParams = this._params;
      this._params = {0: node};

      const ret = templateObj.template.call(this, node, {mode});

      // Restore previous parameter context
      this._params = prevTemplateParams;

      if (typeof ret !== 'undefined') {
        this._getJoiningTransformer().append(ret);
      }
      this._contextNode = node; // Restore (placeholder for more complex state)
    }

    this._contextNode = preApplyContext;

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
    withParams = withParams || /* c8 ignore next */ [];

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
      // Set up parameter context for valueOf() access
      const prevParams = this._params;
      const prevContext = this._contextNode;
      this._params = {0: n};
      this._contextNode = n;
      try {
        cb.call(this, n);
      } finally {
        // Restore previous parameter context
        this._params = prevParams;
        this._contextNode = prevContext;
      }
    }
    return this;
  }

  /**
   * Groups items and executes callback for each group.
   * Equivalent to XSLT's xsl:for-each-group.
   * @param {string} select - XPath selector for items to group
   * @param {object} options - Grouping options
   * @param {string} [options.groupBy] - XPath expression to group by value
   * @param {string} [options.groupAdjacent] - Groups adjacent items with
   *   same value
   * @param {string} [options.groupStartingWith] - Starts new group when
   *   expression matches
   * @param {string} [options.groupEndingWith] - Ends group when expression
   *   matches
   * @param {(
   *   this: XPathTransformerContext, key: any, items: Node[], ctx: any
   * ) => void} cb - Callback receives (groupingKey, groupItems, context)
   * @returns {this}
   */
  forEachGroup (select, options, cb) {
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    const {groupBy, groupAdjacent, groupStartingWith, groupEndingWith} =
      options;

    const nodesResult = this._evalXPath(select, true);
    const nodes = /** @type {Node[]} */ (nodesResult);

    /**
     * @param {string} expr
     * @param {Node} node
     * @returns {any}
     */
    function evalInContext (expr, node) {
      if (expr === '.' || expr === '@') {
        return node.textContent;
      }
      // Temporarily set context to evaluate expression
      const prevNode = that._contextNode;
      that._contextNode = node;
      try {
        const result = that._evalXPath(expr, false);
        // XPath v2/v3 always return arrays; handle NodeList/Array results
        // by taking first item or its text content
        const resultWithLength = /** @type {{length: number}} */ (result);
        if (resultWithLength.length > 0) {
          const firstItem = /** @type {any} */ (result)[0];
          return firstItem?.textContent ?? firstItem;
        }
        return undefined;
      } finally {
        that._contextNode = prevNode;
      }
    }

    /** @type {Map<string, Node[]>} */
    const groups = new Map();

    if (groupBy) {
      // Group by computed value
      for (const node of nodes) {
        const key = evalInContext(groupBy, node);
        // Handle undefined by converting to null for JSON serialization
        const keyStr = JSON.stringify(key === undefined ? null : key);
        if (!groups.has(keyStr)) {
          groups.set(keyStr, []);
        }
        /** @type {Node[]} */ (groups.get(keyStr)).push(node);
      }

      for (const [keyStr, items] of groups) {
        const key = JSON.parse(keyStr);
        // Convert null back to undefined if that was the original value
        const actualKey = key === null && keyStr === 'null' ? undefined : key;
        const prevParams = this._params;
        const prevContext = this._contextNode;
        try {
          this._contextNode = items[0];
          /** @type {any} */ (this)._currentGroup = items;
          /** @type {any} */ (this)._currentGroupingKey = actualKey;
          cb.call(this, actualKey, items, this);
        } finally {
          this._params = prevParams;
          this._contextNode = prevContext;
          delete /** @type {any} */ (this)._currentGroup;
          delete /** @type {any} */ (this)._currentGroupingKey;
        }
      }
    } else if (groupAdjacent) {
      // Group adjacent items with same value
      /** @type {string|null} */
      let currentKey = null;
      /** @type {Node[]} */
      let currentGroup = [];

      for (const node of nodes) {
        const key = evalInContext(groupAdjacent, node);
        const keyStr = JSON.stringify(key);

        if (currentKey === null || currentKey !== keyStr) {
          if (currentGroup.length > 0) {
            const prevParams = this._params;
            const prevContext = this._contextNode;
            try {
              this._contextNode = currentGroup[0];
              /** @type {any} */ (this)._currentGroup = currentGroup;
              /** @type {any} */ (this)._currentGroupingKey =
                JSON.parse(/** @type {string} */ (currentKey));
              cb.call(
                this,
                JSON.parse(/** @type {string} */ (currentKey)),
                currentGroup,
                this
              );
            } finally {
              this._params = prevParams;
              this._contextNode = prevContext;
              delete /** @type {any} */ (this)._currentGroup;
              delete /** @type {any} */ (this)._currentGroupingKey;
            }
          }
          currentKey = keyStr;
          currentGroup = [node];
        } else {
          currentGroup.push(node);
        }
      }

      // Process last group
      if (currentGroup.length > 0) {
        const prevParams = this._params;
        const prevContext = this._contextNode;
        try {
          this._contextNode = currentGroup[0];
          /** @type {any} */ (this)._currentGroup = currentGroup;
          /** @type {any} */ (this)._currentGroupingKey =
            JSON.parse(/** @type {string} */ (currentKey));
          cb.call(
            this,
            JSON.parse(/** @type {string} */ (currentKey)),
            currentGroup,
            this
          );
        } finally {
          this._params = prevParams;
          this._contextNode = prevContext;
          delete /** @type {any} */ (this)._currentGroup;
          delete /** @type {any} */ (this)._currentGroupingKey;
        }
      }
    } else if (groupStartingWith) {
      // Start new group when expression matches
      /** @type {Node[]} */
      let currentGroup = [];

      for (const node of nodes) {
        const startMatch = evalInContext(groupStartingWith, node);

        if (startMatch && currentGroup.length > 0) {
          const prevParams = this._params;
          const prevContext = this._contextNode;
          try {
            this._contextNode = currentGroup[0];
            /** @type {any} */ (this)._currentGroup = currentGroup;
            cb.call(this, null, currentGroup, this);
          } finally {
            this._params = prevParams;
            this._contextNode = prevContext;
            delete /** @type {any} */ (this)._currentGroup;
          }
          currentGroup = [];
        }
        currentGroup.push(node);
      }

      // Process last group
      if (currentGroup.length > 0) {
        const prevParams = this._params;
        const prevContext = this._contextNode;
        try {
          this._contextNode = currentGroup[0];
          /** @type {any} */ (this)._currentGroup = currentGroup;
          cb.call(this, null, currentGroup, this);
        } finally {
          this._params = prevParams;
          this._contextNode = prevContext;
          delete /** @type {any} */ (this)._currentGroup;
        }
      }
    } else if (groupEndingWith) {
      // End group when expression matches
      /** @type {Node[]} */
      let currentGroup = [];

      for (const node of nodes) {
        currentGroup.push(node);
        const endMatch = evalInContext(groupEndingWith, node);

        if (endMatch) {
          const prevParams = this._params;
          const prevContext = this._contextNode;
          try {
            this._contextNode = currentGroup[0];
            /** @type {any} */ (this)._currentGroup = currentGroup;
            cb.call(this, null, currentGroup, this);
          } finally {
            this._params = prevParams;
            this._contextNode = prevContext;
            delete /** @type {any} */ (this)._currentGroup;
          }
          currentGroup = [];
        }
      }

      // Process last group if not ended
      if (currentGroup.length > 0) {
        const prevParams = this._params;
        const prevContext = this._contextNode;
        try {
          this._contextNode = currentGroup[0];
          /** @type {any} */ (this)._currentGroup = currentGroup;
          cb.call(this, null, currentGroup, this);
        } finally {
          this._params = prevParams;
          this._contextNode = prevContext;
          delete /** @type {any} */ (this)._currentGroup;
        }
      }
    }

    return this;
  }

  /**
   * Returns the current group (for use within forEachGroup callback).
   * @returns {Node[]|undefined}
   */
  currentGroup () {
    return /** @type {any} */ (this)._currentGroup;
  }

  /**
   * Returns the current grouping key (for use within forEachGroup callback).
   * @returns {any}
   */
  currentGroupingKey () {
    return /** @type {any} */ (this)._currentGroupingKey;
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

    // Check for format-number() function call
    if (selectStr && selectStr.includes('format-number(')) {
      const match = (/format-number\((?<value>[^,\)]+)(?:,\s*["'](?<format>[^"']+)["'])?(?:,\s*["'](?<decimalFormat>[^"']*)["'])?\)/v).exec(selectStr);
      if (match && match.groups) {
        const {
          value: valueExpr,
          format: formatStr,
          decimalFormat: decimalFormatName
        } = match.groups;
        // Evaluate the value expression
        let numValue;
        if (valueExpr.trim().startsWith('$')) {
          // Parameter reference
          const paramName = valueExpr.trim().slice(1);
          numValue = this._params && paramName in this._params
            ? this._params[paramName]
            : 0;
        } else {
          // Try to parse as number or evaluate as XPath
          const trimmed = valueExpr.trim();
          numValue = Number.isNaN(Number(trimmed))
            ? this._evalXPath(trimmed, false)
            : Number(trimmed);
        }
        const num = typeof numValue === 'string' ? Number(numValue) : numValue;
        const format = formatStr || '1';
        const formatted = this._formatNumber(
          num,
          format,
          undefined,
          undefined,
          decimalFormatName || '',
          'en'
        );
        jt.append(formatted);
        return this;
      }
    }

    // Check if this is a parameter reference (starts with $)
    if (selectStr && selectStr.startsWith('$')) {
      const paramName = selectStr.slice(1);
      if (this._params && paramName in this._params) {
        val = this._params[paramName];
        // If val is a Node, extract its text content
        if (val && typeof val === 'object' && 'nodeType' in val) {
          if (val.nodeType === 3) {
            // Text node: use nodeValue
            val = val.nodeValue;
          } else if (val.nodeType === 9) {
            // Document node: use documentElement.textContent
            const doc = /** @type {Document} */ (val);
            val = doc.documentElement
              ? doc.documentElement.textContent
              : null;
          } else {
            // Other nodes: use textContent
            val = val.textContent;
          }
        }
      } else {
        // Fall back to normal XPath evaluation
        const resResult = this._evalXPath(selectStr, true);
        const res = /** @type {Node[]} */ (resResult);
        const first = res[0];
        /* c8 ignore start */
        val = first && first.nodeType
          ? first.textContent
          : first;
        /* c8 ignore stop */
      }
    } else if (!selectStr || selectStr === '.') {
      if (this._contextNode.nodeType === 3) {
        // Text node: use nodeValue
        val = this._contextNode.nodeValue;
      } else if (this._contextNode.nodeType === 9) {
        // Document node: use documentElement.textContent
        const doc = /** @type {Document} */ (this._contextNode);
        val = doc.documentElement
          ? doc.documentElement.textContent
          : null;
      } else {
        // Other nodes: use textContent
        val = this._contextNode.textContent;
      }
    } else {
      const resResult = this._evalXPath(selectStr, true);
      const res = /** @type {Node[]} */ (resResult);
      // Simplify: use textContent of first match if node, else raw
      const first = res[0];
      val = first && first.nodeType ? first.textContent : first;
    }
    // Ensure val is not null before appending
    if (val !== null) {
      // Use text() method to properly close open tags and escape HTML
      jt.text(String(val));
    }
    return this;
  }

  /**
   * Deep copy selection or current context when omitted.
   * For DOM nodes uses cloneNode(true); for scalars copies the value.
   * @param {string} [select] XPath expression selecting nodes (optional)
   * @returns {XPathTransformerContext}
   */
  copyOf (select) {
    /** @type {Node[]} */ let nodes = [];
    if (select) {
      try {
        const res = this.get(select, true);
        nodes = Array.isArray(res) ? res : /* c8 ignore next */ [];
      } catch { /* c8 ignore next */
        nodes = /* c8 ignore next */ [];
      }
    } else {
      nodes = [this._contextNode];
    }
    if (nodes.length) {
      for (const n of nodes) {
        if (n && typeof n === 'object' && 'cloneNode' in n) {
          let deep;
          try {
            deep = /** @type {Node} */ (n.cloneNode(true));
          } catch { /* c8 ignore start */
            deep = /** @type {Node} */ (n.cloneNode(false));
          } /* c8 ignore stop */
          this._getJoiningTransformer().append(/** @type {any} */ (deep));
        } else { /* c8 ignore start */
          this._getJoiningTransformer().append(/** @type {any} */ (n));
        } /* c8 ignore stop */
      }
    } else if (select) { // Scalar path
      const scalar = this._evalXPath(select, false);
      // If scalar evaluation unexpectedly returns a Node/Document, use its
      // textContent instead of attempting to append the Node itself (which
      // can cause HierarchyRequestError for Document nodes).
      if (
        scalar &&
        typeof scalar === 'object' &&
        'nodeType' in /** @type {any} */ (scalar)
      ) {
        const node = /** @type {Node} */ (scalar);
        let txt = /** @type {any} */ (node.textContent);
        if (/* c8 ignore start */
          (txt === null || typeof txt === 'undefined') &&
          /** @type {any} */ (node).nodeType === 9 // Document
        ) {
          // Fallback to documentElement textContent if available
          const docEl = /** @type {any} */ (
            /** @type {any} */ (node)
          ).documentElement;
          txt = /** @type {any} */ (docEl && docEl.textContent) || '';
        } /* c8 ignore stop */
        this._getJoiningTransformer().append(
          /** @type {any} */ (txt || /* c8 ignore next */ '')
        );
      } else {
        this._getJoiningTransformer().append(/** @type {any} */ (scalar));
      }
    }
    return this;
  }

  /**
   * Shallow copy current context node (cloneNode(false)); scalars copied
   * directly. Provided for parity with JSONPath copy().
   * @param {string[]} [_propertySets] Ignored in XPath variant (parity only)
   * @returns {XPathTransformerContext}
   */
  copy (_propertySets) {
    const target = this._contextNode;
    let clone;
    if (target && typeof target === 'object' && 'nodeType' in target) {
      try {
        clone = /** @type {Node} */ (target.cloneNode(false));
      } catch { /* c8 ignore start */
        clone = target;
      } /* c8 ignore stop */
    } else { /* c8 ignore start */
      clone = target;
    } /* c8 ignore stop */
    this._getJoiningTransformer().append(/** @type {any} */ (clone));
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
   * Append number with xsl:number-like formatting.
   * @param {number|string|{
   *   value?: number|string,
   *   count?: string,
   *   level?: 'single'|'multiple'|'any',
   *   from?: string,
   *   format?: string,
   *   decimalFormat?: string,
   *   groupingSeparator?: string,
   *   groupingSize?: number
   * }} num - Number value, "position()" string, or options object
   * @returns {XPathTransformerContext}
   */
  number (num) {
    // Handle xsl:number-like functionality
    if (typeof num === 'object' && num !== null) {
      const opts = num;
      let {value} = opts;

      // Handle position() calculation
      if (value === 'position()' || value === undefined) {
        const {count} = opts;
        const level = opts.level || 'single';
        const {from} = opts;

        switch (level) {
        case 'single': {
          value = this._calculatePosition(count, from);

          break;
        }
        case 'multiple': {
          // Hierarchical numbering: get position for each ancestor up to root
          const positions = [];
          let node = /** @type {any} */ (this._config).currentNode;
          while (node) {
            positions.unshift(this._calculatePosition(count, undefined));
            node = node.parentNode;
            if (from) {
              const fromResult = /** @type {any} */ (
                this._evalXPath(from, node)
              );
              if (fromResult && fromResult.length > 0) {
                break;
              }
            }
          }
          value = positions.join('.');

          break;
        }
        case 'any': {
          value = this._calculatePositionAny(count, from);

          break;
        }
        // No default
        }
      }

      // Determine format string and locale
      let format = opts.format || '1';
      // @ts-expect-error: dynamic property access
      const locale = opts.lang || 'en';
      // @ts-expect-error: dynamic property access
      const {letterValue} = opts;

      // If letterValue is 'alphabetic', force alphabetic format
      if (letterValue === 'alphabetic') {
        format = (opts.format && (/^[aA]$/v).test(opts.format)) ? opts.format : 'a';
      }

      const numValue = typeof value === 'string' ? Number(value) : (value || 1);
      const formatted = this._formatNumber(
        numValue,
        format,
        opts.groupingSeparator,
        opts.groupingSize,
        locale
      );
      this._getJoiningTransformer().plainText(formatted);
    } else if (num === 'position()') {
      // Simple position() call
      const pos = this._calculatePosition();
      this._getJoiningTransformer().number(pos);
    } else {
      // Simple number
      this._getJoiningTransformer().number(
        typeof num === 'string' ? Number(num) : num
      );
    }
    return this;
  }

  /**
   * Calculate position of current node.
   * @param {string} [count] - XPath pattern to match
   * @param {string} [from] - XPath pattern for ancestor
   * @returns {number}
   * @private
   */
  _calculatePosition (count, from) {
    // eslint-disable-next-line prefer-destructuring -- TS
    const currentNode = /** @type {any} */ (this._config).currentNode;
    if (!currentNode) {
      return 1;
    }

    // Get parent node
    const parent = currentNode.parentNode;
    if (!parent) {
      return 1;
    }

    // If from pattern specified, find that ancestor
    let startNode = parent;
    if (from) {
      const fromResult = /** @type {any} */ (
        this._evalXPath(from, currentNode)
      );
      if (fromResult && fromResult.length > 0) {
        startNode = fromResult[0];
      }
    }

    // Count preceding siblings
    let position = 1;
    let sibling = currentNode.previousSibling;

    while (sibling) {
      if (count) {
        // Check if sibling matches count pattern
        const matches = /** @type {any} */ (this._evalXPath(count, sibling));
        if (matches && matches.length > 0) {
          position++;
        }
      } else if (sibling.nodeType === currentNode.nodeType &&
        (!currentNode.nodeName || sibling.nodeName === currentNode.nodeName)) {
        position++;
      }
      sibling = sibling.previousSibling;
    }

    return position;
  }

  /**
   * Calculate position counting all ancestors (level=any).
   * @param {string} [count] - XPath pattern to match
   * @param {string} [from] - XPath pattern for ancestor
   * @returns {number}
   * @private
   */
  _calculatePositionAny (count, from) {
    // eslint-disable-next-line prefer-destructuring -- TS
    const currentNode = /** @type {any} */ (this._config).currentNode;
    if (!currentNode) {
      return 1;
    }

    // Find root or 'from' node
    let root = currentNode.ownerDocument || currentNode;
    if (from) {
      const fromResult = /** @type {any} */ (
        this._evalXPath(from, currentNode)
      );
      if (fromResult && fromResult.length > 0) {
        root = fromResult[0];
      }
    }

    // Count all matching nodes in document order up to current
    const pattern = count || 'node()';
    const allNodes = /** @type {any[]} */ (
      this._evalXPath('//' + pattern, root)
    );

    for (const [i, allNode] of allNodes.entries()) {
      if (allNode === currentNode) {
        return i + 1;
      }
    }

    return 1;
  }

  /**
   * Format a number according to format string.
   * @param {number} num - Number to format
   * @param {string} format - Format string (1, a, A, i, I, 01, etc.)
   * @param {string} [groupingSeparator] - Separator for grouping (e.g., ',')
   * @param {number} [groupingSize] - Size of groups (e.g., 3 for 1,000)
   * @param {string} [decimalFormatName] - Named decimal format to use
   * @param {string} [locale]
   * @returns {string}
   * @private
   */
  _formatNumber (
    num, format, groupingSeparator, groupingSize, decimalFormatName, locale
  ) {
    if (Number.isNaN(num)) {
      return String(num);
    }

    // Get decimal format symbols if specified
    const symbols = decimalFormatName !== undefined &&
      decimalFormatName in this.decimalFormats
      ? this.decimalFormats[decimalFormatName]
      : undefined;

    // Default locale
    const loc = locale || 'en';

    let result;
    const formatChar = format.charAt(0);

    switch (formatChar) {
    case 'i': {
      result = this._toRoman(num).toLowerCase();

      break;
    }
    case 'I': {
      result = this._toRoman(num);

      break;
    }
    case 'a': {
      result = this._toAlphabetic(num, false);

      break;
    }
    case 'A': {
      result = this._toAlphabetic(num, true);

      break;
    }
    case '0': {
      const width = format.length;
      const zeroDigit = symbols?.zeroDigit || '0';
      result = String(num).padStart(width, zeroDigit);

      break;
    }
    default: {
      // Use Intl.NumberFormat for decimal formatting if grouping/locale
      //   options are provided
      let options = {};
      if (groupingSeparator || groupingSize) {
        options = {
          useGrouping: true
        };
      }
      try {
        result = new Intl.NumberFormat(loc, options).format(num);

        // Apply decimal format symbols if specified
        if (symbols) {
          // Use placeholders to avoid conflicts during replacement
          const TEMP_GROUP = '\u0000GROUPSEP\u0000';
          const TEMP_DECIMAL = '\u0000DECIMALSEP\u0000';

          // Replace with temporary placeholders first
          result = result.replaceAll(',', TEMP_GROUP);
          result = result.replaceAll('.', TEMP_DECIMAL);

          // Now replace with actual symbols
          const effectiveGroupingSep = groupingSeparator ||
            symbols.groupingSeparator || ',';
          const effectiveDecimalSep = symbols.decimalSeparator || '.';

          result = result.replaceAll(TEMP_GROUP, effectiveGroupingSep);
          result = result.replaceAll(TEMP_DECIMAL, effectiveDecimalSep);
        } else if (groupingSeparator) {
          result = result.replaceAll(',', groupingSeparator);
        }
      } catch (e) {
        result = String(num);
      }
    }
    }
    return result;
  }

  /**
   * Convert number to Roman numerals.
   * @param {number} num - Number to convert (1-3999)
   * @returns {string}
   * @private
   */
  // eslint-disable-next-line class-methods-use-this -- Avoid for now
  _toRoman (num) {
    if (num < 1 || num > 3999) {
      return String(num);
    }

    const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const syms = [
      'M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'
    ];

    let result = '';
    for (const [i, val] of vals.entries()) {
      while (num >= val) {
        result += syms[i];
        num -= val;
      }
    }
    return result;
  }

  /**
   * Convert number to alphabetic sequence.
   * @param {number} num - Number to convert
   * @param {boolean} uppercase - Use uppercase letters
   * @returns {string}
   * @private
   */
  // eslint-disable-next-line class-methods-use-this -- Avoid for now
  _toAlphabetic (num, uppercase) {
    if (num < 1) {
      return String(num);
    }

    let result = '';
    const base = uppercase ? 65 : 97; // 'A' or 'a'

    while (num > 0) {
      num--; // Make 0-indexed
      result = String.fromCodePoint(base + (num % 26)) + result;
      num = Math.floor(num / 26);
    }

    return result;
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
   * Alias for propValue(). Append a key-value pair to the current map/object.
   * @param {string} prop Property name
   * @param {any} val Value
   * @returns {XPathTransformerContext}
   */
  mapEntry (prop, val) {
    return this.propValue(prop, val);
  }
  /**
   * Declare elements for which whitespace-only text nodes should be preserved.
   * Equivalent to xsl:preserve-space.
   * @param {string|string[]} elements - Element name(s) or patterns
   * @returns {XPathTransformerContext}
   */
  preserveSpace (elements) {
    const elemArray = Array.isArray(elements) ? elements : [elements];
    this._preserveSpaceElements.push(...elemArray);
    return this;
  }
  /**
   * Declare elements for which whitespace-only text nodes should be stripped.
   * Equivalent to xsl:strip-space.
   * This automatically clones the DOM and removes whitespace-only text nodes.
   * @param {string|string[]} elements - Element name(s) or patterns
   * @returns {XPathTransformerContext}
   */
  stripSpace (elements) {
    const elemArray = Array.isArray(elements) ? elements : [elements];
    const wasEmpty = this._stripSpaceElements.length === 0;
    this._stripSpaceElements.push(...elemArray);
    // Apply stripping if this is the first strip-space declaration
    if (wasEmpty && this._stripSpaceElements.length > 0) {
      this.applyWhitespaceStripping();
    }
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
   * Alias for object(). Append an object/map.
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
  map (objOrCb, cbOrUsePropertySets, usePropertySetsOrPropSets, propSets) {
    return this.object(
      objOrCb, cbOrUsePropertySets, usePropertySetsOrPropSets, propSets
    );
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
   * @param {string} name
   * @param {import('./AbstractJoiningTransformer.js').
   *   OutputCharacters} outputCharacters
   * @returns {this}
   */
  characterMap (name, outputCharacters) {
    this._getJoiningTransformer().characterMap(name, outputCharacters);
    return this;
  }

  /**
   * @param {string} name
   * @param {Record<string, string>} attributes
   * @returns {this}
   */
  attributeSet (name, attributes) {
    this._getJoiningTransformer().attributeSet(name, attributes);
    return this;
  }

  /**
   * @param {string} stylesheetPrefix
   * @param {string} resultPrefix
   * @returns {this}
   */
  namespaceAlias (stylesheetPrefix, resultPrefix) {
    this._getJoiningTransformer().namespaceAlias(
      stylesheetPrefix, resultPrefix
    );
    return this;
  }

  /**
   * Append element.
   * @param {string} name Tag name
   * @param {Record<string, string>|any[]|
   *   ((this: XPathTransformerContext)=>void)} [atts] Attributes,
   *   children, or callback
   * @param {any[]|
   *   ((this: XPathTransformerContext)=>void)} [children]
   *   Children or callback
   * @param {(this: XPathTransformerContext)=>void} [cb] Callback
   * @param {string[]} [useAttributeSets] - Attribute set names to apply
   * @returns {XPathTransformerContext}
   */
  element (name, atts, children, cb, useAttributeSets) {
    /** @type {any} */ (this._getJoiningTransformer()).element(
      name, atts, children, cb, useAttributeSets
    );
    return this;
  }

  /**
   * Adds a prefixed namespace declaration to the most recently opened
   *  element. Mirrors the joining
   * transformer API so templates can call `this.attribute()`.
   * @param {string} prefix - Prefix
   * @param {string} namespaceURI - Namespace
   * @returns {this}
   */
  namespace (prefix, namespaceURI) {
    /** @type {any} */ (this._getJoiningTransformer()).namespace(
      prefix, namespaceURI
    );
    return this;
  }

  /**
   * Define a decimal format with custom symbols for number formatting.
   * Equivalent to xsl:decimal-format. If no name is provided, defines
   * the default format.
   * @param {string|import('./JSONPathTransformerContext.js').
   *   DecimalFormatSymbols} nameOrSymbols - Format name or symbols object
   *   if defining default
   * @param {import('./JSONPathTransformerContext.js').
   *   DecimalFormatSymbols} [symbols] - Format symbols
   * @returns {this}
   */
  decimalFormat (nameOrSymbols, symbols) {
    if (typeof nameOrSymbols === 'string') {
      // Named format
      this.decimalFormats[nameOrSymbols] = symbols || {};
    } else {
      // Default format (unnamed)
      this.decimalFormats[''] = nameOrSymbols;
    }
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

  /**
   * Assert that a test condition is true, throwing an error if it fails.
   * Equivalent to xsl:assert. Evaluates an XPath expression using the
   * same truthiness rules as if() and choose().
   * @param {string} test - XPath expression to test
   * @param {string} [message] - Optional error message to include
   * @returns {XPathTransformerContext}
   * @throws {Error} When the test expression evaluates to false
   */
  assert (test, message) {
    const passes = this._passesIf(test);
    if (!passes) {
      const errorMsg = message
        ? `Assertion failed: ${message}`
        : `Assertion failed: ${test}`;
      throw new Error(errorMsg);
    }
    return this;
  }

  /**
   * Analyze a string with a regular expression, equivalent to
   * xsl:analyze-string. Processes matching and non-matching substrings
   * with separate callbacks.
   * @param {string} str - The string to analyze
   * @param {string|RegExp} regex - Regular expression to match against
   * @param {{
   *   matchingSubstring?: (
   *     this: XPathTransformerContext,
   *     substring: string,
   *     groups: string[],
   *     regexGroup: (n: number) => string
   *   ) => void,
   *   nonMatchingSubstring?: (
   *     this: XPathTransformerContext,
   *     substring: string
   *   ) => void,
   *   flags?: string
   * }} options - Options object
   * @returns {XPathTransformerContext}
   */
  analyzeString (str, regex, options = {}) {
    // Ensure we have a string
    const inputString = String(str || '');

    // If empty string, do nothing
    if (inputString.length === 0) {
      return this;
    }

    const {
      matchingSubstring,
      nonMatchingSubstring,
      flags = ''
    } = options;

    // Convert regex to RegExp if it's a string
    let regexObj;
    if (typeof regex === 'string') {
      // Ensure 'g' flag is present for global matching
      const actualFlags = flags.includes('g') ? flags : flags + 'g';
      regexObj = new RegExp(regex, actualFlags);
    } else {
      regexObj = regex;
      // Ensure global flag is set
      if (!regexObj.global) {
        regexObj = new RegExp(
          regexObj.source,
          regexObj.flags + 'g'
        );
      }
    }

    // Check for zero-length matches (error condition in XSLT)
    if (regexObj.test('')) {
      throw new Error(
        'Regular expression matches zero-length string'
      );
    }

    // Store captured groups for access during callback
    /** @type {string[] | undefined} */
    let currentCapturedGroups;

    /**
     * Get captured group by index.
     * @param {number} groupNumber - Group index
     * @returns {string} - Captured group or empty string
     */
    const getRegexGroup = (groupNumber) => {
      if (!currentCapturedGroups ||
          groupNumber < 0 ||
          groupNumber >= currentCapturedGroups.length) {
        return '';
      }
      return currentCapturedGroups[groupNumber] || '';
    };

    // Save previous context to restore later
    const prevContext = this._contextNode;

    let lastIndex = 0;
    let match;

    // Bind callbacks to this context
    const boundMatchingSubstring = matchingSubstring
      ? matchingSubstring.bind(this)
      : undefined;
    const boundNonMatchingSubstring = nonMatchingSubstring
      ? nonMatchingSubstring.bind(this)
      : undefined;

    // Find all matches
    while ((match = regexObj.exec(inputString)) !== null) {
      // Process non-matching substring before this match
      if (match.index > lastIndex) {
        const nonMatchingStr = inputString.slice(lastIndex, match.index);
        if (boundNonMatchingSubstring) {
          boundNonMatchingSubstring(nonMatchingStr);
        }
      }

      // Process matching substring
      if (boundMatchingSubstring) {
        const matchingStr = match[0];
        // Store captured groups: [full match, group1, group2, ...]
        currentCapturedGroups = [...match];
        boundMatchingSubstring(
          matchingStr, currentCapturedGroups, getRegexGroup
        );
        currentCapturedGroups = undefined;
      }

      const {lastIndex: newLastIndex} = regexObj;
      lastIndex = newLastIndex;

      // Prevent infinite loop on zero-length matches (shouldn't happen
      // due to earlier check, but defensive)
      if (match.index === regexObj.lastIndex) {
        regexObj.lastIndex++;
      }
    }

    // Process final non-matching substring
    if (lastIndex < inputString.length) {
      const nonMatchingStr = inputString.slice(lastIndex);
      if (boundNonMatchingSubstring) {
        boundNonMatchingSubstring(nonMatchingStr);
      }
    }

    // Restore previous context
    this._contextNode = prevContext;

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
