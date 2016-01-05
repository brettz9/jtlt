/*global require, module*/
/*jslint vars:true*/
(function () {'use strict';

var JTLT = require('../src/index').JTLT,
    testCase = require('nodeunit').testCase;

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

module.exports = testCase({
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
});

}());
