import { useBaseurl } from '@myst-theme/providers';
import { previewHref } from '../viewerTransport';
import { InlineReference } from '@astra-spec/ui/primitives';
import * as React from 'react';
import {
  getSelectedOption,
  type Analysis,
  type Decision,
  type Output,
  type Result,
} from '@astra-spec/sdk/reports';
import { recordId } from '@astra-spec/ui/model';
import { Prose } from '@astra-spec/ui/primitives';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';

import { AstraPreviewPopover } from '../preview';
import type { AstraPublication } from '../publication/AstraPublicationProvider';
import { publicationResult } from '../publication/contract';
import {
  NeutralNode,
  nodeClassName,
  nodeHtmlId,
  useAstraRecord,
} from '../rendererUtils';

type OutputSubtype = 'figure' | 'table' | 'metric' | 'unknown';

function subtypeOf(node: GenericNode): OutputSubtype {
  const classes = new Set(nodeClassName(node).split(/\s+/).filter(Boolean));
  if (classes.has('astra-output--figure')) return 'figure';
  if (classes.has('astra-output--table')) return 'table';
  if (classes.has('astra-output--metric')) return 'metric';
  return 'unknown';
}

function nodeText(node: GenericNode | undefined): string {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map((child) => nodeText(child)).join('');
}

interface MetricView {
  value: string;
  uncertainty?: string;
  unit?: string;
  label?: string;
}

/** Recover the exact build-time metric parts already present in neutral MyST. */
function metricFromChildren(node: GenericNode): MetricView | undefined {
  const queue: GenericNode[] = [...(node.children ?? [])];
  while (queue.length) {
    const candidate = queue.shift()!;
    if (candidate.type !== 'paragraph') {
      queue.unshift(...(candidate.children ?? []));
      continue;
    }
    const children = candidate.children ?? [];
    const labelNode = children[0];
    if (labelNode?.type !== 'strong') continue;
    const pieces = children.slice(1).map((child) => nodeText(child).trim());
    const value = pieces.shift();
    if (!value) continue;
    const uncertaintyPiece = pieces[0]?.match(/^±\s*(.+)$/);
    const uncertainty = uncertaintyPiece?.[1];
    if (uncertaintyPiece) pieces.shift();
    const unit = pieces.join(' ').trim() || undefined;
    const label = nodeText(labelNode).replace(/:\s*$/, '').trim() || undefined;
    return { value, uncertainty, unit, label };
  }
  return undefined;
}

function MetricStat({ metric }: { metric: MetricView }) {
  return (
    <div className="astra-metric">
      <span className="astra-metric__value">{metric.value}</span>
      {metric.uncertainty ? (
        <span className="astra-metric__uncertainty">{metric.uncertainty}</span>
      ) : null}
      {metric.unit ? (
        <span className="astra-metric__unit">{metric.unit}</span>
      ) : null}
      {metric.label ? (
        <span className="astra-metric__label">{metric.label}</span>
      ) : null}
    </div>
  );
}

interface ProvenanceDecision {
  decision: Decision;
  analysis: Analysis;
  universe?: string;
  via?: string;
}
interface SourceInput {
  ref: string;
  label?: string;
  id?: string;
}
interface TracedProvenance {
  decisions: ProvenanceDecision[];
  inputs: SourceInput[];
}

/** Preserve direct and inherited decision anchors using analysis keys. */
function decisionHref(item: ProvenanceDecision): string {
  const anchor = `#decision-${recordId(item.decision)}`;
  if (!item.via) return anchor;
  return item.analysis.key
    ? `/${item.analysis.key.split('.').join('/')}${anchor}`
    : `/${anchor}`;
}

/** Follow effective result inputs, including cross-universe pins and cycles. */
function traceOutputProvenance(
  publication: AstraPublication,
  output: Output,
): TracedProvenance {
  const decisions = new Map<string, ProvenanceDecision>();
  const inputs = new Map<string, SourceInput>();
  const visited = new Set<string>();
  const visit = (result: Result): void => {
    if (visited.has(result.id)) return;
    visited.add(result.id);
    const indexed = publication.index.elementByRef.get(result.output);
    if (indexed?.collection !== 'outputs') return;
    const universe = result.universe ?? publication.universe;
    for (const ref of indexed.element.decisions) {
      const entry = publication.index.elementByRef.get(ref);
      if (entry?.collection !== 'decisions') continue;
      const identity = JSON.stringify([ref, universe]);
      if (decisions.has(identity)) continue;
      decisions.set(identity, {
        decision: entry.element,
        analysis: entry.analysis,
        universe,
        via:
          entry.analysis.key === publication.activeAnalysis.key
            ? undefined
            : entry.analysis.key || 'root',
      });
    }
    for (const source of result.inputs) {
      if (source.result) {
        const upstream = publication.index.resultById.get(source.result);
        if (upstream) visit(upstream);
      } else {
        const ref = source.input ?? source.entry;
        const entry = publication.index.elementByRef.get(ref);
        inputs.set(ref, {
          ref,
          label: entry?.element.label,
          id:
            entry?.collection === 'inputs'
              ? recordId(entry.element)
              : undefined,
        });
      }
    }
  };
  const result = publicationResult(publication, output);
  if (result) visit(result);
  return { decisions: [...decisions.values()], inputs: [...inputs.values()] };
}

function ProvenanceDecisionRef({
  item,
  publication,
}: {
  item: ProvenanceDecision;
  publication: AstraPublication;
}) {
  const baseurl = useBaseurl();
  const trigger = (
    <InlineReference kind="decision" asChild>
      <a
        className="astra-ref astra-ref--decision"
        href={previewHref(decisionHref(item), baseurl)}
      >
        {item.decision.label ?? recordId(item.decision)}
      </a>
    </InlineReference>
  );
  // Released inherited decisions were navigable but not joined to the local
  // preview store. Preserve that behavior and its natural row geometry.
  if (item.via) return trigger;
  return (
    <AstraPreviewPopover
      publication={publication}
      entry={{ kind: 'record', record: item.decision, analysis: item.analysis }}
      trigger={trigger}
    />
  );
}

function ProvenanceDrawer({
  output,
  publication,
}: {
  output: Output;
  publication: AstraPublication;
}) {
  const traced = traceOutputProvenance(publication, output);
  const decisions = traced.decisions;
  const inputs = traced.inputs;
  if (!decisions.length && !inputs.length) return null;

  return (
    <details className="astra-output__provenance">
      <summary>Provenance</summary>
      {decisions.length ? (
        <>
          <div className="astra-card__section">
            Decisions ({decisions.length})
          </div>
          <ul className="astra-output__prov-decisions">
            {decisions.map((item) => (
              <li
                key={JSON.stringify([item.decision.ref, item.universe])}
                className="astra-output__prov-row"
              >
                <ProvenanceDecisionRef item={item} publication={publication} />
                {item.via ? (
                  <span className="astra-prov-via">via {item.via}</span>
                ) : null}
                {item.universe &&
                getSelectedOption(
                  publication.index,
                  item.universe,
                  item.decision.ref,
                ) ? (
                  <span className="astra-prov-selection">
                    {getSelectedOption(
                      publication.index,
                      item.universe!,
                      item.decision.ref,
                    )?.label ??
                      getSelectedOption(
                        publication.index,
                        item.universe!,
                        item.decision.ref,
                      )?.id}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {inputs.length ? (
        <>
          <div className="astra-card__section">
            Source data ({inputs.length})
          </div>
          <div className="astra-output__prov-row">
            {inputs.map((input) => (
              <code
                key={input.id ?? input.ref}
                className="astra-flow__node"
                title={input.label ?? input.ref}
              >
                {input.id ?? input.ref}
              </code>
            ))}
          </div>
        </>
      ) : null}
    </details>
  );
}

function OutputCaption({ output }: { output: Output }) {
  const text = output.description ?? output.label;
  return text ? (
    <div className="astra-output__caption">
      <Prose text={text} field="description" />
    </div>
  ) : null;
}

export interface AstraOutputProps {
  node: GenericNode;
}

/** Existing output chrome/provenance over canonical SDK records and neutral artifacts. */
export function AstraOutput({ node }: AstraOutputProps): React.ReactElement {
  const located = useAstraRecord(node, 'output');
  const identifier = nodeHtmlId(node) ?? (node as { id?: string }).id;
  const subtype = subtypeOf(node);
  const baseClass = nodeClassName(node);
  const className = baseClass.split(/\s+/).includes('astra-output')
    ? baseClass
    : [
        'astra-output',
        subtype !== 'unknown' ? `astra-output--${subtype}` : '',
        baseClass,
      ]
        .filter(Boolean)
        .join(' ');
  const stockChildren = <MyST ast={node.children} />;

  if (!located) {
    return <NeutralNode node={node} recognitionClass="astra-output" />;
  }

  const { publication, record: output } = located;
  const hasStockChildren = Boolean(node.children?.length);
  const actualSubtype =
    subtype === 'unknown' && output.type === 'metric' ? 'metric' : subtype;
  const metric =
    actualSubtype === 'metric' ? metricFromChildren(node) : undefined;

  let body: React.ReactNode = hasStockChildren ? stockChildren : null;
  if (actualSubtype === 'metric' && metric)
    body = <MetricStat metric={metric} />;
  if (!body && actualSubtype === 'metric')
    body = <OutputCaption output={output} />;

  return (
    <div className={className} id={identifier}>
      {body}
      {actualSubtype !== 'metric' && !hasStockChildren ? (
        <OutputCaption output={output} />
      ) : null}
      <ProvenanceDrawer output={output} publication={publication} />
    </div>
  );
}

export default AstraOutput;
