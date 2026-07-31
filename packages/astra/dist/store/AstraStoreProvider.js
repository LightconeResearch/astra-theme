import { jsx as _jsx } from "react/jsx-runtime";
/**
 * AstraStoreProvider — exposes the per-page `ResolvedStore` via React context.
 *
 * Integration point (CONTRACT.md §3-4):
 *   The plugin emits ONE hidden carrier per page:
 *     div { identifier: 'astra-store', data: { astra: ResolvedStore } }
 *   It survives the engine's content-JSON serialization intact. This provider
 *   walks the page mdast, finds that carrier, reads `node.data.astra`, and makes
 *   it available to every ASTRA renderer through `useAstraStore()`.
 *
 * Source of the mdast: an explicit `store` or `mdast` prop (the theme passes
 * `mdast={tree}` from ArticlePage; tests pass `store`). All paths are
 * null-safe; a missing carrier yields `undefined` and every renderer falls
 * back to its node's own children.
 */
import { createContext, useMemo } from 'react';
/** The store for the active page, or `undefined` when none was emitted. */
export const AstraStoreContext = createContext(undefined);
const STORE_IDENTIFIER = 'astra-store';
/**
 * Depth-first search for the `[identifier=astra-store]` carrier and return its
 * `data.astra`. Tolerates any tree shape; returns `undefined` if absent.
 *
 * The same walk collects the plugin's hidden `astra-assets` image nodes
 * (`data.astraAsset = <output id>`): MyST's asset pipeline copies those images
 * and rewrites their urls to servable paths, while the store JSON still holds
 * the raw project-relative `resolved_path`. When both are present the rewritten
 * urls are joined back onto the matching output entries (copy-on-write — the
 * mdast-held store object is never mutated).
 */
export function findAstraStore(mdast) {
    var _a, _b;
    if (!mdast)
        return undefined;
    const roots = Array.isArray(mdast) ? mdast : [mdast];
    const stack = [...roots];
    let store;
    const assetUrls = new Map();
    while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== 'object')
            continue;
        if (node.identifier === STORE_IDENTIFIER &&
            ((_a = node.data) === null || _a === void 0 ? void 0 : _a.astra)) {
            store !== null && store !== void 0 ? store : (store = node.data.astra);
        }
        const assetId = (_b = node.data) === null || _b === void 0 ? void 0 : _b.astraAsset;
        if (typeof assetId === 'string' &&
            typeof node.url === 'string') {
            assetUrls.set(assetId, node.url);
        }
        const children = node.children;
        if (Array.isArray(children))
            stack.push(...children);
    }
    if (!store || assetUrls.size === 0)
        return store;
    const outputs = { ...store.outputs };
    for (const [id, url] of assetUrls) {
        if (outputs[id])
            outputs[id] = { ...outputs[id], resolved_path: url };
    }
    return { ...store, outputs };
}
/**
 * Wrap the page content; pass the page `mdast` to scan (or an explicit `store`).
 */
export function AstraStoreProvider({ children, store, mdast, }) {
    const resolved = useMemo(() => {
        if (store)
            return store;
        return findAstraStore(mdast);
    }, [store, mdast]);
    return (_jsx(AstraStoreContext.Provider, { value: resolved, children: children }));
}
//# sourceMappingURL=AstraStoreProvider.js.map