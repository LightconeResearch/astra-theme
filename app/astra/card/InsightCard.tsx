/**
 * Prior-insight presentation shared by the inline-ref hover card, the decision
 * card's SUPPORTED BY chips, and the decision panel's Evidence view.
 *
 * Display name: insights authored without a `label` used to surface their raw
 * id (e.g. `spline_broadband_fiducial`), which carries no meaning for the
 * reader. `useInsightDisplayName` falls back through label → the resolved
 * citation text ("Chen et al., 2024") → the claim → the id.
 *
 * `InsightRef` is the hoverable reference row (◈ + name): the trigger of a
 * nested PreviewCard whose body is the full InsightCard. PreviewCard's
 * FloatingTree support keeps ancestor cards open while it is hovered.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
import type { SerializedInsight } from '@astra-spec/store-types';
import { AstraCite, useCiteNodeForDoi } from '../cite';
import { KindLabel, Title, Desc } from './CardChrome';
import { PreviewCard } from './PreviewCard';

/** Concatenated text content of a resolved cite node ("Chen et al., 2024"). */
export function citeNodeText(node: GenericNode | undefined): string | undefined {
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

/** Reader-meaningful name: label → resolved citation text → claim → id. */
export function useInsightDisplayName(entry: SerializedInsight): string {
  const citeNode = useCiteNodeForDoi(entry.doi);
  return entry.label ?? citeNodeText(citeNode) ?? entry.claim ?? entry.id;
}

/** The full prior-insight hover-card body. */
export const InsightCard: React.FC<{ entry: SerializedInsight }> = ({ entry }) => {
  const title = useInsightDisplayName(entry);
  return (
    <>
      <KindLabel kind="prior_insight" />
      <Title>{title}</Title>
      {/* Skip the claim when the title already fell back to it. */}
      {entry.claim && entry.claim !== title ? <Desc>{entry.claim}</Desc> : null}
      {entry.quote ? <div className="astra-quote">{entry.quote}</div> : null}
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
