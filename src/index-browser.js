import JTLT, {setWindow} from './index.js';
export * from './index.js';
export default JTLT;

// eslint-disable-next-line unicorn/no-top-level-side-effects -- Desired
setWindow(globalThis);
