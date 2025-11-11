export default XPathTransformer;
export type XPathTransformerConfig = {
    /**
     * Throw on equal priority
     */
    errorOnEqualPriority?: boolean | undefined;
    /**
     * Template objects
     */
    templates: import("./index.js").XPathTemplateArray;
    /**
     * XPath version (1|2)
     */
    xpathVersion?: number | undefined;
};
/**
 * @typedef {object} XPathTransformerConfig
 * @property {boolean} [errorOnEqualPriority] Throw on equal priority
 * @property {import('./index.js').
 *   XPathTemplateArray} templates Template objects
 * @property {number} [xpathVersion] XPath version (1|2)
 */
/**
 * Applies named XPath-driven templates to XML/HTML DOM data.
 *
 * Finds templates whose `path` XPath matches the current node (plus optional
 * `mode`), sorts by priority, and invokes the winning template.
 * Falls back to default rules when no template matches.
 */
declare class XPathTransformer {
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
     * @param {XPathTransformerConfig &
     *   import('./XPathTransformerContext.js').
     *   XPathTransformerContextConfig} config Configuration
     */
    constructor(config: XPathTransformerConfig & import("./XPathTransformerContext.js").XPathTransformerContextConfig);
    _config: XPathTransformerConfig & import("./XPathTransformerContext.js").XPathTransformerContextConfig;
    /** @type {any[]} */
    rootTemplates: any[];
    /** @type {import('./index.js').XPathTemplateObject[]} */
    templates: import("./index.js").XPathTemplateObject[];
    /**
     * @returns {void}
     */
    _triggerEqualPriorityError(): void;
    /**
     * @param {string} [mode] Transformation mode
     * @returns {any} Result of transformation
     */
    transform(mode?: string): any;
}
//# sourceMappingURL=XPathTransformer.d.ts.map