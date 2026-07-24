import { useGridSystemProvider } from '@myst-theme/providers';
import classNames from 'classnames';

export function AnalysisArticleBody({
  children,
  isIndex,
}: {
  children: React.ReactNode;
  isIndex?: boolean;
}) {
  const grid = useGridSystemProvider();

  return (
    <article
      data-name="article-page-main"
      className={classNames('myst-article', 'article', grid, 'subgrid-gap col-screen', {
        'pt-10': isIndex,
      })}
    >
      {children}
    </article>
  );
}
