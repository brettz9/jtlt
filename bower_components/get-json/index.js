/*jslint vars: true*/

var require, module;

(function () {'use strict';

function getJSON (jsonURL, cb, errBack) {
    function handleError (e) {
        if (errBack) {
            return errBack(e, jsonURL);
        }
        throw e + ' (' + jsonURL + ')';
    }
    if (Array.isArray(jsonURL)) {
        return Promise.all(jsonURL.map(getJSON)).then(function (arr) {
            if (cb) {
                cb.apply(null, arr);
            }
            return arr;
        }).catch(function (err) {
            handleError(err);
        });
    }
    if (typeof cb !== 'function' && typeof errBack !== 'function') { // Do typeof checks to allow for easier array promise usage of getJSON (as above)
        return new Promise(getJSON.bind(null, jsonURL));
    }
    try {
        // Todo: use fetch API for greater elegance
        var r = require === undefined ? new XMLHttpRequest() : new (require('local-xmlhttprequest').XMLHttpRequest)();

        r.open('GET', jsonURL, true);
        //r.responseType = 'json';
        r.onreadystatechange = function () {
            if (r.readyState !== 4) {return;}
            if (r.status === 200) {
                //var json = r.json;
                var response = r.responseText;

                var json = JSON.parse(response);
                cb(json);
                return;
            }
            // Request failed
            throw "Failed to fetch URL: " + jsonURL + 'state: ' + r.readyState + '; status: ' + r.status;
        };
        r.send();
    }
    catch (e) {
        handleError(e);
    }
}

if (module !== undefined) {
    module.exports = getJSON;
}
else {
    window.getJSON = getJSON;
}

}());
