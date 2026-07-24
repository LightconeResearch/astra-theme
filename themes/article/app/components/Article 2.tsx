import { type PageLoader } from '@myst-theme/common';
import {
  Bibliography,
  SupportingDocuments,
  FrontmatterParts,
  BackmatterParts,
  extractKnownParts,
  Footnotes,
} from '@myst-theme/site';
import React from 'react';
import {
  ErrorTray,
  NotebookToolbar,
  useComputeOptions,
  BusyScopeProvider,
  ConnectionStatusTray,
  ExecuteScopeProvider,
} from '@myst-theme/jupyter';
import { FrontmatterBlock } from '@myst-theme/frontmatter';
import { ArticleProvider, useProjectManifest } from '@myst-theme/providers';
import type { GenericParent } from 'myst-common';
import { copyNode } from 'myst-common';
import { SourceFileKind } from 'myst-spec-ext';
import { MyST } from 'myst-to-react';
import { AstraStoreProvider } from '@astra-spec/theme-astra';
import { AnalysisDocumentOutline } from '@astra-spec/theme-astra/shell';

export function Article({
  article,
  hideKeywords,
  hideOutline,
  hideTitle,
  hideAuthors,
  outlineMaxDepth,
}: {
  article: PageLoader;
  hideKeywords?: boolean;
  hideOutline?: boolean;
  hideTitle?: boolean;
  hideAuthors?: boolean;
  outlineMaxDepth?: number;
}) {
  const manifest = useProjectManifest();
  const keywords = article.frontmatter?.keywords ?? [];
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
  const { title, subtitle } = article.frontmatter;
  const compute = useComputeOptions();
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
          {!hideTitle && (
            <FrontmatterBlock
              frontmatter={{ title, subtitle }}
              hideAuthors={hideAuthors}
              thebe={thebe}
              location={location}
              className="mb-5"
            />
          )}
          {!hideOutline && (
            <AnalysisDocumentOutline maxdepth={outlineMaxDepth} title="In this article">
              <SupportingDocuments />
            </AnalysisDocumentOutline>
          )}

          {compute?.enabled &&
            compute?.features.notebookCompute &&
            article.kind === SourceFileKind.Notebook && <NotebookToolbar showLaunch />}
          <ErrorTray pageSlug={article.slug} />
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
        </ExecuteScopeProvider>
      </BusyScopeProvider>
    </ArticleProvider>
  );
}
