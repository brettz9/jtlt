import {JSDOM} from 'jsdom';
import JTLT, {setWindow} from '../src/index.js';

const {window} = new JSDOM('');
setWindow(window);

describe('forQuery with return values (index.js lines 386-388)', function () {
  it('forQuery function returns value to append (JSONPath)', function () {
    const data = {items: [{x: 1}, {x: 2}, {x: 3}]};
    let out;
    new JTLT({
      data,
      outputType: 'string',
      forQuery: ['$.items[*]', function (arg) {
        // Return a value to trigger the append path
        return `[${/** @type {{x: number}} */ (arg).x}]`;
      }],
      success (result) {
        out = result;
      }
    }).transform();
    // The returned values should be appended
    if (out !== '[1][2][3]') {
      throw new Error(`Expected '[1][2][3]', got '${out}'`);
    }
  });

  it('forQuery function returns value to append (XPath)', function () {
    const {window: w} = new JSDOM(
      '<root><item>A</item><item>B</item><item>C</item></root>'
    );
    const data = w.document;
    let out;
    new JTLT({
      data,
      outputType: 'string',
      engineType: 'xpath',
      forQuery: ['//item/text()', function (arg) {
        // Return a value to trigger the append path
        return `(${arg.nodeValue})`;
      }],
      success (result) {
        out = result;
      }
    }).transform();
    // The returned values should be appended
    if (out !== '(A)(B)(C)') {
      throw new Error(`Expected '(A)(B)(C)', got '${out}'`);
    }
  });
});
