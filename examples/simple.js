/*global JTLT*/

(function () {'use strict';

JTLT({
    templates: [{
        name: 'author', // For use with calling templates
        path: '$.store.book[*].author',
        template: function (parent, property, value/*, path, obj*/) {
            parent[property] = '<b>' + value + '</b>';
            return 's:' + parent;
        }
    }]
    ajaxData: 'data/jsonpath-sample.json',
    success: function (result) {
        alert('result:'+result);
    }
});

}());
