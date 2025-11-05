import {JSONPath} from 'jsonpath-plus';

/**
 *
 */
class XSLTStyleJSONPathResolver {
  /**
   * @param {string|string[]} path
   * @returns {-0.5|0.5|0}
   */
  // eslint-disable-next-line class-methods-use-this -- Convenient
  getPriorityBySpecificity (path) {
    if (typeof path === 'string') {
      path = JSONPath.toPathArray(path);
    }

    const terminal = path.at(-1);
    // *, ~, @string() (comparable to XSLT's *, @*, and node tests,
    //   respectively)
    if (terminal && (/^(?:\*|~|@[a-z]*?\(\))$/vi).test(terminal)) {
      return -0.5;
    }
    // ., .., [] or [()] or [(?)] (comparable to XSLT's /, //, or [],
    //   respectively)
    if (terminal && (/^(?:\.+|\[.*?\])$/v).test(terminal)) {
      return 0.5;
    }
    // single name (i.e., $..someName or someName if allowing such
    //   relative paths) (comparable to XSLT's identifying a particular
    //   element or attribute name)
    return 0;
  }
}

export default XSLTStyleJSONPathResolver;
