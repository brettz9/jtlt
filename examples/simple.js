
JTLT([
    {
        name: 'author', // For use with calling templates
        path: '$.store.book[*].author',
        template: function (value, path, obj) {
            return 's:' + JSON.stringify(value);
        }
    }
], {
    ajaxData: 'data/jsonpath-sample.json',
    success: function (result) {
        alert('result:'+result);
    }
});
