import {expect} from 'chai';
import JTLT, {JSONPathTransformer} from '../src/index.js';

// Helper to run a JTLT transform with minimal config
/**
 * @param {null|boolean|number|string|object} data
 * @param {import('../src/index.js').JSONPathTemplateArray<any>[]} templates
 * @returns {string}
 */
function runStringTransform (data, templates) {
  /** @type {string} */
  let result = '';
  // Use a classic function for lint preference
  const jtlt = new JTLT({
    data,
    templates,
    outputType: 'string',
    /**
     * @param {string} r
     * @returns {void}
     */
    success (r) {
      result = r;
    }
  });
  // autostart by default; transform already run
  return result;
}

describe('JSONPathTransformer additional coverage', function () {
  it('throws on duplicate template names in constructor', function () {
    expect(() => {
      // Only constructing should trigger the duplicate name check
      // Provide minimal template objects with duplicate names
      // Path/template presence isn't required for the check
      // but include a noop template to avoid other issues
      /**
       * @returns {undefined}
       */
      function noop () {
        return undefined;
      }
      // @ts-expect-error Only supplying needed arguments
      return new JSONPathTransformer({
        templates: [
          {name: 'dup', path: '$.a', template: noop},
          {name: 'dup', path: '$.b', template: noop}
        ]
      });
    }).to.throw('Templates must all have different names.');
  });

  it('errors on equal-priority root templates when configured', function () {
    const noop = function () {
      return '';
    };
    const jpt = new JSONPathTransformer(({
      errorOnEqualPriority: true,
      data: {x: 1},
      // Two root templates ('$') implies equal priority for root
      templates: [
        {name: 'r1', path: '$', template: noop},
        {name: 'r2', path: '$', template: noop}
      ],
      // Minimal joining transformer to satisfy context construction
      // @ts-expect-error Testing
      joiningTransformer: (function () {
        let sink;
        return {
          /**
           * @param {any} x
           */
          append (x) {
            // Assign locally to avoid empty method lint while not
            // polluting the object type
            sink = x;
          },
          get () {
            return '';
          }
        };
      }())
    }));
    // Force multiple root templates to trigger the engine's
    // own equal-priority check at root level
    jpt.rootTemplates = [
      {path: '', template: noop},
      {path: '', template: noop}
    ];
    const thrower = () => jpt.transform('');
    expect(thrower).to.throw('templates of equal priority');
  });

  it('makeJSONPathAbsolute normalizes selectors correctly', function () {
    // When missing '$' prefix
    expect(JSONPathTransformer.makeJSONPathAbsolute('a.b')).to.equal('$.a.b');
    // When starting with bracket
    const abs = JSONPathTransformer.makeJSONPathAbsolute("['a']");
    expect(abs).to.equal("$['a']");
    // Already absolute remains unchanged
    expect(JSONPathTransformer.makeJSONPathAbsolute('$.a.b')).to.equal('$.a.b');
  });

  it('property-names (~) default rule emits concatenated keys', function () {
    const data = {obj: {a: 1, b: 2, c: 3}};
    const templates =
      /**
       * @type {import('../src/index.js').JSONPathTemplateArray<"string">[]}
       */ ([
        ['$', function () {
          this.applyTemplates('$.obj~');
        }]
      ]);
    const out = runStringTransform(data, templates);
    // Order of Object.keys is insertion order for string keys in modern engines
    expect(out).to.equal('abc');
  });

  it('default function rule returns function result', function () {
    const data = {fn: () => 'OK'};
    const templates =
      /** @type {import('../src/index.js').JSONPathTemplateArray<"string">[]} */
      ([
        ['$', function () {
          this.applyTemplates('$.fn');
        }]
      ]);
    const out = runStringTransform(data, templates);
    expect(out).to.equal('OK');
  });

  it('property-names on non-object returns empty string', function () {
    const data = 'justAString';
    const templates =
    /** @type {import('../src/index.js').JSONPathTemplateArray<"string">[]} */
      ([
        ['$', function () {
          this.applyTemplates('$~');
        }]
      ]);
    const out = runStringTransform(data, templates);
    expect(out).to.equal('');
  });

  it('set() modifies parent object', function () {
    const data = {items: [{value: 10}, {value: 20}]};
    const templates =
    /** @type {import('../src/index.js').JSONPathTemplateArray<"string">[]} */
      ([
        ['$', function () {
          this.applyTemplates('$.items[*]');
          // After templates run, check if items were modified
          this.plainText(JSON.stringify(data.items));
        }],
        ['$.items[*]',
          function (item) {
            // Use set() to modify the value in parent array
            this.set({value: item.value * 2, modified: true});
          }]
      ]);
    const out = runStringTransform(data, templates);
    // Check that the data was modified by set()
    expect(out).to.include('"modified":true');
    expect(data.items[0].value).to.equal(20); // 10 * 2
    expect(data.items[1].value).to.equal(40); // 20 * 2
  });
});
