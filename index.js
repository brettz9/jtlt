/*global JSONPath, getJSON, exports*/
/*jslint vars:true, todo:true*/
(function (undef) {'use strict';

function JSONPathTransformer (config) {
    if (!(this instanceof JSONPathTransformer)) {
        return new JSONPathTransformer(config);
    }
    this.config = config;
}
JSONPathTransformer.prototype.getDefaultPriority = function (path) {
    
};
JSONPathTransformer.prototype.transform = function () {
    var config = this.config;
    var matched = config.templates.sort(function (a, b) {
        // Root tests
        var aPriority = a.hasOwnProperty('priority') ? a.priority : this.getDefaultPriority(a.path);
        var bPriority = b.hasOwnProperty('priority') ? b.priority : this.getDefaultPriority(a.path);
        if (a.path === '$') {
            return -1;
        }
        if (b.path === '$') {
            return 1;
        }
        
        // Todo: User-supplied priority
        if (aPriority > bPriority) {
            return -1;
        }
        
        // Todo: Path specificity
        // Let's also, unlike XSLT, give higher priority to absolute fixed paths over recursive descent and priority to longer paths
        
        
        // Todo: Templates with same priority (if have config, can throw error as in XSLT)
                
        
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