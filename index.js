/*global JSONPath, getJSON, exports*/
/*jslint vars:true, todo:true*/
(function (undef) {'use strict';

// Satisfy JSLint
var jsonpath = JSONPath;
var JSONPathTransformer;

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
* @todo Make JSON, DOM, and Jamilih output joining transformers
*/
function StringJoiningTransformer (s) {
    if (!(this instanceof StringJoiningTransformer)) {
        return new StringJoiningTransformer(s);
    }
    this._str = s || '';
}
StringJoiningTransformer.prototype.add = function (s) {
    this._str += s;
};
StringJoiningTransformer.prototype.get = function () {
    return this._str;
};


function XSLTStyleJSONPathResolver () {
    if (!(this instanceof XSLTStyleJSONPathResolver)) {
        return new XSLTStyleJSONPathResolver();
    }
}
XSLTStyleJSONPathResolver.prototype.getPriorityBySpecificity = function (path) {
    if (typeof path === 'string') {
        path = JSONPath.toPathArray(path);
    }
    
    var terminal = path.slice(-1);
    if (terminal.match(/^(?:\^|\*|@.*?\(\))$/)) { // *, ^, @string() (comparable to XSLT's *, @*, and node tests)
        return -0.5;
    }
    if (terminal.match(/^(?:\.+|\[.*?\])$/)) { // ., .., [], [()], [(?)] (comparable to XSLT's /, //, or [])
        return 0.5;
    }
    return 0; // single name (i.e., $..someName or someName if allowing such relative paths) (comparable to XSLT's identifying a particular element or attribute name)
};


function JSONPathTransformerContext (config, templates) {
    this._config = config;
    this._templates = templates;
}


JSONPathTransformerContext.prototype.applyTemplates = function (select, mode) {
    // Todo: adapt this code to only find (and apply) templates per context
    var that = this;
    if (select && typeof select === 'object') {
        mode = select.mode;
        select = select.select;
    }
    if (!this.hasOwnProperty('_contextObj')) {
        this._contextObj = this.config.data;
        this._parent = this.config.parent || null;
        this._parentProperty = this.config.parentProperty || null;
        select = select || '$';
    }
    else {
        select = select || '*';
    }
    select = JSONPathTransformer.makeJSONPathAbsolute(select);
    var results = this._config.joiningTransformer;
    var modeMatchedTemplates = this.templates.filter(function (templateObj) {
        return ((mode && mode === templateObj.mode) && (!mode && !templateObj.mode));
    });
    var found = jsonpath({path: select, json: this._contextObj, wrap: false, returnType: 'all', callback: function (preferredOutput) {
        // Todo: For remote JSON stores, could optimize this to first get template paths and cache by template (and then query the remote JSON and transform as results arrive)
        var value = preferredOutput.value;
        var parent = preferredOutput.parent;
        var parentProperty = preferredOutput.parentProperty;
        
        var pathMatchedTemplates = modeMatchedTemplates.filter(function (templateObj) {
            return jsonpath({path: JSONPathTransformer.makeJSONPathAbsolute(templateObj.path), json: that._contextObj, resultType: 'path', wrap: true}).includes(preferredOutput.path);
        });

        var templateObj;
        if (!pathMatchedTemplates.length) {
            // Todo: deal with any default templates (by default, should have all defined), including the object and array ones containing this.applyTemplates('*', mode); and this.getDefaultPriority(preferredOutput.path);
            /*
            // Todo: Handle default templates
            templateObj = ;
            */
            return;
        }
        else {
            // Todo: Could perform this first and cache by template
            pathMatchedTemplates.sort(function (a, b) {
                var aPriority = typeof a.priority === 'number' ? a.priority : that._config.specificityPriorityResolver(a.path);
                var bPriority = typeof b.priority === 'number' ? b.priority : that._config.specificityPriorityResolver(a.path);
                
                if (aPriority === bPriority) {
                    _triggerEqualPriorityError(this._config);
                }
                
                return (aPriority > bPriority) ? -1 : 1; // We want equal conditions to go in favor of the later (b)
            });
            
            templateObj = pathMatchedTemplates.shift();
        }
        
        that._contextObj = value;
        that._parent = parent;
        that._parentProperty = parentProperty;

        var result = templateObj.template.call(that, value, that._parent, that._parentProperty);
        
        // Child templates may have changed the context
        that._contextObj = value;
        that._parent = parent;
        that._parentProperty = parentProperty;
        
        results.add(result);
    }});
    if (!found) {
        return;
    }
    return results.get();
};
JSONPathTransformerContext.prototype.callTemplate = function (name, withParam) {
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
JSONPathTransformerContext.prototype.forEach = function () {
    
};
JSONPathTransformerContext.prototype.valueOf = function () {

};

/**
* @param {boolean} config.errorOnEqualPriority
*/
JSONPathTransformer = function JSONPathTransformer (config) {
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
};

JSONPathTransformer.prototype.defaultRootTemplate = function () {
    return this.applyTemplates();
};

JSONPathTransformer.prototype.transform = function () {
    var jte = new JSONPathTransformerContext(this.config, this.templates);
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

/**
* @private
* @static
*/
JSONPathTransformer.makeJSONPathAbsolute = function (select) {
    // See todo in JSONPath to avoid need for '$' (but may still need to add ".")
    return select[0] !== '$' ? '$' + (select[0] === '[' ? '$' : '$.') + select : select;
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
* @param {function} [config.specificityPriorityResolver=XSLTStyleJSONPathResolver.getPriorityBySpecificity]
* @param {object} [config.joiningTransformer=StringJoiningTransformer] Can be a singleton or class instance. Defaults to string joining for output transformation.
* @param {function} [config.joiningTransformer.get=StringJoiningTransformer.get] Required method. Defaults to string joining getter.
* @param {function} [config.joiningTransformer.add=StringJoiningTransformer.add] Required method. Defaults to string joining adder.
* @returns {JTLT} A JTLT instance object
* @todo Remove JSONPath dependency in query use of '$'?
* @todo Make a simple string type "output" to handle creation of StringJoiningTransformer, DOM, JSON, or Jamilih output for users
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
    // Todo: Let's also, unlike XSLT and the following, give options for higher priority to absolute fixed paths over recursive descent and priority to longer paths and lower to wildcard terminal points
    this.config.specificityPriorityResolver = this.config.specificityPriorityResolver || (function () {
        var xsjpr = new XSLTStyleJSONPathResolver();
        return function (path) {
            xsjpr.getPriorityBySpecificity(path);
        };
    }());
    this.config.joiningTransformer = this.config.joiningTransformer || new StringJoiningTransformer();
    return this;
};
/**
* @returns {any}
* @todo Allow for a success callback in case the jsonpath code is modified
         to work asynchronously (as with queries to access remote JSON stores)
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
    window.JSONPathTransformerContext = JSONPathTransformerContext;
    window.XSLTStyleJSONPathResolver = XSLTStyleJSONPathResolver;
}



}());
