import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {
  StringJoiningTransformer,
  DOMJoiningTransformer,
  JSONJoiningTransformer
} from '../src/index-node.js';

describe('characterMap - StringJoiningTransformer', () => {
  it('replaces characters in text() when useCharacterMaps is set', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.characterMap('special-chars', [
      {character: '©', string: '(C)'},
      {character: '®', string: '(R)'}
    ]);
    joiner.output({useCharacterMaps: ['special-chars']});
    joiner.element('div', {}, [], () => {
      joiner.text('Copyright © 2024, Registered ®');
    });
    const result = joiner.get();
    expect(result).to.include('Copyright (C) 2024, Registered (R)');
    expect(result).to.not.include('©');
    expect(result).to.not.include('®');
  });

  it('replaces characters in attribute() when useCharacterMaps is set', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.characterMap('special-chars', [
      {character: '©', string: '(C)'},
      {character: '®', string: '(R)'}
    ]);
    joiner.output({useCharacterMaps: ['special-chars']});
    joiner.element('div', {}, [], () => {
      joiner.attribute('title', 'Copyright © 2024');
    });
    const result = joiner.get();
    expect(result).to.include('title="Copyright (C) 2024"');
    expect(result).to.not.include('©');
  });

  it('replaces characters in element() attributes object', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.characterMap('euro', [
      {character: '€', string: 'EUR'}
    ]);
    joiner.output({useCharacterMaps: ['euro']});
    joiner.element('div', {price: 'Price: 100€'}, [], () => {
      joiner.text('Item costs 100€');
    });
    const result = joiner.get();
    expect(result).to.include('price="Price: 100EUR"');
    expect(result).to.include('Item costs 100EUR');
  });

  it('applies multiple character maps in order', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.characterMap('symbols', [
      {character: '©', string: '(C)'}
    ]);
    joiner.characterMap('more-symbols', [
      {character: '®', string: '(R)'},
      {character: '™', string: '(TM)'}
    ]);
    joiner.output({useCharacterMaps: ['symbols', 'more-symbols']});
    joiner.element('div', {}, [], () => {
      joiner.text('© ® ™');
    });
    const result = joiner.get();
    expect(result).to.include('(C) (R) (TM)');
  });

  it('does not replace characters when useCharacterMaps is not set', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.characterMap('special-chars', [
      {character: '©', string: '(C)'}
    ]);
    // Note: no output() call with useCharacterMaps
    joiner.element('div', {}, [], () => {
      joiner.text('Copyright ©');
    });
    const result = joiner.get();
    expect(result).to.include('Copyright ©');
  });

  it(
    'does not replace characters when output() without useCharacterMaps',
    () => {
      const joiner = new StringJoiningTransformer('');
      joiner.characterMap('special-chars', [
        {character: '©', string: '(C)'}
      ]);
      joiner.output({method: 'xml'});
      joiner.element('div', {}, [], () => {
        joiner.text('Copyright ©');
      });
      const result = joiner.get();
      expect(result).to.include('Copyright ©');
    }
  );

  it('handles empty character map array', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.characterMap('empty', []);
    joiner.output({useCharacterMaps: ['empty']});
    joiner.element('div', {}, [], () => {
      joiner.text('No changes');
    });
    const result = joiner.get();
    expect(result).to.include('No changes');
  });

  it('replaces all occurrences of a character', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.characterMap('replace-a', [
      {character: 'a', string: 'X'}
    ]);
    joiner.output({useCharacterMaps: ['replace-a']});
    joiner.element('div', {}, [], () => {
      joiner.text('banana');
    });
    const result = joiner.get();
    expect(result).to.include('bXnXnX');
  });

  it(
    'character map works with special XML characters after escaping',
    () => {
      const joiner = new StringJoiningTransformer('');
      joiner.characterMap('custom', [
        {character: 'X', string: '<tag>'}
      ]);
      joiner.output({useCharacterMaps: ['custom']});
      joiner.element('div', {}, [], () => {
        joiner.text('Test X here');
      });
      const result = joiner.get();
      // Character map is applied BEFORE escaping in text(),
      // so <tag> becomes &lt;tag> (> doesn't need escaping in text)
      expect(result).to.include('Test &lt;tag> here');
    }
  );

  it('applies character maps with dataset attributes', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.characterMap('special', [
      {character: '©', string: '(C)'}
    ]);
    joiner.output({useCharacterMaps: ['special']});
    joiner.element('div', {dataset: {info: 'Copyright ©'}}, [], () => {
      joiner.text('Content');
    });
    const result = joiner.get();
    expect(result).to.include('data-info="Copyright (C)"');
  });

  it('applies character maps with ordered attributes ($a)', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.characterMap('special', [
      {character: '©', string: '(C)'}
    ]);
    joiner.output({useCharacterMaps: ['special']});
    joiner.element('div', {$a: [['title', 'Copyright ©']]}, [], () => {
      joiner.text('Content');
    });
    const result = joiner.get();
    expect(result).to.include('title="Copyright (C)"');
  });
});

describe('characterMap - DOMJoiningTransformer', () => {
  it('replaces characters in text() when useCharacterMaps is set', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.characterMap('special-chars', [
      {character: '\u00A9', string: '(C)'},
      {character: '\u00AE', string: '(R)'}
    ]);
    joiner.output({useCharacterMaps: ['special-chars']});
    joiner.element('div', {}, () => {
      joiner.text('Copyright \u00A9 2024, Registered \u00AE');
    });
    // With output() and root element, result goes to _docs
    const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
    const root = doc.documentElement;
    expect(root.textContent).to.include('Copyright (C) 2024, Registered (R)');
    expect(root.textContent).to.not.include('\u00A9');
    expect(root.textContent).to.not.include('\u00AE');
  });

  it('replaces characters in attribute() when useCharacterMaps is set', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.characterMap('special-chars', [
      {character: '\u00A9', string: '(C)'}
    ]);
    joiner.output({useCharacterMaps: ['special-chars']});
    joiner.element('div', {}, () => {
      joiner.attribute('title', 'Copyright \u00A9');
    });
    const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
    const div = doc.documentElement;
    expect(div.getAttribute('title')).to.equal('Copyright (C)');
  });

  it('replaces characters in element() attributes object', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.characterMap('euro', [
      {character: '\u20AC', string: 'EUR'}
    ]);
    joiner.output({useCharacterMaps: ['euro']});
    joiner.element('div', {price: 'Price: 100\u20AC'}, () => {
      joiner.text('Item costs 100\u20AC');
    });
    const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
    const div = doc.documentElement;
    expect(div.getAttribute('price')).to.equal('Price: 100EUR');
    expect(div.textContent).to.equal('Item costs 100EUR');
  });

  it('applies multiple character maps in order', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.characterMap('symbols', [
      {character: '\u00A9', string: '(C)'}
    ]);
    joiner.characterMap('more-symbols', [
      {character: '\u00AE', string: '(R)'},
      {character: '\u2122', string: '(TM)'}
    ]);
    joiner.output({useCharacterMaps: ['symbols', 'more-symbols']});
    joiner.element('div', {}, () => {
      joiner.text('\u00A9 \u00AE \u2122');
    });
    const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
    expect(doc.documentElement.textContent).to.equal('(C) (R) (TM)');
  });

  it('does not replace characters when useCharacterMaps is not set', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.characterMap('special-chars', [
      {character: '\u00A9', string: '(C)'}
    ]);
    // Note: no output() call with useCharacterMaps
    joiner.element('div', {}, () => {
      joiner.text('Copyright \u00A9');
    });
    const result = joiner.get();
    const frag = /** @type {DocumentFragment} */ (result);
    expect(frag.textContent).to.include('Copyright \u00A9');
  });

  it('handles empty character map array', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.characterMap('empty', []);
    joiner.output({useCharacterMaps: ['empty']});
    joiner.element('div', {}, () => {
      joiner.text('No changes');
    });
    const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
    expect(doc.documentElement.textContent).to.equal('No changes');
  });

  it('replaces all occurrences of a character', () => {
    const {window} = new JSDOM('<!doctype html><html><body></body></html>');
    const {document} = window;
    const joiner = new DOMJoiningTransformer(
      document.createDocumentFragment(),
      {document}
    );
    joiner.characterMap('replace-a', [
      {character: 'a', string: 'X'}
    ]);
    joiner.output({useCharacterMaps: ['replace-a']});
    joiner.element('div', {}, () => {
      joiner.text('banana');
    });
    const doc = /** @type {XMLDocument} */ (joiner._docs[0]);
    expect(doc.documentElement.textContent).to.equal('bXnXnX');
  });
});

describe('characterMap - JSONJoiningTransformer', () => {
  it('replaces characters in text() when useCharacterMaps is set', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.characterMap('special-chars', [
      {character: '©', string: '(C)'},
      {character: '®', string: '(R)'}
    ]);
    joiner.output({useCharacterMaps: ['special-chars']});
    joiner.element('div', {}, [], () => {
      joiner.text('Copyright © 2024, Registered ®');
    });
    const result = joiner.get();
    const element = result[0];
    expect(Array.isArray(element)).to.equal(true);
    // element[1] is the children array when no attributes
    const text = element[1][0];
    expect(text).to.equal('Copyright (C) 2024, Registered (R)');
  });

  it('replaces characters in element() attributes object', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.characterMap('euro', [
      {character: '€', string: 'EUR'}
    ]);
    joiner.output({useCharacterMaps: ['euro']});
    joiner.element('div', {price: 'Price: 100€'}, [], () => {
      joiner.text('Item costs 100€');
    });
    const result = joiner.get();
    const element = result[0];
    expect(element[0]).to.equal('div');
    expect(element[1].price).to.equal('Price: 100EUR');
    // element[2] is the children array
    expect(element[2][0]).to.equal('Item costs 100EUR');
  });

  it('applies multiple character maps in order', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.characterMap('symbols', [
      {character: '©', string: '(C)'}
    ]);
    joiner.characterMap('more-symbols', [
      {character: '®', string: '(R)'},
      {character: '™', string: '(TM)'}
    ]);
    joiner.output({useCharacterMaps: ['symbols', 'more-symbols']});
    joiner.element('div', {}, [], () => {
      joiner.text('© ® ™');
    });
    const result = joiner.get();
    const element = result[0];
    expect(element[1][0]).to.equal('(C) (R) (TM)');
  });

  it('does not replace characters when useCharacterMaps is not set', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.characterMap('special-chars', [
      {character: '©', string: '(C)'}
    ]);
    // Note: no output() call with useCharacterMaps
    joiner.element('div', {}, [], () => {
      joiner.text('Copyright ©');
    });
    const result = joiner.get();
    const element = result[0];
    expect(element[1][0]).to.equal('Copyright ©');
  });

  it('handles empty character map array', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.characterMap('empty', []);
    joiner.output({useCharacterMaps: ['empty']});
    joiner.element('div', {}, [], () => {
      joiner.text('No changes');
    });
    const result = joiner.get();
    const element = result[0];
    expect(element[1][0]).to.equal('No changes');
  });

  it('replaces all occurrences of a character', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.characterMap('replace-a', [
      {character: 'a', string: 'X'}
    ]);
    joiner.output({useCharacterMaps: ['replace-a']});
    joiner.element('div', {}, [], () => {
      joiner.text('banana');
    });
    const result = joiner.get();
    const element = result[0];
    expect(element[1][0]).to.equal('bXnXnX');
  });

  it('applies character maps with dataset attributes', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.characterMap('special', [
      {character: '©', string: '(C)'}
    ]);
    joiner.output({useCharacterMaps: ['special']});
    joiner.element('div', {dataset: {info: 'Copyright ©'}}, [], () => {
      joiner.text('Content');
    });
    const result = joiner.get();
    const element = result[0];
    // element[1] is attributes, element[2] is children array
    expect(element[1]['data-info']).to.equal('Copyright (C)');
  });

  it('applies character maps with ordered attributes ($a)', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.characterMap('special', [
      {character: '©', string: '(C)'}
    ]);
    joiner.output({useCharacterMaps: ['special']});
    joiner.element('div', {$a: [['title', 'Copyright ©']]}, [], () => {
      joiner.text('Content');
    });
    const result = joiner.get();
    const element = result[0];
    // element[1] is attributes, element[2] is children array
    expect(element[1].title).to.equal('Copyright (C)');
  });

  it('character map with childNodes array containing strings', () => {
    const joiner = new JSONJoiningTransformer([]);
    joiner.characterMap('special', [
      {character: '©', string: '(C)'}
    ]);
    joiner.output({useCharacterMaps: ['special']});
    joiner.element('div', {}, ['Text with © symbol']);
    const result = joiner.get();
    const element = result[0];
    expect(element[1][0]).to.equal('Text with (C) symbol');
  });
});
