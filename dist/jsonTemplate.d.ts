export type NodeKind = 'text' | 'element' | 'operation';
/**
 * Non-executing structural check for a declarative template. Unlike
 * `compileJSONTemplate`, this never throws — it reports every problem it
 * finds, for a "validate before save" editor workflow.
 * @param {unknown[]} nodes
 * @param {{format?: 'json'|'javascript'}} [options]
 * @returns {{valid: boolean, errors: string[]}}
 */
export declare function validateJSONTemplate(nodes: unknown[], { format }?: {
    format?: 'json' | 'javascript';
}): {
    valid: boolean;
    errors: string[];
};
/**
 * @param {unknown} x
 * @returns {x is unknown[]}
 */
export declare function isJSONTemplateNodeArray(x: unknown): x is unknown[];
/**
 * Compile a declarative (jamilih-shaped) node array into a jtlt
 * `TemplateFunction`. Validates the whole tree up front (see
 * `validateJSONTemplate`) and throws on the first problem, rather than
 * failing partway through execution.
 * @param {unknown[]} nodes
 * @param {{format?: 'json'|'javascript'}} [options]
 * @returns {(
 *   this: any, value: unknown, cfg?: {mode?: string}
 * ) => Promise<void>}
 */
export declare function compileJSONTemplate(nodes: unknown[], { format }?: {
    format?: 'json' | 'javascript';
}): (this: any, value: unknown, cfg?: {
    mode?: string;
}) => Promise<void>;
//# sourceMappingURL=jsonTemplate.d.ts.map