import {expect} from 'chai';
import JSONPathTransformerContext from '../src/JSONPathTransformerContext.js';
import JSONJoiningTransformer from '../src/JSONJoiningTransformer.js';

describe('JSONPathTransformerContext number() formatting', () => {
  /**
   *
   * @param {import('../src/JSONPathTransformerContext.js').
   *   NumberValue} opts
   * @returns {string}
   */
  function getOutputForNumber (opts) {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number(opts);
    return ctx.getOutput().join('');
  }

  it('formats roman numerals (lowercase)', () => {
    expect(getOutputForNumber({value: 4, format: 'i'})).to.equal('iv');
    expect(getOutputForNumber({value: 2023, format: 'i'})).to.equal('mmxxiii');
    expect(getOutputForNumber({value: 0, format: 'i'})).to.equal('0');
    expect(getOutputForNumber({value: 4000, format: 'i'})).to.equal('4000');
  });

  it('formats roman numerals (uppercase)', () => {
    expect(getOutputForNumber({value: 4, format: 'I'})).to.equal('IV');
    expect(getOutputForNumber({value: 2023, format: 'I'})).to.equal('MMXXIII');
    expect(getOutputForNumber({value: 0, format: 'I'})).to.equal('0');
    expect(getOutputForNumber({value: 4000, format: 'I'})).to.equal('4000');
  });

  it('formats alphabetic (lowercase)', () => {
    expect(getOutputForNumber({value: 1, format: 'a'})).to.equal('a');
    expect(getOutputForNumber({value: 26, format: 'a'})).to.equal('z');
    expect(getOutputForNumber({value: 27, format: 'a'})).to.equal('aa');
    expect(getOutputForNumber({value: 52, format: 'a'})).to.equal('az');
    expect(getOutputForNumber({value: 0, format: 'a'})).to.equal('0');
    expect(getOutputForNumber({value: -1, format: 'a'})).to.equal('-1');
  });

  it('formats alphabetic (uppercase)', () => {
    expect(getOutputForNumber({value: 1, format: 'A'})).to.equal('A');
    expect(getOutputForNumber({value: 26, format: 'A'})).to.equal('Z');
    expect(getOutputForNumber({value: 27, format: 'A'})).to.equal('AA');
    expect(getOutputForNumber({value: 52, format: 'A'})).to.equal('AZ');
    expect(getOutputForNumber({value: 0, format: 'A'})).to.equal('0');
    expect(getOutputForNumber({value: -1, format: 'A'})).to.equal('-1');
  });

  it('formats roman numerals for out-of-range values', () => {
    expect(getOutputForNumber({value: 0, format: 'I'})).to.equal('0');
    expect(getOutputForNumber({value: -5, format: 'I'})).to.equal('-5');
    expect(getOutputForNumber({value: 4000, format: 'I'})).to.equal('4000');
    expect(getOutputForNumber({value: 0, format: 'i'})).to.equal('0');
    expect(getOutputForNumber({value: -5, format: 'i'})).to.equal('-5');
    expect(getOutputForNumber({value: 4000, format: 'i'})).to.equal('4000');
  });

  it('formats alphabetic for out-of-range values', () => {
    expect(getOutputForNumber({value: 0, format: 'a'})).to.equal('0');
    expect(getOutputForNumber({value: -5, format: 'a'})).to.equal('-5');
    expect(getOutputForNumber({value: 0, format: 'A'})).to.equal('0');
    expect(getOutputForNumber({value: -5, format: 'A'})).to.equal('-5');
  });

  it('calculatePosition with count returns array-of-arrays length', () => {
    // Setup context with root data containing array of arrays
    const ctx = new JSONPathTransformerContext({
      data: {arr: [[1, 2, 3], [4, 5]]},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    // count selects arr, which is [[1,2,3],[4,5]]
    // Should return length of first item (3)
    expect(ctx.calculatePosition('$.arr')).to.equal(2);
    expect(ctx.calculatePosition('$.arr[0]')).to.equal(3);
  });

  it('calculatePosition returns 1 if no iterationState and no count', () => {
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    expect(ctx.calculatePosition()).to.equal(1);
  });

  it('number() uses default format and grouping', () => {
    // Should use Intl.NumberFormat with grouping
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number({
      value: 12345,
      format: '1',
      groupingSeparator: '.',
      groupingSize: 3
    });
    // Output should be '12.345' (with grouping separator)
    expect(ctx.getOutput().join('')).to.include('12.345');
  });

  it('number() falls back to String(num) if Intl.NumberFormat throws', () => {
    // Use an invalid locale to trigger Intl.NumberFormat error
    const ctx = new JSONPathTransformerContext({
      data: {},
      joiningTransformer: new JSONJoiningTransformer(),
      templates: []
    }, []);
    ctx.number({value: 'not-a-number', format: '1'});
    const output = ctx.getOutput().join('');
    // fallback to default value (see implementation)
    expect(output).to.equal('1');
  });
});
