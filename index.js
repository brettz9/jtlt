/*global JSONPath, getJSON, jml */
/*jslint vars:true, todo:true, regexp:true*/
var getJSON, exports, require, document, window, jhtml;

if (require !== undefined) {
    getJSON = require('simple-get-json');
}

(function (undef) {'use strict';

function l (s) {console.log(s);}
function s (o) {l(JSON.stringify(o));}

// Satisfy JSLint
var jsonpath = require === undefined ? JSONPath : require('JSONPath');
if (exports !== undefined) {
    Object.assign = Object.assign || require('object-assign');
    document = require('jsdom').jsdom('');
    jhtml = require('jhtml');
    window = document.parentWindow;
}

var JSONPathTransformer;




function AbstractJoiningTransformer () {
    if (!(this instanceof AbstractJoiningTransformer)) {
        return new AbstractJoiningTransformer();
    }
}
AbstractJoiningTransformer.prototype._requireSameChildren = function (type) {
    if (this._cfg[type].requireSameChildren) {
        throw "Cannot embed object children for a string joining transformer.";
    }
};


function StringJoiningTransformer (s, cfg) {
    if (!(this instanceof StringJoiningTransformer)) {
        return new StringJoiningTransformer(s, cfg);
    }
    this._str = s || '';
    this._cfg = cfg;
}
StringJoiningTransformer.prototype = new AbstractJoiningTransformer();

StringJoiningTransformer.prototype.add = function (s) {
    // Todo: Could allow option to disallow elements within arrays, etc. (add states and state checking)
    if (this._arrItemState) {
        this._arr.push(s);
    }
    else if (this._objPropState) {
        throw "Scalar values must be added via propValue() when in an object state.";
    }
    else {
        this._str += s;
    }
    return this;
};
StringJoiningTransformer.prototype.get = function () {
    return this._str;
};
StringJoiningTransformer.prototype.propValue = function (prop, val) {
    if (!this._objPropState) {
        throw "propValue() can only be called after an object state has been set up.";
    }
    this._obj[prop] = val;
    return this;
};

StringJoiningTransformer.prototype.object = function (prop, cb) {
    this._requireSameChildren('string');
    var oldObj = this._obj;
    this._obj = {};
    
    if (prop !== undef) {
        this._usePropertySets(obj, prop); // Todo: Put in right scope
    }
    
    var oldObjPropState = this._objPropState;
    this._objPropState = true;
    cb.call(this);
    this._objPropState = oldObjPropState;
    
    if (oldObjPropState || this._arrItemState) { // Not ready to serialize yet as still inside another array
        this.add(this._obj);
    }
    else {
        this.add(JSON.stringify(this._obj));
    }
    this._arr = oldArr;
    return this;
};
StringJoiningTransformer.prototype.array = function (cb) {
    this._requireSameChildren('string');
    var oldArr = this._arr;
    this._arr = [];
    
    var oldArrItemState = this._arrItemState;
    this._arrItemState = true;
    cb.call(this);
    this._arrItemState = oldArrItemState;
    
    if (oldArrItemState || this._objPropState) { // Not ready to serialize yet as still inside another array
        this.add(this._arr);
    }
    else {
        this.add(JSON.stringify(this._arr));
    }
    this._arr = oldArr;
    return this;
};
StringJoiningTransformer.prototype.string = function (str, cb) {
    this.add(str);
    return this;
};


StringJoiningTransformer.prototype.element = function (elName, atts, cb) { // Todo: implement (allow for complete Jamilih or function callback)
    // Todo: allow third argument to be array following Jamilih (also let "atts" follow Jamilih)
    this.add('<' + elName);
    var oldTagState = this._openTagState;
    this._openTagState = true;
    cb.call(this);
    
    // Todo: Depending on an this._cfg option, might allow for HTML self-closing tags (or polyglot-friendly self-closing) or XML self-closing when empty
    if (this._openTagState) {
        this.add('>');
    }
    this.add('</' + elName + '>');
    this._openTagState = oldTagState;
    return this;
};
StringJoiningTransformer.prototype.attribute = function (name, val) {
    if (!this._openTagState) {
        throw "An attribute cannot be added after an opening tag has been closed (name: " + name + "; value: " + val + ")";
    }
    this.add(' ' + name + '="' + val.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"'); // Todo: make ampersand escaping optional to avoid double escaping
    return this;
};
StringJoiningTransformer.prototype.text = function (txt) {
    if (this._openTagState) {
        this.add('>');
        this._openTagState = false;
    }
    this.add(txt);
    return this;
};
// Todo: Implement comment(), processingInstruction(), etc.


/**
* This transformer expects the templates to do their own DOM building
*/
function DOMJoiningTransformer (o, cfg) {
    if (!(this instanceof DOMJoiningTransformer)) {
        return new DOMJoiningTransformer(o, cfg);
    }
    this._dom = o || document.createDocumentFragment();
    this._cfg = cfg;
}
DOMJoiningTransformer.prototype = new AbstractJoiningTransformer();
DOMJoiningTransformer.prototype.add = function (item) {
    this._dom.appendChild(item);
};
DOMJoiningTransformer.prototype.get = function () {
    return this._dom;
};
DOMJoiningTransformer.prototype.propValue = function (prop, val) {
    
};
DOMJoiningTransformer.prototype.object = function () {
    this._requireSameChildren('dom');
    if (this._cfg.useJHTML) {
        this.add(jhtml());
    }
    else {
        this.add(document.createTextNode()); // Todo: set current position and deal with children
    }
    return this;
};
DOMJoiningTransformer.prototype.array = function () {
    this._requireSameChildren('dom');
    if (this._cfg.useJHTML) {
        this.add(jhtml());
    }
    else {
        this.add(document.createTextNode()); // Todo: set current position and deal with children
    }
    return this;
};
DOMJoiningTransformer.prototype.element = function () {
    return this;
};
DOMJoiningTransformer.prototype.attribute = function () {
    return this;
};
DOMJoiningTransformer.prototype.text = function (txt) {
    return this;
};
// Todo: allow separate XML DOM one with XML String and hXML conversions (HTML to XHTML is inevitably safe?)

function JamilihJoiningTransformer (o, cfg) {
    if (!(this instanceof JamilihJoiningTransformer)) {
        return new JamilihJoiningTransformer(o, cfg);
    }
    this._dom = o || document.createDocumentFragment();
    this._cfg = cfg;
}
JamilihJoiningTransformer.prototype = new DOMJoiningTransformer();
JamilihJoiningTransformer.constructor = JamilihJoiningTransformer;
JamilihJoiningTransformer.prototype.add = function (item) {
    this._dom.appendChild(jml(item));
    return this;
};
// Todo: add own object/array and treat result as Jamilih?


function JSONJoiningTransformer (o, cfg) {
    if (!(this instanceof JSONJoiningTransformer)) {
        return new JSONJoiningTransformer(o, cfg);
    }
    this._obj = o || [];
    this._cfg = cfg;
}
JSONJoiningTransformer.prototype = new AbstractJoiningTransformer();
JSONJoiningTransformer.prototype.add = function (item) {
    if (!this._obj || typeof this._obj !== 'object') {
        throw "You cannot add to a scalar or empty value.";
    }
    if (Array.isArray(this._obj)) {
        this._obj.push(item);
    }
    else {
        Object.assign(this._obj, item);
    }
    return this;
};

JSONJoiningTransformer.prototype.get = function () {
    return this._obj;
};


JSONJoiningTransformer.prototype.propValue = function (prop, val) {
    
};

/**
* @param {function} nestedCb Callback to be executed on this transformer but with a context nested within the newly created object
* @param {array} usePropertySets Array of string property set names to copy onto the new object
* @param {object} propSets An object of key-value pairs to copy onto the new object
*/
JSONJoiningTransformer.prototype.object = function (nestedCb, usePropertySets, propSets) {
    var tempObj = this._obj;
    var obj = {};
    var that = this;
    if (usePropertySets !== undef) {
        usePropertySets.reduce(function (obj, psName) {
            return that._usePropertySets(obj, psName); // Todo: Put in right scope
        }, {});
    }
    if (propSets !== undef) {
        Object.assign(obj, propSets);
    }
    this.add(obj);
    nestedCb.call(this, obj); // We pass the object, but user should usually use other methods
    this._obj = tempObj;
    return this;
};

JSONJoiningTransformer.prototype.array = function (nestedCb) {
    var tempObj = this._obj;
    var arr = [];
    this.add(arr); // Todo: set current position and deal with children
    nestedCb.call(this, arr); // We pass the array, but user should usually use other methods
    this._obj = tempObj;
    return this;
};
JSONJoiningTransformer.prototype.string = function (str, nestedCb) {
    this._requireSameChildren('json');
    var sjt = new StringJoiningTransformer(str);
    nestedCb.call(this, str); // We pass the string, but user should usually use other methods
    return this;
};

JSONJoiningTransformer.prototype.element = function () {
    return this;
};
JSONJoiningTransformer.prototype.attribute = function () {
    return this;
};
JSONJoiningTransformer.prototype.text = function (txt) {
    return this;
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
    this._parent = config.parent || this._config;
    this._parentProperty = config.parentProperty || 'data';
    this.vars = {};
    this.propertySets = {};
    this.keys = {};
}
JSONPathTransformerContext.prototype._triggerEqualPriorityError = function () {
    if (this._config.errorOnEqualPriority) {
        throw "You have configured JSONPathTransformer to throw errors on finding templates of equal priority and these have been found.";
    }
};

JSONPathTransformerContext.prototype._getJoiningTransformer = function () {
    return this._config.joiningTransformer;
};

JSONPathTransformerContext.prototype.addOutput = function (item) {
    this._getJoiningTransformer().add(item);
    return this;
};
JSONPathTransformerContext.prototype.getOutput = function () {
    this._getJoiningTransformer().get();
    return this;
};

// Get() and set() are provided as a convenience method for templates, but it should typically not be used (use valueOf or the copy methods to add to the result tree instead)
JSONPathTransformerContext.prototype.get = function (select, wrap) {
    if (select) {
        return jsonpath({path: select, json: this._contextObj, preventEval: this._config.preventEval, wrap: wrap || false, returnType: 'value'});
    }
    return this._contextObj;
};

JSONPathTransformerContext.prototype.set = function (v) {
    this._parent[this._parentProperty] = v;
    return this;
};

JSONPathTransformerContext.prototype.applyTemplates = function (select, mode, sort) { // Todo: implement sort (allow as callback or as object)
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
                    this._triggerEqualPriorityError();
                }
                
                return (aPriority > bPriority) ? -1 : 1; // We want equal conditions to go in favor of the later (b)
            });
            
            templateObj = pathMatchedTemplates.shift();
        }
        
        that._contextObj = value;
        that._parent = parent;
        that._parentProperty = parentProperty;

        templateObj.template.call(that, mode);

        // Child templates may have changed the context
        that._contextObj = value;
        that._parent = parent;
        that._parentProperty = parentProperty;
        
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

JSONPathTransformerContext.prototype.forEach = function (select, cb, sort) { // Todo: Implement sort (allow as callback or as object)
    var that = this;
    jsonpath({path: select, json: this._contextObj, preventEval: this._config.preventEval, wrap: false, returnType: 'value', callback: function (value) {
        cb.call(that, value);
    }});
    return this;
};
JSONPathTransformerContext.prototype.valueOf = function (select) {
    var results = this._getJoiningTransformer();
    var result;
    if (select && typeof select === 'object' && select.select === '.') {
        result = this._contextObj;
    }
    else {
        result = this.get(select);
    }
    results.add(result);
    return this;
};

JSONPathTransformerContext.prototype.copyOf = function (select) { // Deep
    return this;
};

JSONPathTransformerContext.prototype.copy = function (propertySets) { // Shallow
    return this;
};

JSONPathTransformerContext.prototype.variable = function (name, select) {
    this.vars[name] = this.get(select);
    return this;
};

JSONPathTransformerContext.prototype.message = function (json) {
    console.log(json);
};

JSONPathTransformerContext.prototype.object = function (prop) {
    this._getJoiningTransformer().object();
    return this;
};

JSONPathTransformerContext.prototype.array = function () {
    this._getJoiningTransformer().array();
    return this;
};

JSONPathTransformerContext.prototype.propertySet = function (name, propertySetObj, usePropertySets) {
    var that = this;
    this.propertySets[name] = usePropertySets ? Object.assign({}, propertySetObj, usePropertySets.reduce(function (obj, psName) {
        return that._usePropertySets(obj, psName);
    }, {})) : propertySetObj;
    return this;
};

JSONPathTransformerContext.prototype._usePropertySets = function (obj, name) {
    return Object.assign(obj, this.propertySets[name]);
};

JSONPathTransformerContext.prototype.getKey = function (name, value) {
    var key = this.keys[name];
    var matches = this.get(key.match, true);
    var p;
    for (p in matches) { // For objects or arrays
        if (matches.hasOwnProperty(p)) {
            if (matches[p] && typeof matches[p] === 'object' && matches[p][key.use] === value) {
                return matches[p];
            }
        }
    }
    return this;
};

JSONPathTransformerContext.prototype.key = function (name, match, use) {
    this.keys[name] = {match: match, use: use};
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
    this._config = config;
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
JSONPathTransformer.prototype._triggerEqualPriorityError = function () {
    if (this._config.errorOnEqualPriority) {
        throw "You have configured JSONPathTransformer to throw errors on finding templates of equal priority and these have been found.";
    }
};

JSONPathTransformer.prototype.transform = function (mode) {
    var jte = new JSONPathTransformerContext(this._config, this.templates);
    var len = this.rootTemplates.length;
    var templateObj = len ? this.rootTemplates.pop() : JSONPathTransformer.DefaultTemplateRules.transformRoot;
    if (len > 1) {
        this._triggerEqualPriorityError();
    }
    templateObj.template.call(jte, mode);
    var result = jte.getOutput();
    return result;
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
            this.valueOf({select: '.'});
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
            this.valueOf({select: '.'});
        }
    },
    transformFunctions: {
        template: function () {
            this.valueOf({select: '.'})();
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
* @param {function} [config.joiningTransformer.get=StringJoiningTransformer.get] Required method if object provided. Defaults to string joining getter.
* @param {function} [config.joiningTransformer.add=StringJoiningTransformer.add] Required method if object provided. Defaults to string joining adder.
* @param {object} [config.joiningConfig={string: {}, json: {}, dom: {}, jamilih: {}}] Config to pass on to the joining transformer
* @returns {JTLT} A JTLT instance object
* @todo Remove JSONPath dependency in query use of '$'?
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
    if (this.config.data === undef) {
        throw "You must supply either config.ajaxData or config.data";
    }
    this._autoStart(config.mode);
}
JTLT.prototype._createJoiningTransformer = function () {
    var JT;
    switch (this.config.outputType) {
        case 'string':
            JT = StringJoiningTransformer;
            break;
        case 'dom':
            JT = DOMJoiningTransformer;
            break;
        case 'jamilih':
            JT = JamilihJoiningTransformer;
            break;
        case 'json': default:
            JT = JSONJoiningTransformer;
            break;
    }
    return new JT(this.config.data, this.config.joiningConfig);
};
JTLT.prototype._autoStart = function (mode) {
    // We wait to set this default as we want to pass in the data
    this.config.joiningTransformer = this.config.joiningTransformer || this._createJoiningTransformer();

    if (this.config.autostart === false) {
        return;
    }

    this.transform(mode);
};
JTLT.prototype.setDefaults = function (config) {
    this.config = config || {};
    config = this.config;
    var query = config.query || (typeof config.templates === 'function' ? config.templates : (typeof config.template === 'function' ? config.template : null));
    this.config.templates = query ? [{name: 'root', path: '$', template: query}] : (config.templates || [config.template]);
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
    return this;
};
/**
* @returns {any}
* @todo Allow for a success callback in case the jsonpath code is modified
         to work asynchronously (as with queries to access remote JSON stores)
*/
JTLT.prototype.transform = function (mode) {
    if (this.config.data === undef) {
        if (this.config.ajaxData === undef) {
            throw "You must supply a 'data' or 'ajaxData' property";
        }
        throw "You must wait until the ajax file is retrieved";
    }
    if (typeof this.config.success !== 'function') {
        throw "You must supply a 'success' callback";
    }

    this.config.mode = mode;
    return this.config.success(this.config.engine(this.config));
};

var baseObj = exports === undefined ? window : exports;

// EXPORTS
baseObj.AbstractJoiningTransformer = AbstractJoiningTransformer;
baseObj.StringJoiningTransformer = StringJoiningTransformer;
baseObj.DOMJoiningTransformer = DOMJoiningTransformer;
baseObj.JamilihJoiningTransformer = JamilihJoiningTransformer;
baseObj.JSONJoiningTransformer = JSONJoiningTransformer;
baseObj.XSLTStyleJSONPathResolver = XSLTStyleJSONPathResolver;
baseObj.JSONPathTransformerContext = JSONPathTransformerContext;
baseObj.JSONPathTransformer = JSONPathTransformer;
baseObj.JTLT = JTLT;

}());
