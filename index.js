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
        alert(json);
            that.options.data = json;
        });
        return this;
    }
    if (this.options.autostart !== false) {
        return this.start();
    }
}
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

    var that = this;
    return this.templates.find(function (path) {
        that.options.engine(that.options.data, path);
    });
};


if (typeof module !== 'undefined') {
    module.exports = JTLT;
}
else {
    window.JTLT = JTLT;
}



}());