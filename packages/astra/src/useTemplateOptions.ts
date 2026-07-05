import { useSiteManifest } from '@myst-theme/providers';
import type { PageLoader } from '@myst-theme/common';
import type { SiteManifest } from 'myst-config';
import type { CommonTemplateOptions } from '@myst-theme/common';

/**
 * The theme's template options for the current page: the site-level options
 * from the manifest, with the page frontmatter's `site` block merged over them
 * (page wins). Single home for the precedence rule, shared by both themes —
 * each theme instantiates `T` with its own `TemplateOptions`.
 */
export function useTemplateOptions<T extends CommonTemplateOptions = CommonTemplateOptions>(
  frontmatter?: PageLoader['frontmatter'],
): T {
  const siteDesign: T = ((useSiteManifest() as SiteManifest & { options?: T })?.options ?? {}) as T;
  const pageDesign: T = ((frontmatter as any)?.site ?? {}) as T;
  return { ...siteDesign, ...pageDesign };
}
