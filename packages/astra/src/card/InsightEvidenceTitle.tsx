import type { SerializedInsight } from '@astra-spec/store-types';
import { insightEvidenceName } from './insightEvidenceName';

export function InsightEvidenceTitle({
  entry,
  name = insightEvidenceName(entry),
  tag,
}: {
  entry: SerializedInsight;
  name?: string;
  tag?: string;
}) {
  return (
    <span className="astra-evidence__title">
      <span className="astra-evidence__glyph--insight" aria-hidden="true">◈</span>
      <span className="astra-evidence__name">{name}</span>
      {tag ? <span className="astra-evidence__tag">{tag}</span> : null}
    </span>
  );
}
