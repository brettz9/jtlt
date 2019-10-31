/*global require, module*/
/*jslint vars:true*/
var JTLT;
var testBasic;
(function () {'use strict';

var test, expected;

function runTest (templates, replace) {
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
    config.templates[0] = templates.shift();
  }
  templates.forEach(function (template) {
    config.templates.push(template);
  });
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
    runTest([
      ['$.store.book[*].author', function (author) {
        return '<b>' + author + '</b>';
      }]
    ]);
    // Could just do runTest(['$.store.book[*].author', author => '<b>' + author + '</b>']); but may want to use `this`
  },
  'should be able to use valueOf to get current context': function (t) {
    test = t;

    expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    runTest([{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template: function () {
        this.string('<b>');
        this.valueOf({select: '.'});
        this.string('</b>');
      }
    }]);
  },
  'should be able to utilize argument to template': function (t) {
    test = t;

    expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    runTest([{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template: function (author) {
        this.string('<b>' + author + '</b>');
      }
    }]);
  },
  'should be able to provide return value from template': function (t) {
    test = t;

    expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    runTest([{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template: function (author) {
        return '<b>' + author + '</b>';
      }
    }]);
  },
  'should be able to use a root template calling applyTemplates with a select path': function (t) {
    test = t;
    expected = '<b>Nigel Rees</b><b>Evelyn Waugh</b><b>Herman Melville</b><b>J. R. R. Tolkien</b>';
    runTest([
      ['$', function (value, cfg) {
        this.applyTemplates('$.store.book[*].author', cfg.mode);
      }], ['$.store.book[*].author', function (author) {
        return '<b>' + author + '</b>';
      }]
    ], true);
  },
  'should support multiple child templates': function (t) {
    test = t;

    expected = '<b>Nigel Rees</b><u>8.95</u><b>Evelyn Waugh</b><u>12.99</u><b>Herman Melville</b><u>8.99</u><b>J. R. R. Tolkien</b><u>22.99</u>';
    runTest([{
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template: function (author) {
        return '<b>' + author + '</b>';
      }
    }, {
      name: 'price', // For use with calling templates
      path: '$.store.book[*].price',
      template: function (price) {
        return '<u>' + price + '</u>';
      }
    }]);
  },
  'should support nested templates': function (t) {
    test = t;

    expected = '<i><b>Nigel Rees</b><u>8.95</u></i><i><b>Evelyn Waugh</b><u>12.99</u></i><i><b>Herman Melville</b><u>8.99</u></i><i><b>J. R. R. Tolkien</b><u>22.99</u></i>';
    runTest([{
      name: 'book', // For use with calling templates
      path: '$.store.book[*]',
      template: function (book) {
        this.string('<i>');
        this.applyTemplates();
        this.string('</i>');
      }
    }, {
      name: 'author', // For use with calling templates
      path: '$.store.book[*].author',
      template: function (author) {
        return '<b>' + author + '</b>';
      }
    }, {
      name: 'price', // For use with calling templates
      path: '$.store.book[*].price',
      template: function (price) {
        return '<u>' + price + '</u>';
      }
    }]);
  }
};

if (typeof exports !== 'undefined') {
  JTLT = require('../src/index');
  module.exports = testBasic;
}

}());
