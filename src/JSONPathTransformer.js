/**
* @param {boolean} config.errorOnEqualPriority
*/
var JSONPathTransformer = function JSONPathTransformer (config) {
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
    templateObj.template.call(jte, undefined, {mode: mode});
    var result = jte.getOutput();
    return result;
};

/**
* @private
* @static
*/
JSONPathTransformer.makeJSONPathAbsolute = function (select) {
    // See todo in JSONPath to avoid need for '$' (but may still need to add ".")
    return select[0] !== '$' ? ((select[0] === '[' ? '$' : '$.') + select) : select;
};


JSONPathTransformer.DefaultTemplateRules = {
    transformRoot: {
        template: function (value, cfg) {
            this.applyTemplates(null, cfg.mode);
        }
    },
    transformPropertyNames: {
        template: function () {
            this.valueOf({select: '.'});
        }
    },
    transformObjects: {
        template: function (value, cfg) {
            this.applyTemplates(null, cfg.mode);
        }
    },
    transformArrays: {
        template: function (value, cfg) {
            this.applyTemplates(null, cfg.mode);
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

if (typeof module !== 'undefined') {
    module.exports = JSONPathTransformer;
}
