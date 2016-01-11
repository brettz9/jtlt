/*global require, module*/
/*jslint vars:true*/
var JTLT;
var testBasic;
(function () {'use strict';


var json = {
    "store": {
        "book": { "category": "reference",
            "author": "Nigel Rees",
            "title": "Sayings of the Century",
            "price": [8.95, 8.94, 8.93]
        },
        "books": [
            { "category": "reference",
                "author": "Nigel Rees",
                "title": "Sayings of the Century",
                "price": [8.95, 8.94, 8.93]
            }
        ]
    }
};

var test, expected;
var jtltConfig = {
    ajaxData: 'data/jsonpath-sample.json',
    outputType: 'string', // string is default
    templates: [
        { // We could instead try a root template which applied on the author path
            name: 'scalars',
            path: '$..*@scalar()',
            template: function () {}
        }
    ],
    success: function (result) {
        test.deepEqual(expected, result);
        test.done();
    }
};

function runTest (jtltConfig) {
  try {
      JTLT(jtltConfig);
  }
  catch (e) {
      alert(e);
  }
}


testBasic = {
    'should be able to use valueOf to get current context': function (t) {
        // test.expect(1);
        test = t;

        expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
        jtltConfig.templates[1] = {
            name: 'author', // For use with calling templates
            path: '$.store.book[*].author',
            template: function () {
                this.string('<b>');
                this.valueOf({select: '.'});
                this.string('</b>');
            }
        };
        runTest(jtltConfig);
    },
    'should be able to utilize argument to template': function (t) {
        test = t;

        expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
        jtltConfig.templates[1] = {
            name: 'author', // For use with calling templates
            path: '$.store.book[*].author',
            template: function (value) {
                this.string('<b>' + value + '</b>');
            }
        };
        runTest(jtltConfig);
    },
    'should be able to provide return value from template': function (t) {
        test = t;

        expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
        jtltConfig.templates[1] = {
            name: 'author', // For use with calling templates
            path: '$.store.book[*].author',
            template: function (value) {
                return '<b>' + value + '</b>';
            }
        };
        runTest(jtltConfig);
    }
};

if (typeof exports !== 'undefined') {
    JTLT = require('../src/index');
    module.exports = testBasic;
}

}());
