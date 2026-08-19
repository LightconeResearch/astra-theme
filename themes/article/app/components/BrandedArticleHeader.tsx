import {
  FrontmatterBlock,
  GitHubLink,
  LicenseBadges,
  OpenAccessBadge,
} from '@myst-theme/frontmatter';
import { useBaseurl, useGridSystemProvider, useSiteManifest } from '@myst-theme/providers';
import classNames from 'classnames';
import type { PageFrontmatterWithDownloads } from '@myst-theme/common';
import type { SiteManifest } from 'myst-config';

/**
 * Fork of @myst-theme/site's ArticleHeader that adds the Lightcone mark to the
 * eyebrow row, mirroring the mark jupyterlab-astra shows in its topbar. The
 * mark comes from the site manifest (favicon, falling back to the logo
 * option), so projects without one render exactly the stock header.
 */
export function BrandedArticleHeader({
  frontmatter,
  children,
  className,
  hideAuthors,
}: {
  frontmatter: PageFrontmatterWithDownloads;
  children?: React.ReactNode;
  className?: string;
  hideAuthors?: boolean;
}) {
  const grid = useGridSystemProvider();
  const baseurl = useBaseurl();
  const site = useSiteManifest() as (SiteManifest & { favicon?: string }) | undefined;
  const options = (site?.options ?? {}) as Record<string, string | undefined>;
  const mark = options.favicon ?? site?.favicon ?? options.logo;
  const markAlt = options.logo_alt ?? site?.title ?? '';
  const { subject, venue, volume, issue, ...rest } = frontmatter ?? {};
  const positionBackground = {
    'col-page-right': grid === 'article-left-grid',
    'col-page': grid === 'article-grid',
  };
  const positionFrontmatter = {
    'col-body': grid === 'article-left-grid',
    'col-page-left': grid === 'article-grid',
  };
  return (
    <header className="myst-article-header relative col-screen">
      {frontmatter?.banner && (
        // This is the banner contained in a full-bleed div
        <div
          className={classNames(
            'myst-article-header-background absolute',
            grid,
            'subgrid-gap col-screen bg-no-repeat bg-cover bg-top w-full h-full -z-10 pointer-events-none',
          )}
          style={{
            backgroundImage: `url(${frontmatter?.banner})`,
          }}
        />
      )}
      <div
        className={classNames(
          'myst-article-header-content w-full relative col-screen article',
          grid,
          'subgrid-gap',
          {
            'my-[2rem] pb-[1rem] md:my-[4rem]': frontmatter?.banner,
            'my-[2rem]': !frontmatter?.banner,
          },
          className,
        )}
      >
        <div
          className={classNames('myst-article-header-banner', positionBackground, {
            'shadow-2xl bg-white/80 dark:bg-black/80 backdrop-blur': frontmatter?.banner,
          })}
        >
          <div
            className={classNames('flex w-full align-middle py-2 mb-[1rem] text-sm', {
              'px-4 w-full': frontmatter?.banner,
              'bg-white/80 dark:bg-black/80': frontmatter?.banner,
              ...positionBackground,
            })}
          >
            {/* The eyebrow is the ASTRA wordmark, matching the mark + name the
                JupyterLab viewer shows in its tab, rather than the stock
                subject | venue journal line. */}
            <a
              href={baseurl || '/'}
              className="myst-header-logo flex flex-none items-center self-center gap-2 no-underline"
            >
              {mark && <img src={mark} alt={markAlt} />}
              <span className="myst-header-wordmark smallcaps">ASTRA</span>
            </a>
            <div className="flex-grow"></div>
            <div className="hidden sm:block">
              <LicenseBadges license={frontmatter?.license} />
              <OpenAccessBadge open_access={frontmatter?.open_access} />
              <GitHubLink github={frontmatter?.github} />
            </div>
          </div>
          <div className="flex flex-col mb-10 md:flex-row">
            <FrontmatterBlock
              frontmatter={rest}
              authorStyle="list"
              className={classNames('myst-article-header-fm flex-grow', {
                'pt-6 px-6': frontmatter?.banner,
                ...positionFrontmatter,
              })}
              hideAuthors={hideAuthors}
              hideBadges
              hideExports
            />
            {children}
          </div>
        </div>
      </div>
    </header>
  );
}
