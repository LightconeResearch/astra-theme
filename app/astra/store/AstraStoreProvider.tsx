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
 * Source of the mdast: book-theme's `ArticleProvider` stores the page's root
 * mdast on the article context as `references.article` (see ArticlePage.tsx),
 * which `@myst-theme/providers`' `useReferences()` returns. We read it from
 * there as a fallback, and also accept an explicit `store` or `mdast` prop (the
 * theme passes `mdast={tree}` from ArticlePage, the cleanest source). All paths
 * are null-safe; a missing carrier yields `undefined` and every renderer falls
 * back to its node's own children.
 */
import React, { createContext, useMemo } from 'react';
import { useReferences } from '@myst-theme/providers';
import type { ResolvedStore } from '@astra-spec/store-types';
import type { GenericNode } from 'myst-common';

/** The store for the active page, or `undefined` when none was emitted. */
export const AstraStoreContext = createContext<ResolvedStore | undefined>(
  undefined,
);

const STORE_IDENTIFIER = 'astra-store';

/**
 * Depth-first search for the `[identifier=astra-store]` carrier and return its
 * `data.astra`. Tolerates any tree shape; returns `undefined` if absent.
 */
export function findAstraStore(
  mdast: GenericNode | GenericNode[] | undefined | null,
): ResolvedStore | undefined {
  if (!mdast) return undefined;
  const roots = Array.isArray(mdast) ? mdast : [mdast];
  const stack: GenericNode[] = [...roots];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (
      (node as GenericNode).identifier === STORE_IDENTIFIER &&
      (node as GenericNode).data?.astra
    ) {
      return (node as GenericNode).data!.astra as ResolvedStore;
    }
    const children = (node as GenericNode).children;
    if (Array.isArray(children)) stack.push(...children);
  }
  return undefined;
}

export interface AstraStoreProviderProps {
  children: React.ReactNode;
  /** Explicit store (tests / SSR overrides). Wins over mdast scanning. */
  store?: ResolvedStore;
  /** Explicit mdast root to scan instead of the active page's. */
  mdast?: GenericNode | GenericNode[];
}

/**
 * Wrap the page content. By default it reads the active page mdast from
 * `@myst-theme/providers`; pass `store` or `mdast` to override.
 */
export function AstraStoreProvider({
  children,
  store,
  mdast,
}: AstraStoreProviderProps) {
  // book-theme's ArticleProvider sets `references.article = article.mdast`, so
  // `useReferences()?.article` is the page's root mdast when we're inside a page.
  const references = useReferences() as { article?: GenericNode } | undefined;
  const pageMdast = references?.article;
  const resolved = useMemo<ResolvedStore | undefined>(() => {
    if (store) return store;
    return findAstraStore(mdast ?? pageMdast);
  }, [store, mdast, pageMdast]);

  return (
    <AstraStoreContext.Provider value={resolved}>
      {children}
    </AstraStoreContext.Provider>
  );
}
