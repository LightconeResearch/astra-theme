import { useSiteManifest } from '@myst-theme/providers';
/**
 * The theme's template options for the current page: the site-level options
 * from the manifest, with the page frontmatter's `site` block merged over them
 * (page wins). Single home for the precedence rule, shared by both themes —
 * each theme instantiates `T` with its own `TemplateOptions`.
 */
export function useTemplateOptions(frontmatter) {
    var _a, _b, _c;
    const siteDesign = ((_b = (_a = useSiteManifest()) === null || _a === void 0 ? void 0 : _a.options) !== null && _b !== void 0 ? _b : {});
    const pageDesign = ((_c = frontmatter === null || frontmatter === void 0 ? void 0 : frontmatter.site) !== null && _c !== void 0 ? _c : {});
    return { ...siteDesign, ...pageDesign };
}
//# sourceMappingURL=useTemplateOptions.js.map