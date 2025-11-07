import {expect} from 'chai';
import JSONPathTransformerContext from '../src/JSONPathTransformerContext.js';
import JSONJoiningTransformer from '../src/JSONJoiningTransformer.js';

describe('JSONPathTransformerContext copy/copyOf', () => {
  /**
   * Helper to build a context and optionally register property sets.
   * @param {*} data
   * @param {Record<string, object>} [propertySets]
   * @returns {{
   *   ctx: JSONPathTransformerContext,
   *   joiner: JSONJoiningTransformer
   * }}
   */
  function makeCtx (data, propertySets) {
    const joiner = new JSONJoiningTransformer([]);
    const ctx = new JSONPathTransformerContext({
      data,
      joiningTransformer: joiner
    }, []);
    if (propertySets) {
      for (const [name, obj] of Object.entries(propertySets)) {
        ctx.propertySet(name, obj);
      }
    }
    return {ctx, joiner};
  }

  it('copyOf deep copies nested objects', () => {
    const nested = {a: {b: 1}};
    const {ctx, joiner} = makeCtx(nested);
    ctx.copyOf();
    expect(joiner.get()).to.have.length(1);
    const cloned = joiner.get()[0];
    expect(cloned).to.deep.equal(nested);
    nested.a.b = 2; // mutate original
    expect(cloned.a.b).to.equal(1); // deep copy unaffected
  });

  it('copy performs shallow copy (shared nested ref)', () => {
    const nested = {a: {b: 3}};
    const {ctx, joiner} = makeCtx(nested);
    ctx.copy();
    const shallow = joiner.get()[0];
    expect(shallow).to.deep.equal(nested);
    nested.a.b = 4; // change original nested
    expect(shallow.a.b).to.equal(4); // shallow copy reflects change
  });

  it('copy merges property sets into top-level object', () => {
    const base = {x: 1};
    const {ctx, joiner} = makeCtx(base, {ps1: {y: 2}, ps2: {z: 3}});
    ctx.copy(['ps1', 'ps2']);
    const merged = joiner.get()[0];
    expect(merged).to.deep.equal({x: 1, y: 2, z: 3});
  });

  it('copyOf deep copies arrays', () => {
    const arrData = {arr: [1, {n: 5}]};
    const {ctx, joiner} = makeCtx(arrData);
    ctx.copyOf('$.arr');
    const copied = joiner.get()[0];
    expect(copied).to.deep.equal([1, {n: 5}]);
    // Mutate original nested object inside array
    /** @type {{n:number}} */ (arrData.arr[1]).n = 6;
    expect(copied[1].n).to.equal(5); // deep copy unaffected
  });

  it('copy shallow-clones arrays (shared nested ref)', () => {
    const arr = [1, {n: 2}];
    const {ctx, joiner} = makeCtx(arr);
    ctx.copy();
    const cloned = joiner.get()[0];
    expect(cloned).to.deep.equal([1, {n: 2}]);
    // Shallow clone shares nested object reference
    /** @type {{n:number}} */ (arr[1]).n = 3;
    expect(cloned[1].n).to.equal(3);
  });

  it('copy handles primitives unchanged', () => {
    const prim = 42;
    const {ctx, joiner} = makeCtx(prim);
    ctx.copy();
    expect(joiner.get()[0]).to.equal(42);
    ctx.copyOf();
    expect(joiner.get()[1]).to.equal(42);
  });

  it('copyOf on path selecting primitive', () => {
    const data = {num: 9};
    const {ctx, joiner} = makeCtx(data);
    ctx.copyOf('$.num');
    expect(joiner.get()[0]).to.equal(9);
  });

  it('copy with non-existent property sets ignores gracefully', () => {
    const data = {a: 1};
    const {ctx, joiner} = makeCtx(data, {psReal: {b: 2}});
    ctx.copy(['psMissing', 'psReal']);
    const out = joiner.get()[0];
    expect(out).to.deep.equal({a: 1, b: 2});
  });

  it('copyOf handles functions (may retain or reference)', () => {
    const data = {fn: () => 1, o: {v: 2}};
    const {ctx, joiner} = makeCtx(data);
    ctx.copyOf();
    const copied = joiner.get()[0];
    expect(copied.o.v).to.equal(2);
    expect(typeof copied.fn).to.equal('function');
  });

  it('copyOf shallow-falls back on symbol properties (no functions)', () => {
    const data = {o: {v: 2}, s: Symbol('x')};
    const {ctx, joiner} = makeCtx(data);
    ctx.copyOf();
    const copied = joiner.get()[0];
    expect(copied.o.v).to.equal(2);
    expect(typeof copied.s).to.equal('symbol');
  });

  it('copyOf uses shallow path when structuredClone missing', () => {
    const data = {x: {y: 1}};
    const {ctx, joiner} = makeCtx(data);
    const oldSC = /** @type {any} */ (globalThis).structuredClone;
    // Remove structuredClone to force else branch in initial try
    /** @type {any} */ (globalThis).structuredClone = undefined;
    try {
      ctx.copyOf();
    } finally {
      /** @type {any} */ (globalThis).structuredClone = oldSC;
    }
    const copied = joiner.get()[0];
    expect(copied).to.deep.equal({x: {y: 1}});
  });

  it('copyOf shallow-path covers array when structuredClone missing', () => {
    const data = [1, {y: 2}];
    const {ctx, joiner} = makeCtx(data);
    const oldSC = /** @type {any} */ (globalThis).structuredClone;
    /** @type {any} */ (globalThis).structuredClone = undefined;
    try {
      ctx.copyOf();
    } finally {
      /** @type {any} */ (globalThis).structuredClone = oldSC;
    }
    const copied = joiner.get()[0];
    expect(copied).to.deep.equal([1, {y: 2}]);
    // Prove shallow path by mutating original nested object
    /** @type {{y:number}} */ (data[1]).y = 9;
    expect(copied[1].y).to.equal(9);
  });

  it('copy/copyOf handle function context', () => {
    // Root context is a function; both methods should append it as-is
    /**
     * Test function root context.
     * @returns {number}
     */
    function fn () {
      return 7;
    }
    const {ctx, joiner} = makeCtx(fn);
    ctx.copy();
    ctx.copyOf();
    const out = joiner.get();
    expect(typeof out[0]).to.equal('function');
    expect(typeof out[1]).to.equal('function');
    // Ensure they are callable and identical by name/source
    expect(String(out[0])).to.equal(String(fn));
    expect(String(out[1])).to.equal(String(fn));
  });
});
