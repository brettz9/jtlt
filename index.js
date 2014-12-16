/*global JSONPath, getJSON, module*/
/*jslint vars:true*/
(function (undef) {'use strict';

function jsonPath (obj, path) {

    return JSONPath({json: obj, path: path, resultType: 'value', wrap: false, callback: function (parent, property, value, path, obj) {
        
    }});
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

    var that = this, result;
    this.templates.some(function (obj) {
        var path = obj.path;
        var template = obj.template;

        var match = that.options.engine({json: that.options.data, path: path});
        if (match) {
            result = {template: template, value: match, path: path};
            return true;
        }
    });
    if (result) {
        return result.template(result.value, result.path, this.options.data);
    }
};


if (typeof module !== 'undefined') {
    module.exports = JTLT;
}
else {
    window.JTLT = JTLT;
}



}());