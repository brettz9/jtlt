export default XPathTransformer;
export type XPathTransformerConfig<T> = {
    /**
     * Throw on equal priority
     */
    errorOnEqualPriority?: boolean | undefined;
    /**
     * Template objects
     */
    templates: import("./index.js").XPathTemplateArray<T>;
    /**
     * XPath version (1|2|3.1)
     */
    xpathVersion?: number | undefined;
};
/**
 * @template T
 * @typedef {object} XPathTransformerConfig
 * @property {boolean} [errorOnEqualPriority] Throw on equal priority
 * @property {import('./index.js').
 *   XPathTemplateArray<T>} templates Template objects
 * @property {number} [xpathVersion] XPath version (1|2|3.1)
 */
/**
 * Applies named XPath-driven templates to XML/HTML DOM data.
 *
 * Finds templates whose `path` XPath matches the current node (plus optional
 * `mode`), sorts by priority, and invokes the winning template.
 * Falls back to default rules when no template matches.
 * @template T
 */
declare class XPathTransformer<T> {
    static DefaultTemplateRules: {
        transformRoot: {
            /**
             * @param {any} node Node
             * @param {{mode:string}} cfg Config
             * @returns {void}
             */
            template(node: any, cfg: {
                mode: string;
            }): void;
        };
    };
    /**
     * @param {XPathTransformerConfig<T> &
     *   import('./XPathTransformerContext.js').
     *   XPathTransformerContextConfig} config Configuration
     */
    constructor(config: XPathTransformerConfig<T> & import("./XPathTransformerContext.js").XPathTransformerContextConfig);
    _config: XPathTransformerConfig<T> & import("./XPathTransformerContext.js").XPathTransformerContextConfig;
    /** @type {any[]} */
    rootTemplates: any[];
    /** @type {import('./index.js').XPathTemplateObject<T>[]} */
    templates: import("./index.js").XPathTemplateObject<T>[];
    /**
     * @returns {void}
     */
    _triggerEqualPriorityError(): void;
    /**
     * @param {string} [mode] Transformation mode
     * @returns {import('./index.js').ResultType<T>} Result of transformation
     */
    transform(mode?: string): import("./index.js").ResultType<T>;
}
//# sourceMappingURL=XPathTransformer.d.ts.map