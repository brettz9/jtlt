export type NodeKind = 'text' | 'element' | 'operation';
export type ReadTarget = {
    db: string;
    store: string;
};
/**
 * Statically derive the `{db, store}` targets a declarative template's
 * `$indexedDB` nodes touch (ROUTE-OVERRIDES-PLAN.md §3.4, §13 decision 4)
 * — for a route override's data-access checks and its `reads` field. Total:
 * an `$indexedDB` node whose `db`/`store` isn't a literal string is
 * reported as an error rather than silently omitted from `reads` — the
 * whole point is to drive a data-access allowlist, so an unresolvable
 * target must never be mistaken for "no read happens here". Duplicate
 * targets are deduplicated.
 * @param {unknown[]} nodes
 * @returns {{reads: ReadTarget[], errors: string[]}}
 */
export declare function extractReads(nodes: unknown[]): {
    reads: ReadTarget[];
    errors: string[];
};
/**
 * Non-executing structural check for a declarative template. Unlike
 * `compileJSONTemplate`, this never throws — it reports every problem it
 * finds, for a "validate before save" editor workflow. Includes the
 * `extractReads()` check (an unresolvable `$indexedDB` target is a
 * validation error, not just a `reads` omission).
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