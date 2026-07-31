/**
 * Store hooks + id-join helpers.
 *
 * These are the theme's join primitives against the per-page `ResolvedStore`
 * (see CONTRACT.md §4). `useAstraStore()` returns the page store from context;
 * `useAstraEntry(kind, id)` resolves a single entry (or `undefined` so the
 * caller can fall back to the node's own children — never throw).
 *
 * Block renderers carry an `identifier` like `<prefix>-<id>`; use
 * `parseCarrierId` + `PREFIX_TO_TABLE` to turn that into a table lookup. Inline
 * renderers carry `node.data.astra.{kind,id}`; use `KIND_TO_TABLE` from
 * `@astra-spec/store-types`.
 */
import { useContext } from 'react';
import { KIND_TO_TABLE } from '@astra-spec/store-types';
import { AstraStoreContext } from './AstraStoreProvider';
/** The per-page resolved store, or `undefined` when none was emitted. */
export function useAstraStore() {
    return useContext(AstraStoreContext);
}
/**
 * Resolve one store entry by inline `kind` + `id`. Returns `undefined` when the
 * store, the table, or the entry is missing so the caller degrades gracefully.
 *
 * Cross-scope refs (`reconstruction.convention` cited from the index page) are
 * keyed in the store by their full dotted `path`, not the leaf `id` — the
 * plugin merges referenced sub-analysis entries in under that key. Try the
 * path first so a same-named local entry can't shadow the referenced one.
 */
export function useAstraEntry(kind, id, path) {
    var _a;
    const store = useAstraStore();
    if (!store || !kind || !id)
        return undefined;
    const table = KIND_TO_TABLE[kind];
    if (!table)
        return undefined;
    const entries = store[table];
    return (_a = (path !== undefined ? entries[path] : undefined)) !== null && _a !== void 0 ? _a : entries[id];
}
/** Block carrier-identifier prefix → store table. */
export const PREFIX_TO_TABLE = {
    decision: 'decisions',
    output: 'outputs',
    finding: 'findings',
    // NOTE the contract's two naming subtleties (CONTRACT.md §1):
    //   prior-insight class but `prior_insight-<id>` identifier (underscore)
    //   subanalysis    class but `analysis-<id>`       identifier
    prior_insight: 'prior_insights',
    analysis: 'subanalyses',
    input: 'inputs',
};
/**
 * Split a carrier `identifier` of the form `<prefix>-<id>` into its parts.
 * The `<prefix>` is the FIRST segment; the `<id>` keeps any remaining hyphens
 * (ids may themselves contain `-`). Returns `undefined` for non-conforming ids.
 *
 *   parseCarrierId('output-bao_table')      -> { prefix: 'output',        id: 'bao_table' }
 *   parseCarrierId('prior_insight-desi_y1') -> { prefix: 'prior_insight', id: 'desi_y1'   }
 *   parseCarrierId('analysis-recon')        -> { prefix: 'analysis',      id: 'recon'     }
 */
export function parseCarrierId(identifier) {
    if (!identifier)
        return undefined;
    // Longest-known-prefix match so multi-word prefixes (prior_insight) win and
    // ids containing hyphens survive intact.
    for (const prefix of Object.keys(PREFIX_TO_TABLE)) {
        if (identifier.startsWith(prefix + '-')) {
            return { prefix, id: identifier.slice(prefix.length + 1) };
        }
    }
    const dash = identifier.indexOf('-');
    if (dash <= 0)
        return undefined;
    return { prefix: identifier.slice(0, dash), id: identifier.slice(dash + 1) };
}
/**
 * Resolve a block carrier's `identifier` straight to its store entry.
 * Pairs with `parseCarrierId`; returns `undefined` (graceful fallback) when the
 * prefix is unknown, the store is absent, or the id is not present.
 */
export function useEntryByIdentifier(identifier) {
    const store = useAstraStore();
    if (!store)
        return undefined;
    const parsed = parseCarrierId(identifier);
    if (!parsed)
        return undefined;
    const table = PREFIX_TO_TABLE[parsed.prefix];
    if (!table)
        return undefined;
    return store[table][parsed.id];
}
//# sourceMappingURL=useAstraStore.js.map