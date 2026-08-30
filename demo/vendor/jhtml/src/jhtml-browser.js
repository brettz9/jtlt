import {setWindow} from './jhtml.js';

// eslint-disable-next-line unicorn/no-top-level-side-effects -- Static
setWindow(/** @type {Window & typeof globalThis} */ (globalThis));

export * from './jhtml.js';
