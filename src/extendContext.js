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
    // eslint-disable-next-line @stylistic/max-len -- Long
    // eslint-disable-next-line unicorn/no-computed-property-existence-check -- Needed
    if (key in context) {
      throw new Error(
        `Extension property "${key}" conflicts with an existing ` +
        'context property.'
      );
    }
  }
  Object.assign(context, extensions);
}
