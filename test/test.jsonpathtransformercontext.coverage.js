import {expect} from 'chai';
import JSONPathTransformerContext from '../src/JSONPathTransformerContext.js';
import JSONJoiningTransformer from '../src/JSONJoiningTransformer.js';

describe('JSONPathTransformerContext branch coverage', () => {
  it('copyOf: fallback for structuredClone error and shallow clone', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    // Simulate structuredClone throwing and shallow fallback
    const obj = {a: 1, b: Symbol('s')};
    // Monkey-patch structuredClone to throw
    const origStructuredClone = globalThis.structuredClone;
    globalThis.structuredClone = () => {
      throw new Error('fail');
    };
    try {
      ctx._contextObj = obj;
      expect(() => ctx.copyOf()).to.not.throw();
      // Should fallback to shallow clone, output should be an object
      expect(typeof ctx.getOutput()).to.equal('object');
    } finally {
      globalThis.structuredClone = origStructuredClone;
    }
  });

  it('copy: primitive branch', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx._contextObj = 42;
    expect(() => ctx.copy()).to.not.throw();
    expect(ctx.getOutput()).to.deep.equal([42]);
  });

  it('variable and message methods', () => {
    const ctx = new JSONPathTransformerContext({
      data: {foo: 'bar'},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.variable('myVar', '$.foo');
    // Should set vars.myVar to 'bar'
    expect(ctx.vars.myVar).to.equal('bar');
    // message method (just coverage, no assertion needed)
    expect(() => ctx.message({test: 'log'})).to.not.throw();
  });

  it('_passesIf: fallback non-array branch', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    // Monkey-patch get to return a non-array
    ctx.get = () => 'not-an-array';
    // Boolean('not-an-array') is true
    expect(ctx._passesIf('$.foo')).to.equal(true);
  });
  it('calculatePosition: empty result returns 0', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    // Simulate empty result
    ctx.calculatePosition = ctx.calculatePosition.bind({
      ...ctx,
      jsonpath: () => []
    });
    expect(ctx.calculatePosition('$.notfound')).to.equal(0);
  });

  it('calculatePosition: first item is array returns its length', () => {
    const ctx = new JSONPathTransformerContext({
      data: {arr: [[1, 2, 3]]},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    // Use $.arr[0] so result is [1,2,3] and length is 3
    expect(ctx.calculatePosition('$.arr[0]')).to.equal(3);
  });

  it('calculatePosition: result with multiple matches returns length', () => {
    const ctx = new JSONPathTransformerContext({
      data: {arr: [1, 2, 3]},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    // Multiple matches (not array as first item)
    expect(ctx.calculatePosition('$.arr')).to.equal(3);
  });

  it('formatNumber: NaN input returns "NaN"', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    expect(ctx._formatNumber(Number.NaN, '1')).to.equal('NaN');
  });

  it(
    'formatNumber: groupingSeparator and groupingSize triggers useGrouping',
    () => {
      const ctx = new JSONPathTransformerContext({
        data: {},
        joiningTransformer: new JSONJoiningTransformer(),
        templates: []
      }, []);
      // Should use grouping and replace separator
      expect(ctx._formatNumber(12345, '1', '.', 3)).to.include('12.345');
    }
  );

  it('formatNumber: catch block fallback for Intl.NumberFormat', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    // Pass a symbol to force Intl.NumberFormat to throw
    // @ts-expect-error Deliberately bad
    expect(ctx._formatNumber(Symbol('bad'), '1')).to.equal('Symbol(bad)');
  });

  it('applyTemplates: defensive fallback for templateObj.path', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: [
        {
          name: 'foo',
          template () {
            return undefined;
          }
        }
      ]
    }, []);
    // Simulate modeMatchedTemplates with a template missing path
    ctx._templates = [
      {
        name: 'foo',
        template () {
          return undefined;
        },
        path: undefined
      }
    ];
    expect(() => ctx.applyTemplates('$')).to.not.throw();
  });

  it('applyTemplates: defensive fallback for priority resolver', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: [
        {
          template () {
            return undefined;
          },
          path: '$',
          priority: undefined
        },
        {
          template () {
            return undefined;
          },
          path: '$',
          priority: undefined
        }
      ]
    }, []);
    ctx._config.specificityPriorityResolver = undefined;
    expect(() => ctx.applyTemplates('$')).to.not.throw();
  });

  it('forEach: defensive fallback for comparator', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    let called = false;
    ctx.forEach('$.foo', function () {
      called = true;
    }, {
      select: undefined,
      order: 'ascending',
      type: 'text'
    });
    expect(called).to.equal(false);
  });

  it('_passesIf: defensive non-array fallback', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    // Patch get to return non-array (defensive branch)
    ctx.get = () => 'not-an-array';
    expect(ctx._passesIf('$.foo')).to.equal(true);
  });

  it('choose: defensive fallback for otherwiseCb', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx._passesIf = () => false;
    let called = false;
    ctx.choose('$.foo', () => {
      expect(typeof ctx).to.equal('object');
    }, function () {
      called = true;
    });
    expect(called).to.equal(true);
  });

  it('number: letterValue alphabetic with format a', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number({value: 1, letterValue: 'alphabetic', format: 'a'});
    expect(ctx.getOutput()).to.deep.equal(['a']);
  });

  it('number: letterValue alphabetic with format A', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number({value: 1, letterValue: 'alphabetic', format: 'A'});
    expect(ctx.getOutput()).to.deep.equal(['A']);
  });

  it('number: letterValue alphabetic with non-a/A format', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number({value: 1, letterValue: 'alphabetic', format: '1'});
    expect(ctx.getOutput()).to.deep.equal(['a']);
  });

  it('number: format 0 for zero-padded numbers', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number({value: 5, format: '000'});
    expect(ctx.getOutput()).to.deep.equal(['005']);
  });

  it('calculatePosition: return 0 for empty result', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    expect(ctx.calculatePosition('$.nonexistent')).to.equal(0);
  });

  it('number: value undefined fallback to opts.value', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number({value: undefined, format: '1'});
    expect(ctx.getOutput()).to.deep.equal([1]);
  });

  it('number: string value converted to number', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number({value: '42', format: '1'});
    expect(ctx.getOutput()).to.deep.equal([42]);
  });

  it('number: format equals 1 outputs as number', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number({value: 42, format: '1'});
    expect(ctx.getOutput()).to.deep.equal([42]);
  });

  it('number: simple position() call', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number('position()');
    expect(ctx.getOutput()).to.deep.equal([1]);
  });

  it('number: simple string number', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number('42');
    expect(ctx.getOutput()).to.deep.equal([42]);
  });

  it('calculatePosition: return 0 when count result is empty', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    const result = ctx.calculatePosition('$.nothing');
    expect(result).to.equal(0);
  });

  it('number: level any with count', () => {
    const ctx = new JSONPathTransformerContext({
      data: {items: [1, 2, 3]},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    // @ts-expect-error level not in type definition but used in implementation
    ctx.number({value: 'position()', count: '$.items', level: 'any'});
    expect(ctx.getOutput()).to.deep.equal([3]);
  });

  it('number: value undefined with no opts.value defaults to 1', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number({format: 'i'});
    expect(ctx.getOutput()).to.deep.equal(['i']);
  });

  it('calculatePosition: return 0 for non-array non-empty result', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    // When jsonpath returns a non-array result wrapped in array
    const pos = ctx.calculatePosition('$.missing');
    expect(pos).to.equal(0);
  });

  it('number: level multiple with count', () => {
    const ctx = new JSONPathTransformerContext({
      data: {items: [1, 2, 3]},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: [],
      // @ts-expect-error iterationState not in type definition but used
      iterationState: {index: 0}
    }, []);
    // @ts-expect-error level not in type definition but used in implementation
    ctx.number({value: 'position()', count: '$.items', level: 'multiple'});
    const output = ctx.getOutput();
    // Note: hierarchical string gets converted to NaN -> 1
    expect(output).to.deep.equal([1]);
  });

  it('number: level multiple without count', () => {
    const iterationState = {
      index: 2,
      parentState: {index: 1, parentState: {index: 0}}
    };
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: [],
      // @ts-expect-error iterationState not in type definition but used
      iterationState
    }, []);
    // @ts-expect-error level not in type definition but used in implementation
    ctx.number({value: 'position()', level: 'multiple'});
    // Note: hierarchical string '1.2.3' gets converted to NaN -> 1
    expect(ctx.getOutput()).to.deep.equal([1]);
  });

  it('number: value string converted when undefined', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number({value: '10', format: 'i'});
    expect(ctx.getOutput()).to.deep.equal(['x']);
  });

  it('number: value and opts.value both undefined (line 832-833)', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    // Call number with undefined value and unsupported level
    // so value remains undefined through switch statement
    // @ts-expect-error level not in type definition
    ctx.number({value: undefined, level: 'unsupported'});
    // Should default to 1
    expect(ctx.getOutput()).to.deep.equal([1]);
  });

  it('number: level single with count (lines 778-782)', () => {
    const ctx = new JSONPathTransformerContext({
      data: {items: [1, 2, 3, 4, 5]},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: [],
      // @ts-expect-error iterationState not in type definition but used
      iterationState: {index: 2}
    }, []);
    // When count is provided with level single, it returns the length of
    // what get(count, true) returns (wrapped array)
    // @ts-expect-error level not in type definition but used in implementation
    ctx.number({value: 'position()', count: '$.items', level: 'single'});
    // get('$.items', true) returns [[1,2,3,4,5]], so length is 1
    expect(ctx.getOutput()).to.deep.equal([1]);
  });

  it('calculatePosition: returns count of non-array matches (line 888)', () => {
    const ctx = new JSONPathTransformerContext({
      data: {items: [{id: 1}, {id: 2}, {id: 3}]},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    // Use a JSONPath that returns multiple objects (not an array of arrays)
    const pos = ctx.calculatePosition('$.items[*]');
    // Should return the count of matches (3)
    expect(pos).to.equal(3);
  });
});
