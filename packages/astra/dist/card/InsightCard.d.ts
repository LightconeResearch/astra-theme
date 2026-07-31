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
/** The full prior-insight hover-card body (untitled: the claim leads). */
export declare const InsightCard: React.FC<{
    entry: SerializedInsight;
}>;
/**
 * A hoverable insight reference row (◈ + display name [+ tag]); hovering or
 * focusing it opens the full InsightCard as a nested preview card.
 */
export declare const InsightRef: React.FC<{
    entry: SerializedInsight;
    tag?: string;
}>;
