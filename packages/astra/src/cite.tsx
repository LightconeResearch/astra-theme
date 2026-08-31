/**
 * Citation adapters for SDK evidence DOIs.
 *
 * How the main text resolves citations: at build time MyST converts every
 * doi.org link into a `cite` node (author–year children, `label` keyed into
 * `references.cite.data` which carries the formatted html + the doi). The
 * stock `CiteRenderer` then joins `label → data` via `useReferences()`.
 *
 * The resolved publication carries the raw DOI string, so these adapters join
 * the other way around: scan the page AST (exposed as `references.article` by
 * ArticlePage) for the already-resolved `cite` node whose citation data matches
 * this DOI. AstraCite reuses the stock renderer end-to-end in page content;
 * AstraPreviewCite preserves its trigger and bibliography markup while using
 * the shared nested-popover primitive inside ASTRA preview cards.
 *
 * GRACEFUL DEGRADATION: when the references, the cite table, or a matching
 * node is missing we fall back to a plain doi.org link. Never throws.
 */
import * as React from 'react';
import { normalizeDoi as normalizeSdkDoi } from '@astra-spec/sdk';
import { doiHref } from '@astra-spec/ui/model';
import { PreviewPopover } from '@astra-spec/ui/primitives';
import type { GenericNode, References } from 'myst-common';
import { useReferences, useSiteManifest } from '@myst-theme/providers';
import { MyST } from 'myst-to-react';

import { useAstraColorScheme } from './themeScope';

/** Normalize a raw DOI (tolerates full URLs and `doi:` prefixes) to a key. */
export function normalizeDoi(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return normalizeSdkDoi(raw) || undefined;
}

export { doiHref };

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
export function buildDoiCiteIndex(
  references: References | undefined,
): Map<string, DoiCiteEntry> {
  const index = new Map<string, DoiCiteEntry>();
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
      if (key) {
        const kind: CiteKind = node.kind === 'parenthetical' ? 'parenthetical' : 'narrative';
        const entry = index.get(key) ?? {};
        if (!entry[kind]) entry[kind] = node;
        index.set(key, entry);
      }
    }
    if (Array.isArray(node.children)) stack.push(...(node.children as GenericNode[]));
  }
  return index;
}

/**
 * The page's resolved `cite` node for a raw DOI, preferring the requested
 * kind and falling back to the other; `undefined` on any miss.
 */
export function useCiteNodeForDoi(
  raw: string | undefined,
  kind: CiteKind = 'narrative',
): GenericNode | undefined {
  const references = useReferences();
  const index = React.useMemo(() => buildDoiCiteIndex(references), [references]);
  const key = normalizeDoi(raw);
  const entry = key ? index.get(key) : undefined;
  return entry?.[kind] ?? entry?.[kind === 'narrative' ? 'parenthetical' : 'narrative'];
}

function RawDoiLink({
  doi,
  parenthetical,
}: {
  doi: string;
  parenthetical?: boolean;
}) {
  const link = (
    <a href={doiHref(doi)} target="_blank" rel="noreferrer">
      {doi}
    </a>
  );
  return parenthetical ? <>({link})</> : link;
}

/**
 * A DOI rendered as the main text renders it: the page's resolved citation
 * when one exists, a plain doi.org link otherwise. With `parenthetical`, the
 * comma-form citation is wrapped in literal parens — "(Chen et al., 2024)" —
 * for inline prose; when only a narrative node resolved, it renders bare
 * (its "Chen et al. (2024)" form already carries its own parens).
 */
export const AstraCite: React.FC<{ doi: string; parenthetical?: boolean }> = ({
  doi,
  parenthetical,
}) => {
  const citeNode = useCiteNodeForDoi(doi, parenthetical ? 'parenthetical' : 'narrative');
  if (citeNode) {
    if (parenthetical && citeNode.kind === 'parenthetical') {
      return (
        <>
          (<MyST ast={citeNode} />)
        </>
      );
    }
    return <MyST ast={citeNode} />;
  }
  return <RawDoiLink doi={doi} parenthetical={parenthetical} />;
};

export interface AstraPreviewCiteProps {
  doi: string;
  parenthetical?: boolean;
}

/** Render the contents of a resolved citation exactly as MyST's CiteRenderer. */
function CiteContents({ node }: { node: GenericNode }) {
  const numbered = !!useSiteManifest()?.options?.numbered_references;
  if (numbered && node.kind === 'parenthetical') return node.enumerator;
  return <MyST ast={node.children} />;
}

/**
 * The citation adapter used inside shared ASTRA previews.
 *
 * MyST's stock CiteRenderer uses a standalone Radix portal. That portal is not
 * part of the Floating UI tree owned by RecordPreview, so a nested citation can
 * be painted below its parent and crossing into it can close the parent. Keep
 * MyST's cite trigger and bibliography markup, but let the shared
 * PreviewPopover own positioning and nested-hover coordination.
 */
export const AstraPreviewCite: React.FC<AstraPreviewCiteProps> = ({
  doi,
  parenthetical,
}) => {
  const references = useReferences();
  const scheme = useAstraColorScheme();
  const citeNode = useCiteNodeForDoi(
    doi,
    parenthetical ? 'parenthetical' : 'narrative',
  );

  if (!citeNode) return <RawDoiLink doi={doi} parenthetical={parenthetical} />;

  const data = citeNode.label
    ? references?.cite?.data[citeNode.label]
    : undefined;
  const className =
    typeof citeNode.class === 'string' ? citeNode.class : undefined;
  const isButtonLike = (className ?? '').split(' ').includes('button');
  const url = data
    ? data.doi
      ? doiHref(data.doi)
      : data.url
    : doiHref(doi);
  const contents = <CiteContents node={citeNode} />;
  const trigger = (
    url ? (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={isButtonLike ? undefined : 'hover-link'}
      >
        {contents}
      </a>
    ) : (
      <span className="hover-link">{contents}</span>
    )
  );

  // A node found through its DOI-bearing identifier may not have a matching
  // citation-table entry. Preserve its resolved author/year text without
  // creating an empty preview in that partial-data case.
  const citation = (
    <cite className={className}>
      {data ? (
        <PreviewPopover
          trigger={trigger}
          label={`${normalizeDoi(doi) ?? doi} citation preview`}
          kind="paper"
          openDelay={300}
          className="exclude-from-outline astra-citation-preview"
          portalProps={{
            className: 'astra-citation-preview-portal',
            'data-lightcone-color-scheme': scheme,
            'data-astra-color-scheme': scheme,
          }}
        >
          <div
            className="hover-document article w-[500px] sm:max-w-[500px] p-3"
            dangerouslySetInnerHTML={{ __html: data.html || '' }}
          />
        </PreviewPopover>
      ) : (
        trigger
      )}
    </cite>
  );

  if (parenthetical && citeNode.kind === 'parenthetical') {
    return <>({citation})</>;
  }
  return citation;
};

export default AstraCite;
