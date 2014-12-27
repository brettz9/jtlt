/*global JSONPath, getJSON */
/*jslint vars:true, todo:true, regexp:true*/
var getJSON, exports, require;

if (require !== undefined) {
    getJSON = require('simple-get-json');
}

(function (undef) {'use strict';

function l (s) {console.log(s);}
function s (o) {l(JSON.stringify(o));}

// Satisfy JSLint
var jsonpath = require === undefined ? JSONPath : require('JSONPath');

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
    return this;
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
    if (terminal.match(/^(?:\*|~|@[a-z]*?\(\))$/i)) { // *, ~, @string() (comparable to XSLT's *, @*, and node tests, respectively)
        return -0.5;
    }
    if (terminal.match(/^(?:\.+|\[.*?\])$/)) { // ., .., [] or [()] or [(?)] (comparable to XSLT's /, //, or [], respectively)
        return 0.5;
    }
    return 0; // single name (i.e., $..someName or someName if allowing such relative paths) (comparable to XSLT's identifying a particular element or attribute name)
};


function JSONPathTransformerContext (config, templates) {
    this._config = config;
    this._templates = templates;
    this._contextObj = config.data;
    this._parent = config.parent || null;
    this._parentProperty = config.parentProperty || null;
}

JSONPathTransformerContext.prototype._getJoiningTransformer = function () {
    return this._config.joiningTransformer;
};

// Get is provided as a convenience method for templates, but it should typically not be used (use valueOf to add to the result tree instead)
JSONPathTransformerContext.prototype.get = function (select) {
    if (select) {
        return jsonpath({path: select, json: this._contextObj, preventEval: this._config.preventEval, wrap: false, returnType: 'value'});
    }
    return this._contextObj;
};

JSONPathTransformerContext.prototype.set = function (v) {
    this._parent[this._parentProperty] = v;
    return this;
};

JSONPathTransformerContext.prototype.applyTemplates = function (select, mode) {
    var that = this;
    if (select && typeof select === 'object') {
        mode = select.mode;
        select = select.select;
    }
    if (!this._initialized) {
        select = select || '$';
        this._initialized = true;
    }
    else {
        select = select || '*';
    }
    select = JSONPathTransformer.makeJSONPathAbsolute(select);
    var results = this._getJoiningTransformer();
    var modeMatchedTemplates = this._templates.filter(function (templateObj) {
        return ((mode && mode === templateObj.mode) && (!mode && !templateObj.mode));
    });
    jsonpath({path: select, json: this._contextObj, preventEval: this._config.preventEval, wrap: false, resultType: 'all', callback: function (preferredOutput) {
        // Todo: For remote JSON stores, could optimize this to first get template paths and cache by template (and then query the remote JSON and transform as results arrive)
        var value = preferredOutput.value;
        var parent = preferredOutput.parent;
        var parentProperty = preferredOutput.parentProperty;
        
        var pathMatchedTemplates = modeMatchedTemplates.filter(function (templateObj) {
            return jsonpath({path: JSONPathTransformer.makeJSONPathAbsolute(templateObj.path), json: that._contextObj, resultType: 'path', preventEval: that._config.preventEval, wrap: true}).includes(preferredOutput.path);
        });

        var templateObj;
        if (!pathMatchedTemplates.length) {
            var dtr = JSONPathTransformer.DefaultTemplateRules;
            // Default rules in XSLT, although expressible as different kind of paths, are really about result types, so we check the resulting value more than the select expression
            if ((/~$/).test(select)) {
                templateObj = dtr.transformPropertyNames;
            }
            else if (Array.isArray(value)) {
                templateObj = dtr.transformArrays;
            }
            else if (value && typeof value === 'object') {
                templateObj = dtr.transformObjects;
            }
            else if (value && typeof value === 'function') { // Todo: provide parameters to jsonpath based on config on whether to allow non-JSON JS results 
                templateObj = dtr.transformFunctions;
            }
            else {
                templateObj = dtr.transformScalars;
            }
            /*
            Todo: If Jamilih support Jamilih, could add equivalents more like XSL, including processing-instruction(), comment(), and namespace nodes (whose default templates do not add to the result tree in XSLT) as well as elements, attributes, text nodes (see http://lenzconsulting.com/how-xslt-works/#built-in_template_rules )
            */
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

        templateObj.template.call(that, mode);
        var result = that.get();

        // Child templates may have changed the context
        that._contextObj = value;
        that._parent = parent;
        that._parentProperty = parentProperty;
        
        results.add(result);
    }});
    return this;
};
JSONPathTransformerContext.prototype.callTemplate = function (name, withParams) {
    withParams = withParams || [];
    var paramValues = withParams.map(function (withParam) {
        return withParam.value || this.get(withParam.select);
    });
    var results = this._getJoiningTransformer();
    if (name && typeof name === 'object') {
        withParams = name.withParam || withParams;
        name = name.name;
    }
    var templateObj = this._templates.find(function (template) {
        return template.name === name;
    });
    if (!templateObj) {
        throw "Template, " + name + ", cannot be called as it was not found.";
    }
    
    var result = templateObj.template.apply(this, paramValues);
    results.add(result);
    return this;
};

JSONPathTransformerContext.prototype.forEach = function (select, cb) {
    var that = this;
    jsonpath({path: select, json: this._contextObj, preventEval: this._config.preventEval, wrap: false, returnType: 'value', callback: function (value) {
        cb.call(that, value);
    }});
    return this;
};
JSONPathTransformerContext.prototype.valueOf = function (select) {
    var results = this._getJoiningTransformer();
    var result;
    if (select === '.') {
        result = this._contextObj;
    }
    else {
        result = this.get(select);
    }
    results.add(result);
    return this;
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
    this.templates = config.templates;
    this.templates.forEach(function (template, i, templates) {
        if (template.name && map[template.name]) {
            throw "Templates must all have different names.";
        }
        map[template.name] = true;
        if (template.path === '$') {
            that.rootTemplates = that.rootTemplates.concat(templates.splice(i, 1));
        }
    });
    map = null;
};


JSONPathTransformer.prototype.transform = function (mode) {
    var jte = new JSONPathTransformerContext(this.config, this.templates);
    var len = this.rootTemplates.length;
    var templateObj = len ? this.rootTemplates.pop() : JSONPathTransformer.DefaultTemplateRules.transformRoot;
    if (len > 1) {
        _triggerEqualPriorityError(this.config);
    }
    var results = this.config.joiningTransformer;
    templateObj.template.call(jte, mode);
    var result = jte.get();
    results.add(result);
    return results.get();
};

/**
* @private
* @static
*/
JSONPathTransformer.makeJSONPathAbsolute = function (select) {
    // See todo in JSONPath to avoid need for '$' (but may still need to add ".")
    return select[0] !== '$' ? '$' + (select[0] === '[' ? '$' : '$.') + select : select;
};


JSONPathTransformer.DefaultTemplateRules = {
    transformRoot: {
        template: function (mode) {
            this.applyTemplates(null, mode);
        }
    },
    transformPropertyNames: {
        template: function () {
            this.valueOf('.');
        }
    },
    transformObjects: {
        template: function (mode) {
            this.applyTemplates(null, mode);
        }
    },
    transformArrays: {
        template: function (mode) {
            this.applyTemplates(null, mode);
        }
    },
    transformScalars: {
        template: function () {
            this.valueOf('.');
        }
    },
    transformFunctions: {
        template: function () {
            this.valueOf('.')();
        }
    }
};


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
* @param {boolean} [config.preventEval=false] Whether to prevent parenthetical evaluations in JSONPath. Safer if relying on user input, but reduces capabilities of JSONPath.
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
        getJSON(this.config.ajaxData, (function (config) {
            return function (json) {
                that.config.data = json;
                that._autoStart(config.mode);
            };
        }(config)));
        return this;
    }
    this._autoStart(config.mode);
}
JTLT.prototype._autoStart = function (mode) {
    if (this.config.autostart !== false || this.ready) {
        this.config.success(this.transform(mode));
    }
};
JTLT.prototype.setDefaults = function (config) {
    this.config = config || {};
    config = this.config;
    var query = config.query || (typeof config.templates === 'function' ? config.templates : (typeof config.template === 'function' ? config.template : null));
    this.config.templates = query ? [{name: 'root', path: '$', template: query}] : (config.templates || [config.template]);
    this.config.json = this.config.data;
    this.config.errorOnEqualPriority = config.errorOnEqualPriority || false;
    this.config.engine = this.config.engine || function (config) {
        var jpt = new JSONPathTransformer(config);
        return jpt.transform(config.mode);
    };
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
JTLT.prototype.transform = function (mode) {
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

    this.config.mode = mode;
    return this.config.engine(this.config);
};


if (exports !== undefined) {
    exports.JTLT = JTLT;
    exports.JSONPathTransformer = JSONPathTransformer;
    exports.JSONPathTransformerContext = JSONPathTransformerContext;
    exports.XSLTStyleJSONPathResolver = XSLTStyleJSONPathResolver;
}
else {
    window.JTLT = JTLT;
    window.JSONPathTransformer = JSONPathTransformer;
    window.JSONPathTransformerContext = JSONPathTransformerContext;
    window.XSLTStyleJSONPathResolver = XSLTStyleJSONPathResolver;
}



}());
