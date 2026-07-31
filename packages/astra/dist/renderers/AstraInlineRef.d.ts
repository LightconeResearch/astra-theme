/**
 * AstraInlineRef — renderer for the NON-value inline `{astra}` reference
 * tokens (decision / output / finding / prior_insight / analysis / input,
 * plus the card-less option / evidence / universe kinds).
 *
 * The plugin emits each as a neutral span:
 *   span.astra-ref.astra-ref--<kind>  children:[text(label)]
 *   node.data.astra = { kind, id, path }
 *
 * The theme adds ALL presentation here, keyed on those markers and joined to
 * the per-page `ResolvedStore` by id. We:
 *   1. preserve the carrier span (its `astra-ref astra-ref--<kind>` classes so
 *      the stylesheet's per-kind glyph / hotspot affordances apply),
 *   2. render the label from `node.children` through the stock MyST pipeline,
 *   3. look up the matching store entry and, when present, wrap the token in a
 *      `<PreviewCard>` whose body is a rich kind-specific card.
 *
 * GRACEFUL DEGRADATION: when the store, the kind, or the entry is missing we
 * render just the labelled span (no card). We NEVER throw — the worst case is
 * the neutral token the plugin already emitted.
 *
 * `{astra:value}` is handled by a separate renderer (it is self-describing and
 * carries no glyph); this component is registered for the other inline kinds.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
import type { SerializedDecision, ResolvedRecord } from '@astra-spec/store-types';
/** Exported for reuse: the provenance drawer's decision refs hover this card. */
export declare const DecisionCard: React.FC<{
    entry: SerializedDecision;
}>;
/**
 * Host-neutral access to the exact card body used by MyST inline references.
 *
 * The MyST adapter below supplies a record joined from its page store. Other
 * hosts can pass the same serialized record directly without manufacturing a
 * MyST node.
 */
export declare const AstraRecordPreview: React.FC<{
    record: ResolvedRecord;
}>;
export declare const AstraInlineRef: React.FC<{
    node: GenericNode;
}>;
export default AstraInlineRef;
