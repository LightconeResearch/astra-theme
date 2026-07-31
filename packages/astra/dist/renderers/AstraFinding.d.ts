/**
 * AstraFinding — block renderer for the `:::{astra:finding}` carrier.
 *
 * The finding carrier is a stock `heading` node bearing the `astra-finding`
 * class and a stable `finding-<id>` identifier; the claim/notes/scope come from
 * the joined `findings` table entry (`SerializedFinding { id, label?, claim?,
 * notes?, scope? }`), not from the heading's title children.
 *
 * Presentation (Vellum): an editorial "finding card" — a FINDING kind row, the
 * claim as the card's spoken line, a scope chip, and (unless `:compact:`) the
 * notes. The component re-implements no ASTRA logic; it only joins by id and
 * decorates. If the store entry is missing it degrades gracefully to the node's
 * own stock children, and it never throws.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
export interface AstraFindingProps {
    node: GenericNode;
}
/**
 * Render the finding carrier as a finding card. Falls back to the node's stock
 * children whenever the store entry cannot be resolved.
 */
export declare function AstraFinding({ node }: AstraFindingProps): React.ReactElement;
export default AstraFinding;
