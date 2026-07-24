/**
 * Resolve the prior insights cited by a decision's options — the evidence
 * backing the choice (Proposal 2 from the design mirror).
 *
 * `SerializedDecision.option_insights` carries option id → insight ids; this
 * joins them against the page store's `prior_insights` table. Ordering: the
 * selected option's insights first (they justify what actually ran), then the
 * other options' in declaration order, deduplicated. Ids with no store entry
 * are dropped (graceful degradation — never throw).
 */
import type {
  ResolvedStore,
  SerializedDecision,
  SerializedInsight,
} from '@astra-spec/store-types';

export function decisionEvidenceIds(
  decision: Pick<SerializedDecision, 'selected' | 'option_insights'>,
): string[] {
  const { selected, option_insights: byOption = {} } = decision;
  const ordered = [
    ...(selected ? byOption[selected] ?? [] : []),
    ...Object.entries(byOption)
      .filter(([optId]) => optId !== selected)
      .flatMap(([, ids]) => ids ?? []),
  ];
  return [...new Set(ordered)];
}

export function decisionEvidenceInsights(
  decision: SerializedDecision,
  store: ResolvedStore | undefined,
): SerializedInsight[] {
  return decisionEvidenceIds(decision)
    .map((id) => store?.prior_insights?.[id])
    .filter((ins): ins is SerializedInsight => ins != null);
}
