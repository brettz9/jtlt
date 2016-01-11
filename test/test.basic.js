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


function runTest (template, replace) {
    var config = {
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
    if (replace) {
        config.templates[0] = replace;
    }
    config.templates[1] = template;
    try {
        JTLT(config);
    }
    catch (e) {
        alert(e);
    }
}

testBasic = {
    'should support the simple array-based template format': function (t) {
        // test.expect(1);
        test = t;

        expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
        runTest(['$.store.book[*].author', function (author) {
            return '<b>' + author + '</b>';
        }]);
        // Could just do runTest(['$.store.book[*].author', author => '<b>' + author + '</b>']); but may want to use `this`
    },
    'should be able to use valueOf to get current context': function (t) {
        test = t;

        expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
        runTest({
            name: 'author', // For use with calling templates
            path: '$.store.book[*].author',
            template: function () {
                this.string('<b>');
                this.valueOf({select: '.'});
                this.string('</b>');
            }
        });
    },
    'should be able to utilize argument to template': function (t) {
        test = t;

        expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
        runTest({
            name: 'author', // For use with calling templates
            path: '$.store.book[*].author',
            template: function (author) {
                this.string('<b>' + author + '</b>');
            }
        });
    },
    'should be able to provide return value from template': function (t) {
        test = t;

        expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
        runTest({
            name: 'author', // For use with calling templates
            path: '$.store.book[*].author',
            template: function (author) {
                return '<b>' + author + '</b>';
            }
        });
    },
    'should be able to use a root template calling applyTemplates with a select path': function (t) {
        test = t;
        expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
        runTest(['$', function (value, cfg) {
            this.applyTemplates('$.store.book[*].author', cfg.mode);
        }], ['$.store.book[*].author', function (author) {
            return '<b>' + author + '</b>';
        }]);
    }
};

if (typeof exports !== 'undefined') {
    JTLT = require('../src/index');
    module.exports = testBasic;
}

}());
