function JSONPathTransformerContext (config, templates) {
    this._config = config;
    this._templates = templates;
    this._contextObj = this._origObj = config.data;
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
    return this._getJoiningTransformer().get();
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

/**
* @todo implement sort (allow as callback or as object)
*/
JSONPathTransformerContext.prototype.applyTemplates = function (select, mode, sort) {
    var that = this;
    if (select && typeof select === 'object') {
        mode = select.mode;
        select = select.select;
    }
    if (!this._initialized) {
        select = select || '$';
        this._currPath = '$';
        this._initialized = true;
    }
    else {
        select = select || '*';
    }
    select = JSONPathTransformer.makeJSONPathAbsolute(select);
    var results = this._getJoiningTransformer();
    var modeMatchedTemplates = this._templates.filter(function (templateObj) {
        return ((mode && mode === templateObj.mode) || (!mode && !templateObj.mode));
    });
//s(select);
//s(this._contextObj);
    jsonpath({
        path: select,
        resultType: 'all',
        wrap: false,
        json: this._contextObj,
        preventEval: this._config.preventEval,
        callback: function (o /*{value, parent, parentProperty, path}*/) {
            var value = o.value, parent = o.parent, parentProperty = o.parentProperty, path = o.path;
            // Todo: For remote JSON stores, could optimize this to first get
            //        template paths and cache by template (and then query
            //        the remote JSON and transform as results arrive)
//s(value + '::' + parent + '::' + parentProperty + '::' + path);
            var _oldPath = that._currPath;
            that._currPath += path.replace(/^\$/, '');
            // Todo: Normalize templateObj.path's
            var pathMatchedTemplates = modeMatchedTemplates.filter(function (templateObj) {
                var queryResult = jsonpath({
                    path: JSONPathTransformer.makeJSONPathAbsolute(templateObj.path),
                    json: that._origObj,
                    resultType: 'path',
                    preventEval: that._config.preventEval,
                    wrap: true
                });
//s(queryResult);
//s('currPath:'+that._currPath);
                return queryResult.includes(that._currPath);
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
                // Todo: provide parameters to jsonpath based on config on whether to allow non-JSON JS results
                else if (value && typeof value === 'function') {
                    templateObj = dtr.transformFunctions;
                }
                else {
                    templateObj = dtr.transformScalars;
                }
                /*
                Todo: If Jamilih support Jamilih, could add equivalents more like XSL,
                including processing-instruction(), comment(), and namespace nodes (whose
                default templates do not add to the result tree in XSLT) as well as elements,
                attributes, text nodes (see
                http://lenzconsulting.com/how-xslt-works/#built-in_template_rules )
                */
            }
            else {
                // Todo: Could perform this first and cache by template
                pathMatchedTemplates.sort(function (a, b) {
                    var aPriority = typeof a.priority === 'number' ? a.priority : that._config.specificityPriorityResolver(a.path);
                    var bPriority = typeof b.priority === 'number' ? b.priority : that._config.specificityPriorityResolver(a.path);

                    if (aPriority === bPriority) {
                        that._triggerEqualPriorityError();
                    }

                    return (aPriority > bPriority) ? -1 : 1; // We want equal conditions to go in favor of the later (b)
                });

                templateObj = pathMatchedTemplates.shift();
            }

            that._contextObj = value;
            that._parent = parent;
            that._parentProperty = parentProperty;

            var ret = templateObj.template.call(that, value, {mode: mode, parent: parent, parentProperty: parentProperty});
            if (typeof ret !== 'undefined') {
                // Will vary by that._config.outputType
                that._getJoiningTransformer().append(ret);
            }

            // Child templates may have changed the context
            that._contextObj = value;
            that._parent = parent;
            that._parentProperty = parentProperty;
            that._currPath = _oldPath;
        }
    });
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

// Todo: Implement sort (allow as callback or as object)
// Todo: If making changes in return values, be sure to update `forQuery` as well
JSONPathTransformerContext.prototype.forEach = function (select, cb, sort) {
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

// Todo: Add other methods from the joining transformers
JSONPathTransformerContext.prototype.string = function (str, cb) {
    this._getJoiningTransformer().string(str, cb);
    return this;
};

JSONPathTransformerContext.prototype.object = function (cb, usePropertySets, propSets) {
    this._getJoiningTransformer().object(cb, usePropertySets, propSets);
    return this;
};

JSONPathTransformerContext.prototype.array = function (cb) {
    this._getJoiningTransformer().array(cb);
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

if (typeof module !== 'undefined') {
    module.exports = JSONPathTransformerContext;
}
