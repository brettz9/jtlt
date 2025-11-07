export { default as AbstractJoiningTransformer } from "./AbstractJoiningTransformer.js";
export { default as StringJoiningTransformer } from "./StringJoiningTransformer.js";
export { default as DOMJoiningTransformer } from "./DOMJoiningTransformer.js";
export { default as JSONJoiningTransformer } from "./JSONJoiningTransformer.js";
export { default as XSLTStyleJSONPathResolver } from "./XSLTStyleJSONPathResolver.js";
export { default as JSONPathTransformerContext } from "./JSONPathTransformerContext.js";
export { default as JSONPathTransformer } from "./JSONPathTransformer.js";
export default JTLT;
export type JTLTOptions = {
    /**
     * A callback supplied with a single
     * argument that is the result of this instance's transform() method.
     */
    success: Function;
    /**
     * An array of template objects
     */
    templates?: any[] | undefined;
    /**
     * A function assumed to be a
     * root template or a single, complete template object
     */
    template?: object | Function | undefined;
    /**
     * A function assumed to be a root template
     */
    query?: Function | undefined;
    /**
     * An array with arguments to be supplied
     * to a single call to `forEach` (and which will serve as the root
     * template)
     */
    forQuery?: any[] | undefined;
    /**
     * A JSON object
     */
    data?: any;
    /**
     * URL of a JSON file to retrieve for
     * evaluation
     */
    ajaxData?: string | undefined;
    /**
     * Whether or not to
     * report an error when equal priority templates are found
     */
    errorOnEqualPriority?: boolean | undefined;
    /**
     * Whether to begin transform()
     * immediately.
     */
    autostart?: boolean | undefined;
    /**
     * Whether to prevent
     * parenthetical evaluations in JSONPath. Safer if relying on user
     * input, but reduces capabilities of JSONPath.
     */
    preventEval?: boolean | undefined;
    /**
     * The mode in which to begin the transform.
     */
    mode?: string | undefined;
    /**
     * Output type: 'string', 'dom', or 'json'
     */
    outputType?: string | undefined;
    /**
     * Will be based the
     * same config as passed to this instance. Defaults to a transforming
     * function based on JSONPath and with its own set of priorities for
     * processing templates.
     */
    engine?: Function | undefined;
    /**
     * Callback for getting the priority by specificity
     */
    specificityPriorityResolver?: Function | undefined;
    /**
     * Can
     * be a singleton or class instance. Defaults to string joining for output
     * transformation.
     */
    joiningTransformer?: {
        get: Function;
        append: Function;
        string?: Function;
        object?: Function;
        array?: Function;
    } | undefined;
    /**
     * Config to pass on to the joining
     * transformer
     */
    joiningConfig?: object | undefined;
    /**
     * Parent object for context
     */
    parent?: any;
    /**
     * Parent property name for context
     */
    parentProperty?: string | undefined;
};
/**
 * High-level façade for running a JTLT transform.
 *
 * Accepts data and templates (or a root template/query), constructs a joining
 * transformer based on `outputType`, and invokes the JSONPath-based engine.
 * The result is returned to the required `success` callback and also returned
 * from transform().
 */
declare class JTLT {
    /**
     * For templates/queries, one may choose among config.query,
     * config.template, or config.templates, but one must be
     * present and of valid type. For the source json, one must use
     * either a valid config.ajaxData or config.data parameter.
     * @param {JTLTOptions} config Options
     * @todo Remove JSONPath dependency in query use of '$'?
     */
    constructor(config: JTLTOptions);
    /** @type {JTLTOptions} */
    config: JTLTOptions;
    /**
     * @returns {DOMJoiningTransformer|JSONJoiningTransformer|
     *   StringJoiningTransformer}
     */
    _createJoiningTransformer(): DOMJoiningTransformer | JSONJoiningTransformer | StringJoiningTransformer;
    /**
     * @param {string} mode
     * @returns {void}
     */
    _autoStart(mode: string): void;
    /**
     * @param {JTLTOptions} config
     * @returns {JTLT}
     */
    setDefaults(config: JTLTOptions): JTLT;
    /**
     * @param {string} mode The mode of the transformation
     * @returns {any} Result of transformation
     * @todo Allow for a success callback in case the jsonpath code is modified
     *     to work asynchronously (as with queries to access remote JSON
     *     stores)
     */
    transform(mode: string): any;
}
import DOMJoiningTransformer from './DOMJoiningTransformer.js';
import JSONJoiningTransformer from './JSONJoiningTransformer.js';
import StringJoiningTransformer from './StringJoiningTransformer.js';
//# sourceMappingURL=index.d.ts.map