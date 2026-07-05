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
import { MyST } from 'myst-to-react';
import { useEntryByIdentifier } from '../store/useAstraStore';
import { KindLabel } from '../card';
import { StoreProse } from '../storeProse';
import type { SerializedFinding } from '@astra-spec/store-types';

/**
 * Decide whether this finding is in `:compact:` form (no notes). The plugin may
 * surface the directive option in a few neutral ways depending on stock-node
 * shape — a modifier class, a `data.compact` / `data.astra.compact` flag, or a
 * plain node property — so we look in all of them and degrade to `false`.
 */
function isCompact(node: GenericNode): boolean {
  const data = (node.data ?? {}) as { compact?: unknown; astra?: { compact?: unknown } };
  return (
    /\bastra-finding--compact\b/.test(typeof node.class === 'string' ? node.class : '') ||
    data.compact === true ||
    data.astra?.compact === true ||
    (node as Record<string, unknown>).compact === true
  );
}

export interface AstraFindingProps {
  node: GenericNode;
}

/**
 * Render the finding carrier as a finding card. Falls back to the node's stock
 * children whenever the store entry cannot be resolved.
 */
export function AstraFinding({ node }: AstraFindingProps): React.ReactElement {
  const entry = useEntryByIdentifier(node.identifier) as
    | SerializedFinding
    | undefined;

  // Preserve the carrier's own astra-* (and any other) classes on the root so
  // the stylesheet's `.astra-finding` treatment applies regardless of branch.
  const rootClass = typeof node.class === 'string' ? node.class : 'astra-finding';

  // Graceful degradation: no joined entry -> render the node's stock children.
  if (!entry) {
    return (
      <div className={rootClass}>
        <MyST ast={node.children} />
      </div>
    );
  }

  const compact = isCompact(node);
  const claim = entry.claim ?? entry.label;

  return (
    <div className={rootClass}>
      <KindLabel kind="finding" className="astra-finding__kind" />

      {claim ? (
        <div className="astra-finding__claim">
          <StoreProse text={claim} />
        </div>
      ) : null}

      {entry.scope ? (
        <span className="astra-scope-chip">
          <StoreProse text={entry.scope} />
        </span>
      ) : null}

      {!compact && entry.notes ? (
        <div className="astra-finding__notes">
          <StoreProse text={entry.notes} />
        </div>
      ) : null}
    </div>
  );
}

export default AstraFinding;
