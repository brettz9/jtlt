/*jslint vars: true*/
(function () {'use strict';

function getJSON (jsonURL, cb) {
    try {
        var r = new XMLHttpRequest();

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
        throw e + ' (' + jsonURL + ')';
    }
}

window.getJSON = getJSON;

}());
