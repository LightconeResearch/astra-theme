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
import { MyST } from 'myst-to-react';
import { useEntryByIdentifier } from '../store/useAstraStore';
import { KindLabel } from '../card';
import { StoreProse } from '../storeProse';
import type { SerializedSubAnalysis } from '@astra-spec/store-types';

/** Type guard: the resolved entry is a sub-analysis (has the nav fields). */
function isSubAnalysis(entry: unknown): entry is SerializedSubAnalysis {
  return (
    !!entry &&
    typeof entry === 'object' &&
    'url' in (entry as Record<string, unknown>) &&
    'decisions' in (entry as Record<string, unknown>) &&
    'outputs' in (entry as Record<string, unknown>)
  );
}

/**
 * The class string from the carrier node, defaulting to the kind class. The
 * `.astra-subanalysis` block already defines its own `--astra-kind`/`--astra-glyph`,
 * so we do NOT append `astra-card`/`astra-card--analysis` (that would draw a
 * second card box around the block — see FIX 3e).
 */
function rootClass(node: GenericNode): string {
  const cls = (node as { class?: unknown }).class;
  return typeof cls === 'string' && cls.trim() ? cls : 'astra-subanalysis';
}

/** Pluralize "decision"/"output" counts for the footer ("1 decision · 2 outputs"). */
function plural(n: number, one: string): string {
  return `${n} ${n === 1 ? one : `${one}s`}`;
}

export const AstraSubanalysis: React.FC<{ node: GenericNode }> = ({ node }) => {
  const entry = useEntryByIdentifier(
    (node as { identifier?: string }).identifier,
  );

  // Graceful fallback: no joinable entry → render the stock card children.
  if (!isSubAnalysis(entry)) {
    return <MyST ast={node.children} />;
  }

  const name = entry.name || entry.id;
  const counts = `${plural(entry.decisions, 'decision')} · ${plural(
    entry.outputs,
    'output',
  )}`;

  return (
    <div className={rootClass(node)} id={(node as { identifier?: string }).identifier}>
      <KindLabel kind="analysis" className="astra-subanalysis__kind" />
      <div className="astra-subanalysis__name">
        {entry.url ? (
          <a className="astra-subanalysis__link" href={entry.url}>
            {name}
          </a>
        ) : (
          name
        )}
      </div>
      {entry.summary ? (
        <div className="astra-subanalysis__summary">
          <StoreProse text={entry.summary} />
        </div>
      ) : null}
      <div className="astra-subanalysis__counts">{counts}</div>
    </div>
  );
};

export default AstraSubanalysis;
