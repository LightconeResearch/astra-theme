/**
 * AstraOutput — block renderer for `:::{astra:output}` carriers.
 *
 * The plugin emits a stock `container` carrying `astra-output` plus a subtype
 * modifier class (`astra-output--figure` / `--table` / `--metric`) and an
 * identifier `output-<id>` (CONTRACT.md §1). We join the `SerializedOutput`
 * from the page store by that id and decorate the stock figure/table with a
 * provenance drawer (inputs → recipe → artifact). The `metric` subtype renders
 * a big stat from `output.metric{value,uncertainty,unit}`.
 *
 * Graceful degradation: if the store entry is missing we render the node's own
 * stock children verbatim. We never throw, and we always preserve the node's
 * `astra-*` classes on the root so the stylesheet applies.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
export interface AstraOutputProps {
    node: GenericNode;
}
export declare function AstraOutput({ node }: AstraOutputProps): React.ReactElement;
export default AstraOutput;
