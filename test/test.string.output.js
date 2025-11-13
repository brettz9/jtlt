import {expect} from 'chai';
import {StringJoiningTransformer} from '../src/index-node.js';

describe('StringJoiningTransformer output', () => {
  it('builds a string document when output() is called', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.output({
      method: 'xml',
      version: '1.0',
      encoding: 'utf8'
    });
    joiner.element('root', {id: 'main'}, [], () => {
      joiner.element('item', {}, [], () => {
        joiner.text('Hello');
      });
    });
    const result = joiner.get();
    // Should include XML declaration and root element
    expect(result).to.be.a('string');
    expect(result).to.include('<?xml version="1.0" encoding="utf8"?>');
    expect(result).to.include('<root id="main">');
    expect(result).to.include('<item>');
    expect(result).to.include('Hello');
    expect(result).to.include('</item>');
    expect(result).to.include('</root>');
  });

  it('includes DOCTYPE when configured', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.output({
      method: 'xml',
      version: '1.0',
      encoding: 'utf8',
      doctypePublic: '-//W3C//DTD XHTML 1.0 Strict//EN',
      doctypeSystem: 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
    });
    joiner.element('html', {xmlns: 'http://www.w3.org/1999/xhtml'}, [], () => {
      joiner.element('head', {}, [], () => {
        joiner.element('title', {}, [], () => {
          joiner.text('Test');
        });
      });
    });
    const result = joiner.get();
    expect(result).to.be.a('string');
    expect(result).to.include('<?xml version="1.0" encoding="utf8"?>');
    expect(result).to.include('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">');
    expect(result).to.include('<html');
    expect(result).to.include('</html>');
  });

  it('includes SYSTEM DOCTYPE when only systemId is set', () => {
    const joiner = new StringJoiningTransformer('');
    joiner.output({
      method: 'xml',
      doctypeSystem: 'http://example.com/sys.dtd'
    });
    joiner.element('root', {}, [], () => {
      joiner.text('X');
    });
    const result = joiner.get();
    expect(result).to.be.a('string');
    expect(result).to.include('<!DOCTYPE root SYSTEM "http://example.com/sys.dtd">');
    expect(result).to.include('<root>');
    expect(result).to.include('X');
  });

  it('exposeDocuments pushes built string on get()', () => {
    const joiner = new StringJoiningTransformer('', {exposeDocuments: true});
    joiner.output({method: 'xml'});
    joiner.element('doc', {}, [], () => {
      joiner.text('Body');
    });
    const docs = joiner.get();
    expect(Array.isArray(docs)).to.equal(true);
    expect(docs.length).to.equal(1);
    expect(docs[0]).to.include('<doc>Body</doc>');
  });

  it(
    'builds a plain string when output() is not called',
    () => {
      const joiner = new StringJoiningTransformer('');
      joiner.element('div', {class: 'test'}, [], () => {
        joiner.text('Content');
      });
      const result = joiner.get();
      expect(result).to.be.a('string');
      expect(result).to.equal('<div class="test">Content</div>');
      // Should not have XML declaration without output()
      expect(result).to.not.include('<?xml');
    }
  );
});
