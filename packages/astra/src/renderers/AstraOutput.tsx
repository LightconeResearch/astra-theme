/**
 * AstraOutput — block renderer for `:::{astra:output}` carriers.
 *
 * The plugin emits a stock `container` carrying `astra-output` plus a subtype
 * modifier class (`astra-output--figure` / `--table` / `--metric`) and an
 * identifier `output-<id>` (CONTRACT.md §1). We join the `SerializedOutput`
 * from the page store by that id. Registered figures and tables open the
 * canonical astra-ui OutputDialog through AstraPublicationProvider; the
 * `metric` subtype renders a big stat from
 * `output.metric{value,uncertainty,unit}`.
 *
 * Graceful degradation: if the store entry is missing we render the node's own
 * stock children verbatim. We never throw, and we always preserve the node's
 * `astra-*` classes on the root so the stylesheet applies.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';
import {
  parseCarrierId,
  useEntryByIdentifier,
} from '../store/useAstraStore';
import { usePublicationOpenReference } from '../publication/AstraPublicationProvider';
import { StoreProse } from '../storeProse';
import type { SerializedOutput } from '@astra-spec/store-types';

/** The output subtypes carried as `astra-output--<subtype>` modifier classes. */
type OutputSubtype = 'figure' | 'table' | 'metric' | 'unknown';

/** Read the node's class string regardless of which key the AST used. */
function classNameOf(node: GenericNode): string {
  const raw =
    (node as { class?: unknown }).class ??
    (node as { className?: unknown }).className;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.filter((c) => typeof c === 'string').join(' ');
  return '';
}

/** Determine the output subtype from the carrier's modifier class. */
function subtypeOf(node: GenericNode): OutputSubtype {
  const cls = classNameOf(node);
  if (cls.includes('astra-output--figure')) return 'figure';
  if (cls.includes('astra-output--table')) return 'table';
  if (cls.includes('astra-output--metric')) return 'metric';
  return 'unknown';
}

/** Coerce a metric scalar (number | string | undefined) to a display string. */
function fmtScalar(v: number | string | undefined): string | undefined {
  if (v == null || v === '') return undefined;
  return typeof v === 'number' ? String(v) : v;
}

/* ------------------------------------------------------------------ *
 * Metric stat — the big number + unit + ± uncertainty + label.
 * ------------------------------------------------------------------ */
const MetricStat: React.FC<{ output: SerializedOutput }> = ({ output }) => {
  const m = output.metric;
  if (!m) return null;

  const value = fmtScalar(m.value);
  const unit = m.unit ?? m.units;
  const uncertainty = fmtScalar(m.uncertainty ?? m.error);
  const label = m.label ?? output.label;

  if (value == null) return null;

  return (
    <div className="astra-metric">
      <span className="astra-metric__value">{value}</span>
      {uncertainty != null ? (
        <span className="astra-metric__uncertainty">{uncertainty}</span>
      ) : null}
      {unit ? <span className="astra-metric__unit">{unit}</span> : null}
      {label ? <span className="astra-metric__label">{label}</span> : null}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Fallback table built from `output.table_data` when the carrier has
 * no stock table children to render.
 * ------------------------------------------------------------------ */
const TableFromData: React.FC<{ output: SerializedOutput }> = ({ output }) => {
  const data = output.table_data;
  if (!data || !Array.isArray(data.rows) || data.rows.length === 0) return null;
  const headers = data.headers ?? [];
  return (
    <table className="astra-outputs">
      {headers.length > 0 ? (
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={`${h}-${i}`}>{h}</th>
            ))}
          </tr>
        </thead>
      ) : null}
      <tbody>
        {data.rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/** A short editorial caption line beneath the artifact. */
const OutputCaption: React.FC<{ output: SerializedOutput }> = ({ output }) => {
  const text = output.description ?? output.label;
  if (!text) return null;
  return (
    <div className="astra-output__caption">
      <StoreProse text={text} />
    </div>
  );
};

export interface AstraOutputProps {
  node: GenericNode;
}

export function AstraOutput({ node }: AstraOutputProps): React.ReactElement {
  const identifier =
    (node as { identifier?: string }).identifier ??
    (node as { id?: string }).id;
  const entry = useEntryByIdentifier(identifier);
  const subtype = subtypeOf(node);
  const openReference = usePublicationOpenReference();

  // Preserve the carrier's astra-* classes so the stylesheet applies, and make
  // sure the base `astra-output` + subtype modifier are present even if the AST
  // class string only carried one of them.
  const baseClass = classNameOf(node);
  const className = baseClass && baseClass.includes('astra-output')
    ? baseClass
    : ['astra-output', subtype !== 'unknown' ? `astra-output--${subtype}` : '', baseClass]
        .filter(Boolean)
        .join(' ');

  const stockChildren = <MyST ast={node.children} />;
  const output = entry && isOutput(entry) ? entry : undefined;
  const outputId = output?.id ?? parseCarrierId(identifier)?.id;
  const canOpen = Boolean(
    openReference &&
    outputId &&
    (subtype === 'figure' || subtype === 'table'),
  );
  const openOutput = () => {
    if (!openReference || !outputId) return;
    openReference({ kind: 'output', id: outputId });
  };
  const interactionProps: React.HTMLAttributes<HTMLDivElement> & {
    'data-astra-openable'?: string;
  } = canOpen
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-label': `Open ${subtype} details: ${output?.label ?? outputId}`,
        'data-astra-openable': 'true',
        onClick: (event) => {
          event.preventDefault();
          openOutput();
        },
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openOutput();
          }
        },
      }
    : {};

  // No store entry → degrade gracefully to the node's own stock children, but
  // keep the carrier wrapper so the layout/classes still apply. Never throw.
  if (!output) {
    return (
      <div className={className} id={identifier} {...interactionProps}>
        {stockChildren}
      </div>
    );
  }

  const hasStockChildren =
    Array.isArray(node.children) && node.children.length > 0;

  // A metric is presentable when the entry carries a metric value.
  const hasMetricValue = fmtScalar(output.metric?.value) != null;

  let body: React.ReactNode;
  if (subtype === 'metric') {
    if (hasMetricValue) {
      // Prefer the rich stat.
      body = <MetricStat output={output} />;
    } else if (hasStockChildren) {
      // No inlined value → fall back to the stock children.
      body = stockChildren;
    } else {
      body = <OutputCaption output={output} />;
    }
  } else if (subtype === 'table') {
    // Render the stock table when present; otherwise synthesize from table_data.
    body = hasStockChildren ? stockChildren : <TableFromData output={output} />;
  } else {
    // figure (and unknown) — render the stock figure children verbatim.
    body = hasStockChildren ? stockChildren : null;
  }

  // A metric carries its own label inside MetricStat; for figure/table show a
  // caption only when the stock children did not already supply one.
  const showCaption = subtype !== 'metric' && !hasStockChildren;

  return (
    <div className={className} id={identifier} {...interactionProps}>
      {body}
      {showCaption ? <OutputCaption output={output} /> : null}
    </div>
  );
}

/** Narrow an opaque store entry to a `SerializedOutput` (has an `id`). */
function isOutput(entry: unknown): entry is SerializedOutput {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    typeof (entry as { id?: unknown }).id === 'string'
  );
}

export default AstraOutput;
