import {expect} from 'chai';
import {StringJoiningTransformer} from '../src/index-node.js';

describe('StringJoiningTransformer complete coverage', () => {
  describe('standalone attribute edge cases (line 484)', () => {
    it('includes standalone="yes" when standalone is true', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({
        method: 'xml',
        version: '1.0',
        standalone: true
      });
      joiner.element('root', {}, [], () => {
        joiner.text('Content');
      });
      const result = joiner.get();
      expect(result).to.include('standalone="yes"');
    });

    it('omits standalone attribute when standalone is false', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({
        method: 'xml',
        version: '1.0',
        standalone: false
      });
      joiner.element('root', {}, [], () => {
        joiner.text('Content');
      });
      const result = joiner.get();
      expect(result).to.not.include('standalone=');
    });

    it('omits standalone attribute when standalone is undefined', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({
        method: 'xml',
        version: '1.0'
        // standalone not provided
      });
      joiner.element('root', {}, [], () => {
        joiner.text('Content');
      });
      const result = joiner.get();
      expect(result).to.not.include('standalone=');
    });
  });

  describe('DOCTYPE SYSTEM without PUBLIC (line 495)', () => {
    it('outputs SYSTEM DOCTYPE when only systemId provided', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({
        method: 'xml',
        doctypeSystem: 'http://example.com/custom.dtd'
      });
      joiner.element('custom', {}, [], () => {
        joiner.text('Test');
      });
      const result = joiner.get();
      expect(result).to.include(
        '<!DOCTYPE custom SYSTEM "http://example.com/custom.dtd">'
      );
    });

    it('outputs PUBLIC DOCTYPE when both provided', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({
        method: 'xml',
        doctypePublic: '-//TEST//DTD Test 1.0//EN',
        doctypeSystem: 'http://example.com/test.dtd'
      });
      joiner.element('test', {}, [], () => {
        joiner.text('Test');
      });
      const result = joiner.get();
      expect(result).to.include(
        '<!DOCTYPE test PUBLIC "-//TEST//DTD Test 1.0//EN" ' +
        '"http://example.com/test.dtd">'
      );
    });

    it('omits DOCTYPE when neither PUBLIC nor SYSTEM provided', () => {
      const joiner = new StringJoiningTransformer('');
      joiner.output({
        method: 'xml',
        version: '1.0'
      });
      joiner.element('root', {}, [], () => {
        joiner.text('Test');
      });
      const result = joiner.get();
      expect(result).to.not.include('<!DOCTYPE');
    });
  });

  describe(
    'omitXmlDeclaration with html method (line 476-478)',
    () => {
      it(
        'includes xmlDecl when method=html and omitXmlDeclaration=false',
        () => {
          const joiner = new StringJoiningTransformer('');
          joiner.output({
            method: 'html',
            omitXmlDeclaration: false,
            version: '1.1'
          });
          joiner.element('div', {}, [], () => {
            joiner.text('HTML with XML declaration');
          });
          const result = joiner.get();
          expect(result).to.include('<?xml version="1.1"?>');
        }
      );

      it('omits xmlDecl when method=html by default', () => {
        const joiner = new StringJoiningTransformer('');
        joiner.output({
          method: 'html',
          version: '1.0'
        });
        joiner.element('div', {}, [], () => {
          joiner.text('HTML without XML declaration');
        });
        const result = joiner.get();
        expect(result).to.not.include('<?xml');
      });
    }
  );

  describe('resultDocument with cfg.method fallback (line 808)', () => {
    it('uses cfg.method when output() has no method', () => {
      const joiner = new StringJoiningTransformer('');

      joiner.resultDocument('test.xml', () => {
        joiner.output({version: '1.0'}); // No method
        joiner.element('root', {}, [], () => {
          joiner.text('Fallback');
        });
      }, {method: 'xml'});

      const result = joiner._resultDocuments[0];
      expect(result.format).to.equal('xml');
    });

    it('uses cfg.method when no output() is called', () => {
      const joiner = new StringJoiningTransformer('');

      joiner.resultDocument('test.html', () => {
        joiner.element('div', {}, [], () => {
          joiner.text('No output config');
        });
      }, {method: 'html'});

      const result = joiner._resultDocuments[0];
      expect(result.format).to.equal('html');
    });

    it('prefers output().method over cfg.method', () => {
      const joiner = new StringJoiningTransformer('');

      joiner.resultDocument('test.xml', () => {
        joiner.output({method: 'xhtml'});
        joiner.element('div', {}, [], () => {
          joiner.text('XHTML');
        });
      }, {method: 'xml'});

      const result = joiner._resultDocuments[0];
      expect(result.format).to.equal('xhtml');
    });
  });
});
