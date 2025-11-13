import {expect} from 'chai';
import JTLT from '../src/index-node.js';

describe('JSONPathTransformerContext analyzeString', () => {
  it('should split text on newlines', function splitNewlines (done) {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {text: 'Line 1\nLine 2\nLine 3'},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.analyzeString(this.get('$.text', false), /\n/v, {
            matchingSubstring () {
              this.string('<br/>');
            },
            nonMatchingSubstring (substring) {
              this.string(substring);
            }
          });
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('Line 1<br/>Line 2<br/>Line 3');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it(
    'should extract content from square brackets',
    function extractBrackets (done) {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: 'Some [cited] text with [multiple] citations'},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.analyzeString(
              this.get('$.text', false),
              /\[(?<bracket>.*?)\]/v,
              {
                matchingSubstring (substring, groups, regexGroup) {
                  this.string('<cite>');
                  this.string(regexGroup(1));
                  this.string('</cite>');
                },
                nonMatchingSubstring (substring) {
                  this.string(substring);
                }
              }
            );
          }
        }],
        success (result) {
          try {
            expect(result).to.equal(
              'Some <cite>cited</cite> text with ' +
              '<cite>multiple</cite> citations'
            );
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it('should handle empty string input', function emptyString (done) {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {text: ''},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.analyzeString(this.get('$.text', false), /\n/v, {
            matchingSubstring () {
              this.string('MATCH');
            },
            nonMatchingSubstring () {
              this.string('NOMATCH');
            }
          });
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it('should parse date format', function parseDate (done) {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {date: '23 March 2002'},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          this.analyzeString(
            this.get('$.date', false),
            /(?<day>\d{1,2})\s(?<month>[A-Z][a-z]+)\s(?<year>\d{4})/v,
            {
              matchingSubstring (substring, groups, regexGroup) {
                const day = regexGroup(1).padStart(2, '0');
                const monthName = regexGroup(2);
                const year = regexGroup(3);
                const monthNum = String(
                  months.indexOf(monthName) + 1
                ).padStart(2, '0');
                this.string(`${year}-${monthNum}-${day}`);
              }
            }
          );
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('2002-03-23');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it(
    'should handle text with only non-matching parts',
    function onlyNonMatch (done) {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: 'No digits here'},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.analyzeString(this.get('$.text', false), /\d+/v, {
              matchingSubstring (substring) {
                this.string('[' + substring + ']');
              },
              nonMatchingSubstring (substring) {
                this.string(substring);
              }
            });
          }
        }],
        success (result) {
          try {
            expect(result).to.equal('No digits here');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it('should handle text with only matching parts', function onlyMatch (done) {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {text: '123'},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.analyzeString(this.get('$.text', false), /\d+/v, {
            matchingSubstring (substring) {
              this.string('[' + substring + ']');
            },
            nonMatchingSubstring (substring) {
              this.string(substring);
            }
          });
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('[123]');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it(
    'should throw on zero-length matching regex',
    function zeroLength (done) {
      try {
        // eslint-disable-next-line no-new -- exercising API
        new JTLT({
          data: {text: 'test'},
          outputType: 'string',
          templates: [{
            path: '$',
            template () {
              this.analyzeString(this.get('$.text', false), /.*/v, {
                matchingSubstring (substring) {
                  this.string(substring);
                }
              });
            }
          }],
          success () {
            done(new Error('Should have thrown'));
          }
        });
      } catch (err) {
        expect((/** @type {Error} */ (err)).message).to.include(
          'zero-length'
        );
        done();
      }
    }
  );

  it('should work with string regex and flags', function stringRegex (done) {
    // eslint-disable-next-line no-new -- exercising API
    new JTLT({
      data: {text: 'Test TEST test'},
      outputType: 'string',
      templates: [{
        path: '$',
        template () {
          this.analyzeString(this.get('$.text', false), 'test', {
            flags: 'iv',
            matchingSubstring (substring) {
              this.string('[' + substring + ']');
            },
            nonMatchingSubstring (substring) {
              this.string(substring);
            }
          });
        }
      }],
      success (result) {
        try {
          expect(result).to.equal('[Test] [TEST] [test]');
          done();
        } catch (err) {
          done(err);
        }
      }
    });
  });

  it(
    'should handle multiple capturing groups',
    function multipleGroups (done) {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: 'Name: John, Age: 30'},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.analyzeString(
              this.get('$.text', false),
              /(?<key>\w+):\s*(?<value>\w+)/v,
              {
                matchingSubstring (substring, groups, regexGroup) {
                  this.string(regexGroup(1) + '=' + regexGroup(2) + '; ');
                }
              }
            );
          }
        }],
        success (result) {
          try {
            expect(result).to.equal('Name=John; Age=30; ');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it(
    'should handle context object during processing',
    function contextObj (done) {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: 'a1b2c3'},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.analyzeString(this.get('$.text', false), /\d/v, {
              matchingSubstring (substring) {
                // Context should be the matching substring
                this.string('[' + String(this._contextObj) + ']');
              },
              nonMatchingSubstring (substring) {
                // Context should be the non-matching substring
                this.string(String(this._contextObj));
              }
            });
          }
        }],
        success (result) {
          try {
            expect(result).to.equal('a[1]b[2]c[3]');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it(
    'should return empty string for invalid regex groups',
    function invalidGroups (done) {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: 'test123'},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.analyzeString(
              this.get('$.text', false),
              /(?<word>[a-z]+)(?<num>\d+)/v,
              {
                matchingSubstring (substring, groups, regexGroup) {
                  // Test various invalid group accesses
                  this.string(regexGroup(-1)); // Negative index
                  this.string(regexGroup(99)); // Out of bounds
                  this.string(regexGroup(1)); // Valid
                  this.string(',');
                  this.string(regexGroup(2)); // Valid
                }
              }
            );
          }
        }],
        success (result) {
          try {
            expect(result).to.equal('test,123');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it(
    'should handle regex that could cause infinite loop',
    function preventInfiniteLoop (done) {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: 'abc'},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            // Use a regex that matches positions (lookahead)
            // This tests the defensive lastIndex++ code
            this.analyzeString(
              this.get('$.text', false),
              /(?=\w)/v,
              {
                matchingSubstring (substring) {
                  this.string('[' + substring + ']');
                },
                nonMatchingSubstring (substring) {
                  this.string(substring);
                }
              }
            );
          }
        }],
        success (result) {
          try {
            // Should complete without hanging
            expect(result).to.be.a('string');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it(
    'should handle string regex with g flag already present',
    function gFlagPresent (done) {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: 'a b c'},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.analyzeString(this.get('$.text', false), String.raw`\w`, {
              flags: 'v',
              matchingSubstring (substring) {
                this.string('[' + substring + ']');
              },
              nonMatchingSubstring (substring) {
                this.string(substring);
              }
            });
          }
        }],
        success (result) {
          try {
            expect(result).to.equal('[a] [b] [c]');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it(
    'should preserve g flag when already in flags string',
    function preserveGFlag (done) {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: '1 2 3'},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.analyzeString(this.get('$.text', false), String.raw`\d`, {
              flags: 'gv',
              matchingSubstring (substring) {
                this.string('(' + substring + ')');
              },
              nonMatchingSubstring (substring) {
                this.string(substring);
              }
            });
          }
        }],
        success (result) {
          try {
            expect(result).to.equal('(1) (2) (3)');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it(
    'should handle RegExp with global flag already set',
    function regexGlobal (done) {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: 'x y z'},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.analyzeString(this.get('$.text', false), /\w/gv, {
              matchingSubstring (substring) {
                this.string('<' + substring + '>');
              },
              nonMatchingSubstring (substring) {
                this.string(substring);
              }
            });
          }
        }],
        success (result) {
          try {
            expect(result).to.equal('<x> <y> <z>');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it(
    'should handle only nonMatchingSubstring callback',
    function onlyNonMatching (done) {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: 'hello123world'},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.analyzeString(this.get('$.text', false), /\d+/v, {
              nonMatchingSubstring (substring) {
                this.string('[' + substring + ']');
              }
            });
          }
        }],
        success (result) {
          try {
            expect(result).to.equal('[hello][world]');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it(
    'should handle only matchingSubstring callback',
    function onlyMatching (done) {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: 'abc123def'},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            this.analyzeString(this.get('$.text', false), /\d+/v, {
              matchingSubstring (substring) {
                this.string('[' + substring + ']');
              }
            });
          }
        }],
        success (result) {
          try {
            expect(result).to.equal('[123]');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );

  it(
    'should handle empty captured groups',
    function emptyGroups (done) {
      // eslint-disable-next-line no-new -- exercising API
      new JTLT({
        data: {text: 'test  space'},
        outputType: 'string',
        templates: [{
          path: '$',
          template () {
            // Optional group that might capture nothing
            this.analyzeString(
              this.get('$.text', false),
              /(?<word>\w+)(?<space>\s*)/v,
              {
                matchingSubstring (substring, groups, regexGroup) {
                  const word = regexGroup(1);
                  const space = regexGroup(2);
                  this.string('[' + word + '][' + space + ']');
                }
              }
            );
          }
        }],
        success (result) {
          try {
            expect(result).to.include('[test]');
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    }
  );
});
