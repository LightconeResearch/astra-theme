/**
 * AstraSubanalysis — block renderer for `card.astra-subanalysis`.
 *
 * The plugin emits a sub-analysis as a stock `card` node carrying the
 * `astra-subanalysis` class and a `analysis-<id>` identifier (CONTRACT §1:
 * the *class* is `astra-subanalysis` but the *id prefix* is `analysis-`). We
 * join that identifier to the page store's `subanalyses` table and render a
 * navigation card — kind label, linked title, summary, and a counts footer.
 *
 * Degrades gracefully: when the store, the table, or the entry is missing we
 * render the node's own stock children (`<MyST ast={node.children} />`) so the
 * plain card still appears. Never throws; always preserves the node's
 * `astra-*` classes on the root so the stylesheet applies.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
export declare const AstraSubanalysis: React.FC<{
    node: GenericNode;
}>;
export default AstraSubanalysis;
