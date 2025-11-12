/* globals mocha, describe, it -- Should be ESM */
import {expect} from 'chai';

import {jtlt} from '../src/index-browser.js';

describe('jtlt', () => {
  it('performs a string transformation', async () => {
    const result = await jtlt({
      data: new DOMParser().parseFromString(
        `<div type="questions-answers">
          <p n="1">Some text</p>
          <p n="2">More text</p>
        </div>`,
        'text/xml'
      ),
      engineType: 'xpath',
      outputType: 'string',
      templates: [{
        path: '//*[@type="questions-answers"]/p',
        template (p) {
          this.valueOf('@n');
          this.valueOf('./text()');
        }
      }]
    });
    expect(result).to.equal('1Some text2More text');
  });
});

mocha.run();
