/**
 * Prior-insight presentation shared by the inline-ref hover card, the decision
 * card's SUPPORTED BY chips, and the decision panel's Evidence view.
 *
 * Display name: insights authored without a `label` used to surface their raw
 * id (e.g. `spline_broadband_fiducial`), which carries no meaning for the
 * reader. References fall back through label → the start of the claim →
 * the resolved citation text → the id. The claim excerpt comes BEFORE the
 * citation because several insights often cite the same paper — a row of
 * identical "Chen et al. (2024)" chips reads as a duplicated quote, while
 * each claim opening is unique. The hover card is untitled and shows the
 * claim in its entirety.
 *
 * `InsightRef` is the hoverable reference row (◈ + name): the trigger of a
 * nested PreviewCard whose body is the full InsightCard. PreviewCard's
 * FloatingTree support keeps ancestor cards open while it is hovered.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
import type { SerializedInsight } from '@astra-spec/store-types';
import { AstraCite, useCiteNodeForDoi } from '../cite';
import { KindLabel, Desc } from './CardChrome';
import { PreviewCard } from './PreviewCard';
import { StoreProse } from '../storeProse';

/** Concatenated text content of a resolved cite node ("Chen et al., 2024"). */
function citeNodeText(node: GenericNode | undefined): string | undefined {
  if (!node) return undefined;
  const parts: string[] = [];
  const stack: GenericNode[] = [node];
  while (stack.length) {
    const n = stack.shift();
    if (!n || typeof n !== 'object') continue;
    if (typeof n.value === 'string') parts.push(n.value);
    if (Array.isArray(n.children)) stack.unshift(...(n.children as GenericNode[]));
  }
  const text = parts.join('').replace(/\s+/g, ' ').trim();
  return text || undefined;
}

/**
 * The opening of a claim, clipped for one-line reference rows: the first
 * sentence when it is short enough, else a word-boundary cut with an ellipsis.
 */
function claimExcerpt(claim: string | undefined): string | undefined {
  if (!claim) return undefined;
  const text = claim.trim().replace(/\s+/g, ' ');
  if (!text) return undefined;
  const sentence = text.match(/^.{10,90}?[.!?](?=\s|$)/)?.[0];
  if (sentence) return sentence;
  if (text.length <= 90) return text;
  return text.slice(0, 80).replace(/\s+\S*$/, '') + '…';
}

/** Reference-row name: label → claim excerpt → resolved citation text → id. */
function useInsightDisplayName(entry: SerializedInsight): string {
  const citeNode = useCiteNodeForDoi(entry.doi);
  return (
    entry.label ?? claimExcerpt(entry.claim) ?? citeNodeText(citeNode) ?? entry.id
  );
}

/** The full prior-insight hover-card body (untitled: the claim leads). */
export const InsightCard: React.FC<{ entry: SerializedInsight }> = ({ entry }) => {
  return (
    <>
      <KindLabel kind="prior_insight" />
      {entry.claim ? (
        <Desc>
          <StoreProse text={entry.claim} />
        </Desc>
      ) : null}
      {entry.quote ? (
        <div className="astra-quote">
          <StoreProse text={entry.quote} />
        </div>
      ) : null}
      {entry.doi ? (
        <div className="astra-cite">
          <AstraCite doi={entry.doi} />
        </div>
      ) : null}
      {/* The DOI is intentionally NOT repeated here: the cite row above already
          shows the resolved source link when entry.doi is present. */}
    </>
  );
};

/**
 * A hoverable insight reference row (◈ + display name [+ tag]); hovering or
 * focusing it opens the full InsightCard as a nested preview card.
 */
export const InsightRef: React.FC<{ entry: SerializedInsight; tag?: string }> = ({
  entry,
  tag,
}) => {
  const name = useInsightDisplayName(entry);
  return (
    <PreviewCard
      kind="prior_insight"
      trigger={
        <span className="astra-evidence__title">
          <span className="astra-evidence__glyph--insight" aria-hidden="true">
            ◈
          </span>
          <span className="astra-evidence__name">{name}</span>
          {tag ? <span className="astra-evidence__tag">{tag}</span> : null}
        </span>
      }
    >
      <InsightCard entry={entry} />
    </PreviewCard>
  );
};
