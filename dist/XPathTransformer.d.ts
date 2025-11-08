export default XPathTransformer;
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
     * @param {object} config Configuration
     * @param {boolean} [config.errorOnEqualPriority] Throw on equal priority
     * @param {any[]} config.templates Template objects
     * @param {number} [config.xpathVersion] XPath version (1|2)
     */
    constructor(config: {
        errorOnEqualPriority?: boolean | undefined;
        templates: any[];
        xpathVersion?: number | undefined;
    });
    _config: {
        errorOnEqualPriority?: boolean | undefined;
        templates: any[];
        xpathVersion?: number | undefined;
    };
    /** @type {any[]} */
    rootTemplates: any[];
    templates: any[];
    /**
     * @returns {void}
     */
    _triggerEqualPriorityError(): void;
    /**
     * @param {string} mode Transformation mode
     * @returns {any} Result of transformation
     */
    transform(mode: string): any;
}
//# sourceMappingURL=XPathTransformer.d.ts.map