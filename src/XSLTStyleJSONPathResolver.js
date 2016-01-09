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
    // single name (i.e., $..someName or someName if allowing such
    //   relative paths) (comparable to XSLT's identifying a particular
    //   element or attribute name)
    return 0;
};

if (typeof module !== 'undefined') {
    module.exports = XSLTStyleJSONPathResolver;
}
