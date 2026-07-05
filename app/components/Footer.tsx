import type { GenericParent } from 'myst-common';
import classNames from 'classnames';
import { MyST } from 'myst-to-react';

export function Footer({ content, className }: { content: GenericParent; className?: string }) {
  return (
    <footer
      className={classNames(
        'article footer article-grid bg-white dark:bg-slate-950 mt-10 shadow-2xl shadow py-10',
        className,
      )}
    >
      <MyST ast={content} />
    </footer>
  );
}
