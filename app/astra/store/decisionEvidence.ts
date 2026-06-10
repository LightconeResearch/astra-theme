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

export function decisionEvidenceInsights(
  decision: SerializedDecision,
  store: ResolvedStore | undefined,
): SerializedInsight[] {
  const byOption = decision.option_insights ?? {};
  const ordered: string[] = [];
  if (decision.selected && byOption[decision.selected]) {
    ordered.push(...byOption[decision.selected]);
  }
  for (const [optId, ids] of Object.entries(byOption)) {
    if (optId === decision.selected) continue;
    ordered.push(...(ids ?? []));
  }
  const seen = new Set<string>();
  const out: SerializedInsight[] = [];
  for (const id of ordered) {
    if (seen.has(id)) continue;
    seen.add(id);
    const ins = store?.prior_insights?.[id];
    if (ins) out.push(ins);
  }
  return out;
}
