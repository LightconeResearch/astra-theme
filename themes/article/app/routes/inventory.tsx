import type {
  LinksFunction,
  LoaderFunction,
  V2_MetaFunction,
} from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { getProject } from '@myst-theme/common';
import {
  ArticleHeader,
  DocumentOutline,
  getMetaTagsForArticle,
  KatexCSS,
  responseNoArticle,
  responseNoSite,
} from '@myst-theme/site';
import {
  ProjectProvider,
  useMediaQuery,
  useThemeTop,
} from '@myst-theme/providers';
import type { SiteManifest } from 'myst-config';
import { useEffect, useState } from 'react';
import {
  findInventorySnapshot,
  InventoryExplorer,
  OverviewInventory,
  citationTitleFromHtml,
  directCitationPdfUrl,
  normalizeDoi,
  type InventoryPaperMetadataMap,
  type InventorySnapshot,
} from '@astra-spec/theme-astra/inventory';
import inventoryStyles from '@astra-spec/theme-astra/styles/inventory.css';
import { AnalysisModeTabs } from '../components/AnalysisModeTabs';
import { ArticlePageAndNavigation } from '../components/ArticlePageAndNavigation';
import { getConfig, getPage } from '../utils/loaders.server';

type ManifestProject = Required<SiteManifest>['projects'][0];
const OUTLINE_TOP_OFFSET = 24;

function paperMetadataFromPage(page: any): InventoryPaperMetadataMap {
  const citations = page.references?.cite?.data;
  if (!citations || typeof citations !== 'object') return {};
  return Object.fromEntries(
    Object.values(citations).flatMap((citation: any) => {
      const doi = typeof citation?.doi === 'string'
        ? normalizeDoi(citation.doi)
        : undefined;
      const title = citationTitleFromHtml(citation?.html);
      const pdfUrl = directCitationPdfUrl(citation?.url);
      return doi && (title || pdfUrl) ? [[doi, { title, pdfUrl }]] : [];
    }),
  );
}

export const links: LinksFunction = () => [
  KatexCSS,
  { rel: 'stylesheet', href: inventoryStyles },
];

export const meta: V2_MetaFunction<typeof loader> = ({ data, location }) => {
  if (!data) return [];
  const config = data.config as SiteManifest;
  const project = data.project as ManifestProject;
  const siteTitle = config.title ?? project.title ?? '';
  return getMetaTagsForArticle({
    origin: '',
    url: location.pathname,
    title: `Inventory${siteTitle ? ` - ${siteTitle}` : ''}`,
    description: project.description ?? config.description ?? undefined,
    image: (project.thumbnailOptimized || project.thumbnail) ?? undefined,
    twitter: config.options?.twitter,
    keywords: project.keywords ?? config.keywords ?? [],
  });
};

export const loader: LoaderFunction = async ({ request }) => {
  const config = await getConfig();
  if (!config) throw responseNoSite();
  const project = getProject(config);
  if (!project) throw responseNoArticle();
  const page = await getPage(request, {
    config,
    slug: project.index,
    redirect: false,
  });
  const snapshot = findInventorySnapshot(page.mdast);
  if (!snapshot) throw responseNoArticle();
  const rootScopeId = snapshot.scopes.find(
    (scope) => scope.parent === undefined,
  )?.id ?? snapshot.scopes[0]?.id ?? '';
  const requestedScopeId = new URL(request.url).searchParams.get('scope');
  const initialScopeId = requestedScopeId
    && snapshot.scopes.some((scope) => scope.id === requestedScopeId)
    ? requestedScopeId
    : rootScopeId;
  return json({
    config,
    project,
    snapshot,
    paperMetadata: paperMetadataFromPage(page),
    initialScopeId,
  });
};

export default function InventoryPage() {
  const { project, snapshot, paperMetadata, initialScopeId } = useLoaderData() as {
    project: ManifestProject;
    snapshot: InventorySnapshot;
    paperMetadata: InventoryPaperMetadataMap;
    initialScopeId: string;
  };
  const top = useThemeTop();
  const isOutlineMargin = useMediaQuery('(min-width: 1024px)');
  const rootScopeId = snapshot.scopes.find(
    (scope) => scope.parent === undefined,
  )?.id ?? snapshot.scopes[0]?.id ?? '';
  const [scopeId, setScopeId] = useState(initialScopeId);

  useEffect(() => {
    const syncScopeFromUrl = () => {
      const requestedScopeId = new URLSearchParams(window.location.search).get('scope');
      setScopeId(
        requestedScopeId
        && snapshot.scopes.some((candidate) => candidate.id === requestedScopeId)
          ? requestedScopeId
          : rootScopeId,
      );
    };
    syncScopeFromUrl();
    window.addEventListener('popstate', syncScopeFromUrl);
    return () => window.removeEventListener('popstate', syncScopeFromUrl);
  }, [rootScopeId, snapshot.scopes]);

  const selectScope = (nextScopeId: string) => {
    setScopeId(nextScopeId);
    const url = new URL(window.location.href);
    if (nextScopeId === rootScopeId) url.searchParams.delete('scope');
    else url.searchParams.set('scope', nextScopeId);
    window.history.pushState(null, '', url);
  };

  return (
    <ArticlePageAndNavigation>
      <ProjectProvider>
        <ArticleHeader frontmatter={project} />
        <AnalysisModeTabs active="inventory" />
        <article
          id="skip-to-article"
          className="myst-article article article-left-grid subgrid-gap col-screen pt-10"
        >
          <div
            className="block my-10 lg:sticky lg:top-0 lg:z-10 lg:h-0 lg:pt-0 lg:my-0 lg:ml-10 lg:col-margin-right"
            style={{ top: top + OUTLINE_TOP_OFFSET }}
          >
            <DocumentOutline
              className="relative pt-[2px]"
              maxdepth={2}
              isMargin={isOutlineMargin}
              title="In this article"
            >
              <OverviewInventory
                snapshot={snapshot}
                scopeId={scopeId}
                onSelectScope={selectScope}
              />
            </DocumentOutline>
          </div>
          <InventoryExplorer
            snapshot={snapshot}
            scopeId={scopeId}
            paperMetadata={paperMetadata}
          />
        </article>
      </ProjectProvider>
    </ArticlePageAndNavigation>
  );
}
