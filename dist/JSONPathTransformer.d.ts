export default JSONPathTransformer;
/**
 * Applies named JSONPath-driven templates to JSON data.
 *
 * This engine finds templates whose `path` match the current node (plus an
 * optional `mode`), sorts by priority, and invokes the winning template.
 * If no template matches, built-in default rules emulate XSLT-like behavior
 * for objects, arrays, scalars, etc.
 * @template T
 */
declare class JSONPathTransformer<T> {
    /**
     * @param {string} select - JSONPath selector
     * @returns {string} Absolute JSONPath
     */
    static makeJSONPathAbsolute(select: string): string;
    static DefaultTemplateRules: {
        transformRoot: {
            /**
             * @template U
             * @this {JSONPathTransformerContext<U>}
             * @param {any} value - Value
             * @param {{mode?: string}} cfg - Configuration
             * @returns {void}
             */
            template<U>(this: JSONPathTransformerContext<U>, value: any, cfg: {
                mode?: string;
            }): void;
        };
        transformPropertyNames: {
            /**
             * @param {any} value - Current context value
             * @returns {any}
             */
            template(value: any): any;
        };
        transformObjects: {
            /**
             * @this {JSONPathTransformerContext}
             * @param {any} value - Value
             * @param {{mode?: string}} cfg - Configuration
             * @returns {void}
             */
            template(this: JSONPathTransformerContext<"json">, value: any, cfg: {
                mode?: string;
            }): void;
        };
        transformArrays: {
            /**
             * @this {JSONPathTransformerContext}
             * @param {any} value - Value
             * @param {{mode?: string}} cfg - Configuration
             * @returns {void}
             */
            template(this: JSONPathTransformerContext<"json">, value: any, cfg: {
                mode?: string;
            }): void;
        };
        transformScalars: {
            /**
             * @this {JSONPathTransformerContext}
             * @returns {JSONPathTransformerContext}
             */
            template(this: JSONPathTransformerContext<"json">): JSONPathTransformerContext;
        };
        transformFunctions: {
            /**
             * @param {( ...args: any[]) => any} value - Function at current context
             * @returns {any}
             */
            template(value: (...args: any[]) => any): any;
        };
    };
    /**
     * @param {import('./JSONPathTransformerContext.js').
     *   JSONPathTransformerContextConfig<T>} config - Configuration object
     */
    constructor(config: import("./JSONPathTransformerContext.js").JSONPathTransformerContextConfig<T>);
    _config: import("./JSONPathTransformerContext.js").JSONPathTransformerContextConfig<T>;
    /** @type {import('./index.js').JSONPathTemplateObject<T>[]} */
    rootTemplates: import("./index.js").JSONPathTemplateObject<T>[];
    templates: import("./index.js").JSONPathTemplateObject<T>[];
    /**
     * @returns {void}
     */
    _triggerEqualPriorityError(): void;
    /**
     * @param {string} [mode] - Transformation mode
     * @returns {any} The transformation result
     */
    transform(mode?: string): any;
}
import JSONPathTransformerContext from './JSONPathTransformerContext.js';
//# sourceMappingURL=JSONPathTransformer.d.ts.map