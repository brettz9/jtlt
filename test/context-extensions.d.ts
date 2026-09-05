import '../src/context-extensions.js';

/**
 * Test-only augmentation mirroring what a consumer of the published package
 * writes against `'jtlt/context-extensions'`. Registers the helpers that
 * `test.context.extensions.js` passes through the `extensions` option so
 * `this.<helper>()` inside its templates type-checks without suppressions.
 */
declare module '../src/context-extensions.js' {
  interface ContextExtensions {
    wrapTitle (): void;
    markRan (): boolean;
  }
}
