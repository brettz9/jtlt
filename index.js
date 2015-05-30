/*jslint vars:true, todo:true, regexp:true*/
var getJSON, JHTML, JSONPath, jml; // Define globally for convenience of any user subclasses
var exports, require, document, window;

(function (undef) {'use strict';

function l (s) {console.log(s);}
function s (o) {l(JSON.stringify(o));}

// Satisfy JSLint
var jsonpath, JSONPathTransformer;

if (exports !== undefined) {
    getJSON = require('simple-get-json');
    JHTML = require('jhtml');
    jsonpath = require('JSONPath');
    jml = require('jamilih');

    // Polyfills
    Object.assign = Object.assign || require('object-assign');
    document = require('jsdom').jsdom('');
    window = document.parentWindow;
}
else {
    jsonpath = JSONPath;
}

// Todo: Allow swapping of joining transformer types in mid transformation (e.g., building strings with string transformer but adding as text node in a DOM transformer)

function AbstractJoiningTransformer (cfg) {
    if (!(this instanceof AbstractJoiningTransformer)) {
        return new AbstractJoiningTransformer();
    }
    // Todo: Might set some reasonable defaults across all classes
    this._cfg = cfg;
}
AbstractJoiningTransformer.prototype._requireSameChildren = function (type, embedType) {
    if (this._cfg[type].requireSameChildren) {
        throw "Cannot embed " + embedType + " children for a " + type + " joining transformer.";
    }
};
AbstractJoiningTransformer.prototype.config = function (prop, val, cb) {
    var oldCfgProp = this._cfg[prop];
    this._cfg[prop] = val;
    cb.call(this);
    this._cfg[prop] = oldCfgProp;
};


function StringJoiningTransformer (s, cfg) {
    if (!(this instanceof StringJoiningTransformer)) {
        return new StringJoiningTransformer(s, cfg);
    }
    AbstractJoiningTransformer.call(this, cfg); // Include this in any subclass of AbstractJoiningTransformer
    this._str = s || '';
}
StringJoiningTransformer.prototype = new AbstractJoiningTransformer();


StringJoiningTransformer.prototype.append = function (s) {
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
    // Todo: allow a sister method allowing second argument to be a callback? (if so, temporarily disable _objPropState so it can use append())
    return this;
};

StringJoiningTransformer.prototype.object = function (cb, usePropertySets, propSets) {
    this._requireSameChildren('string', 'object');
    var oldObjPropState = this._objPropState;
    var oldObj = this._obj;
    this._obj = {};
    // Todo: Allow in this and subsequent JSON methods ability to create jml-based JHTML
    
    if (usePropertySets !== undef) {
        usePropertySets.reduce(function (obj, psName) {
            return this._usePropertySets(obj, psName); // Todo: Put in right scope
        }.bind(this), {});
    }
    if (propSets !== undef) {
        Object.assign(this._obj, propSets);
    }
    
    if (cb) {
        this._objPropState = true;
        cb.call(this);
        this._objPropState = oldObjPropState;
    }
    
    if (oldObjPropState || this._arrItemState) { // Not ready to serialize yet as still inside another array or object
        this.append(this._obj);
    }
    else if (this._cfg.JHTMLForJSON) {
        this.append(JHTML.toJHTMLString(this._obj));
    }
    else {
        this.append(JSON.stringify(this._obj));
    }
    this._obj = oldObj;
    return this;
};
StringJoiningTransformer.prototype.array = function (cb) {
    this._requireSameChildren('string', 'array');
    var oldArr = this._arr;
    this._arr = [];
    
    var oldArrItemState = this._arrItemState;
    
    if (cb) {
        this._arrItemState = true;
        cb.call(this);
        this._arrItemState = oldArrItemState;
    }
    
    if (oldArrItemState || this._objPropState) { // Not ready to serialize yet as still inside another array or object
        this.append(this._arr);
    }
    else if (this._cfg.JHTMLForJSON) {
        this.append(JHTML.toJHTMLString(this._arr));
    }
    else {
        this.append(JSON.stringify(this._arr));
    }
    this._arr = oldArr;
    return this;
};
StringJoiningTransformer.prototype.string = function (str, cb) {
    var tmpStr = '';
    var _oldStrTemp = this._strTemp;
    if (cb) {
        this._strTemp = '';
        cb.call(this);
        tmpStr = this._strTemp;
        this._strTemp = _oldStrTemp;
    }
    if (_oldStrTemp !== undefined) {
        this._strTemp += str;
    }
    else {
        this.append(JSON.stringify(tmpStr + str));
    }
    return this;
};
StringJoiningTransformer.prototype.number = function (num) {
    this.append(num.toString());
    return this;
};
StringJoiningTransformer.prototype['boolean'] = function (bool) {
    this.append(bool ? 'true' : 'false');
    return this;
};
StringJoiningTransformer.prototype['null'] = function () {
    this.append('null');
    return this;
};

StringJoiningTransformer.prototype['undefined'] = function () {
    if (this._cfg.mode !== 'JavaScript') {
        throw 'undefined is not allowed unless added in JavaScript mode';
    }
    this.append('undefined');
    return this;
};
StringJoiningTransformer.prototype.nonfiniteNumber = function (num) {
    if (this._cfg.mode !== 'JavaScript') {
        throw 'Non-finite numbers are not allowed unless added in JavaScript mode';
    }
    this.append(num.toString());
    return this;
};
StringJoiningTransformer.prototype['function'] = function (func) {
    if (this._cfg.mode !== 'JavaScript') {
        throw 'function is not allowed unless added in JavaScript mode';
    }
    this.append(func.toString());
    return this;
};

StringJoiningTransformer.prototype.element = function (elName, atts, cb) { // Todo: implement (allow for complete Jamilih or function callback)
    // Todo: allow third argument to be array following Jamilih (also let "atts" follow Jamilih)
    // Todo: allow for cfg to produce Jamilih string output or hXML
    
    if (typeof elName === 'object') {
        var objAtts = {};
        Array.from(elName.attributes).forEach(function (att, i) {
            objAtts[att.name] = att.value;
        });
        Object.assign(objAtts, atts);
        elName = elName.nodeName;
    }
    
    this.append('<' + elName);
    var oldTagState = this._openTagState;
    this._openTagState = true;
    if (atts) {
        Object.keys(atts).forEach(function (att) {
            this.attribute(att, atts[att]);
        }, this);
    }
    cb.call(this);
    
    // Todo: Depending on an this._cfg option, might allow for HTML self-closing tags (or polyglot-friendly self-closing) or XML self-closing when empty
    if (this._openTagState) {
        this.append('>');
    }
    this.append('</' + elName + '>');
    this._openTagState = oldTagState;
    return this;
};
StringJoiningTransformer.prototype.attribute = function (name, val) {
    if (!this._openTagState) {
        throw "An attribute cannot be added after an opening tag has been closed (name: " + name + "; value: " + val + ")";
    }
    this.append(' ' + name + '="' + val.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"'); // Todo: make ampersand escaping optional to avoid double escaping
    return this;
};
StringJoiningTransformer.prototype.text = function (txt) {
    if (this._openTagState) {
        this.append('>');
        this._openTagState = false;
    }
    this.append(txt.replace(/&/g, '&amp;').replace(/</g, '&lt;')); // Escape gt if inside CDATA
    return this;
};
/**
* Unlike text(), does not escape for HTML; unlike string(), does not perform JSON stringification;
* unlike append(), is not polymorphic with other joining transformers
* @param {String} str
*/
StringJoiningTransformer.prototype.rawAppend = function (str) {
    this._str += str;
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
    AbstractJoiningTransformer.call(this, cfg); // Include this in any subclass of AbstractJoiningTransformer
    this._dom = o || document.createDocumentFragment();
}
DOMJoiningTransformer.prototype = new AbstractJoiningTransformer();
DOMJoiningTransformer.prototype.append = function (item) {
    if (typeof item === 'string') {
        this._dom.appendChild(document.createTextNode(item));
    }
    else {
        this._dom.appendChild(item);
    }
};
DOMJoiningTransformer.prototype.get = function () {
    return this._dom;
};
DOMJoiningTransformer.prototype.propValue = function (prop, val) {
    
};
DOMJoiningTransformer.prototype.object = function (cb, usePropertySets, propSets) {
    this._requireSameChildren('dom', 'object');
    if (this._cfg.JHTMLForJSON) {
        this.append(JHTML());
    }
    else {
        this.append(document.createTextNode()); // Todo: set current position and deal with children
    }
    return this;
};
DOMJoiningTransformer.prototype.array = function (cb) {
    this._requireSameChildren('dom', 'array');
    if (this._cfg.JHTMLForJSON) {
        this.append(JHTML());
    }
    else {
        this.append(document.createTextNode()); // Todo: set current position and deal with children
    }
    return this;
};

DOMJoiningTransformer.prototype.string = function (str, cb) {
    // Todo: Conditionally add as JHTML (and in subsequent methods as well)
    this.append(str);
    return this;
};
DOMJoiningTransformer.prototype.number = function (num) {
    this.append(num.toString());
    return this;
};
DOMJoiningTransformer.prototype['boolean'] = function (bool) {
    this.append(bool ? 'true' : 'false');
    return this;
};
DOMJoiningTransformer.prototype['null'] = function () {
    this.append('null');
    return this;
};

DOMJoiningTransformer.prototype['undefined'] = function () {
    if (this._cfg.mode !== 'JavaScript') {
        throw 'undefined is not allowed unless added in JavaScript mode';
    }
    this.append('undefined');
    return this;
};
DOMJoiningTransformer.prototype.nonfiniteNumber = function (num) {
    if (this._cfg.mode !== 'JavaScript') {
        throw 'Non-finite numbers are not allowed unless added in JavaScript mode';
    }
    this.append(num.toString());
    return this;
};
DOMJoiningTransformer.prototype['function'] = function (func) {
    if (this._cfg.mode !== 'JavaScript') {
        throw 'function is not allowed unless added in JavaScript mode';
    }
    this.append(func.toString());
    return this;
};


DOMJoiningTransformer.prototype.element = function (elName, atts, cb) {
    // Todo: allow third argument to be array following Jamilih (also let "atts" follow Jamilih)
    // Todo: allow for cfg to produce Jamilih DOM output or hXML
    // Todo: allow separate XML DOM one with XML String and hXML conversions (HTML to XHTML is inevitably safe?)

    var el = document.createElement(elName);
    var att;
    for (att in atts) {
        el.setAttribute(att, atts[att]);
    }
    this.append(el);
    
    var oldDOM = this._dom;

    this._dom = el;
    cb.call(this);
    this._dom = oldDOM;
    
    return this;
};
DOMJoiningTransformer.prototype.attribute = function (name, val) {
    if (!this._dom || typeof this._dom !== 'object' || this._dom.nodeType !== 1) {
        throw "You may only set an attribute on an element";
    }
    this._dom.setAttribute(name, val);
    return this;
};
DOMJoiningTransformer.prototype.text = function (txt) {
    this.append(document.createTextNode(txt));
    return this;
};


function JSONJoiningTransformer (o, cfg) {
    if (!(this instanceof JSONJoiningTransformer)) {
        return new JSONJoiningTransformer(o, cfg);
    }
    AbstractJoiningTransformer.call(this, cfg); // Include this in any subclass of AbstractJoiningTransformer
    this._obj = o || [];
}
JSONJoiningTransformer.prototype = new AbstractJoiningTransformer();
JSONJoiningTransformer.prototype.append = function (item) {
    if (!this._obj || typeof this._obj !== 'object') {
        throw "You cannot append to a scalar or empty value.";
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
    if (!this._objPropState) {
        throw "propValue() can only be called after an object state has been set up.";
    }
    this._obj[prop] = val;
};

/**
* @param {function} cb Callback to be executed on this transformer but with a context nested within the newly created object
* @param {array} usePropertySets Array of string property set names to copy onto the new object
* @param {object} propSets An object of key-value pairs to copy onto the new object
*/
JSONJoiningTransformer.prototype.object = function (cb, usePropertySets, propSets) {
    // Todo: Conditionally add as JHTML-based jml (and in subsequent methods as well)
    var tempObj = this._obj;
    var obj = {};
    if (usePropertySets !== undef) {
        obj = usePropertySets.reduce(function (obj, psName) {
            return this._usePropertySets(obj, psName); // Todo: Put in right scope
        }.bind(this), {});
    }
    if (propSets !== undef) {
        Object.assign(obj, propSets);
    }
    
    this.append(obj);
    var oldObjPropState = this._objPropState;
    this._objPropState = true;
    cb.call(this, obj); // We pass the object, but user should usually use other methods
    this._obj = tempObj;
    this._objPropState = oldObjPropState;
    return this;
};

JSONJoiningTransformer.prototype.array = function (cb) {
    var tempObj = this._obj;
    var arr = [];
    this.append(arr); // Todo: set current position and deal with children
    cb.call(this, arr); // We pass the array, but user should usually use other methods
    this._obj = tempObj;
    return this;
};
JSONJoiningTransformer.prototype.string = function (str, cb) {
    this._requireSameChildren('json', 'string');
    this.append(JSON.stringify(str));
    return this;
};

JSONJoiningTransformer.prototype.number = function (num) {
    this.append(num);
    return this;
};
JSONJoiningTransformer.prototype['boolean'] = function (bool) {
    this.append(bool);
    return this;
};
JSONJoiningTransformer.prototype['null'] = function () {
    this.append(null);
    return this;
};

JSONJoiningTransformer.prototype['undefined'] = function () {
    if (this._cfg.mode !== 'JavaScript') {
        throw 'undefined is not allowed unless added in JavaScript mode';
    }
    this.append(undefined);
    return this;
};
JSONJoiningTransformer.prototype.nonfiniteNumber = function (num) {
    if (this._cfg.mode !== 'JavaScript') {
        throw 'Non-finite numbers are not allowed unless added in JavaScript mode';
    }
    this.append(num);
    return this;
};
JSONJoiningTransformer.prototype['function'] = function (func) {
    if (this._cfg.mode !== 'JavaScript') {
        throw 'function is not allowed unless added in JavaScript mode';
    }
    this.append(func);
    return this;
};

JSONJoiningTransformer.prototype.element = function (elName, atts, cb) {
    return this;
};
JSONJoiningTransformer.prototype.attribute = function (name, val) {
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

JSONPathTransformerContext.prototype.appendOutput = function (item) {
    this._getJoiningTransformer().append(item);
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
    results.append(result);
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
    results.append(result);
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

JSONPathTransformerContext.prototype.object = function (cb, usePropertySets, propSets) {
    this._getJoiningTransformer().object();
    return this;
};

JSONPathTransformerContext.prototype.array = function () {
    this._getJoiningTransformer().array();
    return this;
};

JSONPathTransformerContext.prototype.propertySet = function (name, propertySetObj, usePropertySets) {
    this.propertySets[name] = usePropertySets ? Object.assign({}, propertySetObj, usePropertySets.reduce(function (obj, psName) {
        return this._usePropertySets(obj, psName);
    }.bind(this), {})) : propertySetObj;
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
* @param {function} [config.joiningTransformer.append=StringJoiningTransformer.append] Required method if object provided. Defaults to string joining appender.
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
