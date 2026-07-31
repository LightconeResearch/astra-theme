import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AstraCite — render a store DOI through the SAME citation pipeline the main
 * text uses, so overlay cards show the resolved citation (author–year link +
 * hover bibliography) instead of a raw DOI string.
 *
 * How the main text resolves citations: at build time MyST converts every
 * doi.org link into a `cite` node (author–year children, `label` keyed into
 * `references.cite.data` which carries the formatted html + the doi). The
 * stock `CiteRenderer` then joins `label → data` via `useReferences()`.
 *
 * The `ResolvedStore` only carries the raw DOI string, so we join the other
 * way around: scan the page AST (exposed as `references.article` by
 * ArticlePage) for the already-resolved `cite` node whose citation data
 * matches this DOI, and render THAT node through `<MyST>`. This reuses the
 * stock renderer end-to-end — same label text, link, hover card and numbering
 * as the main text, in the block renderer and inside the floating preview
 * cards alike (React context crosses the FloatingPortal).
 *
 * GRACEFUL DEGRADATION: when the references, the cite table, or a matching
 * node is missing we fall back to a plain doi.org link. Never throws.
 */
import * as React from 'react';
import { doi as doiUtils } from 'doi-utils';
import { useReferences } from '@myst-theme/providers';
import { MyST } from 'myst-to-react';
/** Normalize a raw DOI (tolerates full URLs and `doi:` prefixes) to a key. */
export function normalizeDoi(raw) {
    var _a;
    if (!raw)
        return undefined;
    return (_a = doiUtils.normalize(raw.trim().replace(/^doi:\s*/i, ''))) === null || _a === void 0 ? void 0 : _a.toLowerCase();
}
/** Build a doi.org URL from a raw DOI string (tolerates a full URL already). */
export function doiHref(raw) {
    var _a;
    return (_a = doiUtils.buildUrl(raw.trim())) !== null && _a !== void 0 ? _a : raw.trim();
}
/**
 * Index the page's resolved `cite` nodes by normalized DOI (one slot per
 * citation kind — the plugin's hidden carrier registers both). A cite node's
 * DOI comes from its `references.cite.data[label].doi` entry when present,
 * else from the node's own `identifier`/`label` when that is itself a DOI
 * (MyST stamps the original doi.org URL on `identifier`). Nodes without an
 * explicit `kind` count as narrative (MyST's default).
 */
export function buildDoiCiteIndex(references) {
    var _a, _b, _c, _d, _e, _f;
    const index = new Map();
    if (!(references === null || references === void 0 ? void 0 : references.article))
        return index;
    const citeData = (_b = (_a = references.cite) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {};
    const stack = [references.article];
    while (stack.length) {
        const node = stack.pop();
        if (!node || typeof node !== 'object')
            continue;
        if (node.type === 'cite' && !node.error) {
            const key = (_e = (_d = normalizeDoi(node.label ? (_c = citeData[node.label]) === null || _c === void 0 ? void 0 : _c.doi : undefined)) !== null && _d !== void 0 ? _d : normalizeDoi(node.identifier)) !== null && _e !== void 0 ? _e : normalizeDoi(node.label);
            if (key) {
                const kind = node.kind === 'parenthetical' ? 'parenthetical' : 'narrative';
                const entry = (_f = index.get(key)) !== null && _f !== void 0 ? _f : {};
                if (!entry[kind])
                    entry[kind] = node;
                index.set(key, entry);
            }
        }
        if (Array.isArray(node.children))
            stack.push(...node.children);
    }
    return index;
}
/**
 * The page's resolved `cite` node for a raw DOI, preferring the requested
 * kind and falling back to the other; `undefined` on any miss.
 */
export function useCiteNodeForDoi(raw, kind = 'narrative') {
    var _a;
    const references = useReferences();
    const index = React.useMemo(() => buildDoiCiteIndex(references), [references]);
    const key = normalizeDoi(raw);
    const entry = key ? index.get(key) : undefined;
    return (_a = entry === null || entry === void 0 ? void 0 : entry[kind]) !== null && _a !== void 0 ? _a : entry === null || entry === void 0 ? void 0 : entry[kind === 'narrative' ? 'parenthetical' : 'narrative'];
}
/**
 * A DOI rendered as the main text renders it: the page's resolved citation
 * when one exists, a plain doi.org link otherwise. With `parenthetical`, the
 * comma-form citation is wrapped in literal parens — "(Chen et al., 2024)" —
 * for inline prose; when only a narrative node resolved, it renders bare
 * (its "Chen et al. (2024)" form already carries its own parens).
 */
export const AstraCite = ({ doi, parenthetical, }) => {
    const citeNode = useCiteNodeForDoi(doi, parenthetical ? 'parenthetical' : 'narrative');
    if (citeNode) {
        if (parenthetical && citeNode.kind === 'parenthetical') {
            return (_jsxs(_Fragment, { children: ["(", _jsx(MyST, { ast: citeNode }), ")"] }));
        }
        return _jsx(MyST, { ast: citeNode });
    }
    const link = (_jsx("a", { href: doiHref(doi), target: "_blank", rel: "noreferrer", children: doi }));
    return parenthetical ? _jsxs(_Fragment, { children: ["(", link, ")"] }) : link;
};
export default AstraCite;
//# sourceMappingURL=cite.js.map