/**
 * AstraDecision — block renderer for the `:::{astra:decision}` carrier.
 *
 * The plugin emits a stock `heading` node carrying the `astra-decision` class
 * and an `identifier` of the form `decision-<id>`; the decision body follows as
 * sibling nodes. This component joins that id to the per-page store's
 * `decisions` table and renders the rich Vellum "decision panel" entirely from
 * the store entry: a kind label + title, a segmented narrative|options|evidence
 * toggle, the rationale prose (narrative), the option list (options), or the
 * prior insights cited by the options (evidence — segment only shown when at
 * least one option cites an insight), and a muted footer summarising the
 * default selection and option count.
 *
 * Graceful degradation (CONTRACT §"degrade gracefully"): if the store entry is
 * missing we fall back to the node's own stock children (`<MyST>` over the
 * heading title text) and never throw.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
export declare const AstraDecision: React.FC<{
    node: GenericNode;
}>;
export default AstraDecision;
