/**
 * Merges `extensions` onto a template context instance so templates can
 * invoke them as `this.myHelper()`. Shared by JSONPathTransformerContext
 * and XPathTransformerContext.
 *
 * Also records the registered names on `context._extensionNames` (a `Set`,
 * merged with any already present from an earlier call) — consulted by the
 * declarative interpreter's extension-call nodes (e.g. `{$greet:
 * {select?}}` — see `jsonTemplate.js`) so a declarative `behavior` can only
 * ever invoke names that were actually supplied here, never an
 * arbitrary/built-in context method (`element`, `indexedDB`, etc.) by name.
 * Untrusted, admin-authored declarative source is exactly why this
 * distinction matters — see ROUTE-OVERRIDES-PLAN.md's (idb-manager)
 * "declarative subset" for the threat model this is part of.
 * @param {object} context - The context instance to extend
 * @param {Record<string, unknown>} extensions - Extra methods/values
 * @returns {void}
 */
export default function applyExtensions(context: object, extensions: Record<string, unknown>): void;
//# sourceMappingURL=extendContext.d.ts.map