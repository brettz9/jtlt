var exports;

(function () {

var camelCase = /[a-z][A-Z]/g;

function _isElement (item) {
    return item && typeof item === 'object' && item.nodeType === 1;
}
function _makeDatasetAttribute (n0) {
    return n0.charAt(0) + '-' + n0.charAt(1).toLowerCase();
}

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

    if (this.propOnlyState) {
        this._obj[this._objPropTemp] = val;
        this.propOnlyState = false;
        this._objPropTemp = undefined;
    }
    else if (this._arrItemState) {
        this._arr.push(s);
    }
    else if (this._objPropState) {
        throw "Object values must be added via propValue() or after propOnly() when in an object state.";
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

StringJoiningTransformer.prototype.propOnly = function (prop, cb) {
    if (!this._objPropState) {
        throw "propOnly() can only be called after an object state has been set up.";
    }
    if (this.propOnlyState) {
        throw "propOnly() can only be called again after a value is set";
    }
    this.propOnlyState = true;
    var oldPropTemp = this._objPropTemp;
    this._objPropTemp = prop;
    cb.call(this);
    this._objPropTemp = oldPropTemp;
    if (this.propOnlyState) {
        throw "propOnly() must be followed up with setting a value.";
    }
    return this;
};

StringJoiningTransformer.prototype.object = function (obj, cb, usePropertySets, propSets) {
    this._requireSameChildren('string', 'object');
    var oldObjPropState = this._objPropState;
    var oldObj = this._obj;
    this._obj = obj || {};
    if (_isElement(obj)) {
        this._obj = JHTML.toJSONObject(this._obj);
    }

    // Todo: Allow in this and subsequent JSON methods ability to create jml-based JHTML

    if (usePropertySets !== undef) {
        usePropertySets.reduce(function (o, psName) {
            return this._usePropertySets(o, psName); // Todo: Put in right scope
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
    else if (this._cfg.mode !== 'JavaScript') {
        // Allow this method to operate on non-finite numbers and functions
        var stringifier = new Stringifier({mode: 'JavaScript'});
        this.append(stringifier.walkJSONObject(this._obj));
    }
    else {
        this.append(JSON.stringify(this._obj));
    }
    this._obj = oldObj;
    return this;
};
StringJoiningTransformer.prototype.array = function (arr, cb) {
    this._requireSameChildren('string', 'array');
    var oldArr = this._arr;
    // Todo: copy array?
    this._arr = arr || [];
    if (_isElement(arr)) {
        this._arr = JHTML.toJSONObject(this._arr);
    }

    var oldArrItemState = this._arrItemState;

    if (cb) {
        var oldObjPropState = this._objPropState;
        this._objPropState = false;
        this._arrItemState = true;
        cb.call(this);
        this._arrItemState = oldArrItemState;
        this._objPropState = oldObjPropState;
    }

    if (oldArrItemState || this._objPropState) { // Not ready to serialize yet as still inside another array or object
        this.append(this._arr);
    }
    else if (this._cfg.JHTMLForJSON) {
        this.append(JHTML.toJHTMLString(this._arr));
    }
    else if (this._cfg.mode !== 'JavaScript') {
        // Allow this method to operate on non-finite numbers and functions
        var stringifier = new Stringifier({mode: 'JavaScript'});
        this.append(stringifier.walkJSONObject(this._obj));
    }
    else {
        this.append(JSON.stringify(this._arr));
    }
    this._arr = oldArr;
    return this;
};
StringJoiningTransformer.prototype.string = function (str, cb) {
    if (_isElement(str)) {
        str = JHTML.toJSONObject(str);
    }

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
    else if (this._cfg.mode !== 'JavaScript') {
        // Allow this method to operate on non-finite numbers and functions
        var stringifier = new Stringifier({mode: 'JavaScript'});
        this.append(stringifier.walkJSONObject(this._obj));
    }
    else {
        this.append(JSON.stringify(tmpStr + str));
    }
    return this;
};
StringJoiningTransformer.prototype.number = function (num) {
    if (_isElement(num)) {
        num = JHTML.toJSONObject(num);
    }
    this.append(num.toString());
    return this;
};
StringJoiningTransformer.prototype.boolean = function (bool) {
    if (_isElement(bool)) {
        bool = JHTML.toJSONObject(bool);
    }
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
    if (_isElement(num)) {
        num = JHTML.toJSONObject(num);
    }
    this.append(num.toString());
    return this;
};
StringJoiningTransformer.prototype['function'] = function (func) {
    if (this._cfg.mode !== 'JavaScript') {
        throw 'function is not allowed unless added in JavaScript mode';
    }
    if (_isElement(func)) {
        func = JHTML.toJSONObject(func);
    }
    this.append(func.toString());
    return this;
};

StringJoiningTransformer.prototype.element = function (elName, atts, childNodes, cb) {
    if (Array.isArray(atts)) {
        cb = childNodes;
        childNodes = atts;
        atts = {};
    }
    else if (typeof atts === 'function') {
        cb = atts;
        childNodes = undefined;
        atts = {};
    }
    if (typeof childNodes === 'function') {
        cb = childNodes;
        childNodes = undefined;
    }

    // Todo: allow for cfg to produce Jamilih string output or hXML string output
    var method = this._cfg.xmlElements ? 'toXML' : 'toHTML';
    if (!cb) {
        // Note that Jamilih currently has an issue with 'selected', 'checked',
        //  'value', 'defaultValue', 'for', 'on*', 'style' (workaround: pass
        //   an empty callback as the last argument to element())
        this.append(jml[method].call(jml, elName, atts, childNodes));
        return this;
    }

    if (typeof elName === 'object') {
        var objAtts = {};
        Array.from(elName.attributes).forEach(function (att, i) {
            objAtts[att.name] = att.value;
        });
        atts = Object.assign(objAtts, atts);
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
    if (childNodes && childNodes.length) {
        this._openTagState = false;
        this.append(jml[method].call(jml, {'#': childNodes}));
    }
    if (cb) {
        cb.call(this);
    }

    // Todo: Depending on an this._cfg.xmlElements option, allow for
    //        XML self-closing when empty or as per the tag, HTML
    //        self-closing tags (or polyglot-friendly self-closing)
    if (this._openTagState) {
        this.append('>');
    }
    this.append('</' + elName + '>');
    this._openTagState = oldTagState;
    return this;
};
StringJoiningTransformer.prototype.attribute = function (name, val, avoidAttEscape) {
    if (!this._openTagState) {
        throw "An attribute cannot be added after an opening tag has been closed (name: " + name + "; value: " + val + ")";
    }

    if (!this._cfg.xmlElements) {
        if (typeof val === 'object') {
            switch (name) {
                case 'dataset':
                    Object.keys(val).forEach(function (att) {
                        this.attribute('data-' + att.replace(camelCase, _makeDatasetAttribute), val[att]);
                    });
                    break;
                case '$a': // Ordered attributes
                    val.forEach(function (attArr) {
                        this.attribute(attArr[0], attArr[1]);
                    });
                    break;
            }
            return this;
        }
        name = {className: 'class', htmlFor: 'for'}[name] || name;
    }

    val = (this._cfg.preEscapedAttributes || avoidAttEscape) ? val : val.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    this.append(' ' + name + '="' + val + '"');
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
* unlike append(), does not do other checks (but still varies in its role across transformers)
* @param {String} str
*/
StringJoiningTransformer.prototype.rawAppend = function (str) {
    this._str += str;
    return this;
};

StringJoiningTransformer.prototype.plainText = function (str) {
    this._str += str;
    return this;
};

// Todo: Implement comment(), processingInstruction(), etc.

var baseObj = exports === undefined ? window : exports;
baseObj.StringJoiningTransformer = StringJoiningTransformer;

}());
