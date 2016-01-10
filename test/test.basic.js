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

testBasic = {
    'basic test': function (test) {
        test.expect(1);

        var expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
        try {
            JTLT({
                templates: [
                    {
                        name: 'strings',
                        path: '$..*@string()',
                        template: function () {}
                    },
                    {
                        name: 'author', // For use with calling templates
                        path: '$.store.book[*].author',
                        template: function () {
                            this.string('<b>');
                            this.valueOf({select: '.'});
                            this.string('</b>');
                        }
                    }
                ],
                ajaxData: 'data/jsonpath-sample.json',
                success: function (result) {
//                    alert('result:' + JSON.stringify(result));
                    test.deepEqual(expected, JSON.stringify(result));
                    test.done();
                },
                outputType: 'string'
            });
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
