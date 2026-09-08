import { useBaseurl } from '@myst-theme/providers';
import { previewHref } from '../viewerTransport';
import * as React from 'react';
import type {
  ResolvedAnalysisNode,
  ResolvedDecision,
  ResolvedOutput,
} from '@astra-spec/sdk';
import {
  linkedRecord,
  selectedOptionLabel,
  type LinkedRecord,
} from '@astra-spec/ui/model';
import { Prose } from '@astra-spec/ui/primitives';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';

import { AstraPreviewPopover } from '../preview';
import type { AstraPublication } from '../publication/AstraPublicationProvider';
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
      {metric.unit ? <span className="astra-metric__unit">{metric.unit}</span> : null}
      {metric.label ? <span className="astra-metric__label">{metric.label}</span> : null}
    </div>
  );
}

interface ProvenanceDecision {
  decision: ResolvedDecision;
  analysis: ResolvedAnalysisNode;
  via?: string;
}

function provenanceDecisions(
  publication: AstraPublication,
  links: LinkedRecord[],
): ProvenanceDecision[] {
  const seen = new Set<string>();
  const decisions: ProvenanceDecision[] = [];
  for (const link of links) {
    if (seen.has(link.canonicalPath)) continue;
    seen.add(link.canonicalPath);
    if (link.record?.kind !== 'decision' || !link.analysis) continue;
    const isCurrent =
      link.analysis.canonicalPath === publication.activeAnalysis.canonicalPath;
    const via = isCurrent
      ? undefined
      : link.analysis.canonicalPath === '$'
        ? 'root'
        : link.analysis.canonicalPath;
    decisions.push({
      decision: link.record,
      analysis: link.analysis,
      via,
    });
  }
  return decisions;
}

interface TracedProvenance {
  decisions: LinkedRecord[];
  inputs: LinkedRecord[];
}

/** Preserve the released decision anchor for direct and inherited records. */
function decisionHref(item: ProvenanceDecision): string {
  const anchor = `#decision-${item.decision.id}`;
  if (!item.via) return anchor;
  return item.via === 'root'
    ? `/${anchor}`
    : `/${item.via.split('.').join('/')}${anchor}`;
}

/**
 * Trace provenance in authored, depth-first order. This matches the released
 * transport's flattened provenance while deriving it from canonical records.
 */
function traceOutputProvenance(
  publication: AstraPublication,
  output: ResolvedOutput,
): TracedProvenance {
  const decisions = new Map<string, LinkedRecord>();
  const roots = new Map<string, LinkedRecord>();
  const seenOutputs = new Set<string>();
  const seenDependencies = new Set<string>();

  const visitDependency = (path: string): void => {
    if (seenDependencies.has(path)) return;
    seenDependencies.add(path);
    const link = linkedRecord(publication.index, path);
    const record = link.record;
    if (!record) {
      roots.set(path, link);
    } else if (record.kind === 'input') {
      if (record.resolvedFrom) visitDependency(record.resolvedFrom);
      else roots.set(record.canonicalPath, link);
    } else if (record.kind === 'output') {
      visitOutput(record);
    }
  };

  const visitOutput = (candidate: ResolvedOutput): void => {
    if (seenOutputs.has(candidate.canonicalPath)) return;
    seenOutputs.add(candidate.canonicalPath);
    for (const path of candidate.provenance.decisionPaths) {
      if (!decisions.has(path)) {
        decisions.set(path, linkedRecord(publication.index, path));
      }
    }
    for (const path of candidate.provenance.inputPaths) {
      visitDependency(path);
    }
  };

  visitOutput(output);
  return {
    decisions: [...decisions.values()],
    inputs: [...roots.values()],
  };
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
    <a
      className="astra-ref astra-ref--decision"
      href={previewHref(decisionHref(item), baseurl)}
    >
      {item.decision.label ?? item.decision.id}
    </a>
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
  output: ResolvedOutput;
  publication: AstraPublication;
}) {
  const traced = traceOutputProvenance(publication, output);
  const decisions = provenanceDecisions(publication, traced.decisions);
  const inputs = traced.inputs;
  if (!decisions.length && !inputs.length) return null;

  return (
    <details className="astra-output__provenance">
      <summary>Provenance</summary>
      {decisions.length ? (
        <>
          <div className="astra-card__section">Decisions ({decisions.length})</div>
          <ul className="astra-output__prov-decisions">
            {decisions.map((item) => (
              <li key={item.decision.canonicalPath} className="astra-output__prov-row">
                <ProvenanceDecisionRef item={item} publication={publication} />
                {item.via ? <span className="astra-prov-via">via {item.via}</span> : null}
                {item.decision.selectedOptionId ? (
                  <span className="astra-prov-selection">
                    {selectedOptionLabel(item.decision)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {inputs.length ? (
        <>
          <div className="astra-card__section">Source data ({inputs.length})</div>
          <div className="astra-output__prov-row">
            {inputs.map((input) => (
              <code
                key={input.canonicalPath}
                className="astra-flow__node"
                title={input.record?.label ?? input.record?.id ?? input.canonicalPath}
              >
                {input.record?.id ?? input.canonicalPath}
              </code>
            ))}
          </div>
        </>
      ) : null}
    </details>
  );
}

function OutputCaption({ output }: { output: ResolvedOutput }) {
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
  const actualSubtype = subtype === 'unknown' && output.type === 'metric'
    ? 'metric'
    : subtype;
  const metric = actualSubtype === 'metric' ? metricFromChildren(node) : undefined;

  let body: React.ReactNode = hasStockChildren ? stockChildren : null;
  if (actualSubtype === 'metric' && metric) body = <MetricStat metric={metric} />;
  if (!body && actualSubtype === 'metric') body = <OutputCaption output={output} />;

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
