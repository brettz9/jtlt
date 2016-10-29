/*globals module*/
/*eslint-disable no-unused-vars */
var jsonpath, getJSON, JHTML, JSONPath,
    jml, Stringifier; // Define globally for convenience of any user subclasses
var exports, require, document, window;
var AbstractJoiningTransformer, DOMJoiningTransformer,
    JSONJoiningTransformer, JSONPathTransformer,
    JSONPathTransformerContext, StringJoiningTransformer,
    XSLTStyleJSONPathResolver;

function l (str) {
    'use strict';
    console.log(str); // eslint-disable-line no-console
}
function s (o) {'use strict'; l(JSON.stringify(o));}

(function (undef) {'use strict';

    if (exports !== undefined) {
        getJSON = require('simple-get-json');
        JHTML = require('jhtml');
        jsonpath = require('jsonpath-plus');
        try {
            jml = require('jamilih');
            document = require('jsdom').jsdom(''); // eslint-disable-line no-native-reassign, max-len
            window = document.parentWindow; // eslint-disable-line no-native-reassign, max-len
        }
        catch (e) {
            console.log('Optional dependency not defined: ' + e); // eslint-disable-line no-console, max-len
        }
        Stringifier = require('../node_modules/jhtml/SAJJ/SAJJ.Stringifier');

        AbstractJoiningTransformer = require('./AbstractJoiningTransformer');
        DOMJoiningTransformer = require('./DOMJoiningTransformer');
        JSONJoiningTransformer = require('./JSONJoiningTransformer');
        JSONPathTransformer = require('./JSONPathTransformer');
        JSONPathTransformerContext = require('./JSONPathTransformerContext');
        StringJoiningTransformer = require('./StringJoiningTransformer');
        XSLTStyleJSONPathResolver = require('./XSLTStyleJSONPathResolver');

        // Polyfills
        Object.assign = Object.assign || require('object-assign');
    }
    else {
        jsonpath = JSONPath;
    }

    /* eslint-disable max-len*/
    /**
    * For templates/queries, one may choose among config.query,
        config.template, or config.templates, but one must be
        present and of valid type. For the source json, one must use
        either a valid config.ajaxData or config.data parameter.
    * @param {object} config Options
    * @param {function} config.success A callback supplied with a single
        argument that is the result of this instance's transform() method.
    * @param {array} [config.templates] An array of template objects
    * @param {object|function} [config.template] A function assumed to be a
        root template or a single, complete template object
    * @param {function} [config.query] A function assumed to be a root template
    * @param {array} [config.forQuery] An array with arguments to be supplied
        to a single call to `forEach` (and which will serve as the root
        template)
    * @param {object} [config.data] A JSON object
    * @param {string} [config.ajaxData] URL of a JSON file to retrieve for
        evaluation
    * @param {boolean} [config.errorOnEqualPriority=false] Whether or not to
        report an error when equal priority templates are found
    * @param {boolean} [config.autostart=true] Whether to begin transform()
        immediately.
    * @param {boolean} [config.preventEval=false] Whether to prevent
        parenthetical evaluations in JSONPath. Safer if relying on user
        input, but reduces capabilities of JSONPath.
    * @param {string} [config.mode=''] The mode in which to begin the transform.
    * @param {function} [config.engine=JSONPathTransformer] Will be based the
        same config as passed to this instance. Defaults to a transforming
        function based on JSONPath and with its own set of priorities for
        processing templates.
    * @param {function} [config.specificityPriorityResolver=XSLTStyleJSONPathResolver.getPriorityBySpecificity]
        Callback for getting the priority by specificity
    * @param {object} [config.joiningTransformer=StringJoiningTransformer] Can
        be a singleton or class instance. Defaults to string joining for output
        transformation.
    * @param {function} [config.joiningTransformer.get=StringJoiningTransformer.get] Required method if object provided. Defaults to string joining getter.
    * @param {function} [config.joiningTransformer.append=StringJoiningTransformer.append] Required method if object provided. Defaults to string joining appender.
    * @param {object} [config.joiningConfig={string: {}, json: {}, dom: {}, jamilih: {}}] Config to pass on to the joining transformer
    * @returns {JTLT} A JTLT instance object
    * @todo Remove JSONPath dependency in query use of '$'?
    */
    /* eslint-enable max-len*/
    function JTLT (config) {
        if (!(this instanceof JTLT)) {
            return new JTLT(config);
        }

        this.setDefaults(config);
        var that = this;
        if (this.config.ajaxData) {
            getJSON(this.config.ajaxData, (function (cfg) {
                return function (json) {
                    that.config.data = json;
                    that._autoStart(cfg.mode);
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
        case 'dom':
            JT = DOMJoiningTransformer;
            break;
        case 'json':
            JT = JSONJoiningTransformer;
            break;
        case 'string': default:
            JT = StringJoiningTransformer;
            break;
        }
        return new JT(/* this.config.data, */
            undefined,
            this.config.joiningConfig || {
                string: {}, json: {}, dom: {}, jamilih: {}
            });
    };
    JTLT.prototype._autoStart = function (mode) {
        // We wait to set this default as we want to pass in the data
        this.config.joiningTransformer = this.config.joiningTransformer ||
            this._createJoiningTransformer();

        if (this.config.autostart === false) {
            return;
        }

        this.transform(mode);
    };
    JTLT.prototype.setDefaults = function (config) {
        this.config = config || {};
        config = this.config;
        var query = config.forQuery ? function () {
            this.forEach([].slice.call(config.forQuery));
        } : config.query || (
            typeof config.templates === 'function' ? config.templates :
            typeof config.template === 'function' ? config.template : null
        );
        this.config.templates = query ? [
            {name: 'root', path: '$', template: query}
        ] : config.templates || [config.template];
        this.config.errorOnEqualPriority = config.errorOnEqualPriority || false;
        this.config.engine = this.config.engine || function (cfg) {
            var jpt = new JSONPathTransformer(cfg);
            return jpt.transform(cfg.mode);
        };
        // Todo: Let's also, unlike XSLT and the following, give options for
        //   higher priority to absolute fixed paths over recursive descent
        //   and priority to longer paths and lower to wildcard terminal points
        this.config.specificityPriorityResolver =
            this.config.specificityPriorityResolver || (function () {
                var xsjpr = new XSLTStyleJSONPathResolver();
                return function (path) {
                    xsjpr.getPriorityBySpecificity(path);
                };
            }());
        return this;
    };
    /**
    * @param {string} mode The mode of the transformation
    * @returns {any} Result of transformation
    * @todo Allow for a success callback in case the jsonpath code is modified
             to work asynchronously (as with queries to access remote JSON
             stores)
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
        var ret = this.config.success(this.config.engine(this.config));
        return ret;
    };


    var baseObj = exports === undefined ? window : exports;

    // EXPORTS
    baseObj.AbstractJoiningTransformer = AbstractJoiningTransformer;
    // baseObj.StringJoiningTransformer = StringJoiningTransformer;
    baseObj.DOMJoiningTransformer = DOMJoiningTransformer;
    baseObj.JSONJoiningTransformer = JSONJoiningTransformer;
    baseObj.XSLTStyleJSONPathResolver = XSLTStyleJSONPathResolver;
    baseObj.JSONPathTransformerContext = JSONPathTransformerContext;
    baseObj.JSONPathTransformer = JSONPathTransformer;

    if (typeof module !== 'undefined') {
        module.exports = JTLT;
    }
    else {
        baseObj.JTLT = JTLT;
    }

}());
