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
import type { GenericNode, References } from 'myst-common';
/** Normalize a raw DOI (tolerates full URLs and `doi:` prefixes) to a key. */
export declare function normalizeDoi(raw: string | undefined): string | undefined;
/** Build a doi.org URL from a raw DOI string (tolerates a full URL already). */
export declare function doiHref(raw: string): string;
/** A DOI's resolved cite nodes, one per citation kind found on the page. */
export type CiteKind = 'narrative' | 'parenthetical';
export type DoiCiteEntry = Partial<Record<CiteKind, GenericNode>>;
/**
 * Index the page's resolved `cite` nodes by normalized DOI (one slot per
 * citation kind — the plugin's hidden carrier registers both). A cite node's
 * DOI comes from its `references.cite.data[label].doi` entry when present,
 * else from the node's own `identifier`/`label` when that is itself a DOI
 * (MyST stamps the original doi.org URL on `identifier`). Nodes without an
 * explicit `kind` count as narrative (MyST's default).
 */
export declare function buildDoiCiteIndex(references: References | undefined): Map<string, DoiCiteEntry>;
/**
 * The page's resolved `cite` node for a raw DOI, preferring the requested
 * kind and falling back to the other; `undefined` on any miss.
 */
export declare function useCiteNodeForDoi(raw: string | undefined, kind?: CiteKind): GenericNode | undefined;
/**
 * A DOI rendered as the main text renders it: the page's resolved citation
 * when one exists, a plain doi.org link otherwise. With `parenthetical`, the
 * comma-form citation is wrapped in literal parens — "(Chen et al., 2024)" —
 * for inline prose; when only a narrative node resolved, it renders bare
 * (its "Chen et al. (2024)" form already carries its own parens).
 */
export declare const AstraCite: React.FC<{
    doi: string;
    parenthetical?: boolean;
}>;
export default AstraCite;
