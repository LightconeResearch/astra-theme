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
import { MyST } from 'myst-to-react';
import type { SerializedDecision, SerializedInsight } from '@astra-spec/store-types';
import { useAstraStore, useEntryByIdentifier } from '../store/useAstraStore';
import { decisionEvidenceInsights } from '../store/decisionEvidence';
import { InsightRef } from '../card';
import { AstraCite } from '../cite';
import { labelFor } from '../glyphs';
import { StoreProse } from '../storeProse';

const KIND = 'decision' as const;

type DecisionView = 'narrative' | 'options' | 'evidence';

/**
 * Type guard: a store entry is a `SerializedDecision` when it exposes an
 * `options` record. (The shared `AstraEntry` union is structural, so we narrow
 * here rather than trust the carrier prefix alone.)
 */
function isDecision(entry: unknown): entry is SerializedDecision {
  return (
    !!entry &&
    typeof entry === 'object' &&
    'options' in (entry as Record<string, unknown>)
  );
}

/**
 * One Evidence-view row: hoverable insight reference (opens the full insight
 * card), the claim as a plain-language note (only when the row is named by an
 * authored label — an unlabelled row is already named by the claim's opening,
 * and the hover card shows it in its entirety), and the resolved citation.
 */
const EvidenceItem: React.FC<{ ins: SerializedInsight }> = ({ ins }) => {
  return (
    <li className="astra-evidence__item">
      <InsightRef entry={ins} tag="prior insight" />
      {ins.label && ins.claim ? (
        <div className="astra-evidence__note">
          <StoreProse text={ins.claim} />
        </div>
      ) : null}
      {ins.doi ? (
        <div className="astra-cite">
          <AstraCite doi={ins.doi} />
        </div>
      ) : null}
    </li>
  );
};

export const AstraDecision: React.FC<{ node: GenericNode }> = ({ node }) => {
  const entry = useEntryByIdentifier(node.identifier);
  const store = useAstraStore();
  const [view, setView] = React.useState<DecisionView>('narrative');

  // Preserve whatever astra-* classes the carrier already declares so the
  // stylesheet's `.astra-decision` (and any future modifiers) still apply, and
  // self-set the kind modifier that plumbs the per-kind accent var.
  const rootClass = ['astra-decision', node.class].filter(Boolean).join(' ');

  // ── Graceful fallback ──────────────────────────────────────────────────────
  // No store, no table, or no matching id → render the stock details children.
  if (!isDecision(entry)) {
    return <MyST ast={node.children} />;
  }

  const { label, rationale, selected, options } = entry;
  const optionIds = Object.keys(options ?? {});
  const optionCount = optionIds.length;
  const selectedLabel =
    (selected != null ? options[selected] : undefined) ?? selected ?? '—';
  // The prior insights cited by the options — shown under the Evidence segment
  // (the segment itself only renders when at least one insight resolves).
  const evidence = decisionEvidenceInsights(entry, store);

  return (
    <details className={rootClass} data-kind={KIND} open>
      {/* The native <summary> is the kind row: it carries the uppercase sans
          styling and supplies the ◇ glyph via `.astra-decision > summary::before`.
          The title sits below it. */}
      <summary className="astra-decision__head">{labelFor(KIND)}</summary>
      {label ? <div className="astra-decision__title">{label}</div> : null}

      {/* Segmented narrative | options toggle (default: narrative). The plain
          <button> children inside `.astra-decision__toggle` get the CSS
          descendant-button styling. */}
      <div className="astra-decision__toggle" role="tablist" aria-label="Decision view">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'narrative'}
          className={view === 'narrative' ? 'is-active' : undefined}
          data-view="narrative"
          onClick={() => setView('narrative')}
        >
          Narrative
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'options'}
          className={view === 'options' ? 'is-active' : undefined}
          data-view="options"
          onClick={() => setView('options')}
        >
          Options
        </button>
        {evidence.length > 0 ? (
          <button
            type="button"
            role="tab"
            aria-selected={view === 'evidence'}
            className={view === 'evidence' ? 'is-active' : undefined}
            data-view="evidence"
            onClick={() => setView('evidence')}
          >
            Evidence
          </button>
        ) : null}
      </div>

      {/* Narrative view — rationale prose. */}
      {view === 'narrative' ? (
        <div className="astra-decision__rationale">
          {rationale ? (
            <p>
              <StoreProse text={rationale} />
            </p>
          ) : (
            <MyST ast={node.children} />
          )}
        </div>
      ) : null}

      {/* Options view — the full option list with selected / excluded states. */}
      {view === 'options' ? (
        <ul className="astra-options">
          {optionIds.map((optId) => {
            const isSelected = optId === selected;
            const optClass = [
              'astra-option',
              isSelected ? 'astra-option--selected' : 'astra-option--excluded',
            ].join(' ');
            const optLabel = options[optId] ?? optId;
            return (
              <li key={optId} className={optClass} aria-current={isSelected ? 'true' : undefined}>
                <span className="astra-option__dot" aria-hidden="true" />
                <span className="astra-option__label">{optLabel}</span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Evidence view — the prior insights the options cite, in plain
          language: hoverable name, the claim, and the resolved citation. */}
      {view === 'evidence' ? (
        <ul className="astra-evidence">
          {evidence.map((ins) => (
            <EvidenceItem key={ins.id} ins={ins} />
          ))}
        </ul>
      ) : null}

      {/* Footer meta: default selection + option count. */}
      <div className="astra-decision__meta">
        default: {selectedLabel} · {optionCount} option{optionCount === 1 ? '' : 's'}
      </div>
    </details>
  );
};

export default AstraDecision;
