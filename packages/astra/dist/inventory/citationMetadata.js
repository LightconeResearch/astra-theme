const DOI_URL_PREFIX = /^https?:\/\/(?:dx\.)?doi\.org\//i;
const DOI_LABEL_PREFIX = /^doi:\s*/i;
export function normalizeDoi(value) {
    return value
        .trim()
        .replace(DOI_LABEL_PREFIX, '')
        .replace(DOI_URL_PREFIX, '')
        .trim()
        .toLowerCase();
}
export function doiHref(value) {
    return `https://doi.org/${normalizeDoi(value)}`;
}
function decodeHtmlText(html) {
    const entities = {
        amp: '&',
        apos: "'",
        gt: '>',
        lt: '<',
        quot: '"',
    };
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (match, entity) => {
        var _a, _b;
        if (entity[0] !== '#')
            return (_a = entities[entity.toLowerCase()]) !== null && _a !== void 0 ? _a : match;
        const hexadecimal = ((_b = entity[1]) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === 'x';
        const value = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
        return Number.isSafeInteger(value) && value >= 0 && value <= 0x10ffff
            ? String.fromCodePoint(value)
            : match;
    })
        .replace(/\s+/g, ' ')
        .trim();
}
/**
 * Extract a title from MyST's default APA bibliography HTML.
 *
 * Journal article titles are the text after the parenthesized year and before
 * the first italicized container title. For books and reports, the title itself
 * is commonly the first italicized field.
 */
export function citationTitleFromHtml(html) {
    var _a;
    if (typeof html !== 'string')
        return undefined;
    const firstItalic = /<(i|em)\b[^>]*>([\s\S]*?)<\/\1>/i.exec(html);
    const firstLink = /<a\b/i.exec(html);
    const boundary = [firstItalic === null || firstItalic === void 0 ? void 0 : firstItalic.index, firstLink === null || firstLink === void 0 ? void 0 : firstLink.index]
        .filter((index) => index !== undefined)
        .sort((left, right) => left - right)[0];
    const beforeText = decodeHtmlText(boundary === undefined ? html : html.slice(0, boundary));
    const year = /\((?:\d{4}[a-z]?|n\.d\.)\)\.?\s*/i.exec(beforeText);
    if (!year)
        return undefined;
    const articleTitle = beforeText
        .slice(((_a = year.index) !== null && _a !== void 0 ? _a : 0) + year[0].length)
        .replace(/^[\s.:;–—-]+/, '')
        .replace(/[\s.]+$/, '')
        .trim();
    if (articleTitle)
        return articleTitle;
    const italicTitle = firstItalic ? decodeHtmlText(firstItalic[2]) : '';
    return italicTitle || undefined;
}
/** Preserve citation URLs only when they are clearly direct PDF resources. */
export function directCitationPdfUrl(value) {
    if (typeof value !== 'string' || !value.trim())
        return undefined;
    const url = value.trim();
    try {
        const parsed = new URL(url, 'https://inventory.invalid');
        const isPdfPath = /\.pdf$/i.test(parsed.pathname);
        const isArxivPdf = /(^|\.)arxiv\.org$/i.test(parsed.hostname)
            && /^\/pdf(?:\/|$)/i.test(parsed.pathname);
        return isPdfPath || isArxivPdf ? url : undefined;
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=citationMetadata.js.map