import {expect} from 'chai';
import {jtlt} from '../src/index-node.js';

describe('`applyTemplates`', () => {
  it('`applyTemplates`', async () => {
    const data = {
      a: 5,
      b: {
        c: 7
      }
    };

    const result = await jtlt({
      data,
      engineType: 'jsonpath',
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.applyTemplates('$.b');
          }
        },
        ['$.b', function (o) {
          this.string(String(/** @type {{c: 7}} */ (o).c));
        }]
      ]
    });

    expect(result).to.equal('7');
  });
});
