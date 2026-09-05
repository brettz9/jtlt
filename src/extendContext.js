/**
 * Merges `extensions` onto a template context instance so templates can
 * invoke them as `this.myHelper()`. Shared by JSONPathTransformerContext
 * and XPathTransformerContext.
 * @param {object} context - The context instance to extend
 * @param {Record<string, unknown>} extensions - Extra methods/values
 * @returns {void}
 */
export default function applyExtensions (context, extensions) {
  for (const key of Object.keys(extensions)) {
    if (key in context) {
      throw new Error(
        `Extension property "${key}" conflicts with an existing ` +
        'context property.'
      );
    }
  }
  Object.assign(context, extensions);
}
