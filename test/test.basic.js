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
    templates: [
        { // We could instead try a root template which applied on the author path
            name: 'scalars',
            path: '$..*@scalar()',
            template: function () {}
        }
    ],
    ajaxData: 'data/jsonpath-sample.json',
    success: function (result) {
        test.deepEqual(expected, result);
        test.done();
    },
    outputType: 'string'
};

testBasic = {
    'basic test': function (t) {
        test = t;
        // test.expect(1);

        expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
        try {
            jtltConfig.templates[1] = {
                name: 'author', // For use with calling templates
                path: '$.store.book[*].author',
                template: function () {
                    this.string('<b>');
                    this.valueOf({select: '.'});
                    this.string('</b>');
                }
            };
            JTLT(jtltConfig);
        }
        catch (e) {
            alert(e);
        }
    },
    'should be able to use argument to template': function (t) {
        test = t;
        // test.expect(1);

        expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
        try {
            jtltConfig.templates[1] = {
                name: 'author', // For use with calling templates
                path: '$.store.book[*].author',
                template: function (cfg) {
                    this.string('<b>' + cfg.value + '</b>');
                }
            };
            JTLT(jtltConfig);
        }
        catch (e) {
            alert(e);
        }
    }
};

if (typeof exports !== 'undefined') {
    JTLT = require('../src/index');
    module.exports = testBasic;
}

}());
