/*global require, module*/
/*jslint vars:true*/
var testBasic;
(function () {'use strict';

var JTLT;

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

testBasic = {
    'basic test': function (test) {
        test.expect(1);

        var expected = '';
        var result = '';

        var a = JTLT({
            templates: [{
                name: 'author', // For use with calling templates
                path: '$..author',
                template: function () {
                    return '<b>' + this.valueOf({select: '.'}) + '</b>';
                }
            }],
            ajaxData: '../examples/data/jsonpath-sample.json',
            success: function (result) {
                console.log('result:'+result);
            }
        });
        test.deepEqual(expected, result);
        test.done();
    }
};

if (typeof exports !== 'undefined') {
    JTLT = require('../src/index');
    module.exports = testBasic;
}

}());
