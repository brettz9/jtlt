import {expect} from 'chai';
import JTLT from '../src/index.js';

describe('valueOf in element callbacks', function () {
  it(
    'should close open tag and escape HTML when valueOf is called ' +
    'inside element callback (JSONPath)',
    function () {
      const data = {name: 'World & Friends'};

      /** @type {import('../src/index.js').JSONPathTemplateArray<"string">[]} */
      const templates = [{
        path: '$',
        template () {
          this.element('div', {class: 'test'}, [], function () {
            this.valueOf('$.name');
          });
        }
      }];

      let result;
      JTLT.create({
        data,
        templates,
        outputType: 'string',
        success (output) {
          result = output;
        }
      }).transform();

      expect(result).to.equal('<div class="test">World &amp; Friends</div>');
    }
  );

  it('should escape < characters in valueOf output (JSONPath)', function () {
    const data = {content: '<script>alert(1)</script>'};

    /** @type {import('../src/index.js').JSONPathTemplateArray<"string">[]} */
    const templates = [{
      path: '$',
      template () {
        this.element('p', {}, [], function () {
          this.valueOf('$.content');
        });
      }
    }];

    let result;
    JTLT.create({
      data,
      templates,
      outputType: 'string',
      success (output) {
        result = output;
      }
    }).transform();

    expect(result).to.equal('<p>&lt;script>alert(1)&lt;/script></p>');
  });

  it(
    'should work correctly when valueOf is called outside element (JSONPath)',
    function () {
      const data = {name: 'Test'};

      /** @type {import('../src/index.js').JSONPathTemplateArray<"string">[]} */
      const templates = [{
        path: '$',
        template () {
          this.valueOf('$.name');
        }
      }];

      let result;
      JTLT.create({
        data,
        templates,
        outputType: 'string',
        success (output) {
          result = output;
        }
      }).transform();

      expect(result).to.equal('Test');
    }
  );
});
