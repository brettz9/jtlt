function JSONJoiningTransformer (o, cfg) {
    if (!(this instanceof JSONJoiningTransformer)) {
        return new JSONJoiningTransformer(o, cfg);
    }
    AbstractJoiningTransformer.call(this, cfg); // Include this in any subclass of AbstractJoiningTransformer
    this._obj = o || [];
}
JSONJoiningTransformer.prototype = new AbstractJoiningTransformer();

JSONJoiningTransformer.prototype.rawAppend = function (item) {
    this._obj.push(item);
};

JSONJoiningTransformer.prototype.append = function (item) {
    if (!this._obj || typeof this._obj !== 'object') { // Todo: allow for first time
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
    this.append(str);
    return this;
};

JSONJoiningTransformer.prototype.number = function (num) {
    this.append(num);
    return this;
};
JSONJoiningTransformer.prototype.boolean = function (bool) {
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

JSONJoiningTransformer.prototype.plainText = function (str) {
    this.string(str);
    return this;
};
