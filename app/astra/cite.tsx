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
import type { GenericNode, References } from 'myst-common';
import { useReferences } from '@myst-theme/providers';
import { MyST } from 'myst-to-react';

/** Normalize a raw DOI (tolerates full URLs and `doi:` prefixes) to a key. */
export function normalizeDoi(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return doiUtils.normalize(raw.trim().replace(/^doi:\s*/i, ''))?.toLowerCase();
}

/** Build a doi.org URL from a raw DOI string (tolerates a full URL already). */
export function doiHref(raw: string): string {
  return doiUtils.buildUrl(raw.trim()) ?? raw.trim();
}

/**
 * Index the page's resolved `cite` nodes by normalized DOI. A cite node's DOI
 * comes from its `references.cite.data[label].doi` entry when present, else
 * from the node's own `identifier`/`label` when that is itself a DOI (MyST
 * stamps the original doi.org URL on `identifier`).
 */
export function buildDoiCiteIndex(
  references: References | undefined,
): Map<string, GenericNode> {
  const index = new Map<string, GenericNode>();
  if (!references?.article) return index;
  const citeData = references.cite?.data ?? {};

  const stack: GenericNode[] = [references.article as GenericNode];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'cite' && !node.error) {
      const key =
        normalizeDoi(node.label ? citeData[node.label]?.doi : undefined) ??
        normalizeDoi(node.identifier) ??
        normalizeDoi(node.label);
      if (key && !index.has(key)) index.set(key, node);
    }
    if (Array.isArray(node.children)) stack.push(...(node.children as GenericNode[]));
  }
  return index;
}

/** The page's resolved `cite` node for a raw DOI, or `undefined` on any miss. */
export function useCiteNodeForDoi(raw: string | undefined): GenericNode | undefined {
  const references = useReferences();
  const index = React.useMemo(() => buildDoiCiteIndex(references), [references]);
  const key = normalizeDoi(raw);
  return key ? index.get(key) : undefined;
}

/**
 * A DOI rendered as the main text renders it: the page's resolved citation
 * when one exists, a plain doi.org link otherwise.
 */
export const AstraCite: React.FC<{ doi: string }> = ({ doi }) => {
  const citeNode = useCiteNodeForDoi(doi);
  if (citeNode) return <MyST ast={citeNode} />;
  return (
    <a href={doiHref(doi)} target="_blank" rel="noreferrer">
      {doi}
    </a>
  );
};

export default AstraCite;
