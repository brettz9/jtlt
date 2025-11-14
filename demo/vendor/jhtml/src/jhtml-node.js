import {JSDOM} from 'jsdom';
import {setWindow} from './jhtml.js';

const {window} = new JSDOM();

setWindow(window);

export * from './jhtml.js';
