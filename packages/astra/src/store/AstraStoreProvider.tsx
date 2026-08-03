/**
 * AstraStoreProvider — exposes the per-page `ResolvedStore` via React context.
 *
 * Integration point (CONTRACT.md §3-4):
 *   The plugin emits ONE hidden carrier per page:
 *     div.astra-store {
 *       identifier: 'astra-store-<page>',
 *       data: { astra: ResolvedStore }
 *     }
 *   It survives the engine's content-JSON serialization intact. This provider
 *   walks the page mdast, finds that carrier, reads `node.data.astra`, and makes
 *   it available to every ASTRA renderer through `useAstraStore()`.
 *
 * Source of the mdast: an explicit `store` or `mdast` prop (the theme passes
 * `mdast={tree}` from ArticlePage; tests pass `store`). All paths are
 * null-safe; a missing carrier yields `undefined` and every renderer falls
 * back to its node's own children.
 */
import React, { createContext, useMemo } from 'react';
import type { ResolvedStore } from '@astra-spec/store-types';
import type { GenericNode } from 'myst-common';

/** The store for the active page, or `undefined` when none was emitted. */
export const AstraStoreContext = createContext<ResolvedStore | undefined>(
  undefined,
);

const STORE_CLASS = 'astra-store';
const LEGACY_STORE_IDENTIFIER = 'astra-store';

function hasClass(node: GenericNode, className: string): boolean {
  const value = (node as GenericNode).class;
  if (typeof value === 'string') return value.split(/\s+/).includes(className);
  if (Array.isArray(value)) return value.includes(className);
  return false;
}

/**
 * Depth-first search for the `.astra-store` carrier and return its `data.astra`.
 * The class is stable while the identifier is deliberately page-unique, so
 * MyST does not report a duplicate target across multi-page publications.
 * Legacy `[identifier=astra-store]` carriers remain readable. Tolerates any
 * tree shape; returns `undefined` if absent.
 *
 * The same walk collects the plugin's hidden `astra-assets` image nodes
 * (`data.astraAsset = <output id>`): MyST's asset pipeline copies those images
 * and rewrites their urls to servable paths, while the store JSON still holds
 * the raw project-relative `resolved_path`. When both are present the rewritten
 * urls are joined back onto the matching output entries (copy-on-write — the
 * mdast-held store object is never mutated).
 */
export function findAstraStore(
  mdast: GenericNode | GenericNode[] | undefined | null,
): ResolvedStore | undefined {
  if (!mdast) return undefined;
  const roots = Array.isArray(mdast) ? mdast : [mdast];
  const stack: GenericNode[] = [...roots];
  let store: ResolvedStore | undefined;
  const assetUrls = new Map<string, string>();
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (
      (hasClass(node as GenericNode, STORE_CLASS) ||
        (node as GenericNode).identifier === LEGACY_STORE_IDENTIFIER) &&
      (node as GenericNode).data?.astra
    ) {
      store ??= (node as GenericNode).data!.astra as ResolvedStore;
    }
    const assetId = (node as GenericNode).data?.astraAsset;
    if (
      typeof assetId === 'string' &&
      typeof (node as GenericNode).url === 'string'
    ) {
      assetUrls.set(assetId, (node as GenericNode).url as string);
    }
    const children = (node as GenericNode).children;
    if (Array.isArray(children)) stack.push(...children);
  }
  if (!store || assetUrls.size === 0) return store;
  const outputs = { ...store.outputs };
  for (const [id, url] of assetUrls) {
    if (outputs[id]) outputs[id] = { ...outputs[id], resolved_path: url };
  }
  return { ...store, outputs };
}

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
export function AstraStoreProvider({
  children,
  store,
  mdast,
}: AstraStoreProviderProps) {
  const resolved = useMemo<ResolvedStore | undefined>(() => {
    if (store) return store;
    return findAstraStore(mdast);
  }, [store, mdast]);

  return (
    <AstraStoreContext.Provider value={resolved}>
      {children}
    </AstraStoreContext.Provider>
  );
}
