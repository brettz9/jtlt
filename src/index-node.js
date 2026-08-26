import {JSDOM} from 'jsdom';
import JTLT, {setWindow} from './index.js';
export * from './index.js';
export default JTLT;

const {window} = new JSDOM();

// eslint-disable-next-line unicorn/no-top-level-side-effects -- Desired
setWindow(window);
