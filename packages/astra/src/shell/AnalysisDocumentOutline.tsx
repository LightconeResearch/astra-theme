import { useMediaQuery, useThemeTop } from '@myst-theme/providers';
import { DocumentOutline } from '@myst-theme/site/src/components/DocumentOutline.js';
import { SectionLabel } from '../card/CardChrome';

const TOP_OFFSET = 24;

export function AnalysisDocumentOutline({
  children,
  childrenPosition,
  defaultOpen = true,
  headingsTitle,
  maxdepth,
  title = 'In this article',
}: {
  children?: React.ReactNode;
  childrenPosition?: 'before' | 'after';
  defaultOpen?: boolean;
  headingsTitle?: React.ReactNode;
  maxdepth?: number;
  title?: React.ReactNode;
}) {
  const top = useThemeTop();
  const isOutlineMargin = useMediaQuery('(min-width: 1024px)');

  return (
    <div
      className="block my-10 lg:sticky lg:top-0 lg:z-10 lg:h-0 lg:pt-0 lg:my-0 lg:ml-12 lg:col-margin-right"
      style={{ top: top + TOP_OFFSET }}
    >
      <DocumentOutline
        className="astra-numbered-outline relative pt-[2px]"
        maxdepth={maxdepth}
        isMargin={isOutlineMargin}
        childrenPosition={childrenPosition}
        defaultOpen={defaultOpen}
        headingsTitle={headingsTitle ? <SectionLabel>{headingsTitle}</SectionLabel> : undefined}
        title={title}
      >
        {children}
      </DocumentOutline>
    </div>
  );
}
