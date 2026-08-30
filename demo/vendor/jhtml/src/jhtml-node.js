import {JSDOM} from 'jsdom';
import {setWindow} from './jhtml.js';

const {window} = new JSDOM();

// eslint-disable-next-line unicorn/no-top-level-side-effects -- Static
setWindow(window);

export * from './jhtml.js';
