import type { PageFrontmatterWithDownloads } from '@myst-theme/common';
import { ArticleHeader } from '@myst-theme/site/src/components/Headers.js';

export function AnalysisArticleHeader({
  frontmatter,
  children,
  hideAuthors,
}: {
  frontmatter: PageFrontmatterWithDownloads;
  children?: React.ReactNode;
  hideAuthors?: boolean;
}) {
  return (
    <ArticleHeader frontmatter={frontmatter} hideAuthors={hideAuthors}>
      {children}
    </ArticleHeader>
  );
}
