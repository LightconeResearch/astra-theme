/**
 * AstraPriorInsight — block renderer for the `astra:prior-insight` directive.
 *
 * The plugin emits a stock `seealso` admonition carrying the class
 * `astra-prior-insight` and the identifier `prior_insight-<id>` (NOTE the
 * UNDERSCORE in the id — CONTRACT.md §1 subtlety). We join the matching
 * `SerializedInsight` out of the per-page store and render an editorial insight
 * card: kind row, the insight claim, an optional scope chip, a DOI citation,
 * and the exact quote (serif italic) when present.
 *
 * Graceful degradation: if the store, the table, or this entry is missing we
 * fall back to the node's own stock children (the plain `seealso` admonition).
 * This renderer never throws.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
export declare const AstraPriorInsight: React.FC<{
    node: GenericNode;
}>;
export default AstraPriorInsight;
