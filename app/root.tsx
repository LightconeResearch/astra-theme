/**
 * app/root.tsx — the ASTRA overlay of the book-theme Remix root.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * This file is the ONLY ASTRA-aware change to the Remix app shell. Everything
 * else that makes this a runnable MyST site — the routes (`$.tsx`, `[robots.txt]`,
 * sitemap, …), `entry.client.tsx`, `entry.server.tsx`, the Vite config, Tailwind
 * setup, and the `Document`/`Theme` providers — is VENDORED from `@myst-theme/book`
 * at build time (its `app/` is copied into place; this file overlays its
 * `root.tsx`). We intentionally do not fork those: we depend on the published
 * `@myst-theme/*` packages and overlay just the renderer-merge + store provider.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * What we change vs the stock book-theme root:
 *   1. Merge `ASTRA_RENDERERS` into the renderer set (over the defaults), so
 *      ASTRA classes get rich treatments while every other node hits `base`.
 *   2. Wrap the document body in `<AstraStoreProvider>` so renderers can join
 *      placed/inline nodes to the per-page `ResolvedStore` via `useAstraStore()`.
 *   3. Import the ASTRA design system stylesheet.
 *
 * Keep this in step with the book-theme root it overlays; only these three
 * concerns are ours.
 */
import React from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import type { LinksFunction, LoaderFunction } from '@remix-run/node';

// Stock book-theme building blocks (depended on, not forked).
import { Document, getMetaTagsForSite, getThemeSession } from '@myst-theme/site';
import { renderers as defaultRenderers } from '@myst-theme/site';
import { mergeRenderers } from '@myst-theme/providers';
import { JUPYTER_RENDERERS } from '@myst-theme/jupyter';
import { LANDING_PAGE_RENDERERS } from '@myst-theme/landing-pages';
import { ANY_RENDERERS } from '@myst-theme/anywidget';

// The ASTRA overlay.
import { ASTRA_RENDERERS, AstraStoreProvider } from './astra';
import '../styles/astra.css';

/**
 * The full renderer set, exactly the book-theme stack PLUS `ASTRA_RENDERERS`
 * merged last so our class-keyed overrides win while non-ASTRA nodes fall back
 * through each map's `base`.
 */
export const RENDERERS = mergeRenderers([
  defaultRenderers,
  JUPYTER_RENDERERS,
  LANDING_PAGE_RENDERERS,
  ANY_RENDERERS,
  ASTRA_RENDERERS,
]);

export const links: LinksFunction = () => {
  return [];
};

export const loader: LoaderFunction = async ({ request }) => {
  const themeSession = await getThemeSession(request);
  return {
    theme: themeSession.theme,
  };
};

export const meta = getMetaTagsForSite({
  title: 'ASTRA Theme',
  description: 'A rich MyST web theme for ASTRA analyses.',
});

export default function App() {
  const data = useLoaderData<typeof loader>();
  return (
    <Document
      theme={data?.theme}
      renderers={RENDERERS}
      links={<Links />}
      meta={<Meta />}
    >
      {/*
        AstraStoreProvider reads the active page's mdast (via @myst-theme/providers)
        and exposes the `[identifier=astra-store]` carrier's `ResolvedStore` to
        every ASTRA renderer. It is null-safe: pages without an ASTRA store render
        as plain book-theme.
      */}
      <AstraStoreProvider>
        <Outlet />
      </AstraStoreProvider>
      <ScrollRestoration />
      <Scripts />
    </Document>
  );
}
