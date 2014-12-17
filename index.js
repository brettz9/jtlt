/*global JSONPath, getJSON, exports*/
/*jslint vars:true, todo:true*/
(function (undef) {'use strict';


// Todo: utilize
function JSONTransformerEvaluator () {

}
JSONTransformerEvaluator.prototype.applyTemplates = function () {

};
JSONTransformerEvaluator.prototype.callTemplate = function () {

};
JSONTransformerEvaluator.prototype.forEach = function () {

};
JSONTransformerEvaluator.prototype.valueOf = function () {

};

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
        if (template.name && map[template.name]) {
            throw "Templates must all have different names.";
        }
        map[template.name] = true;
    });
    map = null;
    this.transform();
}
JSONPathTransformer.prototype.getDefaultPriority = function (path) {
    if (typeof path === 'string') {
        path = JSONPath.toPathArray(path);
    }
    // Todo: Path specificity
    // Let's also, unlike XSLT, give higher priority to absolute fixed paths over recursive descent and priority to longer paths and lower to wildcard terminal points
    
    // -.5 = *, @string() (etc.)
    // -.25 = Namespace (not relevant without Jamilih)
    // 0 = single name (i.e., $..someName or someName if allowing such relative paths)
    // .5 = ., .., [], [()], [(?)]

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
        var json = config.data;
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
    /*
    / | *                                : apply-templates          (this.applyTemplates())
    / | * mode                           : apply-templates mode     (this.config.mode)
    text() | @*                          : value-of select="."      (this.valueOf({select: '.'}) or this.valueOf('.'))
    processing-instruction() | comment() : (nothing); optionally allow JSON equivalents or Jamilih
    (an XSLT processor is not to copy any part of the namespace node to the output); optionally allow JSON equivalents or Jamilih
    */
];


/**
* For templates/queries, one may choose among config.query, config.template, or config.templates, but one must be present and of valid type. For the source json, one must use either a valid config.ajaxData or config.data parameter.
* @param {function} config.success A callback supplied with a single argument that is the result of this instance's transform() method.
* @param {array} [config.templates] An array of template objects
* @param {object|function} [config.template] A function assumed to be a root template or a single, complete template object
* @param {function} [config.query] A function assumed to be a root template
* @param {object} [config.data] A JSON object
* @param {string} [config.ajaxData] URL of a JSON file to retrieve for evaluation
* @param {boolean} [config.errorOnEqualPriority=false]
* @param {boolean} [config.autostart=true] Whether to begin transform() immediately.
* @param {string} [config.mode=''] The mode in which to begin the transform.
* @param {function} [config.engine=JSONPathTransformer] Will be based the same config as passed to this instance. Defaults to a transforming function based on JSONPath and with its own set of priorities for processing templates.
* @returns {JTLT} A JTLT instance object
*/
function JTLT (config) {
    if (!(this instanceof JTLT)) {
        return new JTLT(config);
    }

    this.setDefaults(config);
    var that = this;
    if (this.config.ajaxData) {
        getJSON(this.config.ajaxData, function (json) {
            that.config.data = json;
            that._autoStart();
        });
        return this;
    }
    this._autoStart();
}
JTLT.prototype._autoStart = function () {
    if (this.config.autostart !== false || this.ready) {
        this.config.success(this.transform());
    }
};
JTLT.prototype.setDefaults = function (config) {
    var query = config.query || (typeof config.templates === 'function' ? config.templates : (typeof config.template === 'function' ? config.template : null));
    this.templates = query ? [{name: 'root', path: '$', template: query}] : (config.templates || [config.template]);
    this.config.errorOnEqualPriority = config.errorOnEqualPriority || false;
    this.config = config || {};
    this.config.engine = this.config.engine || JSONPathTransformer;
    return this;
};
/**
* @returns {any}
*/
JTLT.prototype.transform = function () {
    if (this.config.data === undef) {
        if (this.config.ajaxData) {
            this.ready = true;
            return;
        }
        throw "You must supply a 'data' or 'ajaxData' property";
    }
    if (typeof this.config.success !== 'function') {
        throw "You must supply a 'success' callback";
    }

    return this.config.engine({templates: this.templates, json: this.config.data});
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