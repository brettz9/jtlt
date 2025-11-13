import {expect} from 'chai';
import JTLT, {JSONPathTransformer} from '../src/index-node.js';

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

  it(
    'splits root templates and len>1 does not throw by default',
    function () {
      /** @returns {string} */
      const t1 = function () {
        return 'A';
      };
      /** @returns {string} */
      const t2 = function () {
        return 'B';
      };
      const jpt = new JSONPathTransformer(({
        data: {x: 1},
        templates: [
          {name: 'r1', path: '$', template: t1},
          {name: 'r2', path: '$', template: t2}
        ],
        // Minimal joining transformer
        // @ts-expect-error testing
        joiningTransformer: (function () {
          let buf = '';
          return {
            /**
             * @param {any} x
             * @returns {void}
             */
            append (x) {
              buf += String(x ?? '');
            },
            get () {
              return buf;
            }
          };
        }())
      }));
      // rootTemplates should be populated via constructor splice
      expect(Array.isArray(jpt.rootTemplates)).to.equal(true);
      expect(jpt.rootTemplates.length).to.be.greaterThan(0);

      // Default is not to error on equal-priority root templates
      const out = jpt.transform('');
      expect(out).to.be.a('string');
    }
  );

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

  it('maps array-form templates in constructor', function () {
    /** @returns {string} */
    const noop = function () {
      return '';
    };
    const jpt = new JSONPathTransformer(({
      data: {a: 1, b: 2},
      templates: /** @type {any} */ ([
        ['$.a', noop],
        ['$.b', noop]
      ]),
      // @ts-expect-error testing
      joiningTransformer: (function () {
        return {
          append () { /* no-op */ },
          get () {
            return '';
          }
        };
      }())
    }));
    expect(jpt.templates[0]).to.have.property('path', '$.a');
    expect(typeof jpt.templates[0].template).to.equal('function');
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
          function (/** @type {{value: number}} */ item) {
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
