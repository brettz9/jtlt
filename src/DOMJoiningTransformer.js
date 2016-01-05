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

DOMJoiningTransformer.prototype.rawAppend = function (item) {
    this._dom.appendChild(item);
};

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
DOMJoiningTransformer.prototype.boolean = function (bool) {
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
        if (atts.hasOwnProperty(att)) {
            el.setAttribute(att, atts[att]);
        }
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

DOMJoiningTransformer.prototype.plainText = function (str) {
    this.text(str);
    return this;
};
