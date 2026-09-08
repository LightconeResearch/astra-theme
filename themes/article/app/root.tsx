import type { LinksFunction, LoaderFunction, V2_MetaFunction } from '@remix-run/node';
import tailwind from '~/styles/app.css';
import thebeCoreCss from 'thebe-core/dist/lib/thebe-core.css';
import { getConfig } from '~/utils/loaders.server';
import { type SiteLoader } from '@myst-theme/common';
import {
  Document,
  Error404,
  ErrorUnhandled,
  responseNoSite,
  getMetaTagsForSite,
  getThemeSession,
  ContentReload,
  SkipTo,
  renderers as defaultRenderers,
} from '@myst-theme/site';
import { isRouteErrorResponse, Outlet, useLoaderData, useRouteError } from '@remix-run/react';
import type { NodeRenderers } from '@myst-theme/providers';
import { mergeRenderers, Theme } from '@myst-theme/providers';
import { JUPYTER_RENDERERS } from '@myst-theme/jupyter';
import { ANY_RENDERERS } from '@myst-theme/anywidget';

// ── ASTRA renderer overlay ─────────────────────────────────────────────────
// Merged LAST so its class-selector renderers win for `astra-*` nodes; every
// other node falls back to the stock article-theme renderer. See packages/astra.
import {
  ASTRA_RENDERERS,
  ASTRA_THEME_ATTRIBUTES,
  LIGHTCONE_BRAND_CLASS,
} from '@astra-spec/theme-astra';
import astraStyles from '@astra-spec/theme-astra/styles/astra.css';

const RENDERERS: NodeRenderers = mergeRenderers([
  defaultRenderers,
  JUPYTER_RENDERERS,
  ANY_RENDERERS,
  ASTRA_RENDERERS,
]);

/**
 * MyST's error pages render outside the publication provider, and the stock
 * boundary hands Document no brand props, so every --astra-* token would be
 * undefined there and the page would lose the palette and the serif faces.
 * Brand the document root exactly as the app does; the body is upstream's.
 */
export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <Document
      theme={Theme.light}
      htmlClassName={LIGHTCONE_BRAND_CLASS}
      themeAttributes={[...ASTRA_THEME_ATTRIBUTES]}
    >
      <main className="article-grid subgrid-gap col-screen">
        <article className="article">
          {isRouteErrorResponse(error) ? (
            <Error404 />
          ) : (
            <ErrorUnhandled
              error={error as Parameters<typeof ErrorUnhandled>[0]['error']}
            />
          )}
        </article>
      </main>
    </Document>
  );
}

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  return getMetaTagsForSite({
    title: data?.config?.title,
    description: data?.config?.description,
    twitter: data?.config?.options?.twitter,
  });
};

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: tailwind },
    { rel: 'stylesheet', href: thebeCoreCss },
    // ASTRA design system (Lightcone Research branding) — layered over
    // article-theme's styles. Brand typefaces: Quattrocento (headings),
    // Alegreya (subheadings/labels), Newsreader (body).
    { rel: 'stylesheet', href: astraStyles },
    {
      rel: 'stylesheet',
      href: 'https://cdn.jsdelivr.net/npm/jupyter-matplotlib@0.11.3/css/mpl_widget.css',
    },
    {
      rel: 'stylesheet',
      href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.css',
    },
  ];
};

export const loader: LoaderFunction = async ({ request }): Promise<SiteLoader> => {
  const [config, themeSession] = await Promise.all([
    getConfig().catch(() => null),
    getThemeSession(request),
  ]);
  if (!config) throw responseNoSite();
  const data = {
    theme: themeSession.getTheme(),
    config,
    CONTENT_CDN_PORT: process.env.CONTENT_CDN_PORT ?? 3100,
    MODE: (process.env.MODE ?? 'app') as 'app' | 'static',
    BASE_URL: process.env.BASE_URL || undefined,
  };
  return data;
};

export default function AppWithReload() {
  const { theme, config, CONTENT_CDN_PORT, MODE, BASE_URL } = useLoaderData<SiteLoader>();
  return (
    <Document
      htmlClassName={LIGHTCONE_BRAND_CLASS}
      themeAttributes={[...ASTRA_THEME_ATTRIBUTES]}
      theme={theme}
      config={config}
      scripts={MODE === 'static' ? undefined : <ContentReload port={CONTENT_CDN_PORT} />}
      staticBuild={MODE === 'static'}
      baseurl={BASE_URL}
      top={0}
      renderers={RENDERERS}
      head={
        <>
          <link rel="icon" href={`${BASE_URL || ''}/favicon.ico`} />
          <link rel="stylesheet" href={`${BASE_URL || ''}/myst-theme.css`} />
        </>
      }
    >
      <SkipTo targets={[{ id: 'skip-to-article', title: 'Skip to article content' }]} />
      <Outlet />
    </Document>
  );
}
