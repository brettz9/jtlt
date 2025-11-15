import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import JSONPathTransformer from '../src/JSONPathTransformer.js';
import XPathTransformer from '../src/XPathTransformer.js';
import StringJoiningTransformer from '../src/StringJoiningTransformer.js';

describe('forEachGroup() function', function () {
  describe('JSONPathTransformer', function () {
    it('should group by value with groupBy', function () {
      const data = {
        items: [
          {name: 'Alice', department: 'Engineering'},
          {name: 'Bob', department: 'Sales'},
          {name: 'Charlie', department: 'Engineering'},
          {name: 'Diana', department: 'Sales'}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEachGroup(
                '$.items[*]',
                {groupBy: '$.department'},
                function (key, items) {
                  this.element('group', {dept: key}, [], () => {
                    items.forEach((item) => {
                      this.element('person', {}, [], () => {
                        this.text(item.name);
                      });
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      expect(result).to.include('<group dept="Engineering">');
      expect(result).to.include('<person>Alice</person>');
      expect(result).to.include('<person>Charlie</person>');
      expect(result).to.include('<group dept="Sales">');
      expect(result).to.include('<person>Bob</person>');
      expect(result).to.include('<person>Diana</person>');
    });

    it('should group adjacent items with groupAdjacent', function () {
      const data = {
        items: [
          {name: 'Alice', status: 'active'},
          {name: 'Bob', status: 'active'},
          {name: 'Charlie', status: 'inactive'},
          {name: 'Diana', status: 'active'}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              /** @type {Array<{key: any, count: number}>} */
              const groups = [];
              this.forEachGroup(
                '$.items[*]',
                {groupAdjacent: '$.status'},
                function (key, items) {
                  groups.push({key, count: items.length});
                }
              );
              this.element('result', {}, [], () => {
                this.text(JSON.stringify(groups));
              });
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      expect(result).to.include('"key":"active"');
      expect(result).to.include('"count":2');
      expect(result).to.include('"key":"inactive"');
      expect(result).to.include('"count":1');
    });

    it('should use groupStartingWith to start new groups', function () {
      const data = {
        items: [
          {type: 'header', text: 'Section 1', isHeader: true},
          {type: 'content', text: 'Item 1', isHeader: false},
          {type: 'content', text: 'Item 2', isHeader: false},
          {type: 'header', text: 'Section 2', isHeader: true},
          {type: 'content', text: 'Item 3', isHeader: false}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              let groupCount = 0;
              this.forEachGroup(
                '$.items[*]',
                {groupStartingWith: '$.isHeader'},
                function (key, items) {
                  groupCount++;
                  this.element('section', {}, [], () => {
                    this.element('title', {}, [], () => {
                      this.text(items[0].text);
                    });
                    this.element('count', {}, [], () => {
                      this.text(String(items.length));
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      expect(result).to.include('<title>Section 1</title>');
      expect(result).to.include('<count>3</count>');
      expect(result).to.include('<title>Section 2</title>');
      expect(result).to.include('<count>2</count>');
    });

    it('should use groupEndingWith to end groups', function () {
      const data = {
        items: [
          {text: 'Line 1', endLine: false},
          {text: 'Line 2', endLine: true},
          {text: 'Line 3', endLine: false},
          {text: 'Line 4', endLine: true}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              let groupCount = 0;
              this.forEachGroup(
                '$.items[*]',
                {groupEndingWith: '$.endLine'},
                function (key, items) {
                  groupCount++;
                  this.element('group', {}, [], () => {
                    items.forEach((item) => {
                      this.element('line', {}, [], () => {
                        this.text(item.text);
                      });
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      expect(result).to.include('<line>Line 1</line>');
      expect(result).to.include('<line>Line 2</line>');
      expect(result).to.match(
        /<group>.*<line>Line 1<\/line>.*<line>Line 2<\/line>.*<\/group>/sv
      );
      expect(result).to.match(
        /<group>.*<line>Line 3<\/line>.*<line>Line 4<\/line>.*<\/group>/sv
      );
    });

    it('should provide currentGroup() and currentGroupingKey()', function () {
      const data = {
        items: [
          {name: 'Alice', category: 'A'},
          {name: 'Bob', category: 'B'},
          {name: 'Charlie', category: 'A'}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEachGroup(
                '$.items[*]',
                {groupBy: '$.category'},
                function () {
                  const key = this.currentGroupingKey();
                  const group = this.currentGroup();
                  this.element('group', {}, [], () => {
                    this.element('key', {}, [], () => {
                      this.text(String(key));
                    });
                    this.element('size', {}, [], () => {
                      this.text(String(group?.length ?? 0));
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      expect(result).to.include('<key>A</key>');
      expect(result).to.include('<size>2</size>');
      expect(result).to.include('<key>B</key>');
      expect(result).to.include('<size>1</size>');
    });
  });

  describe('XPathTransformer', function () {
    it('should group by value with groupBy', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item dept="Engineering">Alice</item>
          <item dept="Sales">Bob</item>
          <item dept="Engineering">Charlie</item>
          <item dept="Sales">Diana</item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupBy: '@dept'},
                function (key, items) {
                  this.element('group', {dept: key}, [], () => {
                    items.forEach((node) => {
                      this.element('person', {}, [], () => {
                        this.text(/** @type {string} */ (node.textContent));
                      });
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      expect(result).to.include('<group dept="Engineering">');
      expect(result).to.include('<person>Alice</person>');
      expect(result).to.include('<person>Charlie</person>');
      expect(result).to.include('<group dept="Sales">');
      expect(result).to.include('<person>Bob</person>');
      expect(result).to.include('<person>Diana</person>');
    });

    it('should group adjacent items with groupAdjacent', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item status="active">Alice</item>
          <item status="active">Bob</item>
          <item status="inactive">Charlie</item>
          <item status="active">Diana</item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupAdjacent: '@status'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {status: key}, [], () => {
                    this.element('count', {}, [], () => {
                      this.text(String(items.length));
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      expect(result).to.include('<group status="active">');
      expect(result).to.include('<count>2</count>');
      expect(result).to.include('<group status="inactive">');
      expect(result).to.include('<count>1</count>');
    });

    it('should use groupStartingWith', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item type="header">Section 1</item>
          <item type="content">Item 1</item>
          <item type="header">Section 2</item>
          <item type="content">Item 2</item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupStartingWith: '@type = "header"'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('section', {}, [], () => {
                    this.element('size', {}, [], () => {
                      this.text(String(items.length));
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      expect(result).to.include('<size>2</size>');
    });

    it('should provide currentGroup() and currentGroupingKey()', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item cat="A">Alice</item>
          <item cat="B">Bob</item>
          <item cat="A">Charlie</item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupBy: '@cat'},
                /**
                 * @this {any}
                 * @returns {void}
                 */
                function () {
                  const key = this.currentGroupingKey();
                  const group = this.currentGroup();
                  this.element('group', {}, [], () => {
                    this.element('key', {}, [], () => {
                      this.text(String(key));
                    });
                    this.element('size', {}, [], () => {
                      this.text(String(group?.length ?? 0));
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      expect(result).to.include('<key>A</key>');
      expect(result).to.include('<size>2</size>');
      expect(result).to.include('<key>B</key>');
      expect(result).to.include('<size>1</size>');
    });

    it('should support groupEndingWith', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item end="false">A</item>
          <item end="true">B</item>
          <item end="false">C</item>
          <item end="true">D</item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupEndingWith: '@end = "true"'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('section', {}, [], () => {
                    this.element('size', {}, [], () => {
                      this.text(String(items.length));
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      expect(result).to.include('<size>2</size>');
    });
  });

  describe('Edge cases and sorting', function () {
    it('should handle sorting with forEachGroup in JSONPath', function () {
      const data = {
        items: [
          {name: 'Charlie', dept: 'Sales'},
          {name: 'Alice', dept: 'Engineering'},
          {name: 'Bob', dept: 'Engineering'}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEachGroup(
                '$.items[*]',
                {
                  groupBy: '$.dept',
                  sort: '$.name'
                },
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {}, [], () => {
                    items.forEach((item) => {
                      this.element('name', {}, [], () => {
                        this.text(item.name);
                      });
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      expect(result).to.include('<name>Alice</name>');
      expect(result).to.include('<name>Bob</name>');
      expect(result).to.include('<name>Charlie</name>');
    });

    it('should handle sorting with multiple criteria', function () {
      const data = {
        items: [
          {name: 'Charlie', dept: 'Sales', age: 30},
          {name: 'Alice', dept: 'Engineering', age: 25},
          {name: 'Bob', dept: 'Engineering', age: 28}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEachGroup(
                '$.items[*]',
                {
                  groupBy: '$.dept',
                  sort: [
                    {select: '$.age', type: 'number', order: 'descending'}
                  ]
                },
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {}, [], () => {
                    for (const item of items) {
                      this.element('person', {}, [], () => {
                        this.text(`${item.name}-${item.age}`);
                      });
                    }
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      expect(result).to.include('Bob-28');
      expect(result).to.include('Alice-25');
    });

    it('should handle sorting with function comparator', function () {
      const data = {
        items: [
          {name: 'Charlie', value: 5},
          {name: 'Alice', value: 10},
          {name: 'Bob', value: 3}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEachGroup(
                '$.items[*]',
                {
                  groupBy: '$.name',
                  sort:
                  /**
                   * @param {any} a
                   * @param {any} b
                   * @returns {number}
                   */
                  (a, b) => a.value - b.value
                },
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {}, [], () => {
                    for (const item of items) {
                      this.element('name', {}, [], () => {
                        this.text(item.name);
                      });
                    }
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      // Check that Bob (3) comes before Charlie (5) comes before Alice (10)
      const resultStr = /** @type {string} */ (result);
      const bobIndex = resultStr.indexOf('<name>Bob</name>');
      const charlieIndex = resultStr.indexOf('<name>Charlie</name>');
      const aliceIndex = resultStr.indexOf('<name>Alice</name>');

      expect(bobIndex).to.be.lessThan(charlieIndex);
      expect(charlieIndex).to.be.lessThan(aliceIndex);
    });

    it(
      'should handle groupEndingWith with remaining items in JSONPath',
      function () {
        const data = {
          items: [
            {text: 'A', isEnd: false},
            {text: 'B', isEnd: true},
            {text: 'C', isEnd: false}
          ]
        };

        const result = new JSONPathTransformer({
          templates: [
            {
              path: '$',
              template () {
                this.forEachGroup(
                  '$.items[*]',
                  {groupEndingWith: '$.isEnd'},
                  /**
                   * @param {any} key
                   * @param {any[]} items
                   * @param {any} ctx
                   * @returns {void}
                   */
                  function (key, items, ctx) {
                    this.element('section', {}, [], () => {
                      this.element('count', {}, [], () => {
                        this.text(String(items.length));
                      });
                    });
                  }
                );
              }
            }
          ],
          joiningTransformer: new StringJoiningTransformer(''),
          data
        }).transform();

        // Should have 2 sections: first with 2 items (A,B), second with 1
        //   item (C)
        expect(result).to.match(/<count>2<\/count>/v);
        expect(result).to.match(/<count>1<\/count>/v);
      }
    );

    it(
      'should handle groupStartingWith with remaining items in XPath',
      function () {
        const {window} = new JSDOM('<!doctype html><html><body></body></html>');
        const parser = new window.DOMParser();
        const doc = parser.parseFromString(`
          <root>
            <item start="true">Header1</item>
            <item start="false">Content1</item>
            <item start="true">Header2</item>
          </root>
        `, 'text/xml');

        const result = new XPathTransformer({
          templates: [
            {
              path: '/root',
              template () {
                this.forEachGroup(
                  'item',
                  {groupStartingWith: '@start = "true"'},
                  /**
                   * @param {any} key
                   * @param {any[]} items
                   * @param {any} ctx
                   * @returns {void}
                   */
                  function (key, items, ctx) {
                    this.element('section', {}, [], () => {
                      this.element('size', {}, [], () => {
                        this.text(String(items.length));
                      });
                    });
                  }
                );
              }
            }
          ],
          joiningTransformer: new StringJoiningTransformer(''),
          data: doc,
          xpathVersion: 2
        }).transform();

        // Should have 2 sections: first with 2 items, second with 1 item
        expect(result).to.match(/<size>2<\/size>/v);
        expect(result).to.match(/<size>1<\/size>/v);
      }
    );

    it('should handle XPath evalInContext with NodeList results', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item><value>A</value></item>
          <item><value>B</value></item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupBy: 'value'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {key: String(key)}, [], () => {
                    this.text(String(items.length));
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      expect(result).to.include('<group key="A">');
      expect(result).to.include('<group key="B">');
    });

    it('should handle XPath evalInContext with Node results', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item><cat>X</cat></item>
          <item><cat>Y</cat></item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupBy: 'cat[1]'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {}, [], () => {
                    this.text(String(key));
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      expect(result).to.include('<group>X</group>');
      expect(result).to.include('<group>Y</group>');
    });

    it('should handle sorting with NaN values in JSONPath', function () {
      const data = {
        items: [
          {name: 'Alice', score: 'invalid'},
          {name: 'Bob', score: 10},
          {name: 'Charlie', score: 'notanumber'}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEachGroup(
                '$.items[*]',
                {
                  groupBy: '$.name',
                  sort: {select: '$.score', type: 'number', order: 'ascending'}
                },
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  for (const item of items) {
                    this.element('name', {}, [], () => {
                      this.text(item.name);
                    });
                  }
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      // Bob with valid number should come first, NaN values last
      expect(result).to.include('<name>Bob</name>');
      expect(result).to.include('<name>Alice</name>');
      expect(result).to.include('<name>Charlie</name>');
    });

    it('should handle locale-aware sorting in JSONPath', function () {
      const data = {
        items: [
          {name: 'Äpfel'},
          {name: 'Apfel'},
          {name: 'Zitrone'}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEachGroup(
                '$.items[*]',
                {
                  groupBy: '$.name',
                  sort: {
                    select: '$.name',
                    type: 'text',
                    order: 'ascending',
                    locale: 'de',
                    localeOptions: {sensitivity: 'base'}
                  }
                },
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  for (const item of items) {
                    this.element('name', {}, [], () => {
                      this.text(item.name);
                    });
                  }
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      expect(result).to.include('<name>Äpfel</name>');
      expect(result).to.include('<name>Apfel</name>');
      expect(result).to.include('<name>Zitrone</name>');
    });

    it('should handle sorting with object specs in JSONPath', function () {
      const data = {
        items: [
          {name: 'Charlie', age: 30},
          {name: 'Alice', age: 25},
          {name: 'Bob', age: 25}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEachGroup(
                '$.items[*]',
                {
                  groupBy: '$.name',
                  sort: [
                    {select: '$.age', type: 'number'},
                    '$.name'
                  ]
                },
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  for (const item of items) {
                    this.element('person', {}, [], () => {
                      this.text(`${item.name}-${item.age}`);
                    });
                  }
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      // Sort by age first (25, 25, 30), then by name (Alice, Bob, Charlie)
      const resultStr = /** @type {string} */ (result);
      const aliceIndex = resultStr.indexOf('<person>Alice-25</person>');
      const bobIndex = resultStr.indexOf('<person>Bob-25</person>');
      const charlieIndex = resultStr.indexOf('<person>Charlie-30</person>');

      expect(aliceIndex).to.be.lessThan(bobIndex);
      expect(bobIndex).to.be.lessThan(charlieIndex);
    });

    it('should handle XPath groupEndingWith with leftover items', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item end="false">A</item>
          <item end="true">B</item>
          <item end="false">C</item>
          <item end="false">D</item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupEndingWith: '@end = "true"'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('section', {}, [], () => {
                    this.element('size', {}, [], () => {
                      this.text(String(items.length));
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      // Should have 2 sections: first with 2 items (A,B),
      // second with 2 items (C,D)
      expect(result).to.match(/<size>2<\/size>/v);
    });

    it('should handle XPath evalInContext with empty NodeList', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item category="A">Item1</item>
          <item>Item2</item>
          <item category="B">Item3</item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupBy: '@category'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {}, [], () => {
                    this.element('key', {}, [], () => {
                      this.text(String(key));
                    });
                    this.element('count', {}, [], () => {
                      this.text(String(items.length));
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      // Should group items: A (1 item), undefined (1 item), B (1 item)
      expect(result).to.include('<key>A</key>');
      expect(result).to.include('<key>B</key>');
      expect(result).to.include('<key>undefined</key>');
      expect(result).to.match(/<count>1<\/count>/v);
    });

    it('should handle groupBy with current item selector (@)', function () {
      const data = {
        items: ['A', 'B', 'A', 'C']
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEachGroup(
                '$.items[*]',
                {groupBy: '@'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {}, [], () => {
                    this.element('key', {}, [], () => {
                      this.text(String(key));
                    });
                    this.element('count', {}, [], () => {
                      this.text(String(items.length));
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      expect(result).to.include('<key>A</key>');
      expect(result).to.include('<count>2</count>');
      expect(result).to.include('<key>B</key>');
      expect(result).to.include('<count>1</count>');
    });

    it('should handle groupBy with dot selector (.)', function () {
      const data = {
        items: [1, 2, 1, 3]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEachGroup(
                '$.items[*]',
                {groupBy: '.'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {}, [], () => {
                    this.element('val', {}, [], () => {
                      this.text(String(key));
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      expect(result).to.include('<val>1</val>');
      expect(result).to.include('<val>2</val>');
      expect(result).to.include('<val>3</val>');
    });

    it('should handle empty sortSpec', function () {
      const data = {
        items: [3, 1, 2]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEachGroup(
                '$.items[*]',
                {groupBy: '.', sort: null},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('val', {}, [], () => {
                    this.text(String(key));
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      // Items should be in group order (not sorted)
      expect(result).to.include('<val>3</val>');
      expect(result).to.include('<val>1</val>');
      expect(result).to.include('<val>2</val>');
    });

    it('should handle XPath groupBy with dot selector', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item>A</item>
          <item>B</item>
          <item>A</item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupBy: '.'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {key: String(key)}, [], () => {
                    this.text(String(items.length));
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      expect(result).to.include('key="A"');
      expect(result).to.include('key="B"');
    });

    it('should handle XPath result with no matching nodes', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item>A</item>
          <item>B</item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupBy: 'nonexistent'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {}, [], () => {
                    this.element('key', {}, [], () => {
                      this.text(String(key));
                    });
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      // All items grouped with undefined key
      expect(result).to.include('<key>undefined</key>');
    });

    it('should handle XPath expression returning empty node-set', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item><value>A</value></item>
          <item><value>B</value></item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupBy: 'missing-element'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {}, [], () => {
                    this.text(String(items.length));
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      // All items should be grouped together with undefined key
      expect(result).to.include('<group>2</group>');
    });

    it('should handle XPath expression returning primitive value', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item value="1">A</item>
          <item value="2">B</item>
          <item value="1">C</item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupBy: '@value'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {key: String(key)}, [], () => {
                    this.text(String(items.length));
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      expect(result).to.include('key="1"');
      expect(result).to.include('key="2"');
    });

    it('should handle XPath returning boolean for grouping', function () {
      const {window} = new JSDOM('<!doctype html><html><body></body></html>');
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(`
        <root>
          <item active="true">A</item>
          <item active="false">B</item>
          <item active="true">C</item>
        </root>
      `, 'text/xml');

      const result = new XPathTransformer({
        templates: [
          {
            path: '/root',
            template () {
              this.forEachGroup(
                'item',
                {groupBy: '@active = "true"'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {}, [], () => {
                    this.text(String(items.length));
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data: doc,
        xpathVersion: 2
      }).transform();

      expect(result).to.match(/<group>2<\/group>/v);
      expect(result).to.match(/<group>1<\/group>/v);
    });
  });

  describe('JSONPath branch coverage', function () {
    it('should handle groupBy with undefined values', function () {
      const data = {
        items: [
          {name: 'Alice', category: 'A'},
          {name: 'Bob'}, // No category -> undefined
          {name: 'Charlie', category: 'A'},
          {name: 'David'} // No category -> undefined
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEachGroup(
                '$.items[*]',
                {groupBy: '$.category'},
                /**
                 * @param {any} key
                 * @param {any[]} items
                 * @param {any} ctx
                 * @returns {void}
                 */
                function (key, items, ctx) {
                  this.element('group', {key: String(key)}, [], () => {
                    this.text(String(items.length));
                  });
                }
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      expect(result).to.include('key="A"');
      expect(result).to.include('key="undefined"');
    });

    it('should handle text sorting with null/undefined', function () {
      const data = {
        items: [
          {name: 'Charlie', value: 'c'},
          {name: 'Alice', value: null},
          {name: 'Bob', value: undefined},
          {name: 'David', value: 'd'}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEach(
                '$.items[*]',
                /**
                 * @this {import('../src/JSONPathTransformerContext.js').
                 *   default}
                 * @param {any} item
                 * @returns {void}
                 */
                function (item) {
                  this.element('item', {}, [], () => {
                    this.text(item.name);
                  });
                },
                {select: '$.value', order: 'ascending', type: 'text'}
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      // null and undefined should be treated as empty strings (sort first)
      const resultStr = /** @type {string} */ (result);
      const aliceIndex = resultStr.indexOf('<item>Alice</item>');
      const bobIndex = resultStr.indexOf('<item>Bob</item>');
      const charlieIndex = resultStr.indexOf('<item>Charlie</item>');
      const davidIndex = resultStr.indexOf('<item>David</item>');

      // Empty strings (null/undefined) should come before 'c' and 'd'
      expect(aliceIndex).to.be.lessThan(charlieIndex);
      expect(bobIndex).to.be.lessThan(charlieIndex);
    });

    it('should handle text sorting with equal values', function () {
      const data = {
        items: [
          {name: 'Item1', value: 'same'},
          {name: 'Item2', value: 'same'},
          {name: 'Item3', value: 'different'}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEach(
                '$.items[*]',
                /**
                 * @this {import('../src/JSONPathTransformerContext.js').
                 *   default}
                 * @param {any} item
                 * @returns {void}
                 */
                function (item) {
                  this.element('item', {}, [], () => {
                    this.text(item.name);
                  });
                },
                {select: '$.value', order: 'ascending', type: 'text'}
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      expect(result).to.include('Item1');
      expect(result).to.include('Item2');
      expect(result).to.include('Item3');
    });

    it('should handle text sorting with explicit null', function () {
      const data = {
        items: [
          {name: 'C', value: 'c'},
          {name: 'A', value: null},
          {name: 'B', value: 'b'}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEach(
                '$.items[*]',
                /**
                 * @this {import('../src/JSONPathTransformerContext.js').
                 *   default}
                 * @param {any} item
                 * @returns {void}
                 */
                function (item) {
                  this.element('item', {}, [], () => {
                    this.text(item.name);
                  });
                },
                {select: '$.value', order: 'ascending', type: 'text'}
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      // null should sort first (converted to empty string)
      expect(result).to.match(/<item>A<\/item>/v);
    });

    it(
      'should handle text sorting with non-null/undefined values',
      function () {
        const data = {
          items: [
            {name: 'Z', value: 'zebra'},
            {name: 'A', value: 'apple'},
            {name: 'M', value: 'mango'}
          ]
        };

        const result = new JSONPathTransformer({
          templates: [
            {
              path: '$',
              template () {
                this.forEach(
                  '$.items[*]',
                  /**
                   * @this {import('../src/JSONPathTransformerContext.js').
                   *   default}
                   * @param {any} item
                   * @returns {void}
                   */
                  function (item) {
                    this.element('item', {}, [], () => {
                      this.text(item.name);
                    });
                  },
                  {select: '$.value', order: 'ascending', type: 'text'}
                );
              }
            }
          ],
          joiningTransformer: new StringJoiningTransformer(''),
          data
        }).transform();

        // Should be sorted: apple, mango, zebra
        const resultStr = /** @type {string} */ (result);
        expect(resultStr.indexOf('A')).to.be.lessThan(
          resultStr.indexOf('M')
        );
        expect(resultStr.indexOf('M')).to.be.lessThan(
          resultStr.indexOf('Z')
        );
      }
    );

    it('should handle sorting with only one value being null', function () {
      const data = {
        items: [
          {name: 'A', value: null},
          {name: 'B', value: 'text'}
        ]
      };

      const result = new JSONPathTransformer({
        templates: [
          {
            path: '$',
            template () {
              this.forEach(
                '$.items[*]',
                /**
                 * @this {import('../src/JSONPathTransformerContext.js').
                 *   default}
                 * @param {any} item
                 * @returns {void}
                 */
                function (item) {
                  this.element('item', {}, [], () => {
                    this.text(item.name);
                  });
                },
                {select: '$.value', order: 'ascending', type: 'text'}
              );
            }
          }
        ],
        joiningTransformer: new StringJoiningTransformer(''),
        data
      }).transform();

      // null converts to empty string, should sort before 'text'
      const resultStr = /** @type {string} */ (result);
      expect(resultStr.indexOf('A')).to.be.lessThan(
        resultStr.indexOf('B')
      );
    });

    it('should handle sorting with one value being undefined',
      function () {
        const data = {
          items: [
            {name: 'A'},
            {name: 'B', value: 'text'}
          ]
        };

        const result = new JSONPathTransformer({
          templates: [
            {
              path: '$',
              template () {
                this.forEach(
                  '$.items[*]',
                  /**
                   * @this {import('../src/JSONPathTransformerContext.js').
                   *   default}
                   * @param {any} item
                   * @returns {void}
                   */
                  function (item) {
                    this.element('item', {}, [], () => {
                      this.text(item.name);
                    });
                  },
                  {select: '$.value', order: 'ascending', type: 'text'}
                );
              }
            }
          ],
          joiningTransformer: new StringJoiningTransformer(''),
          data
        }).transform();

        // undefined converts to empty string
        const resultStr = /** @type {string} */ (result);
        expect(resultStr.indexOf('A')).to.be.lessThan(
          resultStr.indexOf('B')
        );
      });
  });
});
