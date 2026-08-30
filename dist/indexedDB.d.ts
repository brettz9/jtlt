export type OpenDBFunction = typeof import("idb").openDB;
export type IndexedDBResultType = 'value' | 'key' | 'primaryKey' | 'all';
export type QueryOptions = {
    index?: string;
    range?: {
        lower?: IDBValidKey;
        upper?: IDBValidKey;
        lowerOpen?: boolean;
        upperOpen?: boolean;
    };
    query?: NonNullable<object | string | number>;
    direction?: 'next' | 'nextunique' | 'prev' | 'prevunique';
    count?: number;
    resultType?: IndexedDBResultType;
};
export type IdbCursorLike = {
    key: IDBValidKey;
    primaryKey: IDBValidKey;
    value: unknown;
    continue: () => Promise<IdbCursorLike | null>;
};
export type IdbRecord = {
    key: IDBValidKey;
    primaryKey: IDBValidKey;
    value: unknown;
};
export type IdbQueryTarget = {
    openCursor: (range?: IDBKeyRange | null, direction?: IDBCursorDirection) => Promise<IdbCursorLike | null>;
    openKeyCursor: (range?: IDBKeyRange | null, direction?: IDBCursorDirection) => Promise<IdbCursorLike | null>;
    getAll: (range?: IDBKeyRange | null, count?: number) => Promise<unknown[]>;
    getAllKeys: (range?: IDBKeyRange | null, count?: number) => Promise<IDBValidKey[]>;
    getAllRecords?: ((options?: {
        query?: IDBKeyRange | null;
        count?: number;
        direction?: IDBCursorDirection;
    }) => Promise<IdbRecord[]>);
};
export declare function queryIndexedDB(dbName: string, storeName: string, options: QueryOptions & {
    resultType: 'all';
}): Promise<IdbRecord[]>;
export declare function queryIndexedDB(dbName: string, storeName: string, options: QueryOptions & {
    resultType: 'key' | 'primaryKey';
}): Promise<IDBValidKey[]>;
export declare function queryIndexedDB(dbName: string, storeName: string, options?: QueryOptions): Promise<unknown[]>;
export type ParsedIndexedDBExpression = {
    dbName: string;
    storeName: string;
    options: QueryOptions | undefined;
    /**
     * - A JSONPath segment applied to the fetched
     * records (e.g. `.*.name` or `[0].name`), with surrounding whitespace
     * trimmed. Used by the JSONPath engine only; the XPath engine exposes
     * `indexedDB()` as a registered XPath function instead (see
     * {@link evaluateXPathWithIndexedDB}).
     */
    trailing: string;
};
/**
 * @typedef {object} ParsedIndexedDBExpression
 * @property {string} dbName
 * @property {string} storeName
 * @property {QueryOptions|undefined} options
 * @property {string} trailing - A JSONPath segment applied to the fetched
 *   records (e.g. `.*.name` or `[0].name`), with surrounding whitespace
 *   trimmed. Used by the JSONPath engine only; the XPath engine exposes
 *   `indexedDB()` as a registered XPath function instead (see
 *   {@link evaluateXPathWithIndexedDB}).
 */
/**
 * Detect and parse an `indexedDB(...)` call at the start of a selector string.
 * @param {string} expr
 * @returns {ParsedIndexedDBExpression|null} `null` when `expr` is not an
 *   `indexedDB(...)` expression.
 */
export declare function parseIndexedDBExpression(expr: string): ParsedIndexedDBExpression | null;
/**
 * Fetch the records for a parsed `indexedDB(...)` expression and, when a
 * trailing JSONPath segment is present (e.g. `.*.name`), evaluate it against
 * the fetched records. Shared by the JSONPath and XPath engines.
 * @param {ParsedIndexedDBExpression} parsed
 * @param {{preventEval?: boolean}} [options]
 * @returns {Promise<unknown>}
 */
export declare function resolveIndexedDBQuery(parsed: ParsedIndexedDBExpression, { preventEval }?: {
    preventEval?: boolean;
}): Promise<unknown>;
/**
 * Namespace URI backing the predefined `jtlt` prefix under which the XPath
 * `indexedDB()` function is registered.
 */
export declare const JTLT_XPATH_NAMESPACE = "urn:jtlt";
/**
 * @param {unknown} expr
 * @returns {boolean} Whether `expr` calls the `indexedDB()` XPath function
 */
export declare function xpathExpressionUsesIndexedDB(expr: unknown): boolean;
/**
 * Evaluate an XPath 3.1 expression that may call `jtlt:indexedDB(...)`,
 * to a string. Because fontoxpath is synchronous, this first evaluates the
 * expression in "collect" mode to discover every `indexedDB()` call, awaits
 * those queries, then evaluates again with the records available.
 * @param {string} selectStr
 * @param {Node} contextNode
 * @returns {Promise<string>}
 */
export declare function evaluateXPathWithIndexedDB(selectStr: string, contextNode: Node): Promise<string>;
//# sourceMappingURL=indexedDB.d.ts.map