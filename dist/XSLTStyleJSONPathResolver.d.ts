export default XSLTStyleJSONPathResolver;
/**
 * Computes a simple specificity score for JSONPath selectors inspired by XSLT.
 *
 * Used by the engine to break ties between templates when multiple JSONPath
 * expressions match the same node. Lower values indicate broader matches
 * (e.g., wildcards), while higher values indicate more specific matches.
 */
declare class XSLTStyleJSONPathResolver {
    /**
     * @param {string|string[]} path
     * @returns {-0.5|0.5|0}
     */
    getPriorityBySpecificity(path: string | string[]): -0.5 | 0.5 | 0;
}
//# sourceMappingURL=XSLTStyleJSONPathResolver.d.ts.map