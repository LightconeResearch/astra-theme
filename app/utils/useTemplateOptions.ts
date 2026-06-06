import { useSiteManifest } from '@myst-theme/providers';
import type { PageLoader } from '@myst-theme/common';
import type { SiteManifest } from 'myst-config';
import type { TemplateOptions } from '../types.js';

/**
 * The theme's template options for the current page: the site-level options
 * from the manifest, with the page frontmatter's `site` block merged over them
 * (page wins). Single home for the precedence rule.
 */
export function useTemplateOptions(
  frontmatter?: PageLoader['frontmatter'],
): TemplateOptions {
  const siteDesign: TemplateOptions =
    (useSiteManifest() as SiteManifest & TemplateOptions)?.options ?? {};
  const pageDesign: TemplateOptions = (frontmatter as any)?.site ?? {};
  return { ...siteDesign, ...pageDesign };
}
