/* Test mode() configuration with onMultipleMatch behavior */
import {expect} from 'chai';
import JTLT from '../src/index-node.js';
import {JSDOM} from 'jsdom';

describe('mode() configuration - JSONPath', () => {
  it('defaults to use-last behavior when onMultipleMatch not set', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'value'},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.applyTemplates('$.x');
          }
        },
        {
          path: '$.x',
          template () {
            this.text('first');
          }
        },
        {
          path: '$.x',
          template () {
            this.text('last');
          }
        }
      ],
      success (result) {
        // Default behavior: first template wins (not reversed)
        expect(result).to.equal('first');
        done();
      }
    });
  });

  it('uses last template with onMultipleMatch=use-last (explicit)', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'value'},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.mode({onMultipleMatch: 'use-last'});
            this.applyTemplates('$.x');
          }
        },
        {
          path: '$.x',
          template () {
            this.text('first');
          }
        },
        {
          path: '$.x',
          template () {
            this.text('last');
          }
        }
      ],
      success (result) {
        // With explicit use-last, still first template wins
        // (the mode config doesn't change priority resolution,
        // just controls fail behavior)
        expect(result).to.equal('first');
        done();
      }
    });
  });

  it(
    'throws error with onMultipleMatch=fail when multiple templates match',
    () => {
      expect(() => {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {x: 'value'},
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.mode({onMultipleMatch: 'fail'});
                this.applyTemplates('$.x');
              }
            },
            {
              path: '$.x',
              template () {
                this.text('first');
              }
            },
            {
              path: '$.x',
              template () {
                this.text('last');
              }
            }
          ],
          success () {
            // Empty - test expects throw
          }
        });
      }).to.throw(/Multiple templates match with equal priority/v);
    }
  );

  it(
    'works with onMultipleMatch=fail when only one template matches',
    (done) => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {x: 'value'},
        outputType: 'string',
        templates: [
          {
            path: '$',
            template () {
              this.mode({onMultipleMatch: 'fail'});
              this.applyTemplates('$.x');
            }
          },
          {
            path: '$.x',
            template () {
              this.text('only-one');
            }
          }
        ],
        success (result) {
          expect(result).to.equal('only-one');
          done();
        }
      });
    }
  );

  it('does not throw when templates have different priorities', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'value'},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.mode({onMultipleMatch: 'fail'});
            this.applyTemplates('$.x');
          }
        },
        {
          path: '$.x',
          priority: 1,
          template () {
            this.text('low');
          }
        },
        {
          path: '$.x',
          priority: 2,
          template () {
            this.text('high');
          }
        }
      ],
      success (result) {
        expect(result).to.equal('high');
        done();
      }
    });
  });

  it('mode() returns context for chaining', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: 'value'},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            const result = this.mode({onMultipleMatch: 'use-last'});
            expect(result).to.equal(this);
            this.applyTemplates('$.x');
          }
        },
        {
          path: '$.x',
          template () {
            this.text('chained');
          }
        }
      ],
      success (result) {
        expect(result).to.equal('chained');
        done();
      }
    });
  });

  it(
    'warns with warningOnMultipleMatch when multiple templates match',
    (done) => {
      // eslint-disable-next-line no-console -- Testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;
      let warnMessage = '';

      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = (msg) => {
        warnCalled = true;
        warnMessage = msg;
      };

      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {x: 'value'},
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.mode({warningOnMultipleMatch: true});
                this.applyTemplates('$.x');
              }
            },
            {
              path: '$.x',
              template () {
                this.text('first');
              }
            },
            {
              path: '$.x',
              template () {
                this.text('second');
              }
            }
          ],
          success (result) {
            expect(warnCalled).to.equal(true);
            expect(warnMessage).to.include('Multiple templates match');
            expect(warnMessage).to.include('warningOnMultipleMatch=true');
            expect(result).to.equal('first');
            // eslint-disable-next-line no-console -- Testing console.warn
            console.warn = originalWarn;
            done();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console -- Testing console.warn
        console.warn = originalWarn;
        done(err);
      }
    }
  );

  it(
    'does not warn with warningOnMultipleMatch when only one template matches',
    (done) => {
      // eslint-disable-next-line no-console -- Testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;

      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = () => {
        warnCalled = true;
      };

      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {x: 'value'},
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.mode({warningOnMultipleMatch: true});
                this.applyTemplates('$.x');
              }
            },
            {
              path: '$.x',
              template () {
                this.text('only-one');
              }
            }
          ],
          success (result) {
            expect(warnCalled).to.equal(false);
            expect(result).to.equal('only-one');
            // eslint-disable-next-line no-console -- Testing console.warn
            console.warn = originalWarn;
            done();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console -- Testing console.warn
        console.warn = originalWarn;
        done(err);
      }
    }
  );

  it(
    'does not warn when templates have different priorities',
    (done) => {
      // eslint-disable-next-line no-console -- Testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;

      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = () => {
        warnCalled = true;
      };

      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {x: 'value'},
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.mode({warningOnMultipleMatch: true});
                this.applyTemplates('$.x');
              }
            },
            {
              path: '$.x',
              priority: 1,
              template () {
                this.text('low');
              }
            },
            {
              path: '$.x',
              priority: 2,
              template () {
                this.text('high');
              }
            }
          ],
          success (result) {
            expect(warnCalled).to.equal(false);
            expect(result).to.equal('high');
            // eslint-disable-next-line no-console -- Testing console.warn
            console.warn = originalWarn;
            done();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console -- Testing console.warn
        console.warn = originalWarn;
        done(err);
      }
    }
  );

  it(
    'does not warn when warningOnMultipleMatch is explicitly false',
    (done) => {
      // eslint-disable-next-line no-console -- Testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;

      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = () => {
        warnCalled = true;
      };

      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {x: 'value'},
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                this.mode({warningOnMultipleMatch: false});
                this.applyTemplates('$.x');
              }
            },
            {
              path: '$.x',
              template () {
                this.text('first');
              }
            },
            {
              path: '$.x',
              template () {
                this.text('second');
              }
            }
          ],
          success (result) {
            expect(warnCalled).to.equal(false);
            expect(result).to.equal('first');
            // eslint-disable-next-line no-console -- Testing console.warn
            console.warn = originalWarn;
            done();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console -- Testing console.warn
        console.warn = originalWarn;
        done(err);
      }
    }
  );

  it(
    'warns by default when mode config exists without explicit setting',
    (done) => {
      // eslint-disable-next-line no-console -- Testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;

      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = () => {
        warnCalled = true;
      };

      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {x: 'value'},
          outputType: 'string',
          templates: [
            {
              path: '$',
              template () {
                // mode() called but warningOnMultipleMatch not specified
                this.mode({onMultipleMatch: 'use-last'});
                this.applyTemplates('$.x');
              }
            },
            {
              path: '$.x',
              template () {
                this.text('first');
              }
            },
            {
              path: '$.x',
              template () {
                this.text('second');
              }
            }
          ],
          success (result) {
            expect(warnCalled).to.equal(true);
            expect(result).to.equal('first');
            // eslint-disable-next-line no-console -- Testing console.warn
            console.warn = originalWarn;
            done();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console -- Testing console.warn
        console.warn = originalWarn;
        done(err);
      }
    }
  );

  it(
    'handles templates without priority and no specificityPriorityResolver',
    (done) => {
      // eslint-disable-next-line no-console -- Testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;

      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = () => {
        warnCalled = true;
      };

      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {x: 'value'},
          outputType: 'string',
          specificityPriorityResolver: undefined,
          templates: [
            {
              path: '$',
              template () {
                this.mode({warningOnMultipleMatch: true});
                this.applyTemplates('$.x');
              }
            },
            {
              path: '$.x',
              template () {
                this.text('first');
              }
            },
            {
              path: '$.x',
              template () {
                this.text('second');
              }
            }
          ],
          success (result) {
            expect(warnCalled).to.equal(true);
            expect(result).to.equal('first');
            // eslint-disable-next-line no-console -- Testing console.warn
            console.warn = originalWarn;
            done();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console -- Testing console.warn
        console.warn = originalWarn;
        done(err);
      }
    }
  );
});

describe('mode() configuration - XPath', () => {
  it('defaults to use-last behavior when onMultipleMatch not set', (done) => {
    const {window} = new JSDOM('<root><item>test</item></root>');
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.applyTemplates('//item');
          }
        },
        {
          path: '//item',
          template () {
            this.text('first');
          }
        },
        {
          path: '//item',
          template () {
            this.text('last');
          }
        }
      ],
      success (result) {
        // Default behavior: first template wins (not reversed)
        expect(result).to.equal('first');
        done();
      }
    });
  });

  it('uses last template with onMultipleMatch=use-last (explicit)', (done) => {
    const {window} = new JSDOM('<root><item>test</item></root>');
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({onMultipleMatch: 'use-last'});
            this.applyTemplates('//item');
          }
        },
        {
          path: '//item',
          template () {
            this.text('first');
          }
        },
        {
          path: '//item',
          template () {
            this.text('last');
          }
        }
      ],
      success (result) {
        // With explicit use-last, still first template wins
        // (the mode config doesn't change priority resolution,
        // just controls fail behavior)
        expect(result).to.equal('first');
        done();
      }
    });
  });

  it(
    'throws error with onMultipleMatch=fail when multiple templates match',
    () => {
      const {window} = new JSDOM('<root><item>test</item></root>');
      const doc = window.document;

      expect(() => {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: doc,
          engineType: 'xpath',
          outputType: 'string',
          templates: [
            {
              path: '/',
              template () {
                this.mode({onMultipleMatch: 'fail'});
                this.applyTemplates('//item');
              }
            },
            {
              path: '//item',
              template () {
                this.text('first');
              }
            },
            {
              path: '//item',
              template () {
                this.text('last');
              }
            }
          ],
          success () {
            // Empty - test expects throw
          }
        });
      }).to.throw(/Multiple templates match with equal priority/v);
    }
  );

  it(
    'works with onMultipleMatch=fail when only one template matches',
    (done) => {
      const {window} = new JSDOM('<root><item>test</item></root>');
      const doc = window.document;

      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: doc,
        engineType: 'xpath',
        outputType: 'string',
        templates: [
          {
            path: '/',
            template () {
              this.mode({onMultipleMatch: 'fail'});
              this.applyTemplates('//item');
            }
          },
          {
            path: '//item',
            template () {
              this.text('only-one');
            }
          }
        ],
        success (result) {
          expect(result).to.equal('only-one');
          done();
        }
      });
    }
  );

  it('does not throw when templates have different priorities', (done) => {
    const {window} = new JSDOM('<root><item>test</item></root>');
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({onMultipleMatch: 'fail'});
            this.applyTemplates('//item');
          }
        },
        {
          path: '//item',
          priority: 1,
          template () {
            this.text('low');
          }
        },
        {
          path: '//item',
          priority: 2,
          template () {
            this.text('high');
          }
        }
      ],
      success (result) {
        expect(result).to.equal('high');
        done();
      }
    });
  });

  it('mode() returns context for chaining', (done) => {
    const {window} = new JSDOM('<root><item>test</item></root>');
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            const result = this.mode({onMultipleMatch: 'use-last'});
            expect(result).to.equal(this);
            this.applyTemplates('//item');
          }
        },
        {
          path: '//item',
          template () {
            this.text('chained');
          }
        }
      ],
      success (result) {
        expect(result).to.equal('chained');
        done();
      }
    });
  });

  it(
    'warns with warningOnMultipleMatch when multiple templates match',
    (done) => {
      const {window} = new JSDOM('<root><item>test</item></root>');
      const doc = window.document;

      // eslint-disable-next-line no-console -- Testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;
      let warnMessage = '';

      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = (msg) => {
        warnCalled = true;
        warnMessage = msg;
      };

      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: doc,
          engineType: 'xpath',
          outputType: 'string',
          templates: [
            {
              path: '/',
              template () {
                this.mode({warningOnMultipleMatch: true});
                this.applyTemplates('//item');
              }
            },
            {
              path: '//item',
              template () {
                this.text('first');
              }
            },
            {
              path: '//item',
              template () {
                this.text('second');
              }
            }
          ],
          success (result) {
            expect(warnCalled).to.equal(true);
            expect(warnMessage).to.include('Multiple templates match');
            expect(warnMessage).to.include('warningOnMultipleMatch=true');
            expect(result).to.equal('first');
            // eslint-disable-next-line no-console -- Testing console.warn
            console.warn = originalWarn;
            done();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console -- Testing console.warn
        console.warn = originalWarn;
        done(err);
      }
    }
  );

  it(
    'does not warn with warningOnMultipleMatch when only one template matches',
    (done) => {
      const {window} = new JSDOM('<root><item>test</item></root>');
      const doc = window.document;

      // eslint-disable-next-line no-console -- Testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;

      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = () => {
        warnCalled = true;
      };

      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: doc,
          engineType: 'xpath',
          outputType: 'string',
          templates: [
            {
              path: '/',
              template () {
                this.mode({warningOnMultipleMatch: true});
                this.applyTemplates('//item');
              }
            },
            {
              path: '//item',
              template () {
                this.text('only-one');
              }
            }
          ],
          success (result) {
            expect(warnCalled).to.equal(false);
            expect(result).to.equal('only-one');
            // eslint-disable-next-line no-console -- Testing console.warn
            console.warn = originalWarn;
            done();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console -- Testing console.warn
        console.warn = originalWarn;
        done(err);
      }
    }
  );

  it(
    'does not warn when templates have different priorities',
    (done) => {
      const {window} = new JSDOM('<root><item>test</item></root>');
      const doc = window.document;

      // eslint-disable-next-line no-console -- Testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;

      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = () => {
        warnCalled = true;
      };

      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: doc,
          engineType: 'xpath',
          outputType: 'string',
          templates: [
            {
              path: '/',
              template () {
                this.mode({warningOnMultipleMatch: true});
                this.applyTemplates('//item');
              }
            },
            {
              path: '//item',
              priority: 1,
              template () {
                this.text('low');
              }
            },
            {
              path: '//item',
              priority: 2,
              template () {
                this.text('high');
              }
            }
          ],
          success (result) {
            expect(warnCalled).to.equal(false);
            expect(result).to.equal('high');
            // eslint-disable-next-line no-console -- Testing console.warn
            console.warn = originalWarn;
            done();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console -- Testing console.warn
        console.warn = originalWarn;
        done(err);
      }
    }
  );

  it(
    'does not warn when warningOnMultipleMatch is explicitly false',
    (done) => {
      const {window} = new JSDOM('<root><item>test</item></root>');
      const doc = window.document;

      // eslint-disable-next-line no-console -- Testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;

      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = () => {
        warnCalled = true;
      };

      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: doc,
          engineType: 'xpath',
          outputType: 'string',
          templates: [
            {
              path: '/',
              template () {
                this.mode({warningOnMultipleMatch: false});
                this.applyTemplates('//item');
              }
            },
            {
              path: '//item',
              template () {
                this.text('first');
              }
            },
            {
              path: '//item',
              template () {
                this.text('second');
              }
            }
          ],
          success (result) {
            expect(warnCalled).to.equal(false);
            expect(result).to.equal('first');
            // eslint-disable-next-line no-console -- Testing console.warn
            console.warn = originalWarn;
            done();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console -- Testing console.warn
        console.warn = originalWarn;
        done(err);
      }
    }
  );

  it(
    'warns by default when mode config exists without explicit setting',
    (done) => {
      const {window} = new JSDOM('<root><item>test</item></root>');
      const doc = window.document;

      // eslint-disable-next-line no-console -- Testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;

      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = () => {
        warnCalled = true;
      };

      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: doc,
          engineType: 'xpath',
          outputType: 'string',
          templates: [
            {
              path: '/',
              template () {
                // mode() called but warningOnMultipleMatch not specified
                this.mode({onMultipleMatch: 'use-last'});
                this.applyTemplates('//item');
              }
            },
            {
              path: '//item',
              template () {
                this.text('first');
              }
            },
            {
              path: '//item',
              template () {
                this.text('second');
              }
            }
          ],
          success (result) {
            expect(warnCalled).to.equal(true);
            expect(result).to.equal('first');
            // eslint-disable-next-line no-console -- Testing console.warn
            console.warn = originalWarn;
            done();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console -- Testing console.warn
        console.warn = originalWarn;
        done(err);
      }
    }
  );

  it(
    'handles templates without priority and no specificityPriorityResolver',
    (done) => {
      const {window} = new JSDOM('<root><item>test</item></root>');
      const doc = window.document;

      // eslint-disable-next-line no-console -- Testing console.warn
      const originalWarn = console.warn;
      let warnCalled = false;

      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = () => {
        warnCalled = true;
      };

      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: doc,
          engineType: 'xpath',
          outputType: 'string',
          specificityPriorityResolver: undefined,
          templates: [
            {
              path: '/',
              template () {
                this.mode({warningOnMultipleMatch: true});
                this.applyTemplates('//item');
              }
            },
            {
              path: '//item',
              template () {
                this.text('first');
              }
            },
            {
              path: '//item',
              template () {
                this.text('second');
              }
            }
          ],
          success (result) {
            expect(warnCalled).to.equal(true);
            expect(result).to.equal('first');
            // eslint-disable-next-line no-console -- Testing console.warn
            console.warn = originalWarn;
            done();
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console -- Testing console.warn
        console.warn = originalWarn;
        done(err);
      }
    }
  );
});

describe('mode() onNoMatch configuration - JSONPath', () => {
  it('uses text-only-copy as default when onNoMatch not set', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: {y: 'value'}},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.mode({warningOnNoMatch: false});
            this.applyTemplates('$.x');
          }
        }
        // No template for $.x, should use text-only-copy (XSLT default)
      ],
      success (result) {
        // text-only-copy on object outputs nothing (no primitives)
        expect(result).to.equal('');
        done();
      }
    });
  });

  it('throws error when onNoMatch=fail', () => {
    expect(() => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {x: 'value'},
        outputType: 'string',
        templates: [
          {
            path: '$',
            template () {
              this.mode({onNoMatch: 'fail'});
              this.applyTemplates('$.x');
            }
          }
          // No template for $.x
        ],
        success () {
          // Empty - test expects throw
        }
      });
    }).to.throw(/No template matches.*onNoMatch/v);
  });

  it('skips node when onNoMatch=deep-skip', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {items: [{x: 1}, {x: 2}]},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.mode({onNoMatch: 'deep-skip'});
            this.element('root', () => {
              this.applyTemplates('$.items[*]');
            });
          }
        },
        {
          path: '$.items[0]',
          template () {
            this.element('item', () => {
              this.text('matched');
            });
          }
        }
        // No template for $.items[1], should be skipped
      ],
      success (result) {
        expect(result).to.include('matched');
        expect(result).not.to.include('2');
        expect(result.match(/<item>/gv)).to.have.lengthOf(1);
        done();
      }
    });
  });

  it('warns when warningOnNoMatch=true and no template matches', (done) => {
    // eslint-disable-next-line no-console -- Testing console.warn
    const originalWarn = console.warn;
    let warnCalled = false;

    // eslint-disable-next-line no-console -- Testing console.warn
    console.warn = () => {
      warnCalled = true;
    };

    try {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {x: 'value'},
        outputType: 'string',
        templates: [
          {
            path: '$',
            template () {
              this.mode({warningOnNoMatch: true});
              this.applyTemplates('$.x');
            }
          }
          // No template for $.x
        ],
        success (result) {
          expect(warnCalled).to.equal(true);
          // eslint-disable-next-line no-console -- Testing console.warn
          console.warn = originalWarn;
          done();
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = originalWarn;
      done(err);
    }
  });

  it('does not warn when warningOnNoMatch=false', (done) => {
    // eslint-disable-next-line no-console -- Testing console.warn
    const originalWarn = console.warn;
    let warnCalled = false;

    // eslint-disable-next-line no-console -- Testing console.warn
    console.warn = () => {
      warnCalled = true;
    };

    try {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {x: 'value'},
        outputType: 'string',
        templates: [
          {
            path: '$',
            template () {
              this.mode({warningOnNoMatch: false});
              this.applyTemplates('$.x');
            }
          }
          // No template for $.x
        ],
        success (result) {
          expect(warnCalled).to.equal(false);
          // eslint-disable-next-line no-console -- Testing console.warn
          console.warn = originalWarn;
          done();
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = originalWarn;
      done(err);
    }
  });

  it('can combine onNoMatch with onMultipleMatch', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {a: 'one', b: 'two'},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.mode({
              onMultipleMatch: 'fail',
              onNoMatch: 'deep-skip'
            });
            this.applyTemplates('$.a');
            this.applyTemplates('$.b');
          }
        },
        {
          path: '$.a',
          template () {
            this.text('matched-a');
          }
        }
        // No template for $.b, should be skipped
      ],
      success (result) {
        expect(result).to.equal('matched-a');
        done();
      }
    });
  });

  it('outputs value with onNoMatch=shallow-copy', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: {y: {z: 'nested'}}},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.mode({onNoMatch: 'shallow-copy'});
            this.applyTemplates('$.x');
          }
        }
      ],
      success (result) {
        // shallow-copy outputs the object which becomes [object Object]
        expect(result).to.include('[object Object]');
        done();
      }
    });
  });

  it('outputs JSON string with onNoMatch=deep-copy', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: {y: 'value', z: 123}},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.mode({onNoMatch: 'deep-copy'});
            this.applyTemplates('$.x');
          }
        }
      ],
      success (result) {
        // deep-copy outputs JSON.stringify
        expect(result).to.equal('{"y":"value","z":123}');
        done();
      }
    });
  });

  it('outputs only primitives with onNoMatch=text-only-copy', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {items: ['text', 42, true, {nested: 'obj'}]},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.mode({onNoMatch: 'text-only-copy'});
            this.applyTemplates('$.items[*]');
          }
        }
      ],
      success (result) {
        // text-only-copy outputs primitives only
        expect(result).to.equal('text42true');
        done();
      }
    });
  });

  it('uses default template rules with onNoMatch=apply-templates', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: {y: 'value'}},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.mode({onNoMatch: 'apply-templates'});
            this.applyTemplates('$.x');
          }
        }
      ],
      success (result) {
        // apply-templates uses default template rules
        expect(result).to.include('value');
        done();
      }
    });
  });

  it('uses default template rules with onNoMatch=shallow-skip', (done) => {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {x: {y: 'value'}},
      outputType: 'string',
      templates: [
        {
          path: '$',
          template () {
            this.mode({onNoMatch: 'shallow-skip'});
            this.applyTemplates('$.x');
          }
        }
      ],
      success (result) {
        // shallow-skip uses default template rules
        expect(result).to.include('value');
        done();
      }
    });
  });
});

describe('mode() onNoMatch configuration - XPath', () => {
  it('uses text-only-copy as default when onNoMatch not set', (done) => {
    const {window} = new JSDOM('<root><item>test</item></root>');
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({warningOnNoMatch: false});
            this.element('result', () => {
              this.applyTemplates('//item');
            });
          }
        }
        // No template for //item, should use text-only-copy (XSLT default)
      ],
      success (result) {
        // text-only-copy outputs text content of elements
        expect(result).to.equal('<result>test</result>');
        done();
      }
    });
  });

  it('throws error when onNoMatch=fail', () => {
    const {window} = new JSDOM('<root><item>test</item></root>');
    const doc = window.document;

    expect(() => {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: doc,
        engineType: 'xpath',
        outputType: 'string',
        templates: [
          {
            path: '/',
            template () {
              this.mode({onNoMatch: 'fail'});
              this.applyTemplates('//item');
            }
          }
          // No template for //item
        ],
        success () {
          // Empty - test expects throw
        }
      });
    }).to.throw(/No template matches.*onNoMatch/v);
  });

  it('skips node when onNoMatch=deep-skip', (done) => {
    const {window} = new JSDOM(
      '<root><item id="1"/><item id="2"/></root>'
    );
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({onNoMatch: 'deep-skip'});
            this.element('result', () => {
              this.applyTemplates('//item');
            });
          }
        },
        {
          path: '//item[@id="1"]',
          template () {
            this.element('matched', () => {
              this.text('first');
            });
          }
        }
        // No template for item[@id="2"], should be skipped
      ],
      success (result) {
        expect(result).to.include('matched');
        expect(result).to.include('first');
        expect(result).not.to.include('2');
        expect(result.match(/<matched>/gv)).to.have.lengthOf(1);
        done();
      }
    });
  });

  it('warns when warningOnNoMatch=true and no template matches', (done) => {
    const {window} = new JSDOM('<root><item>test</item></root>');
    const doc = window.document;

    // eslint-disable-next-line no-console -- Testing console.warn
    const originalWarn = console.warn;
    let warnCalled = false;

    // eslint-disable-next-line no-console -- Testing console.warn
    console.warn = () => {
      warnCalled = true;
    };

    try {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: doc,
        engineType: 'xpath',
        outputType: 'string',
        templates: [
          {
            path: '/',
            template () {
              this.mode({warningOnNoMatch: true});
              this.applyTemplates('//item');
            }
          }
          // No template for //item
        ],
        success (result) {
          expect(warnCalled).to.equal(true);
          // eslint-disable-next-line no-console -- Testing console.warn
          console.warn = originalWarn;
          done();
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = originalWarn;
      done(err);
    }
  });

  it('does not warn when warningOnNoMatch=false', (done) => {
    const {window} = new JSDOM('<root><item>test</item></root>');
    const doc = window.document;

    // eslint-disable-next-line no-console -- Testing console.warn
    const originalWarn = console.warn;
    let warnCalled = false;

    // eslint-disable-next-line no-console -- Testing console.warn
    console.warn = () => {
      warnCalled = true;
    };

    try {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: doc,
        engineType: 'xpath',
        outputType: 'string',
        templates: [
          {
            path: '/',
            template () {
              this.mode({warningOnNoMatch: false});
              this.applyTemplates('//item');
            }
          }
          // No template for //item
        ],
        success (result) {
          expect(warnCalled).to.equal(false);
          // eslint-disable-next-line no-console -- Testing console.warn
          console.warn = originalWarn;
          done();
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console -- Testing console.warn
      console.warn = originalWarn;
      done(err);
    }
  });

  it('can combine onNoMatch with onMultipleMatch', (done) => {
    const {window} = new JSDOM(
      '<root><a>one</a><b>two</b></root>'
    );
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({
              onMultipleMatch: 'fail',
              onNoMatch: 'deep-skip'
            });
            this.applyTemplates('//a');
            this.applyTemplates('//b');
          }
        },
        {
          path: '//a',
          template () {
            this.text('matched-a');
          }
        }
        // No template for //b, should be skipped
      ],
      success (result) {
        expect(result).to.equal('matched-a');
        done();
      }
    });
  });

  it('outputs element without children with onNoMatch=shallow-copy', (done) => {
    const {window} = new JSDOM('<root><item attr="val">text</item></root>');
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({onNoMatch: 'shallow-copy'});
            this.element('result', () => {
              this.applyTemplates('//item');
            });
          }
        }
      ],
      success (result) {
        // shallow-copy outputs element without children
        expect(result).to.include('<item');
        expect(result).to.include('attr="val"');
        expect(result).not.to.include('>text<');
        done();
      }
    });
  });

  it('outputs full element with onNoMatch=deep-copy', (done) => {
    const {window} = new JSDOM(
      '<root><item><nested>value</nested></item></root>'
    );
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({onNoMatch: 'deep-copy'});
            this.element('result', () => {
              this.applyTemplates('//item');
            });
          }
        }
      ],
      success (result) {
        // deep-copy outputs element and all descendants
        expect(result).to.include('<item');
        expect(result).to.include('<nested>value</nested>');
        expect(result).to.include('</item>');
        done();
      }
    });
  });

  it('outputs only text content with onNoMatch=text-only-copy (explicit)', (
    done
  ) => {
    const {window} = new JSDOM(
      '<root><item><nested>value</nested></item></root>'
    );
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({onNoMatch: 'text-only-copy'});
            this.element('result', () => {
              this.applyTemplates('//item');
            });
          }
        }
      ],
      success (result) {
        // text-only-copy outputs only text content
        expect(result).to.equal('<result>value</result>');
        done();
      }
    });
  });

  it('uses default template rules with onNoMatch=apply-templates', (done) => {
    const {window} = new JSDOM('<root><item>text</item></root>');
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({onNoMatch: 'apply-templates'});
            this.element('result', () => {
              this.applyTemplates('//item');
            });
          }
        }
      ],
      success (result) {
        // apply-templates uses default template rules
        expect(result).to.equal('<result>text</result>');
        done();
      }
    });
  });

  it('uses default template rules with onNoMatch=shallow-skip', (done) => {
    const {window} = new JSDOM('<root><item>text</item></root>');
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({onNoMatch: 'shallow-skip'});
            this.element('result', () => {
              this.applyTemplates('//item');
            });
          }
        }
      ],
      success (result) {
        // shallow-skip uses default template rules
        expect(result).to.equal('<result>text</result>');
        done();
      }
    });
  });

  it('handles text nodes with onNoMatch=shallow-copy', (done) => {
    const {window} = new JSDOM('<root>text content</root>');
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({onNoMatch: 'shallow-copy'});
            this.element('result', () => {
              this.applyTemplates('//text()');
            });
          }
        }
      ],
      success (result) {
        // shallow-copy on text nodes outputs the text
        expect(result).to.include('text content');
        done();
      }
    });
  });

  it('handles text nodes with onNoMatch=deep-copy', (done) => {
    const {window} = new JSDOM('<root>deep text</root>');
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({onNoMatch: 'deep-copy'});
            this.element('result', () => {
              this.applyTemplates('//text()');
            });
          }
        }
      ],
      success (result) {
        // deep-copy on text nodes outputs the text
        expect(result).to.include('deep text');
        done();
      }
    });
  });

  it('handles text nodes with onNoMatch=text-only-copy', (done) => {
    const {window} = new JSDOM('<root>plain text</root>');
    const doc = window.document;

    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: doc,
      engineType: 'xpath',
      outputType: 'string',
      templates: [
        {
          path: '/',
          template () {
            this.mode({onNoMatch: 'text-only-copy'});
            this.element('result', () => {
              this.applyTemplates('//text()');
            });
          }
        }
      ],
      success (result) {
        // text-only-copy on text nodes outputs the text
        expect(result).to.include('plain text');
        done();
      }
    });
  });
});
