import JSONPathTransformerContext from './JSONPathTransformerContext.js';
/**
 * Applies named JSONPath-driven templates to JSON data.
 *
 * This engine finds templates whose `path` match the current node (plus an
 * optional `mode`), sorts by priority, and invokes the winning template.
 * If no template matches, built-in default rules emulate XSLT-like behavior
 * for objects, arrays, scalars, etc.
 * @template {"json"|"string"|"dom"} [T="json"]
 */
declare class JSONPathTransformer<T extends "json" | "string" | "dom" = "json"> {
    _config: import("./JSONPathTransformerContext.js").JSONPathTransformerContextConfig<T>;
    /** @type {import('./index.js').JSONPathTemplateObject<T>[]} */
    rootTemplates: import('./index.js').JSONPathTemplateObject<T>[];
    templates: import("./index.js").JSONPathTemplateObject<T>[];
    static DefaultTemplateRules: {
        transformRoot: {
            /**
             * @template {"json"|"string"|"dom"} U
             * @this {JSONPathTransformerContext<U>}
             * @param {unknown} value - Value
             * @param {{mode?: string}} cfg - Configuration
             * @returns {void}
             */
            template<U extends "json" | "string" | "dom">(this: JSONPathTransformerContext<U>, value: unknown, cfg: {
                mode?: string;
            }): void;
        };
        transformPropertyNames: {
            /**
             * @param {unknown} value - Current context value
             * @returns {unknown}
             */
            template(value: unknown): unknown;
        };
        transformObjects: {
            /**
             * @this {JSONPathTransformerContext}
             * @param {unknown} value - Value
             * @param {{mode?: string}} cfg - Configuration
             * @returns {void}
             */
            template(this: JSONPathTransformerContext, value: unknown, cfg: {
                mode?: string;
            }): void;
        };
        transformArrays: {
            /**
             * @this {JSONPathTransformerContext}
             * @param {unknown} value - Value
             * @param {{mode?: string}} cfg - Configuration
             * @returns {void}
             */
            template(this: JSONPathTransformerContext, value: unknown, cfg: {
                mode?: string;
            }): void;
        };
        transformScalars: {
            /**
             * @this {JSONPathTransformerContext}
             * @returns {JSONPathTransformerContext}
             */
            template(this: JSONPathTransformerContext): JSONPathTransformerContext;
        };
        transformFunctions: {
            /**
             * @param {(...args: unknown[]) => unknown} value - Function at current
             *   context
             * @returns {unknown}
             */
            template(value: (...args: unknown[]) => unknown): unknown;
        };
    };
    /**
     * @param {string} select - JSONPath selector
     * @returns {string} Absolute JSONPath
     */
    static makeJSONPathAbsolute(select: string): string;
    /**
     * @param {import('./JSONPathTransformerContext.js').
     *   JSONPathTransformerContextConfig<T>} config - Configuration object
     */
    constructor(config: import('./JSONPathTransformerContext.js').JSONPathTransformerContextConfig<T>);
    /**
     * @returns {void}
     */
    _triggerEqualPriorityError(): void;
    /**
     * @param {string} [mode] - Transformation mode
     * @returns {import('./index.js').ResultType<T>} The transformation result
     */
    transform(mode?: string): import('./index.js').ResultType<T>;
}
export default JSONPathTransformer;
//# sourceMappingURL=JSONPathTransformer.d.ts.map