// Todo: Allow swapping of joining transformer types in
//        mid-transformation (e.g., building strings with
//        string transformer but adding as text node in a DOM transformer)

function AbstractJoiningTransformer (cfg) {
    if (!(this instanceof AbstractJoiningTransformer)) {
        return new AbstractJoiningTransformer();
    }
    // Todo: Might set some reasonable defaults across all classes
    this.setConfig(cfg);
}

AbstractJoiningTransformer.prototype.setConfig = function (cfg) {
    this._cfg = cfg;
};

AbstractJoiningTransformer.prototype._requireSameChildren = function (type, embedType) {
    if (this._cfg[type].requireSameChildren) {
        throw "Cannot embed " + embedType + " children for a " + type + " joining transformer.";
    }
};
AbstractJoiningTransformer.prototype.config = function (prop, val, cb) {
    var oldCfgProp = this._cfg[prop];
    this._cfg[prop] = val;
    if (cb) {
        cb.call(this);
        this._cfg[prop] = oldCfgProp;
    }
};
