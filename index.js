/*global JSONPath, getJSON, exports*/
/*jslint vars:true, todo:true*/
(function (undef) {'use strict';

/**
* @param {boolean} config.errorOnEqualPriority
*/
function JSONPathTransformer (config) {
    if (!(this instanceof JSONPathTransformer)) {
        return new JSONPathTransformer(config);
    }
    this.config = config;
    // Todo: if no templates, allow query (e.g., something like '$' without apply-templates but like XQuery)
    var map = {};
    this.config.templates.forEach(function (template) {
        if (map[template.name]) {
            throw "Templates must all have different names.";
        }
        map[template.name] = true;
    });
    map = null;
}
JSONPathTransformer.prototype.getDefaultPriority = function (path) {
    if (typeof path === 'string') {
        path = JSONPath.toPathArray(path);
    }
    // Todo: Path specificity
    // Let's also, unlike XSLT, give higher priority to absolute fixed paths over recursive descent and priority to longer paths and lower to wildcard terminal points
    
};
JSONPathTransformer.prototype.transform = function () {
    var config = this.config;
    var matched = config.templates.sort(function (a, b) {
        // Root tests
        if (a.path === '$') {
            return -1;
        }
        if (b.path === '$') {
            return 1;
        }

        var aPriority = typeof a.priority === 'number' ? a.priority : this.getDefaultPriority(a.path);
        var bPriority = typeof b.priority === 'number' ? b.priority : this.getDefaultPriority(a.path);
        
        if (aPriority === bPriority && this.config.errorOnEqualPriority) {
            throw "You have configured JSONPathTransformer to throw errors on finding templates of equal priority and these have been found.";
        }
        
        return (aPriority > bPriority) ? -1 : 1; // We want equal conditions to go in favor of the later (b)
    }).some(function (templateObj) {
        var path = templateObj.path;
        var json = config.json;
        var values = JSONPath({json: json, path: path, resultType: 'value', wrap: false, callback: function (parent, property, value, path) {
            
        }});
        if (values) {
            templateObj.template(values, path, json);
        }
        return true;
    });

    if (!matched) { // Should not get here with default template rules in place
        throw "No template rules matched";
    }
};
JSONPathTransformer.DefaultTemplateRules = [
    // Todo: Apply default template rules
    
];


function JTLT (templates, options) {
    if (!(this instanceof JTLT)) {
        return new JTLT(templates, options);
    }
    this.templates = templates;
    this.options = options || {};    
    this.setDefaults();
    var that = this;
    if (this.options.ajaxData) {
        getJSON(this.options.ajaxData, function (json) {
            that.options.data = json;
            that.autoStart();
        });
        return this;
    }
    this.autoStart();
}
JTLT.prototype.autoStart = function () {
    if (this.options.autostart !== false) {
        return this.options.success(this.start());
    }
};
JTLT.prototype.setDefaults = function () {
    this.options.engine = this.options.engine || JSONPathTransformer;
    return this;
};
JTLT.prototype.start = function () {
    if (this.options.data === undef) {    
        if (this.options.ajaxData) {
            throw "You must wait for the 'ajaxData' source to be retrieved.";
        }
        throw "You must supply a 'data' or 'ajaxData' property";
    }

    var engineObj = this.options.engine({templates: this.options.templates, json: this.options.data});
    engineObj.transform();
};


if (typeof exports !== 'undefined') {
    exports.JTLT = JTLT;
    exports.JSONPathTransformer = JSONPathTransformer;
}
else {
    window.JTLT = JTLT;
    window.JSONPathTransformer = JSONPathTransformer;
}



}());