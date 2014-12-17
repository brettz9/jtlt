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
    this.templates.forEach(function (template) {
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
    var matched = this.templates.sort(function (a, b) {
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


function JTLT (config) {
    if (!(this instanceof JTLT)) {
        return new JTLT(config);
    }
    this.templates = config.templates;
    this.config = config || {};
    this.setDefaults();
    var that = this;
    if (this.config.ajaxData) {
        getJSON(this.config.ajaxData, function (json) {
            that.config.data = json;
            that.autoStart();
        });
        return this;
    }
    this.autoStart();
}
JTLT.prototype.autoStart = function () {
    if (this.config.autostart !== false) {
        return this.config.success(this.transform());
    }
};
JTLT.prototype.setDefaults = function () {
    this.config.engine = this.config.engine || JSONPathTransformer;
    return this;
};
JTLT.prototype.transform = function () {
    if (this.config.data === undef) {
        if (this.config.ajaxData) {
            throw "You must wait for the 'ajaxData' source to be retrieved.";
        }
        throw "You must supply a 'data' or 'ajaxData' property";
    }

    var engineObj = this.config.engine({templates: this.templates, json: this.config.data});
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