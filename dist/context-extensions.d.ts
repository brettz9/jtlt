/**
 * Consumer-augmentable registry of the helper methods/values added to a
 * template context through the `extensions` option.
 *
 * `extensions` are merged onto the `this` seen inside templates at runtime,
 * but TypeScript cannot see them unless they are declared here. Augment this
 * interface with declaration merging so calls like `this.myHelper()` inside a
 * template type-check without suppressions:
 *
 * @example
 * ```ts
 * declare module 'jtlt/context-extensions' {
 *   interface ContextExtensions {
 *     myHelper (): void;
 *   }
 * }
 * ```
 *
 * Leaving it un-augmented keeps templates strict: an undeclared `this.foo()`
 * is still a type error.
 *
 * Intentionally empty; consumers populate it via declaration merging.
 */
export interface ContextExtensions {}
