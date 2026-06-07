/**
 * AstraInlineRef — renderer for the NON-value inline `{astra:*}` reference
 * tokens (decision / output / finding / prior_insight / analysis).
 *
 * The plugin emits each as a neutral span:
 *   span.astra-ref.astra-ref--<kind>  children:[text(label)]
 *   node.data.astra = { kind, id, path }
 *
 * The theme adds ALL presentation here, keyed on those markers and joined to
 * the per-page `ResolvedStore` by id. We:
 *   1. preserve the carrier span (its `astra-ref astra-ref--<kind>` classes so
 *      the stylesheet's per-kind glyph / hotspot affordances apply),
 *   2. render the label from `node.children` through the stock MyST pipeline,
 *   3. look up the matching store entry and, when present, wrap the token in a
 *      `<PreviewCard>` whose body is a rich kind-specific card.
 *
 * GRACEFUL DEGRADATION: when the store, the kind, or the entry is missing we
 * render just the labelled span (no card). We NEVER throw — the worst case is
 * the neutral token the plugin already emitted.
 *
 * `{astra:value}` is handled by a separate renderer (it is self-describing and
 * carries no glyph); this component is registered for the other inline kinds.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';
import { useAstraEntry } from '../store/useAstraStore';
import { PreviewCard } from '../card/PreviewCard';
import { CardChrome, DataFlow } from '../card';
import { AstraCite } from '../cite';
import type {
  AstraKind,
  InlineAstra,
  SerializedDecision,
  SerializedFinding,
  SerializedInsight,
  SerializedSubAnalysis,
  SerializedOutput,
} from '@astra-spec/store-types';

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Pull the typed inline payload off the node, tolerating missing data. */
function readInline(node: GenericNode): InlineAstra | undefined {
  const astra = (node?.data as { astra?: InlineAstra } | undefined)?.astra;
  if (!astra || !astra.kind || !astra.id) return undefined;
  return astra;
}

/** Filter + trim a list of possibly-empty strings down to real values. */
function clean(values: (string | undefined)[] | undefined): string[] {
  return (values ?? [])
    .map((v) => (v == null ? '' : String(v).trim()))
    .filter((v) => v !== '');
}

/** Reconstruct the visible carrier `<span>` (preserves its astra-* classes). */
function tokenSpan(node: GenericNode): React.ReactNode {
  const className =
    typeof node.class === 'string' && node.class.trim() !== ''
      ? node.class
      : 'astra-ref';
  return (
    <span className={className}>
      <MyST ast={node.children} />
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Per-kind card bodies
 * ------------------------------------------------------------------ */

const DecisionCard: React.FC<{ entry: SerializedDecision }> = ({ entry }) => {
  const optionIds = Object.keys(entry.options ?? {});
  const optionCount = optionIds.length;
  const selected = entry.selected;
  const selectedLabel =
    (selected != null ? entry.options?.[selected] : undefined) ?? selected ?? '';

  return (
    <>
      <CardChrome.KindLabel kind="decision" />
      <CardChrome.Title>{entry.label ?? entry.id}</CardChrome.Title>
      {entry.rationale ? (
        <CardChrome.Desc>{entry.rationale}</CardChrome.Desc>
      ) : null}

      {optionCount > 0 ? (
        <>
          <CardChrome.SectionLabel>OPTION DETAIL</CardChrome.SectionLabel>
          <ul className="astra-options">
            {optionIds.map((oid) => {
              const isSelected = selected != null && oid === selected;
              return (
                <li
                  key={oid}
                  className={
                    'astra-option' +
                    (isSelected
                      ? ' astra-option--selected'
                      : ' astra-option--excluded')
                  }
                >
                  <span className="astra-option__label">
                    {entry.options?.[oid] ?? oid}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      <CardChrome.MetaFooter>
        {selectedLabel ? `default: ${selectedLabel}` : 'no default'}
        {optionCount > 0
          ? ` · ${optionCount} option${optionCount === 1 ? '' : 's'}`
          : ''}
      </CardChrome.MetaFooter>
    </>
  );
};

const FindingCard: React.FC<{ entry: SerializedFinding }> = ({ entry }) => {
  const title = entry.label ?? entry.id;
  return (
    <>
      <CardChrome.KindLabel kind="finding" />
      <CardChrome.Title>{title}</CardChrome.Title>
      {entry.claim ? (
        <div className="astra-finding__claim">{entry.claim}</div>
      ) : null}
      {entry.scope ? (
        <span className="astra-scope-chip">{entry.scope}</span>
      ) : null}
      {entry.notes ? (
        <CardChrome.Desc>
          <span className="astra-finding__notes">{entry.notes}</span>
        </CardChrome.Desc>
      ) : null}
      <CardChrome.MetaFooter>{`finding · ${entry.id}`}</CardChrome.MetaFooter>
    </>
  );
};

const InsightCard: React.FC<{ entry: SerializedInsight }> = ({ entry }) => {
  const title = entry.label ?? entry.id;
  return (
    <>
      <CardChrome.KindLabel kind="prior_insight" />
      <CardChrome.Title>{title}</CardChrome.Title>
      {entry.claim ? <CardChrome.Desc>{entry.claim}</CardChrome.Desc> : null}
      {entry.quote ? (
        <div className="astra-quote">{entry.quote}</div>
      ) : null}
      {entry.doi ? (
        <div className="astra-cite">
          <AstraCite doi={entry.doi} />
        </div>
      ) : null}
      {/* The DOI is intentionally NOT repeated here: the cite row above already
          shows the resolved source link when entry.doi is present. */}
      <CardChrome.MetaFooter>
        {entry.scope ? `${entry.scope} · ` : ''}
        {`prior insight · ${entry.id}`}
      </CardChrome.MetaFooter>
    </>
  );
};

const AnalysisCard: React.FC<{ entry: SerializedSubAnalysis }> = ({ entry }) => {
  const title = entry.name ?? entry.id;
  const flowNodes = clean([entry.name, entry.summary ? 'summary' : undefined]);
  return (
    <>
      <CardChrome.KindLabel kind="analysis" />
      <CardChrome.Title>{title}</CardChrome.Title>
      {entry.summary ? (
        <CardChrome.Desc>{entry.summary}</CardChrome.Desc>
      ) : null}
      {flowNodes.length > 1 ? <DataFlow nodes={flowNodes} /> : null}
      <CardChrome.MetaFooter>
        {`${entry.decisions} decision${entry.decisions === 1 ? '' : 's'} · ` +
          `${entry.outputs} output${entry.outputs === 1 ? '' : 's'}`}
      </CardChrome.MetaFooter>
    </>
  );
};

const OutputCard: React.FC<{ entry: SerializedOutput }> = ({ entry }) => {
  const title = entry.label ?? entry.id;
  const inputs = clean(entry.inputs);
  const recipe = entry.recipe?.command ?? entry.recipe?.container;
  const provNodes = clean([
    inputs.length > 0 ? inputs.join(', ') : undefined,
    recipe,
    entry.resolved_path ?? entry.id,
  ]);

  return (
    <>
      <CardChrome.KindLabel kind="output" />
      <CardChrome.Title>{title}</CardChrome.Title>
      {entry.description ? (
        <CardChrome.Desc>{entry.description}</CardChrome.Desc>
      ) : null}

      {entry.resolved_path ? (
        <div className="astra-output__thumb">
          <img
            src={entry.resolved_path}
            alt={entry.label ?? entry.id}
            loading="lazy"
          />
        </div>
      ) : null}

      {provNodes.length > 1 ? (
        <>
          <CardChrome.SectionLabel>PROVENANCE</CardChrome.SectionLabel>
          <DataFlow nodes={provNodes} />
        </>
      ) : null}

      <CardChrome.MetaFooter>
        {entry.type ? `${entry.type} · ` : ''}
        {`output · ${entry.id}`}
      </CardChrome.MetaFooter>
    </>
  );
};

/* ------------------------------------------------------------------ *
 * Card dispatch
 * ------------------------------------------------------------------ */

function renderCardBody(
  kind: AstraKind,
  entry: unknown,
): React.ReactNode | null {
  switch (kind) {
    case 'decision':
      return <DecisionCard entry={entry as SerializedDecision} />;
    case 'finding':
      return <FindingCard entry={entry as SerializedFinding} />;
    case 'prior_insight':
      return <InsightCard entry={entry as SerializedInsight} />;
    case 'analysis':
      return <AnalysisCard entry={entry as SerializedSubAnalysis} />;
    case 'output':
      return <OutputCard entry={entry as SerializedOutput} />;
    default:
      // `value` is handled by its own renderer; anything else degrades.
      return null;
  }
}

/* ------------------------------------------------------------------ *
 * The renderer component
 * ------------------------------------------------------------------ */

export const AstraInlineRef: React.FC<{ node: GenericNode }> = ({ node }) => {
  const inline = readInline(node);
  const kind = inline?.kind;
  const id = inline?.id;

  // Always call the hook (stable order); it returns undefined on any miss.
  const entry = useAstraEntry(kind, id);

  const token = tokenSpan(node);

  // No payload, no entry, or a kind we don't card (e.g. value) → bare token.
  if (!kind || !entry) {
    return <>{token}</>;
  }

  const body = renderCardBody(kind, entry);
  if (!body) {
    return <>{token}</>;
  }

  return (
    <PreviewCard kind={kind} trigger={token}>
      {body}
    </PreviewCard>
  );
};

export default AstraInlineRef;
