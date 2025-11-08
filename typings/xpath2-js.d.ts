// Ambient module declaration for xpath2.js (library lacks bundled types)
declare module 'xpath2.js' {
	/**
	 * Options for XPath 2 evaluation.
	 * @interface XPath2EvaluateOptions
	 */
	interface XPath2EvaluateOptions {
		/** Prefix-to-URI mappings */
		namespaces?: Record<string, string>;
		/** Variable name-to-value mappings */
		variables?: Record<string, any>;
		/** Force node array return (wrap scalars) */
		asNodes?: boolean;
	}
	/** Scalar result types */
	type XPath2Scalar = string | number | boolean | null;
	/** Node representation (library uses host objects) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	type XPath2Node = any;
	/** Possible evaluate result */
	type XPath2Result =
		| XPath2Scalar
		| XPath2Node
		| XPath2Node[]
		| XPath2Scalar[];
	/** Evaluate an XPath 2 expression */
	function evaluate (
		expression: string,
		contextNode: XPath2Node,
		options?: XPath2EvaluateOptions
	): XPath2Result;
	const _default: {evaluate: typeof evaluate};
	export {
		evaluate,
		XPath2EvaluateOptions,
		XPath2Scalar,
		XPath2Node,
		XPath2Result
	};
	export default _default;
}
