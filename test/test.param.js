import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {jtlt} from '../src/index.js';
import XPathTransformerContext from '../src/XPathTransformerContext.js';
import DOMJoiningTransformer from '../src/DOMJoiningTransformer.js';

/**
 * `this.param()` mirrors `xsl:param`: a declared default that a caller's
 * `xsl:with-param` (`this.withParam()` / `callTemplate`'s `withParam`) or a
 * runtime `config.params` value overrides. `this.withParam()` mirrors
 * `xsl:with-param`, staging values for the next `callTemplate()` /
 * `applyTemplates()`.
 */
describe('this.param() and this.withParam() (xsl:param / xsl:with-param)',
  function () {
    describe('JSONPath engine', function () {
      it('uses the declared default when nothing is supplied', async () => {
        const out = await jtlt({
          data: {name: 'Ada'},
          outputType: 'string',
          templates: [
            {path: '$', template () {
              this.callTemplate('greet');
            }},
            {name: 'greet', template () {
              this.param('greeting', {value: 'Hello'});
              this.string(this.vars.greeting + ', ');
              this.valueOf({select: '$greeting'});
            }}
          ]
        });
        expect(out).to.equal('Hello, Hello');
      });

      it('resolves a default given as a JSONPath expression', async () => {
        const out = await jtlt({
          data: {name: 'Ada'},
          outputType: 'string',
          templates: [
            {path: '$', template () {
              this.param('who', '$.name');
              this.valueOf({select: '$who'});
            }}
          ]
        });
        expect(out).to.equal('Ada');
      });

      it('is overridden by a runtime config.params value', async () => {
        const out = await jtlt({
          data: {name: 'Ada'},
          outputType: 'string',
          params: {greeting: 'Yo'},
          templates: [
            {path: '$', template () {
              this.param('greeting', {value: 'Hello'});
              this.valueOf({select: '$greeting'});
            }}
          ]
        });
        expect(out).to.equal('Yo');
      });

      it('is overridden by a caller callTemplate withParam', async () => {
        const out = await jtlt({
          data: {},
          outputType: 'string',
          templates: [
            {path: '$', template () {
              this.callTemplate({
                name: 'greet',
                withParam: [{name: 'greeting', value: 'Sup'}]
              });
            }},
            {name: 'greet', template () {
              this.param('greeting', {value: 'Hello'});
              this.valueOf({select: '$greeting'});
            }}
          ]
        });
        expect(out).to.equal('Sup');
      });

      it('a caller withParam beats a runtime config.params value', async () => {
        const out = await jtlt({
          data: {},
          outputType: 'string',
          params: {greeting: 'FromRuntime'},
          templates: [
            {path: '$', template () {
              this.callTemplate({
                name: 'greet',
                withParam: [{name: 'greeting', value: 'FromCaller'}]
              });
            }},
            {name: 'greet', template () {
              this.param('greeting', {value: 'FromDefault'});
              this.valueOf({select: '$greeting'});
            }}
          ]
        });
        expect(out).to.equal('FromCaller');
      });

      it('config.params is visible as $name without a param() declaration',
        async () => {
          const out = await jtlt({
            data: {},
            outputType: 'string',
            params: {token: 'abc123'},
            templates: [
              {path: '$', template () {
                this.valueOf({select: '$token'});
              }}
            ]
          });
          expect(out).to.equal('abc123');
        });

      it('config.params feeds a $name reference in format-number()',
        async () => {
          const out = await jtlt({
            data: {},
            outputType: 'string',
            params: {rate: 1234.5},
            templates: [
              {path: '$', template () {
                this.valueOf({select: "format-number($rate, '#,##0.00')"});
              }}
            ]
          });
          expect(out).to.equal('1,234.5');
        });

      it('withParam() stages a value for the next callTemplate()', async () => {
        const out = await jtlt({
          data: {},
          outputType: 'string',
          templates: [
            {path: '$', template () {
              this.withParam('greeting', {value: 'Staged'});
              this.callTemplate('greet');
            }},
            {name: 'greet', template () {
              this.param('greeting', {value: 'Hello'});
              this.valueOf({select: '$greeting'});
            }}
          ]
        });
        expect(out).to.equal('Staged');
      });

      it('withParam() stages a value for the next applyTemplates()',
        async () => {
          const out = await jtlt({
            data: {items: [{n: 1}, {n: 2}]},
            outputType: 'string',
            templates: [
              {path: '$', template () {
                this.withParam('sep', {value: '|'});
                this.applyTemplates('$.items[*]', 'row');
              }},
              {path: '$.items[*]', mode: 'row', template () {
                this.param('sep', {value: ','});
                this.valueOf({select: '$sep'});
                this.valueOf({select: '$.n'});
              }}
            ]
          });
          expect(out).to.equal('|1|2');
        });

      it('a staged withParam() is consumed and not reused', async () => {
        const out = await jtlt({
          data: {},
          outputType: 'string',
          templates: [
            {path: '$', template () {
              this.withParam('greeting', {value: 'Once'});
              this.callTemplate('greet');
              this.string('/');
              this.callTemplate('greet');
            }},
            {name: 'greet', template () {
              this.param('greeting', {value: 'Default'});
              this.valueOf({select: '$greeting'});
            }}
          ]
        });
        expect(out).to.equal('Once/Default');
      });

      it('an explicit withParam entry overrides a staged one', async () => {
        const out = await jtlt({
          data: {},
          outputType: 'string',
          templates: [
            {path: '$', template () {
              this.withParam('greeting', {value: 'Staged'});
              this.callTemplate({
                name: 'greet',
                withParam: [{name: 'greeting', value: 'Explicit'}]
              });
            }},
            {name: 'greet', template () {
              this.param('greeting', {value: 'Default'});
              this.valueOf({select: '$greeting'});
            }}
          ]
        });
        expect(out).to.equal('Explicit');
      });

      it('withParam() resolves a bare-string arg as a JSONPath expression',
        async () => {
          const out = await jtlt({
            data: {label: 'DataLabel'},
            outputType: 'string',
            templates: [
              {path: '$', template () {
                this.withParam('lbl', '$.label');
                this.callTemplate('show');
              }},
              {name: 'show', template () {
                this.param('lbl', {value: 'fallback'});
                this.valueOf({select: '$lbl'});
              }}
            ]
          });
          expect(out).to.equal('DataLabel');
        });

      it('param() with no default binds undefined (unless supplied)',
        async () => {
          const out = await jtlt({
            data: {},
            outputType: 'string',
            params: {supplied: 'RUNTIME'},
            templates: [
              {path: '$', template () {
                this.param('missing');
                this.param('supplied');
                this.string(
                  String(this.vars.missing) + ':' + this.vars.supplied
                );
              }}
            ]
          });
          expect(out).to.equal('undefined:RUNTIME');
        });

      it('param() accepts an explicit {select} default', async () => {
        const out = await jtlt({
          data: {name: 'Ada'},
          outputType: 'string',
          templates: [
            {path: '$', template () {
              this.param('who', {select: '$.name'});
              this.valueOf({select: '$who'});
            }}
          ]
        });
        expect(out).to.equal('Ada');
      });
    });

    describe('XPath engine', function () {
      /**
       * @param {string} xml
       * @returns {Document}
       */
      const parse = (xml) => new JSDOM(
        xml, {contentType: 'text/xml'}
      ).window.document;

      it('uses the declared default when nothing is supplied', () => {
        const doc = parse('<root/>');
        const joiner = DOMJoiningTransformer.create(
          doc.createDocumentFragment(), {document: doc}
        );
        const ctx = new XPathTransformerContext({
          data: doc.documentElement, joiningTransformer: joiner
        }, [
          {name: 'greet', template () {
            this.param('greeting', {value: 'Hello'});
            this.valueOf('$greeting');
          }}
        ]);
        ctx.callTemplate('greet');
        expect(joiner.get().textContent).to.equal('Hello');
      });

      it('is overridden by a runtime config.params value', () => {
        const doc = parse('<root/>');
        const joiner = DOMJoiningTransformer.create(
          doc.createDocumentFragment(), {document: doc}
        );
        const ctx = new XPathTransformerContext({
          data: doc.documentElement,
          joiningTransformer: joiner,
          params: {greeting: 'Yo'}
        }, [
          {name: 'greet', template () {
            this.param('greeting', {value: 'Hello'});
            this.valueOf('$greeting');
          }}
        ]);
        ctx.callTemplate('greet');
        expect(joiner.get().textContent).to.equal('Yo');
      });

      it('is overridden by a caller withParam', () => {
        const doc = parse('<root/>');
        const joiner = DOMJoiningTransformer.create(
          doc.createDocumentFragment(), {document: doc}
        );
        const ctx = new XPathTransformerContext({
          data: doc.documentElement, joiningTransformer: joiner
        }, [
          {name: 'greet', template () {
            this.param('greeting', {value: 'Hello'});
            this.valueOf('$greeting');
          }}
        ]);
        ctx.callTemplate('greet', [{name: 'greeting', value: 'Sup'}]);
        expect(joiner.get().textContent).to.equal('Sup');
      });

      it('withParam() stages a value for the next callTemplate()', () => {
        const doc = parse('<root/>');
        const joiner = DOMJoiningTransformer.create(
          doc.createDocumentFragment(), {document: doc}
        );
        const ctx = new XPathTransformerContext({
          data: doc.documentElement, joiningTransformer: joiner
        }, [
          {name: 'greet', template () {
            this.param('greeting', {value: 'Hello'});
            this.valueOf('$greeting');
          }}
        ]);
        ctx.withParam('greeting', {value: 'Staged'});
        ctx.callTemplate('greet');
        expect(joiner.get().textContent).to.equal('Staged');
      });

      it('config.params is visible as $name without a param() declaration',
        () => {
          const doc = parse('<root/>');
          const joiner = DOMJoiningTransformer.create(
            doc.createDocumentFragment(), {document: doc}
          );
          const ctx = new XPathTransformerContext({
            data: doc.documentElement,
            joiningTransformer: joiner,
            params: {token: 'abc123'}
          }, [
            {name: 't', template () {
              this.valueOf('$token');
            }}
          ]);
          ctx.callTemplate('t');
          expect(joiner.get().textContent).to.equal('abc123');
        });

      it('resolves a default given as an XPath expression (string or {select})',
        () => {
          const doc = parse('<root><label>FromDoc</label></root>');
          const joiner = DOMJoiningTransformer.create(
            doc.createDocumentFragment(), {document: doc}
          );
          const ctx = new XPathTransformerContext({
            data: doc.documentElement, joiningTransformer: joiner
          }, [
            {name: 'bare', template () {
              this.param('lbl', 'label');
              this.valueOf('$lbl');
            }},
            {name: 'obj', template () {
              this.param('lbl', {select: 'label'});
              this.valueOf('$lbl');
            }},
            {name: 'str', template () {
              // A string-valued XPath expression (not a node-set)
              this.param('lbl', {select: 'string(label)'});
              this.valueOf('$lbl');
            }}
          ]);
          ctx.callTemplate('bare');
          ctx.callTemplate('obj');
          ctx.callTemplate('str');
          expect(joiner.get().textContent).to.equal('FromDocFromDocFromDoc');
        });

      it('param() with no default binds undefined', () => {
        const doc = parse('<root/>');
        const joiner = DOMJoiningTransformer.create(
          doc.createDocumentFragment(), {document: doc}
        );
        const ctx = new XPathTransformerContext({
          data: doc.documentElement, joiningTransformer: joiner
        }, [
          {name: 't', template () {
            this.param('a');
            this.string(String(this.vars.a));
          }}
        ]);
        ctx.callTemplate('t');
        expect(joiner.get().textContent).to.equal('undefined');
      });

      it('withParam() stages a value for the next applyTemplates()', () => {
        const doc = parse('<root><item>a</item><item>b</item></root>');
        const joiner = DOMJoiningTransformer.create(
          doc.createDocumentFragment(), {document: doc}
        );
        const ctx = new XPathTransformerContext({
          data: doc.documentElement, joiningTransformer: joiner
        }, [
          {path: '/root', template () {
            this.withParam('sep', {value: '-'});
            this.applyTemplates('//item', 'row');
          }},
          {path: '//item', mode: 'row', template () {
            this.param('sep', {value: ','});
            this.valueOf('$sep');
            this.valueOf('.');
          }}
        ]);
        ctx.applyTemplates('/root');
        expect(joiner.get().textContent).to.equal('-a-b');
      });
    });
  });
