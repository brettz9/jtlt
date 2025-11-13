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
