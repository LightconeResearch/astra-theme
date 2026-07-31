export declare function normalizeDoi(value: string): string;
export declare function doiHref(value: string): string;
/**
 * Extract a title from MyST's default APA bibliography HTML.
 *
 * Journal article titles are the text after the parenthesized year and before
 * the first italicized container title. For books and reports, the title itself
 * is commonly the first italicized field.
 */
export declare function citationTitleFromHtml(html: unknown): string | undefined;
/** Preserve citation URLs only when they are clearly direct PDF resources. */
export declare function directCitationPdfUrl(value: unknown): string | undefined;
