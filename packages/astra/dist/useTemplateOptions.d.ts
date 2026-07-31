import type { PageLoader } from '@myst-theme/common';
import type { CommonTemplateOptions } from '@myst-theme/common';
/**
 * The theme's template options for the current page: the site-level options
 * from the manifest, with the page frontmatter's `site` block merged over them
 * (page wins). Single home for the precedence rule, shared by both themes —
 * each theme instantiates `T` with its own `TemplateOptions`.
 */
export declare function useTemplateOptions<T extends CommonTemplateOptions = CommonTemplateOptions>(frontmatter?: PageLoader['frontmatter']): T;
