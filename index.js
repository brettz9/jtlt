/*global JSONPath, getJSON, exports*/
/*jslint vars:true, todo:true*/
(function (undef) {'use strict';

var jsonpath = JSONPath; // Satisfy JSLint

/**
* @private
* @static
*/
function _triggerEqualPriorityError (config) {
    if (config.errorOnEqualPriority) {
        throw "You have configured JSONPathTransformer to throw errors on finding templates of equal priority and these have been found.";
    }
}

/**
* @private
* @static
*/
function _makeAbsolute (select) {
    // See todo in JSONPath to avoid need for '$' (but may still need to add ".")
    return select[0] !== '$' ? '$' + (select[0] === '[' ? '$' : '$.') + select : select;
}

function _getPriorityBySpecificity (path) {
    if (typeof path === 'string') {
        path = JSONPath.toPathArray(path);
    }
    // Todo: Let's also, unlike XSLT, give options for higher priority to absolute fixed paths over recursive descent and priority to longer paths and lower to wildcard terminal points
    
    var terminal = path.slice(-1);
    if (terminal.match(/\^|\*|@.*?\(\)$/)) { // *, ^, @string() (comparable to XSLT's *, @*, and node tests)
        return -0.5;
    }
    if (terminal.match(/^(\.+|\[.*?\])$/))) { // ., .., [], [()], [(?)] (comparable to XSLT's /, //, or [])
        return 0.5;
    }
    return 0; // single name (i.e., $..someName or someName if allowing such relative paths)
}

// Todo: utilize
function JSONTransformerEvaluator (config, templates) {
    this._config = config;
    this._templates = templates;
}


JSONTransformerEvaluator.prototype.applyTemplates = function (select, mode) {
    // Todo: adapt this code to only find (and apply) templates per context
    var that = this;
    if (select && typeof select === 'object') {
        mode = select.mode;
        select = select.select;
    }
    if (!this.hasOwnProperty('_contextNode')) {
        this._contextNode = this.config.data;
        this._parent = this.config.parent || null;
        this._parentProperty = this.config.parentProperty || null;
        select = select || '$';
    }
    else {
        select = select || '*';
    }
    select = _makeAbsolute(select);
    var results;
    var modeMatchedTemplates = this.templates.filter(function (template) {
        return ((mode && mode === template.mode) && (!mode && !template.mode));
    });
    var found = jsonpath({path: select, json: this._contextNode, wrap: false, returnType: 'all', callback: function (preferredOutput) {
        /*
        // Utilize
        preferredOutput.value;
        that._contextNode;
        that._parent;
        that._parentProperty;
        */
        
        var pathMatchedTemplates = modeMatchedTemplates.filter(function (template) {
            return jsonpath({path: _makeAbsolute(template.path), json: that._contextNode, resultType: 'path', wrap: true}).includes(preferredOutput.path);
        });
        
        if (!pathMatchedTemplates) {
            // Todo: deal with any default templates (by default, should have all defined), including the object and array ones containing this.applyTemplates('*', mode); and this.getDefaultPriority(preferredOutput.path);
            
            return;
        }
        
        var matched = pathMatchedTemplates.sort(function (a, b) {
        
            // Todo: deal with priority, specificity, order

            var aPriority = typeof a.priority === 'number' ? a.priority : _getPriorityBySpecificity(a.path);
            var bPriority = typeof b.priority === 'number' ? b.priority : _getPriorityBySpecificity(a.path);
            
            if (aPriority === bPriority) {
                _triggerEqualPriorityError(this._config);
            }
            
            return (aPriority > bPriority) ? -1 : 1; // We want equal conditions to go in favor of the later (b)
        }).some(function (templateObj) {
            var path = templateObj.path;
            var json = that._contextNode;
            var values = jsonpath({json: json, path: path, resultType: 'value', wrap: false, callback: function (parent, property, value, path) {
                
            }});
            if (values) {
                templateObj.template(values, path, json);
            }
            return true;
        });

        if (!matched) { // Should not get here with default template rules in place
            throw "No template rules matched";
        }
        
        results.add(matched.shift());
    }});
    if (!found) {
        
    }
    return results;
};
JSONTransformerEvaluator.prototype.callTemplate = function (name, withParam) {
    var value;
    if (name && typeof name === 'object') {
        withParam = name.withParam;
        name = name.name;
    }
    var template = this.templates.find(function (template) {
        value = withParam.value; // Todo: Support withParam.select (with reference to current context)
        return template.name === name;
    });
    if (!template) {
        throw "Template, " + name + ", cannot be called as it was not found.";
    }
    return template(value); // Todo: provide context
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
    var that = this;
    var map = {};
    this.config = config;
    this.rootTemplates = [];
    this.templates.forEach(function (template, i, templates) {
        if (template.name && map[template.name]) {
            throw "Templates must all have different names.";
        }
        map[template.name] = true;
        if (template.path === '$') {
            that.rootTemplates.concat(templates.splice(i, 1));
        }
    });
    map = null;
    this.transform();
}

JSONPathTransformer.prototype.defaultRootTemplate = function () {
    return this.applyTemplates();
};

JSONPathTransformer.prototype.transform = function () {
    var jte = new JSONTransformerEvaluator(this.config, this.templates);
    var len = this.rootTemplates.length;
    if (!len) {
        return this.defaultRootTemplate.call(jte);
    }
    if (len === 1) {
        _triggerEqualPriorityError(this.config);
    }
    var templateObj = this.rootTemplates.pop();
    var path = templateObj.path;
    var json = this.config.data;
    return templateObj.template.call(jte, json, path, json);
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