function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

/**
 * @typedef {JSONValue[]} JSONArray
 */
/**
 * @typedef {null|boolean|number|string|JSONArray|{[key: string]: JSONValue}} JSONValue
 */

/**
* @callback SimpleJSONCallback
* @param {...JSONValue} json
* @returns {void}
*/

/**
* @callback SimpleJSONErrback
* @param {Error} err
* @param {string|string[]} jsonURL
* @returns {JSONValue}
*/

/**
 * @typedef {((
 *   jsonURL: string|string[],
 *   cb?: SimpleJSONCallback,
 *   errBack?: SimpleJSONErrback
 * ) => Promise<JSONValue>) & {
 *   _fetch?: import('./index-polyglot.js').SimpleFetch,
 *   hasURLBasePath?: boolean,
 *   basePath?: string|false
 * }} getJSONCallback
 */

/**
 * @param {object} [cfg]
 * @param {import('./index-polyglot.js').SimpleFetch} [cfg.fetch]
 * @returns {getJSONCallback}
 */

function _await(value, then, direct) {
  if (!value || !value.then) {
    value = Promise.resolve(value);
  }
  return then ? value.then(then) : value;
}
function _invoke(body, then) {
  var result = body();
  if (result && result.then) {
    return result.then(then);
  }
  return then(result);
}
function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }
  if (result && result.then) {
    return result.then(void 0, recover);
  }
  return result;
}
function buildGetJSONWithFetch() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
    _ref$fetch = _ref.fetch,
    fetch = _ref$fetch === void 0 ? typeof window !== 'undefined' ? window.fetch : self.fetch : _ref$fetch;
  /**
  * @type {getJSONCallback}
  */
  return function getJSON(jsonURL, cb, errBack) {
    try {
      var _exit = false;
      return _await(_catch(function () {
        return _invoke(function () {
          if (Array.isArray(jsonURL)) {
            return _await(Promise.all(jsonURL.map(function (url) {
              return /** @type {getJSONCallback} */getJSON(url);
            })), function (arrResult) {
              if (cb) {
                // eslint-disable-next-line promise/prefer-await-to-callbacks -- Old-style API
                cb.apply(void 0, _toConsumableArray(arrResult));
              }
              _exit = true;
              return arrResult;
            });
          }
        }, function (_result) {
          return _exit ? _result : _await(fetch(jsonURL), function (resp) {
            return _await(resp.json(), function (result) {
              return typeof cb === 'function'
              // eslint-disable-next-line promise/prefer-await-to-callbacks -- Old-style API
              ? cb(result) : result;
              // https://github.com/bcoe/c8/issues/135
              /* c8 ignore next */
            });
          });
        });
      }, function (err) {
        var e = /** @type {Error} */err;
        e.message += " (File: ".concat(jsonURL, ")");
        if (errBack) {
          return errBack(e, jsonURL);
        }
        throw e;
        // https://github.com/bcoe/c8/issues/135
        /* c8 ignore next */
      }));
      /* c8 ignore next */
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var getJSON = buildGetJSONWithFetch();

/**
 * For polymorphism with Node.
 * @returns {getJSON}
 */
var buildGetJSON = function buildGetJSON() {
  return getJSON;
};

export { buildGetJSON, getJSON };
//# sourceMappingURL=index-es.js.map
