/*global require, module*/
/*jslint vars:true*/
var testJtltConfig;
(function () {'use strict';

var JTLT;

var json = {
  "store": {
    "book": [
      {
        "category": "reference",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95
      },
      {
        "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99
      },
      {
        "category": "fiction",
        "author": "Herman Melville",
        "title": "Moby Dick",
        "isbn": "0-553-21311-3",
        "price": 8.99
      },
      {
        "category": "fiction",
        "author": "J. R. R. Tolkien",
        "title": "The Lord of the Rings",
        "isbn": "0-395-19395-8",
        "price": 22.99
      }
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95
    }
  }
};

testJtltConfig = {
    'ajaxData': function (test) {
        test.expect(1);
        var expected = json;

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
                test.deepEqual(expected, this.data);
                test.done();
            }
        });
    }
};

if (typeof exports !== 'undefined') {
    JTLT = require('../src/index');
    module.exports = testJtltConfig;
}

}());
