import * as React from 'react';
import {
  getSelectedOption,
  type Analysis,
  type Insight,
} from '@astra-spec/sdk/reports';
import { primaryLiteratureEvidence } from '@astra-spec/ui/model';
import { decisionInsights, recordId } from '@astra-spec/ui/model';
import { InlineReference, Prose } from '@astra-spec/ui/primitives';
import type { GenericNode } from 'myst-common';

import { AstraCite } from '../cite';
import { AstraPreviewPopover } from '../preview';
import type { AstraPublication } from '../publication/AstraPublicationProvider';
import {
  kindLabel,
  NeutralNode,
  nodeClassName,
  nodeHtmlId,
  useAstraRecord,
} from '../rendererUtils';

type DecisionView = 'rationale' | 'options' | 'evidence';

function claimExcerpt(claim: string): string | undefined {
  const text = claim.trim().replace(/\s+/g, ' ');
  if (!text) return undefined;
  const sentence = /^.{10,90}?[.!?](?=\s|$)/.exec(text)?.[0];
  if (sentence) return sentence;
  if (text.length <= 90) return text;
  return `${text.slice(0, 80).replace(/\s+\S*$/, '')}…`;
}

function EvidenceItem({
  insight,
  analysis,
  publication,
}: {
  insight: Insight;
  analysis: Analysis;
  publication: AstraPublication;
}) {
  const source = primaryLiteratureEvidence(insight);
  const name =
    insight.label ?? claimExcerpt(insight.claim) ?? recordId(insight);
  return (
    <li className="astra-evidence__item">
      <AstraPreviewPopover
        publication={publication}
        entry={{ kind: 'record', record: insight, analysis }}
        trigger={
          <InlineReference
            kind="prior_insight"
            className="astra-evidence__title"
          >
            <span className="astra-evidence__name">{name}</span>
            <span className="astra-evidence__tag">prior insight</span>
          </InlineReference>
        }
      />
      {insight.label ? (
        <div className="astra-evidence__note">
          <Prose text={insight.claim} field="claim" />
        </div>
      ) : null}
      {source?.doi ? (
        <div className="astra-cite">
          <AstraCite doi={source.doi} />
        </div>
      ) : null}
    </li>
  );
}

/** Existing decision panel, now joined exclusively through SDK paths. */
export const AstraDecision: React.FC<{ node: GenericNode }> = ({ node }) => {
  const located = useAstraRecord(node, 'decision');
  const [view, setView] = React.useState<DecisionView>('rationale');
  const rootClass = Array.from(
    new Set([
      'astra-decision',
      ...nodeClassName(node).split(/\s+/).filter(Boolean),
    ]),
  ).join(' ');

  if (!located)
    return <NeutralNode node={node} recognitionClass="astra-decision" />;

  const { publication, record } = located;
  const evidence = decisionInsights(
    publication.index,
    record,
    publication.universe,
  );
  const views: DecisionView[] = evidence.length
    ? ['rationale', 'options', 'evidence']
    : ['rationale', 'options'];
  const selected = publication.universe
    ? getSelectedOption(publication.index, publication.universe, record.ref)
    : undefined;
  const selectedLabel = selected?.label ?? selected?.id ?? '—';

  return (
    <details
      className={rootClass}
      data-kind="decision"
      id={nodeHtmlId(node)}
      open
    >
      <summary className="astra-decision__head">
        {kindLabel('decision')}
      </summary>
      {record.label ? (
        <div className="astra-decision__title">{record.label}</div>
      ) : null}
      <div
        className="astra-decision__toggle"
        role="group"
        aria-label="Decision view"
      >
        {views.map((nextView) => (
          <button
            key={nextView}
            type="button"
            aria-pressed={view === nextView}
            className={view === nextView ? 'is-active' : undefined}
            data-view={nextView}
            onClick={() => setView(nextView)}
          >
            {nextView[0].toUpperCase() + nextView.slice(1)}
          </button>
        ))}
      </div>
      {view === 'rationale' && record.rationale ? (
        <div className="astra-decision__rationale">
          <p>
            <Prose text={record.rationale} field="rationale" />
          </p>
        </div>
      ) : null}
      {view === 'options' ? (
        <ul className="astra-options">
          {record.options.map((option) => {
            const isSelected = option.id === selected?.id;
            return (
              <li
                key={option.id}
                className={[
                  'astra-option',
                  isSelected
                    ? 'astra-option--selected'
                    : option.excluded
                      ? 'astra-option--excluded'
                      : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={option.excluded}
                aria-current={isSelected ? 'true' : undefined}
              >
                <span className="astra-option__label">
                  {option.label ?? option.id}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {view === 'evidence' ? (
        <ul className="astra-evidence">
          {evidence.map((insight) => {
            const analysis = publication.index.elementByRef.get(
              insight.ref,
            )?.analysis;
            return analysis ? (
              <EvidenceItem
                key={insight.ref}
                insight={insight}
                analysis={analysis}
                publication={publication}
              />
            ) : null;
          })}
        </ul>
      ) : null}
      <div className="astra-decision__meta">
        selected: {selectedLabel} · {record.options.length} option
        {record.options.length === 1 ? '' : 's'}
      </div>
    </details>
  );
};

export default AstraDecision;
