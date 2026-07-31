/**
 * AstraValue — inline `{astra:value}` renderer.
 *
 * The plugin emits a self-describing neutral span:
 *   span.astra-ref.astra-ref--value[.astra-ref--<output-type>]
 *   children: [text("19.88 ± 0.17")]   // the already-computed number
 *   node.data.astra = { kind:'value', id, path, col, filter, type, product }
 *
 * `id` joins the `outputs` table (a value is one cell pulled from a product),
 * so we resolve it via `useAstraEntry('output', id)` to recover the product's
 * human label / description for the preview card. The visible text is ALWAYS
 * the node's own children — we never recompute the number.
 *
 * Graceful degradation (CONTRACT §"degrade gracefully"): if there is no store
 * entry we render the bare number span (still carrying the astra-* classes so
 * the stylesheet applies) and skip the popover. Never throws.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
export interface AstraValueProps {
    node: GenericNode;
}
export declare const AstraValue: React.FC<AstraValueProps>;
export default AstraValue;
