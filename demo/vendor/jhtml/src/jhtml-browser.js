import {setWindow} from './jhtml.js';

setWindow(/** @type {Window & typeof globalThis} */ (globalThis));

export * from './jhtml.js';
