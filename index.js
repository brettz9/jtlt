/*global JSONPath, getJSON, module*/
/*jslint vars:true, todo:true*/
(function (undef) {'use strict';

function jsonPath (config) {

    var matched = config.templates.sort(function (a, b) {
        // Root tests
        if (a.path === '$') {
            return -1;
        }
        if (b.path === '$') {
            return 1;
        }
        
        // Todo: User-supplied priority
        
        
        // Todo: Path specificity
        
        
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

    if (!matched) {
        // Todo: Apply default template rules where no match
        return;
    }
}


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
    this.options.engine = this.options.engine || jsonPath;
    return this;
};
JTLT.prototype.start = function () {
    if (this.options.data === undef) {    
        if (this.options.ajaxData) {
            throw "You must wait for the 'ajaxData' source to be retrieved.";
        }
        throw "You must supply a 'data' or 'ajaxData' property";
    }

    var that = this;
    
    return that.options.engine({templates: that.options.templates, json: this.options.data});
};


if (typeof module !== 'undefined') {
    module.exports = JTLT;
}
else {
    window.JTLT = JTLT;
}



}());