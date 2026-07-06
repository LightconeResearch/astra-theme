import React from 'react';
import {
  ArticleProvider,
  useProjectManifest,
  useThemeTop,
  useMediaQuery,
} from '@myst-theme/providers';
import {
  Bibliography,
  FooterLinksBlock,
  FrontmatterParts,
  BackmatterParts,
  DocumentOutline,
  combineDownloads,
  extractKnownParts,
  Footnotes,
} from '@myst-theme/site';
import type { PageLoader } from '@myst-theme/common';
import { copyNode } from 'myst-common';
import { SourceFileKind } from 'myst-spec-ext';
import {
  ExecuteScopeProvider,
  BusyScopeProvider,
  NotebookToolbar,
  ConnectionStatusTray,
  ErrorTray,
  useComputeOptions,
} from '@myst-theme/jupyter';
import { MyST } from 'myst-to-react';
import { FrontmatterBlock } from '@myst-theme/frontmatter';
import { AstraStoreProvider, useTemplateOptions } from '@astra-spec/theme-astra';
import type { TemplateOptions } from '../types.js';

export const ArticlePage = React.memo(function ({
  article,
  hide_all_footer_links,
  hideKeywords,
}: {
  article: PageLoader;
  hide_all_footer_links?: boolean;
  hideKeywords?: boolean;
}) {
  const manifest = useProjectManifest();
  const compute = useComputeOptions();
  const top = useThemeTop();

  const { hide_title_block, hide_footer_links, hide_outline, outline_maxdepth, hide_authors } =
    useTemplateOptions<TemplateOptions>(article.frontmatter);
  const downloads = combineDownloads(manifest?.downloads, article.frontmatter);
  // copyNode deep-copies the whole article AST; memoize so re-renders (theme
  // top, media query, compute options) keep stable identities and <MyST> /
  // the store scan are not invalidated.
  const { tree, parts } = React.useMemo(() => {
    const tree = copyNode(article.mdast);
    return { tree, parts: extractKnownParts(tree, article.frontmatter?.parts) };
  }, [article]);
  const references = React.useMemo(
    () => ({ ...article.references, article: article.mdast }),
    [article],
  );
  const keywords = article.frontmatter?.keywords ?? [];
  const isOutlineMargin = useMediaQuery('(min-width: 1024px)');
  const { thebe } = manifest as any;
  const { location } = article;

  return (
    <ArticleProvider
      kind={article.kind}
      references={references}
      frontmatter={article.frontmatter}
    >
      <BusyScopeProvider>
        <ExecuteScopeProvider enable={compute?.enabled ?? false} contents={article}>
          {!hide_title_block && (
            <FrontmatterBlock
              kind={article.kind}
              frontmatter={{ ...article.frontmatter, downloads }}
              className="mb-8 pt-9"
              thebe={thebe}
              location={location}
              hideAuthors={hide_authors}
            />
          )}
          {!hide_outline && (
            <div
              className="block my-10 lg:sticky lg:z-10 lg:h-0 lg:pt-0 lg:my-0 lg:ml-10 lg:col-margin-right"
              style={{ top }}
            >
              <DocumentOutline
                className="relative mt-9"
                maxdepth={outline_maxdepth}
                isMargin={isOutlineMargin}
              />
            </div>
          )}
          {compute?.enabled &&
            compute.features.notebookCompute &&
            article.kind === SourceFileKind.Notebook && <NotebookToolbar showLaunch />}
          {compute?.enabled && article.kind === SourceFileKind.Article && (
            <ErrorTray pageSlug={article.slug} />
          )}
          <div id="skip-to-article" />
          {/* The store provider must wrap the frontmatter/backmatter parts too:
              the abstract is extracted from the tree and rendered separately,
              and its astra refs need the store context for preview cards. */}
          <AstraStoreProvider mdast={tree}>
            <FrontmatterParts parts={parts} keywords={keywords} hideKeywords={hideKeywords} />
            <MyST ast={tree} />
            <BackmatterParts parts={parts} />
          </AstraStoreProvider>
          <Footnotes />
          <Bibliography />
          <ConnectionStatusTray />
          {!hide_footer_links && !hide_all_footer_links && (
            <FooterLinksBlock links={article.footer} />
          )}
        </ExecuteScopeProvider>
      </BusyScopeProvider>
    </ArticleProvider>
  );
});
