
JTLT([
    {
        '$.store.book[*].author': function (value, path, obj) {
            return 's:' + JSON.stringify(value);
        }
    }
], {
    ajaxData: 'data/jsonpath-sample.json',
    success: function (result) {
        alert('result:'+result);
    }
});
