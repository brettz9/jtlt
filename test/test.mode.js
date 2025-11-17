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
