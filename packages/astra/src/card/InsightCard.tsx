/**
 * Prior-insight presentation shared by the inline-ref hover card, the decision
 * card's SUPPORTED BY chips, and the decision panel's Evidence view.
 *
 * Display name: an authored label when present, otherwise the insight id.
 * The claim remains body content instead of being repeated as the title.
 *
 * `InsightRef` is the hoverable reference row (◈ + name): the trigger of a
 * nested PreviewCard whose body is the full InsightCard. PreviewCard's
 * FloatingTree support keeps ancestor cards open while it is hovered.
 */
import * as React from 'react';
import type { SerializedInsight } from '@astra-spec/store-types';
import { AstraCite } from '../cite';
import { KindLabel, Desc } from './CardChrome';
import { PreviewCard } from './PreviewCard';
import { StoreProse } from '../storeProse';
import { InsightEvidenceTitle } from './InsightEvidenceTitle';
import { insightEvidenceName } from './insightEvidenceName';

/** Reference-row name: authored label → insight id. */
function useInsightDisplayName(entry: SerializedInsight): string {
  return insightEvidenceName(entry);
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
        <InsightEvidenceTitle entry={entry} name={name} tag={tag} />
      }
    >
      <InsightCard entry={entry} />
    </PreviewCard>
  );
};
