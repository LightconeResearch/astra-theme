import type { SerializedInsight } from '@astra-spec/store-types';

export function insightEvidenceName(entry: SerializedInsight): string {
  return entry.label ?? entry.id;
}
