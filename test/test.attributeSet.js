/* eslint-disable no-empty-function -- Using many for tests */
// @ts-nocheck - Testing new useAttributeSets parameter
import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JTLT, {
  StringJoiningTransformer,
  DOMJoiningTransformer,
  JSONJoiningTransformer
} from '../src/index-node.js';

describe('attributeSet - StringJoiningTransformer', () => {
  it('applies single attribute set to element', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.attributeSet('common-styles', {
      class: 'button',
      role: 'button'
    });
    joiner.element('div', {}, [], () => {}, ['common-styles']);
    const result = joiner.get();
    expect(result).to.include('class="button"');
    expect(result).to.include('role="button"');
  });

  it('overrides attribute set with element attributes', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.attributeSet('defaults', {
      class: 'default',
      id: 'default-id'
    });
    joiner.element('div', {class: 'override'}, [], () => {}, ['defaults']);
    const result = joiner.get();
    expect(result).to.include('class="override"');
    expect(result).to.include('id="default-id"');
  });

  it('applies multiple attribute sets', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.attributeSet('style1', {
      class: 'btn',
      'data-role': 'button'
    });
    joiner.attributeSet('style2', {
      'aria-label': 'Click me',
      tabindex: '0'
    });
    joiner.element('button', {}, [], () => {}, ['style1', 'style2']);
    const result = joiner.get();
    expect(result).to.include('class="btn"');
    expect(result).to.include('data-role="button"');
    expect(result).to.include('aria-label="Click me"');
    expect(result).to.include('tabindex="0"');
  });

  it('multiple sets with override precedence', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.attributeSet('set1', {
      class: 'first',
      id: 'id1'
    });
    joiner.attributeSet('set2', {
      class: 'second',
      title: 'title2'
    });
    // set2 overrides set1's class, then element attrs override all
    joiner.element('div', {id: 'final-id'}, [], () => {}, ['set1', 'set2']);
    const result = joiner.get();
    expect(result).to.include('class="second"');
    expect(result).to.include('id="final-id"');
    expect(result).to.include('title="title2"');
  });

  it('works without useAttributeSets parameter', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.attributeSet('unused', {
      class: 'unused'
    });
    joiner.element('div', {id: 'test'}, [], () => {});
    const result = joiner.get();
    expect(result).to.include('id="test"');
    expect(result).to.not.include('class="unused"');
  });

  it('ignores non-existent attribute set names', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.element('div', {id: 'test'}, [], () => {}, ['non-existent']);
    const result = joiner.get();
    expect(result).to.include('id="test"');
  });

  it('works with callback-based element building', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.attributeSet('layout', {
      'data-layout': 'flex'
    });
    joiner.element('div', {}, [], () => {
      joiner.text('Content');
    }, ['layout']);
    const result = joiner.get();
    expect(result).to.include('data-layout="flex"');
    expect(result).to.include('Content');
  });

  it('applies to root element with output config', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.attributeSet('root-attrs', {
      lang: 'en',
      dir: 'ltr'
    });
    joiner.output({method: 'html'});
    joiner.element('html', {}, [], () => {
      joiner.text('Test');
    }, ['root-attrs']);
    const result = joiner.get();
    expect(result).to.include('lang="en"');
    expect(result).to.include('dir="ltr"');
  });
});

describe('attributeSet - DOMJoiningTransformer', () => {
  it('applies single attribute set to element', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.attributeSet('common-styles', {
      class: 'button',
      role: 'button'
    });
    joiner.element('div', {}, [], () => {}, ['common-styles']);
    const result = joiner.get();
    const div = /** @type {Element} */ (
      /** @type {DocumentFragment} */ (result).firstChild
    );
    expect(div.getAttribute('class')).to.equal('button');
    expect(div.getAttribute('role')).to.equal('button');
  });

  it('overrides attribute set with element attributes', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.attributeSet('defaults', {
      class: 'default',
      id: 'default-id'
    });
    joiner.element('div', {class: 'override'}, [], () => {}, ['defaults']);
    const result = joiner.get();
    const div = /** @type {Element} */ (
      /** @type {DocumentFragment} */ (result).firstChild
    );
    expect(div.getAttribute('class')).to.equal('override');
    expect(div.getAttribute('id')).to.equal('default-id');
  });

  it('applies multiple attribute sets', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.attributeSet('style1', {
      class: 'btn',
      'data-role': 'button'
    });
    joiner.attributeSet('style2', {
      'aria-label': 'Click me',
      tabindex: '0'
    });
    joiner.element('button', {}, [], () => {}, ['style1', 'style2']);
    const result = joiner.get();
    const btn = /** @type {Element} */ (
      /** @type {DocumentFragment} */ (result).firstChild
    );
    expect(btn.getAttribute('class')).to.equal('btn');
    expect(btn.dataset.role).to.equal('button');
    expect(btn.getAttribute('aria-label')).to.equal('Click me');
    expect(btn.getAttribute('tabindex')).to.equal('0');
  });

  it('applies to root element with output config', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.attributeSet('root-attrs', {
      lang: 'en',
      dir: 'ltr'
    });
    joiner.output({method: 'html'});
    joiner.element('html', {}, [], () => {
      joiner.text('Test');
    }, ['root-attrs']);
    const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
    const root = doc.documentElement;
    expect(root.getAttribute('lang')).to.equal('en');
    expect(root.getAttribute('dir')).to.equal('ltr');
  });

  it('works without useAttributeSets parameter', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.attributeSet('unused', {
      class: 'unused'
    });
    joiner.element('div', {id: 'test'}, [], () => {});
    const result = joiner.get();
    const div = /** @type {Element} */ (
      /** @type {DocumentFragment} */ (result).firstChild
    );
    expect(div.getAttribute('id')).to.equal('test');
    expect(div.getAttribute('class')).to.be.null;
  });
});

describe('attributeSet - JSONJoiningTransformer', () => {
  it('applies single attribute set to element', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.attributeSet('common-styles', {
      class: 'button',
      role: 'button'
    });
    joiner.element('div', {}, [], () => {}, ['common-styles']);
    const result = joiner.get();
    const element = result[0];
    expect(element[0]).to.equal('div');
    expect(element[1].class).to.equal('button');
    expect(element[1].role).to.equal('button');
  });

  it('overrides attribute set with element attributes', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.attributeSet('defaults', {
      class: 'default',
      id: 'default-id'
    });
    joiner.element('div', {class: 'override'}, [], () => {}, ['defaults']);
    const result = joiner.get();
    const element = result[0];
    expect(element[1].class).to.equal('override');
    expect(element[1].id).to.equal('default-id');
  });

  it('applies multiple attribute sets', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.attributeSet('style1', {
      class: 'btn',
      'data-role': 'button'
    });
    joiner.attributeSet('style2', {
      'aria-label': 'Click me',
      tabindex: '0'
    });
    joiner.element('button', {}, [], () => {}, ['style1', 'style2']);
    const result = joiner.get();
    const element = result[0];
    expect(element[1].class).to.equal('btn');
    expect(element[1]['data-role']).to.equal('button');
    expect(element[1]['aria-label']).to.equal('Click me');
    expect(element[1].tabindex).to.equal('0');
  });

  it('works with callback-based element building', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.attributeSet('layout', {
      'data-layout': 'flex'
    });
    joiner.element('div', {}, [], () => {
      joiner.text('Content');
    }, ['layout']);
    const result = joiner.get();
    const element = result[0];
    expect(element[1]['data-layout']).to.equal('flex');
    // element[2] is children array
    expect(element[2][0]).to.equal('Content');
  });

  it('works without useAttributeSets parameter', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.attributeSet('unused', {
      class: 'unused'
    });
    joiner.element('div', {id: 'test'}, [], () => {});
    const result = joiner.get();
    const element = result[0];
    expect(element[1].id).to.equal('test');
    expect(element[1].class).to.be.undefined;
  });

  it('applies to root element with output config', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.attributeSet('root-attrs', {
      lang: 'en',
      xmlns: 'http://www.w3.org/1999/xhtml'
    });
    joiner.output({method: 'html'});
    joiner.element('html', {}, [], () => {
      joiner.text('Test');
    }, ['root-attrs']);
    const result = joiner.get();
    const element = result[0];
    expect(element[1].lang).to.equal('en');
    expect(element[1].xmlns).to.equal('http://www.w3.org/1999/xhtml');
  });

  it('combines with dataset attribute helper', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.attributeSet('base', {
      class: 'widget'
    });
    joiner.element(
      'div',
      {dataset: {value: '123'}},
      [],
      () => {},
      ['base']
    );
    const result = joiner.get();
    const element = result[0];
    expect(element[1].class).to.equal('widget');
    expect(element[1]['data-value']).to.equal('123');
  });

  it('combines with $a ordered attributes', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.attributeSet('base', {
      class: 'component'
    });
    joiner.element(
      'div',
      {$a: [['title', 'Test']]},
      [],
      () => {},
      ['base']
    );
    const result = joiner.get();
    const element = result[0];
    expect(element[1].class).to.equal('component');
    expect(element[1].title).to.equal('Test');
  });
});

describe('attributeSet - JSONPath Context API', () => {
  it('uses attributeSet through context', () => {
    const data = {name: 'Test'};
    let output;

    new JTLT({
      data,
      outputType: 'string',
      engineType: 'jsonpath',
      templates: [{
        path: '$.name',
        template (val) {
          this.attributeSet('btn-attrs', {
            class: 'button',
            type: 'button'
          });
          this.element('button', {id: 'test'}, [], () => {
            this.text(val);
          }, ['btn-attrs']);
        }
      }],
      success (result) {
        output = result;
      }
    }).transform();

    expect(output).to.include('class="button"');
    expect(output).to.include('type="button"');
    expect(output).to.include('id="test"');
    expect(output).to.include('Test');
  });
});

describe('attributeSet - XPath Context API', () => {
  it('uses attributeSet through context', () => {
    const {window} = new JSDOM('<root>Content</root>');
    const doc = window.document;
    let output;

    new JTLT({
      data: doc,
      outputType: 'string',
      engineType: 'xpath',
      templates: [{
        path: '/',
        template () {
          this.attributeSet('wrapper-attrs', {
            class: 'wrapper',
            'data-test': 'value'
          });
          this.element('div', {}, [], () => {
            this.text('Wrapped');
          }, ['wrapper-attrs']);
        }
      }],
      success (result) {
        output = result;
      }
    }).transform();

    expect(output).to.include('class="wrapper"');
    expect(output).to.include('data-test="value"');
    expect(output).to.include('Wrapped');
  });
});
