import * as JHTML from 'jhtml';
import AbstractJoiningTransformer from './AbstractJoiningTransformer.js';

/**
 * @callback SimpleCallback
 * @this {DOMJoiningTransformer}
 * @returns {void}
 */

/**
 * Joining transformer that accumulates into a DOM tree.
 *
 * This transformer appends strings and nodes to a DocumentFragment/Element.
 * It expects templates to build DOM nodes explicitly (e.g., via element(),
 * attribute(), and text()), though string/number/boolean will append text
 * nodes for convenience.
 * @extends {AbstractJoiningTransformer<"dom">}
 */
class DOMJoiningTransformer extends AbstractJoiningTransformer {
  /**
   * @param {DocumentFragment|Element} o - Initial DOM node
   * @param {import('./AbstractJoiningTransformer.js').
   *   DOMJoiningTransformerConfig} cfg - Configuration object
   */
  constructor (o, cfg) {
    super(cfg);
    this._dom = o || cfg.document.createDocumentFragment();
    /** @type {any} */
    this._context = undefined;
    /** @type {XMLDocument[]} */
    this._docs = [];
    /** @type {Array<{href: string, document: XMLDocument, format?: string}>} */
    this._resultDocuments = [];
    /** @type {Record<string, unknown>} */
    this.propertySets = {};
  }

  /**
   * @param {Node} item
   * @returns {void}
   */
  rawAppend (item) {
    this._dom.append(item);
  }

  /**
   * Set the transformer context for callback invocations.
   * @param {any} context - The transformer context object
   * @returns {DOMJoiningTransformer}
   */
  setContext (context) {
    this._context = context;
    return this;
  }

  /**
   * @param {string|Node} item - Item to append
   * @returns {void}
   */
  append (item) {
    this._dom.append(item);
  }

  /**
   * @returns {DocumentFragment|Element|XMLDocument[]}
   */
  get () {
    if (this._cfg.exposeDocuments) {
      return this._docs;
    }
    return this._dom;
  }

  /**
   * @param {string} prop - Property name
   * @param {any} val - Property value
   * @returns {void}
   */
  propValue (prop, val) {
    // @ts-expect-error Ok
    this._dom[prop] = val;
  }

  /**
   * Alias for propValue(). Set a key-value pair in the current map/object.
   * @param {string} prop - Property name
   * @param {any} val - Property value
   * @returns {void}
   */
  mapEntry (prop, val) {
    return this.propValue(prop, val);
  }

  /**
   * @param {Record<string, unknown>} obj - Object to serialize
   * @param {(this: DOMJoiningTransformer) => void} [cb] - Callback function.
   * @param {any[]} [usePropertySets] - Property sets to use
   * @param {Record<string, unknown>} [propSets] - Additional property sets
   * @returns {DOMJoiningTransformer}
   */
  object (obj, cb, usePropertySets, propSets) {
    // eslint-disable-next-line unicorn/no-this-assignment -- Temporary
    const that = this;
    this._requireSameChildren('dom', 'object');

    if (usePropertySets !== undefined) {
      obj = usePropertySets.reduce(function (o, psName) {
        return that._usePropertySets(o, psName);
      }, obj);
    }
    if (propSets !== undefined) {
      Object.assign(obj, propSets);
    }

    if (this._cfg.JHTMLForJSON) {
      this.append(JHTML.toJHTMLDOM(/** @type {any} */ (obj)));
    } else {
      // Todo: set current position and deal with children
      this.append('');
    }
    return this;
  }

  /**
   * Alias for object(). Build an object/map.
   * @param {Record<string, unknown>} obj - Object to serialize
   * @param {(this: DOMJoiningTransformer) => void} [cb] - Callback function.
   * @param {any[]} [usePropertySets] - Property sets to use
   * @param {Record<string, unknown>} [propSets] - Additional property sets
   * @returns {DOMJoiningTransformer}
   */
  map (obj, cb, usePropertySets, propSets) {
    return this.object(obj, cb, usePropertySets, propSets);
  }

  /**
   * @param {any[]|Element} arr
   * @param {(this: DOMJoiningTransformer) => void} [cb] - Callback function
   * @returns {DOMJoiningTransformer}
   */
  array (arr, cb) {
    this._requireSameChildren('dom', 'array');
    if (this._cfg.JHTMLForJSON) {
      this.append(JHTML.toJHTMLDOM(/** @type {any} */ (arr)));
    } else {
      // Todo: set current position and deal with children
      this.append('');
    }
    return this;
  }

  /**
   * @param {string} str - String value
   * @param {(this: DOMJoiningTransformer) => void} [cb] - Callback
   *   function (unused)
   * @returns {DOMJoiningTransformer}
   */
  string (str, cb) {
    // Todo: Conditionally add as JHTML (and in subsequent methods as well)
    this.append(str);
    return this;
  }

  /**
   * @param {number} num - Number value
   * @returns {DOMJoiningTransformer}
   */
  number (num) {
    this.append(num.toString());
    return this;
  }

  /**
   * @param {boolean} bool
   * @returns {DOMJoiningTransformer}
   */
  boolean (bool) {
    this.append(bool ? 'true' : 'false');
    return this;
  }

  /**
   * @returns {DOMJoiningTransformer}
   */
  null () {
    this.append('null');
    return this;
  }

  /**
   * @returns {DOMJoiningTransformer}
   */
  undefined () {
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'undefined is not allowed unless added in JavaScript mode'
      );
    }
    this.append('undefined');
    return this;
  }

  /**
   * @param {number} num - Non-finite number (NaN, Infinity, -Infinity)
   * @returns {DOMJoiningTransformer}
   */
  nonfiniteNumber (num) {
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'Non-finite numbers are not allowed unless added in JavaScript mode'
      );
    }
    this.append(num.toString());
    return this;
  }

  /**
   * @param {(...args: any[]) => any} func - Function to stringify
   * @returns {DOMJoiningTransformer}
   */
  outputFunction (func) {
    if (this._cfg.mode !== 'JavaScript') {
      throw new Error(
        'outputFunction is not allowed unless added in JavaScript mode'
      );
    }
    this.append(func.toString());
    return this;
  }

  /**
   * @overload
   * @param {Element|string} elName
   * @param {Record<string, string>} atts
   * @param {(Node|string)[]} childNodes
   * @param {(this: DOMJoiningTransformer) => void} cb
   * @returns {DOMJoiningTransformer}
   */
  /**
   * @overload
   * @param {Element|string} elName
   * @param {Record<string, string>} atts
   * @param {(Node|string)[]} childNodes
   * @returns {DOMJoiningTransformer}
   */
  /**
   * @overload
   * @param {Element|string} elName
   * @param {Record<string, string>} atts
   * @param {(this: DOMJoiningTransformer) => void} cb
   * @returns {DOMJoiningTransformer}
   */
  /**
   * @overload
   * @param {Element|string} elName
   * @param {Record<string, string>} atts
   * @returns {DOMJoiningTransformer}
   */
  /**
   * @overload
   * @param {Element|string} elName
   * @param {(Node|string)[]} childNodes
   * @param {(this: DOMJoiningTransformer) => void} cb
   * @returns {DOMJoiningTransformer}
   */
  /**
   * @overload
   * @param {Element|string} elName
   * @param {(Node|string)[]} childNodes
   * @returns {DOMJoiningTransformer}
   */
  /**
   * @overload
   * @param {Element|string} elName
   * @param {(this: DOMJoiningTransformer) => void} cb
   * @returns {DOMJoiningTransformer}
   */
  /**
   * @overload
   * @param {Element|string} elName
   * @returns {DOMJoiningTransformer}
   */
  /**
   * @param {Element|string} elem - Element name
   * @param {Record<string, string>|(Node|string)[
   *   ]|((this: DOMJoiningTransformer) => void)} [atts] - Attributes,
   *   childNodes, or callback
   * @param {(Node|string)[]|((this: DOMJoiningTransformer) => void)
   *   } [childNodes] - Child nodes or callback
   * @param {(this: DOMJoiningTransformer) => void} [cb] - Callback
   * @param {string[]} [useAttributeSets] - Attribute set names to apply
   * @returns {DOMJoiningTransformer}
   */
  element (elem, atts, childNodes, cb, useAttributeSets) {
    // Handle argument overloading like other transformers
    if (Array.isArray(atts)) {
      cb = /** @type {(this: DOMJoiningTransformer) => void} */ (
        /** @type {unknown} */ (childNodes)
      );
      childNodes = atts;
      atts = {};
    } else if (typeof atts === 'function') {
      cb = /** @type {(this: DOMJoiningTransformer) => void} */ (atts);
      childNodes = [];
      atts = {};
    }
    if (typeof childNodes === 'function') {
      cb = /** @type {(this: DOMJoiningTransformer) => void} */ (childNodes);
      childNodes = [];
    }

    const elementName = this._replaceNamespaceAliasInElement(
      typeof elem === 'string'
        ? elem
        : elem.localName
    );

    if (!this.root && this._outputConfig) {
      this.root = elementName;

      const {
        omitXmlDeclaration, doctypePublic, doctypeSystem, method
      /* c8 ignore start -- outputConfig ?? attribution issue */
      } = this._outputConfig ?? {};
      /* c8 ignore stop */

      /* c8 ignore start -- namespace/prefix detection branches */
      const dtd = this._cfg.document.implementation.createDocumentType(
        elementName,
        doctypePublic ?? '',
        doctypeSystem ?? ''
      );

      let xmlns;
      if (elementName.includes(':')) {
        const prefix = elementName.slice(0, elementName.indexOf(':'));
        xmlns = atts?.[prefix];
      } else {
        ({xmlns} = atts ?? {});
      }

      const doc = /** @type {XMLDocument} */ (
        this._cfg.document.implementation.createDocument(
          xmlns ?? null,
          elementName,
          dtd
        )
      );
      /* c8 ignore stop */

      /* c8 ignore start -- third OR condition short-circuits */
      if (!omitXmlDeclaration && (
        method === 'xml' || method === 'xhtml' || omitXmlDeclaration === false)
      ) {
        const {version, encoding, standalone} = this._outputConfig ?? {};

        const xmlDeclarationData = `${
          version ? ` version="${version}"` : ''
        }${
          encoding ? ` encoding="${encoding}"` : ''
        }${
          standalone ? ` standalone="yes"` : ''
        }`.slice(1);

        const xmlDecl = doc.createProcessingInstruction(
          'xml', xmlDeclarationData
        );
        doc.insertBefore(
          xmlDecl,
          doc.firstChild
        );
      }
      /* c8 ignore stop */

      // Push the document to _docs
      this._docs.push(doc);

      // Use the document's root element
      const el = doc.documentElement;

      // Apply attribute sets if specified
      if (useAttributeSets && useAttributeSets.length) {
        useAttributeSets.forEach((setName) => {
          if (this._attributeSet[setName]) {
            for (const att in this._attributeSet[setName]) {
              if (Object.hasOwn(this._attributeSet[setName], att)) {
                el.setAttribute(att, this._replaceCharacterMaps(
                  this._attributeSet[setName][att]
                ));
              }
            }
          }
        });
      }

      for (const att in atts) {
        if (Object.hasOwn(atts, att)) {
          el.setAttribute(att, this._replaceCharacterMaps(atts[att]));
        }
      }

      const oldDOM = this._dom;
      this._dom = el;

      // Add childNodes if provided
      if (childNodes && childNodes.length) {
        for (const child of childNodes) {
          if (typeof child === 'string') {
            el.append(this._replaceCharacterMaps(child));
          } else {
            el.append(child);
          }
        }
      }

      if (cb) {
        cb.call(this._context || this);
      }
      this._dom = oldDOM;

      return this;
    }

    // Non-root elements
    const el = elem && typeof elem === 'object'
      ? elem
      : /** @type {Element} */ (
        this._cfg.document.createElement(elem)
      );

    // Apply attribute sets if specified
    if (useAttributeSets && useAttributeSets.length) {
      useAttributeSets.forEach((setName) => {
        if (this._attributeSet[setName]) {
          for (const att in this._attributeSet[setName]) {
            if (Object.hasOwn(this._attributeSet[setName], att)) {
              el.setAttribute(att, this._replaceCharacterMaps(
                this._attributeSet[setName][att]
              ));
            }
          }
        }
      });
    }

    for (const att in atts) {
      if (Object.hasOwn(atts, att)) {
        el.setAttribute(att, this._replaceCharacterMaps(atts[att]));
      }
    }
    this.append(el);

    const oldDOM = this._dom;

    this._dom = el;

    // Add childNodes if provided
    if (childNodes && childNodes.length) {
      for (const child of childNodes) {
        if (typeof child === 'string') {
          el.append(this._replaceCharacterMaps(child));
        } else {
          el.append(child);
        }
      }
    }

    if (cb) {
      cb.call(this._context || this);
    }
    this._dom = oldDOM;

    return this;
  }

  /**
   * @param {string} prefix
   * @param {string} namespaceURI
   * @returns {DOMJoiningTransformer}
   */
  namespace (prefix, namespaceURI) {
    let alias = this._getNamespaceAlias(prefix);

    // Normalize empty string or undefined/null to #default
    if (!alias) {
      alias = '#default';
    }
    const normalizedPrefix = alias;

    // If this prefix is excluded, buffer it instead of outputting immediately
    if (this._excludeResultPrefixes.has(normalizedPrefix)) {
      this._pendingNamespaceMap.set(normalizedPrefix, {
        prefix: alias,
        namespaceURI
      });
      return this;
    }

    // Not excluded, output immediately
    /** @type {Element} */
    (this._dom).setAttributeNS(
      'http://www.w3.org/2000/xmlns/',
      alias === '#default' ? 'xmlns' : 'xmlns:' + alias,
      this._replaceCharacterMaps(namespaceURI)
    );
    return this;
  }

  /**
   * @param {string} prefix
   * @returns {void}
   * @override
   */
  _flushPendingNamespace (prefix) {
    const pending = this._pendingNamespaceMap.get(prefix);
    if (pending) {
      /** @type {Element} */
      (this._dom).setAttributeNS(
        'http://www.w3.org/2000/xmlns/',
        pending.prefix === '#default' ? 'xmlns' : 'xmlns:' + pending.prefix,
        this._replaceCharacterMaps(pending.namespaceURI)
      );
      this._pendingNamespaceMap.delete(prefix);
    }
  }
  /**
   * @param {string} name
   * @param {string} val
   * @returns {DOMJoiningTransformer}
   */
  attribute (name, val) {
    if (!this._dom || typeof this._dom !== 'object' ||
        this._dom.nodeType !== 1) {
      throw new Error('You may only set an attribute on an element');
    }

    // Track attribute prefix usage for namespace exclusion
    this._trackAttributePrefix(name);

    (/** @type {Element} */ (this._dom)).setAttribute(
      this._replaceNamespaceAliasInNamespaceDeclaration(name),
      this._replaceCharacterMaps(val)
    );
    return this;
  }

  /**
   * @param {string} txt - Text content
   * @returns {DOMJoiningTransformer}
   */
  text (txt) {
    this.append(this._replaceCharacterMaps(txt));
    return this;
  }

  /**
   * @param {string} text
   * @returns {DOMJoiningTransformer}}
   */
  comment (text) {
    if (!this._dom || typeof this._dom !== 'object' ||
        (![1, 9, 11].includes(this._dom.nodeType))) {
      throw new Error(
        'You may only set a comment on a document, fragment, or element'
      );
    }
    this._dom.append((this._dom.ownerDocument).createComment(text));
    return this;
  }

  /**
   * @param {string} target
   * @param {string} data
   * @returns {DOMJoiningTransformer}}
   */
  processingInstruction (target, data) {
    if (!this._dom || typeof this._dom !== 'object' ||
        (![1, 9, 11].includes(this._dom.nodeType))) {
      throw new Error(
        'You may only set a processing instruction on a ' +
          'document, fragment, or element'
      );
    }
    this._dom.append((this._dom.ownerDocument).createProcessingInstruction(
      target, data
    ));
    return this;
  }

  /**
   * @param {string} str
   * @returns {DOMJoiningTransformer}
   */
  plainText (str) {
    this.text(str);
    return this;
  }

  /**
   * Creates a new XML document and executes a callback in its context.
   * Similar to XSLT's xsl:document, this allows templates to generate
   * multiple output documents. The created document is pushed to this._docs
   * and will be included in the result when exposeDocuments is true.
   *
   * @param {(this: DOMJoiningTransformer) => void} cb
   *   Callback that builds the document content
   * @param {import('./StringJoiningTransformer.js').OutputConfig} [cfg]
   *   Output configuration for the document (encoding, doctype, etc.)
   * @returns {DOMJoiningTransformer}
   */
  document (cb, cfg) {
    // Save current state
    /** @type {any} */
    const oldRoot = this.root;
    /** @type {any} */
    const oldOutputConfig = this._outputConfig;
    const oldDOM = this._dom;

    // Reset state for new document
    this.root = undefined;
    /** @type {any} */
    this._outputConfig = cfg;

    // Create a new document fragment as the working context
    const fragment = this._cfg.document.createDocumentFragment();
    this._dom = fragment;

    // Execute callback to build document content
    cb.call(this._context || this);

    // Restore previous state
    this.root = oldRoot;
    this._outputConfig = oldOutputConfig;
    this._dom = oldDOM;

    return this;
  }

  /**
   * Creates a new result document with metadata (href, format).
   * Similar to XSLT's xsl:result-document, this allows templates to generate
   * multiple output documents with associated metadata like URIs. The created
   * document is stored in this._resultDocuments with the provided href.
   *
   * @param {string} href - URI/path for the result document
   * @param {(this: DOMJoiningTransformer) => void} cb
   *   Callback that builds the document content
   * @param {import('./StringJoiningTransformer.js').OutputConfig} [cfg]
   *   Output configuration for the document (encoding, doctype, format, etc.)
   * @returns {DOMJoiningTransformer}
   */
  resultDocument (href, cb, cfg) {
    // Save current state
    /** @type {any} */
    const oldRoot = this.root;
    /** @type {any} */
    const oldOutputConfig = this._outputConfig;
    const oldDOM = this._dom;

    // Reset state for new document
    this.root = undefined;
    /** @type {any} */
    this._outputConfig = cfg;

    // Create a new document fragment as the working context
    const fragment = this._cfg.document.createDocumentFragment();
    this._dom = fragment;

    // Execute callback to build document content
    cb.call(this._context || this);

    // Get the created document from _docs (document() will have pushed it)
    // or extract from the current DOM state
    const resultDoc = this._docs.length > 0
      ? /** @type {XMLDocument} */ (this._docs.at(-1))
      : /** @type {XMLDocument} */ (
        this._cfg.document.implementation.createDocument(null, 'root', null)
      );

    // Store with metadata, using the output config that was set during callback
    this._resultDocuments.push({
      href,
      document: resultDoc,
      format: this._outputConfig?.method || cfg?.method
    });

    // Restore previous state
    this.root = oldRoot;
    this._outputConfig = oldOutputConfig;
    this._dom = oldDOM;

    return this;
  }

  /**
   * Helper method to use property sets.
   * @param {Record<string, unknown>} obj - Object to apply property set to
   * @param {string} psName - Property set name
   * @returns {Record<string, unknown>}
   */
  _usePropertySets (obj, psName) {
    // Merge named property set from this.propertySets into obj
    if (this.propertySets && this.propertySets[psName]) {
      return {
        ...obj,
        ...this.propertySets[psName]
      };
    }
    return obj;
  }
}

export default DOMJoiningTransformer;
