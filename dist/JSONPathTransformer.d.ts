export default JSONPathTransformer;
/**
 * Applies named JSONPath-driven templates to JSON data.
 *
 * This engine finds templates whose `path` match the current node (plus an
 * optional `mode`), sorts by priority, and invokes the winning template.
 * If no template matches, built-in default rules emulate XSLT-like behavior
 * for objects, arrays, scalars, etc.
 */
declare class JSONPathTransformer {
    /**
     * @param {string} select - JSONPath selector
     * @returns {string} Absolute JSONPath
     */
    static makeJSONPathAbsolute(select: string): string;
    static DefaultTemplateRules: {
        transformRoot: {
            /**
             * @param {*} value - Value
             * @param {{mode: string}} cfg - Configuration
             * @returns {void}
             */
            template(value: any, cfg: {
                mode: string;
            }): void;
        };
        transformPropertyNames: {
            /**
             * @param {*} value - Current context value
             * @returns {*}
             */
            template(value: any): any;
        };
        transformObjects: {
            /**
             * @param {*} value - Value
             * @param {{mode: string}} cfg - Configuration
             * @returns {void}
             */
            template(value: any, cfg: {
                mode: string;
            }): void;
        };
        transformArrays: {
            /**
             * @param {*} value - Value
             * @param {{mode: string}} cfg - Configuration
             * @returns {void}
             */
            template(value: any, cfg: {
                mode: string;
            }): void;
        };
        transformScalars: {
            /**
             * @returns {*}
             */
            template(): any;
        };
        transformFunctions: {
            /**
             * @param {Function} value - Function at current context
             * @returns {*}
             */
            template(value: Function): any;
        };
    };
    /**
     * @param {object} config - Configuration object
     * @param {boolean} [config.errorOnEqualPriority] - Whether to error on
     *   equal priority templates
     * @param {any[]} config.templates - Array of template objects
     */
    constructor(config: {
        errorOnEqualPriority?: boolean | undefined;
        templates: any[];
    });
    _config: {
        errorOnEqualPriority?: boolean | undefined;
        templates: any[];
    };
    /** @type {any[]} */
    rootTemplates: any[];
    templates: any[];
    /**
     * @returns {void}
     */
    _triggerEqualPriorityError(): void;
    /**
     * @param {string} mode - Transformation mode
     * @returns {*} The transformation result
     */
    transform(mode: string): any;
}
//# sourceMappingURL=JSONPathTransformer.d.ts.map