import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {jtlt} from '../src/index.js';
import XPathTransformerContext from '../src/XPathTransformerContext.js';
import DOMJoiningTransformer from '../src/DOMJoiningTransformer.js';

/**
 * `this.if()` / `choose()` / `assert()` accept a simple, non-`eval`-based
 * binary comparison as their test: `<ref> <op> <literal>`, where the left
 * side is a bare `$name` parameter reference (or, for the JSONPath engine, a
 * plain dotted/indexed `$...` path), the operator is one of
 * `===`, `!==`, `==`, `!=`, `<`, `<=`, `>`, `>=`, and the right side is a
 * string, number, boolean, or `null` literal.
 */
describe('this.if() simple comparison operators', function () {
  describe('JSONPath engine', function () {
    /**
     * @param {Record<string, unknown>} params
     * @param {(this: import(
     *   '../src/JSONPathTransformerContext.js').default<"string">
     * ) => void} tmpl
     * @param {Record<string, unknown>} [data]
     * @returns {Promise<string>}
     */
    const render = (params, tmpl, data = {}) => jtlt({
      data,
      outputType: 'string',
      params,
      templates: [{path: '$', template: tmpl}]
    });

    it('compares a $param against a string literal with ===', async () => {
      expect(await render({name: 'Ada'}, function () {
        this.if('$name === "Ada"', () => this.string('match'));
      })).to.equal('match');
      expect(await render({name: 'Bob'}, function () {
        this.if('$name === "Ada"', () => this.string('match'));
      })).to.equal('');
    });

    it('honors a single-quoted string literal', async () => {
      expect(await render({name: 'Ada'}, function () {
        this.if("$name === 'Ada'", () => this.string('yes'));
      })).to.equal('yes');
    });

    it('supports !== / != inequality', async () => {
      expect(await render({name: 'Bob'}, function () {
        this.if('$name !== "Ada"', () => this.string('ne'));
      })).to.equal('ne');
      expect(await render({name: 'Ada'}, function () {
        this.if('$name != "Ada"', () => this.string('ne'));
      })).to.equal('');
    });

    it('compares a numeric $param with < <= > >=', async () => {
      const fires = (age, cond) => render({age}, function () {
        this.if(cond, () => this.string('hit'));
      });
      expect(await fires(30, '$age < 50')).to.equal('hit');
      expect(await fires(70, '$age < 50')).to.equal('');
      expect(await fires(50, '$age <= 50')).to.equal('hit');
      expect(await fires(51, '$age > 50')).to.equal('hit');
      expect(await fires(50, '$age >= 50')).to.equal('hit');
    });

    it('does loose == / != against a string-ish literal', async () => {
      expect(await render({n: 5}, function () {
        this.if('$n == "5"', () => this.string('loose'));
      })).to.equal('loose');
      expect(await render({n: 5}, function () {
        this.if('$n === "5"', () => this.string('strict'));
      })).to.equal('');
    });

    it('compares against boolean, null, and undefined literals', async () => {
      expect(await render({flag: true}, function () {
        this.if('$flag === true', () => this.string('t'));
      })).to.equal('t');
      expect(await render({flag: false}, function () {
        this.if('$flag === false', () => this.string('f'));
      })).to.equal('f');
      expect(await render({val: null}, function () {
        this.if('$val === null', () => this.string('n'));
      })).to.equal('n');
      expect(await render({val: undefined}, function () {
        this.if('$val === undefined', () => this.string('u'));
      })).to.equal('u');
      expect(await render({val: null}, function () {
        this.if('$val == undefined', () => this.string('loose'));
      })).to.equal('loose');
      expect(await render({}, function () {
        this.if('$.missing !== undefined', () => this.string('x'));
        this.string('ok');
      })).to.equal('ok');
    });

    it('compares a $.path against a literal', async () => {
      expect(await render({}, function () {
        this.if('$.price < 50', () => this.string('cheap'));
      }, {price: 30})).to.equal('cheap');
      expect(await render({}, function () {
        this.if('$.user.name === "Ada"', () => this.string('ada'));
      }, {user: {name: 'Ada'}})).to.equal('ada');
      expect(await render({}, function () {
        this.if('$.items[0] === "x"', () => this.string('first'));
      }, {items: ['x', 'y']})).to.equal('first');
    });

    it('reads a param declared with param() or supplied via withParam()',
      async () => {
        const out = await jtlt({
          data: {},
          outputType: 'string',
          templates: [
            {path: '$', template () {
              this.withParam('viaWith', {value: 7});
              this.callTemplate('t');
            }},
            {name: 't', template () {
              this.param('viaParam', {value: 'y'});
              this.if('$viaParam === "y"', () => this.string('P'));
              this.if('$viaWith < 10', () => this.string('W'));
            }}
          ]
        });
        expect(out).to.equal('PW');
      });

    it('choose() routes on a comparison', async () => {
      const fires = (age) => render({age}, function () {
        this.choose(
          '$age >= 18',
          () => this.string('adult'),
          () => this.string('minor')
        );
      });
      expect(await fires(20)).to.equal('adult');
      expect(await fires(10)).to.equal('minor');
    });

    it('assert() passes a true comparison and throws on a false one',
      async () => {
        await render({count: 3}, function () {
          this.assert('$count > 0', 'must be positive');
        });
        let err;
        try {
          await render({count: 0}, function () {
            this.assert('$count > 0', 'must be positive');
          });
        } catch (e) {
          err = e;
        }
        expect(/** @type {Error} */ (err).message).to.match(/must be positive/v);
      });

    it('leaves a JSONPath filter expression containing < untouched',
      async () => {
        const out = await render({}, function () {
          this.if(
            '$.store.book[?(@.price < 10)]', () => this.string('has-cheap')
          );
        }, {store: {book: [{price: 5}, {price: 20}]}});
        expect(out).to.equal('has-cheap');
      });

    it('an unknown $name path compares as undefined (no throw)', async () => {
      const out = await render({}, function () {
        this.if('$.missing === "x"', () => this.string('nope'));
        this.string('ok');
      });
      expect(out).to.equal('ok');
    });

    it('leaves the test to the JSONPath engine when the right side is not ' +
      'a recognized literal', async () => {
      const out = await render({a: 1, b: 2}, function () {
        // `$b` is not a string/number/boolean/null literal, so this is not
        // treated as a simple comparison.
        this.if('$a === $b', () => this.string('cmp'));
        this.if('$a === somebareword', () => this.string('bare'));
        this.string('done');
      });
      expect(out).to.equal('done');
    });
  });

  describe('XPath engine', function () {
    /**
     * @param {Record<string, unknown>} params
     * @param {(this: import(
     *   '../src/XPathTransformerContext.js').default
     * ) => void} tmpl
     * @param {string} [xml]
     * @returns {string}
     */
    const render = (params, tmpl, xml = '<root/>') => {
      const doc = new JSDOM(xml, {contentType: 'text/xml'}).window.document;
      const joiner = DOMJoiningTransformer.create(
        doc.createDocumentFragment(), {document: doc}
      );
      const ctx = new XPathTransformerContext({
        data: doc.documentElement, joiningTransformer: joiner, params
      }, [{name: 't', template: tmpl}]);
      ctx.callTemplate('t');
      return joiner.get().textContent || '';
    };

    it('compares a $param against a string literal', () => {
      expect(render({name: 'Ada'}, function () {
        this.if('$name === "Ada"', () => this.string('yes'));
      })).to.equal('yes');
      expect(render({name: 'Bob'}, function () {
        this.if('$name === "Ada"', () => this.string('yes'));
      })).to.equal('');
    });

    it('honors a single-quoted string literal', () => {
      expect(render({name: 'Ada'}, function () {
        this.if("$name === 'Ada'", () => this.string('yes'));
      })).to.equal('yes');
    });

    it('compares against boolean, null, and undefined literals', () => {
      expect(render({flag: true}, function () {
        this.if('$flag === true', () => this.string('t'));
      })).to.equal('t');
      expect(render({flag: false}, function () {
        this.if('$flag === false', () => this.string('f'));
      })).to.equal('f');
      expect(render({val: null}, function () {
        this.if('$val === null', () => this.string('n'));
      })).to.equal('n');
      expect(render({}, function () {
        this.if('$missing === undefined', () => this.string('u'));
      })).to.equal('u');
    });

    it('exercises every comparison operator', () => {
      const fires = (params, cond) => render(params, function () {
        this.if(cond, () => this.string('hit'));
      });
      expect(fires({n: 5}, '$n === 5')).to.equal('hit');
      expect(fires({n: 5}, '$n !== 6')).to.equal('hit');
      expect(fires({n: 5}, '$n == "5"')).to.equal('hit');
      expect(fires({n: 5}, '$n != "6"')).to.equal('hit');
      expect(fires({n: 5}, '$n < 6')).to.equal('hit');
      expect(fires({n: 5}, '$n <= 5')).to.equal('hit');
      expect(fires({n: 5}, '$n > 4')).to.equal('hit');
      expect(fires({n: 5}, '$n >= 5')).to.equal('hit');
    });

    it('leaves the test to the XPath engine when the right side is not a ' +
      'recognized literal', () => {
      expect(render({n: 5}, function () {
        this.if('$n === $other', () => this.string('cmp'));
        this.string('done');
      })).to.equal('done');
    });

    it('choose() and assert() honor a comparison', () => {
      expect(render({age: 20}, function () {
        this.choose(
          '$age >= 18',
          () => this.string('adult'),
          () => this.string('minor')
        );
      })).to.equal('adult');

      expect(() => render({count: 0}, function () {
        this.assert('$count > 0', 'needed');
      })).to.throw(/needed/v);
    });

    it('leaves a native XPath comparison untouched', () => {
      expect(render({}, function () {
        this.if('count(//item) > 0', () => this.string('has'));
      }, '<root><item/></root>')).to.equal('has');
    });
  });
});
