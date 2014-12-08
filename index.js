/*global jsonPath, getJSON, module*/
/*jslint vars:true*/
(function (undef) {'use strict';

function JSONPath (obj, path) {
    return jsonPath.eval(obj, path);
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
    this.options.engine = this.options.engine || JSONPath;
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
    this.templates.some(function (obj, idx, arr) {
        var path = Object.keys(obj)[0];
        var template = obj[path];

        var match = that.options.engine(that.options.data, path);
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