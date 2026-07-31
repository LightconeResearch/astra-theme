import type { ResolvedStore, StoreTable, AstraKind } from '@astra-spec/store-types';
/** The per-page resolved store, or `undefined` when none was emitted. */
export declare function useAstraStore(): ResolvedStore | undefined;
/**
 * The union of value types held across all `ResolvedStore` tables — the return
 * shape of a generic entry lookup.
 */
export type AstraEntry = ResolvedStore['outputs'][string] | ResolvedStore['inputs'][string] | ResolvedStore['decisions'][string] | ResolvedStore['findings'][string] | ResolvedStore['prior_insights'][string] | ResolvedStore['subanalyses'][string];
/**
 * Resolve one store entry by inline `kind` + `id`. Returns `undefined` when the
 * store, the table, or the entry is missing so the caller degrades gracefully.
 *
 * Cross-scope refs (`reconstruction.convention` cited from the index page) are
 * keyed in the store by their full dotted `path`, not the leaf `id` — the
 * plugin merges referenced sub-analysis entries in under that key. Try the
 * path first so a same-named local entry can't shadow the referenced one.
 */
export declare function useAstraEntry(kind: AstraKind | undefined, id: string | undefined, path?: string): AstraEntry | undefined;
/** Block carrier-identifier prefix → store table. */
export declare const PREFIX_TO_TABLE: Record<string, StoreTable>;
/**
 * Split a carrier `identifier` of the form `<prefix>-<id>` into its parts.
 * The `<prefix>` is the FIRST segment; the `<id>` keeps any remaining hyphens
 * (ids may themselves contain `-`). Returns `undefined` for non-conforming ids.
 *
 *   parseCarrierId('output-bao_table')      -> { prefix: 'output',        id: 'bao_table' }
 *   parseCarrierId('prior_insight-desi_y1') -> { prefix: 'prior_insight', id: 'desi_y1'   }
 *   parseCarrierId('analysis-recon')        -> { prefix: 'analysis',      id: 'recon'     }
 */
export declare function parseCarrierId(identifier: string | undefined): {
    prefix: string;
    id: string;
} | undefined;
/**
 * Resolve a block carrier's `identifier` straight to its store entry.
 * Pairs with `parseCarrierId`; returns `undefined` (graceful fallback) when the
 * prefix is unknown, the store is absent, or the id is not present.
 */
export declare function useEntryByIdentifier(identifier: string | undefined): AstraEntry | undefined;
