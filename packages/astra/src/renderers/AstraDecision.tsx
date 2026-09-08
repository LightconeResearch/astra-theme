import * as React from 'react';
import type { ResolvedAnalysisNode, ResolvedInsight } from '@astra-spec/sdk';
import { primaryLiteratureEvidence } from '@astra-spec/ui/model';
import { decisionInsights } from '@astra-spec/ui/model';
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

type DecisionView = 'narrative' | 'options' | 'evidence';

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
  insight: ResolvedInsight;
  analysis: ResolvedAnalysisNode;
  publication: AstraPublication;
}) {
  const source = primaryLiteratureEvidence(insight);
  const name = insight.label ?? claimExcerpt(insight.claim) ?? insight.id;
  return (
    <li className="astra-evidence__item">
      <AstraPreviewPopover
        publication={publication}
        entry={{ kind: 'record', record: insight, analysis }}
        trigger={
          <InlineReference kind="prior_insight" className="astra-evidence__title">
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
  const [view, setView] = React.useState<DecisionView>('narrative');
  const rootClass = Array.from(
    new Set([
      'astra-decision',
      ...nodeClassName(node).split(/\s+/).filter(Boolean),
    ]),
  ).join(' ');

  if (!located) return <NeutralNode node={node} recognitionClass="astra-decision" />;

  const { publication, record } = located;
  const evidence = decisionInsights(publication.index, record);
  const views: DecisionView[] = evidence.length
    ? ['narrative', 'options', 'evidence']
    : ['narrative', 'options'];
  const selectedLabel = record.selectedOptionId
    ? record.options.find((option) => option.id === record.selectedOptionId)?.label ??
      record.selectedOptionId
    : '—';

  return (
    <details className={rootClass} data-kind="decision" id={nodeHtmlId(node)} open>
      <summary className="astra-decision__head">{kindLabel('decision')}</summary>
      {record.label ? <div className="astra-decision__title">{record.label}</div> : null}
      <div className="astra-decision__toggle" role="group" aria-label="Decision view">
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
      {view === 'narrative' && record.rationale ? (
        <div className="astra-decision__rationale">
          <p>
            <Prose text={record.rationale} field="rationale" />
          </p>
        </div>
      ) : null}
      {view === 'options' ? (
        <ul className="astra-options">
          {record.options.map((option) => {
            const selected = option.id === record.selectedOptionId;
            return (
              <li
                key={option.id}
                className={`astra-option ${
                  selected ? 'astra-option--selected' : 'astra-option--excluded'
                }`}
                aria-current={selected ? 'true' : undefined}
              >
                <span className="astra-option__label">{option.label}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {view === 'evidence' ? (
        <ul className="astra-evidence">
          {evidence.map((insight) => {
            const analysis = publication.index.analysisByRecordPath.get(
              insight.canonicalPath,
            );
            return analysis ? (
              <EvidenceItem
                key={insight.canonicalPath}
                insight={insight}
                analysis={analysis}
                publication={publication}
              />
            ) : null;
          })}
        </ul>
      ) : null}
      <div className="astra-decision__meta">
        default: {selectedLabel} · {record.options.length} option
        {record.options.length === 1 ? '' : 's'}
      </div>
    </details>
  );
};

export default AstraDecision;
