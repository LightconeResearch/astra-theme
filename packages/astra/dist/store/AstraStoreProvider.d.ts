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
import React from 'react';
import type { ResolvedStore } from '@astra-spec/store-types';
import type { GenericNode } from 'myst-common';
/** The store for the active page, or `undefined` when none was emitted. */
export declare const AstraStoreContext: React.Context<ResolvedStore | undefined>;
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
export declare function findAstraStore(mdast: GenericNode | GenericNode[] | undefined | null): ResolvedStore | undefined;
export interface AstraStoreProviderProps {
    children: React.ReactNode;
    /** Explicit store (tests / SSR overrides). Wins over mdast scanning. */
    store?: ResolvedStore;
    /** Mdast root to scan for the store carrier. */
    mdast?: GenericNode | GenericNode[];
}
/**
 * Wrap the page content; pass the page `mdast` to scan (or an explicit `store`).
 */
export declare function AstraStoreProvider({ children, store, mdast, }: AstraStoreProviderProps): React.JSX.Element;
