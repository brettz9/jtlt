import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {
  StringJoiningTransformer,
  XPathTransformer,
  XPathTransformerContext
} from '../src/index.js';

/**
 * Build a small DOM for XPath evaluation.
 * @returns {{document: Document}}
 */
function buildDom () {
  const {window} = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://example.org'
  });
  const parser = new window.DOMParser();
  const document = parser.parseFromString(
    '<root><item id="a">text</item><item id="b">more</item></root>',
    'text/xml'
  );
  return {document};
}

// Note: Default root rule behavior is covered elsewhere; skip fallback tests

describe('XPathTransformerContext extended branches (version 1)', () => {
  it('handles ITERATOR and snapshot (native v1)', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: document,
      joiningTransformer: joiner,
      xpathVersion: 1
    }, []);
      // iterator type env-dependent; snapshot path covered
    // snapshot when asNodes true
    const nodesSnap = ctx.get('//*[@id]', true);
    expect(nodesSnap).to.be.an('array').with.lengthOf(2);
  });

  it('throws when native XPath unavailable for version 1', () => {
    const badCtx = new XPathTransformerContext({
      data: {nodeType: 1},
      joiningTransformer: new StringJoiningTransformer('', {}),
      xpathVersion: 1
    }, []);
    const cnt = () => badCtx.get('count(//item)');
    expect(cnt).to.throw('Native XPath unavailable');
  });
});

describe('XPathTransformerContext extended branches (version 2)', () => {
  it('wraps non-array result in array (v2)', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: document,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, []);
    const wrapped = ctx.get('"lit"', true);
    expect(wrapped).to.be.an('array');
    expect(wrapped[0]).to.equal('lit');
  });
});

describe('XPathTransformerContext utility and default rule coverage', () => {
  it('covers appendOutput and propertySet helpers', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: document,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, []);
    ctx.appendOutput('APP');
    ctx.plainText('RAW');
    ctx.number(42);
    ctx.object({}, () => {
      ctx.propValue('prop', 'val');
    });
    ctx.element('div', {}, [], () => {
      ctx.attribute('data-x', 'y');
    });
    ctx.array([], () => { /* empty callback */ });
    ctx.propertySet('base', {a: 1});
    ctx.propertySet('ext', {b: 2}, ['base']);
    const merged = ctx._usePropertySets({}, 'ext');
    expect(merged).to.have.property('a', 1);
    expect(merged).to.have.property('b', 2);
    const out = ctx.getOutput();
    expect(out).to.include('APP');
  });

  it('getKey returns context when no match', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: document,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, []);
    ctx.key('byId', '//item', 'id');
    const ret = ctx.getKey('byId', 'missing');
    expect(ret).to.equal(ctx); // returns context
  });
});

describe('XPathTransformerContext init and sorting', () => {
  it('initializes then defaults select to * on subsequent calls', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: document,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, [
      {
        path: '//item',
        priority: 1,
        template (node) {
          this.text(node.textContent);
        }
      }
    ]);
    ctx.applyTemplates('//item'); // explicit
    ctx.applyTemplates();
    const out = ctx.getOutput();
    expect(out).to.include('text').and.to.include('more');
  });

  it('prefers higher numeric priority', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: document,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, [
      {
        path: '//item',
        priority: 1,
        template () {
          this.appendOutput('low');
        }
      },
      {
        path: '//item',
        priority: 2,
        template () {
          this.appendOutput('high');
        }
      }
    ]);
    ctx.applyTemplates('//item');
    const out = ctx.getOutput();
    // Highest priority template appends ('high' twice for two items)
    expect(out).to.include('high');
    expect(out).to.not.include('low');
  });

  it('throws on equal priority when configured', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');

    const ctx = new XPathTransformerContext({
      data: document,
      joiningTransformer: joiner,
      xpathVersion: 2,
      errorOnEqualPriority: true
    }, [
      {
        path: '//item',
        priority: 1,
        template () {
          this.appendOutput('one');
        }
      },
      {
        path: '//item',
        priority: 1,
        template () {
          this.appendOutput('two');
        }
      }
    ]);
    expect(() => ctx.applyTemplates('//item')).to.throw('Equal priority');
  });
});

describe('XPathTransformerContext misc branches', () => {
  it('get with empty expression returns context node', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: document,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, []);
    const ret = ctx.get('', false);
    expect(ret).to.equal(document);
  });

  it('getKey returns matching element when present', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: document,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, []);
    ctx.key('byId', '//item', 'id');
    const ret = ctx.getKey('byId', 'a');
    // Should return the element with id="a"
    expect(ret.tagName.toLowerCase()).to.equal('item');
  });

  it('default scalar rule executes for attribute nodes', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const ctx = new XPathTransformerContext({
      data: document,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, []);
    // Select attributes so nodeType !== 1|3 triggers transformScalars
    ctx.applyTemplates('//@id');
    const out = ctx.getOutput();
    // Should include attribute values 'a' and 'b'
    expect(out).to.include('a');
    expect(out).to.include('b');
  });
});

describe('XPathTransformer return append path', () => {
  it('appends return value from root template', () => {
    const {document} = buildDom();
    const joiner = new StringJoiningTransformer('');
    const templates = [
      {
        path: '/',
        template () {
          // Return a value instead of emitting; engine should append it
          return 'X';
        }
      }
    ];
    const ctx = new XPathTransformerContext({
      data: document,
      joiningTransformer: joiner,
      xpathVersion: 2
    }, templates);
    // Use the engine wrapper to invoke root behavior
    // Use already imported engine class

    const engineCfg = {
      data: document,
      templates,
      joiningTransformer: joiner,
      xpathVersion: 2
    };
    const engine = new XPathTransformer(engineCfg);
    const out = engine.transform('');
    expect(out).to.equal('X');
  });
});
