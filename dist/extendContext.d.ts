/**
 * Merges `extensions` onto a template context instance so templates can
 * invoke them as `this.myHelper()`. Shared by JSONPathTransformerContext
 * and XPathTransformerContext.
 * @param {object} context - The context instance to extend
 * @param {Record<string, unknown>} extensions - Extra methods/values
 * @returns {void}
 */
export default function applyExtensions(context: object, extensions: Record<string, unknown>): void;
//# sourceMappingURL=extendContext.d.ts.map