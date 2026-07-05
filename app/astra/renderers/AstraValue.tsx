/**
 * AstraValue — inline `{astra:value}` renderer.
 *
 * The plugin emits a self-describing neutral span:
 *   span.astra-ref.astra-ref--value[.astra-ref--<output-type>]
 *   children: [text("19.88 ± 0.17")]   // the already-computed number
 *   node.data.astra = { kind:'value', id, path, col, filter, type, product }
 *
 * `id` joins the `outputs` table (a value is one cell pulled from a product),
 * so we resolve it via `useAstraEntry('output', id)` to recover the product's
 * human label / description for the preview card. The visible text is ALWAYS
 * the node's own children — we never recompute the number.
 *
 * Graceful degradation (CONTRACT §"degrade gracefully"): if there is no store
 * entry we render the bare number span (still carrying the astra-* classes so
 * the stylesheet applies) and skip the popover. Never throws.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';
import { useAstraEntry } from '../store/useAstraStore';
import { PreviewCard } from '../card/PreviewCard';
import { KindLabel, Title, Desc } from '../card';
import { StoreProse } from '../storeProse';
import type { InlineAstra, SerializedOutput } from '@astra-spec/store-types';

/** Pull the inline `data.astra` payload off the node, tolerating absence. */
function inlineAstra(node: GenericNode): Partial<InlineAstra> {
  const data = (node?.data ?? {}) as { astra?: Partial<InlineAstra> };
  return data.astra ?? {};
}

/**
 * Compose the root className: preserve whatever astra-* classes the plugin
 * stamped on the node (e.g. `astra-ref astra-ref--value astra-ref--metric`) so
 * the design system applies. Fall back to the canonical pair if absent.
 */
function rootClassName(node: GenericNode): string {
  const cls = (node as { class?: unknown }).class;
  return typeof cls === 'string' && cls.trim()
    ? cls.trim()
    : 'astra-ref astra-ref--value';
}

export interface AstraValueProps {
  node: GenericNode;
}

export const AstraValue: React.FC<AstraValueProps> = ({ node }) => {
  const astra = inlineAstra(node);
  const id = astra.id;

  // Join the value to its source product/output (kind 'value' -> outputs table).
  // The path key resolves cross-scope products (merged from sub-analyses).
  const entry = useAstraEntry('output', id, astra.path) as SerializedOutput | undefined;

  // The visible number is always the node's own children — rendered through the
  // stock pipeline so any inline markup inside it survives.
  const number = <MyST ast={node.children} />;

  const valueSpan = <span className={rootClassName(node)}>{number}</span>;

  // No join target (missing store / unknown id): degrade to the bare number.
  if (!entry) {
    return valueSpan;
  }

  const description = entry.description;

  // Surface the underlying metric unit when this value came from a metric output.
  const unit = entry.metric?.unit ?? entry.metric?.units;

  return (
    <PreviewCard
      kind="value"
      trigger={valueSpan}
      children={
        <>
          <KindLabel kind="output" />
          <Title>
            <span className="astra-ref astra-ref--value">
              {number}
              {unit ? <span className="astra-card__unit"> {unit}</span> : null}
            </span>
          </Title>
          {description ? (
            <Desc>
              <StoreProse text={description} />
            </Desc>
          ) : null}
        </>
      }
    />
  );
};

export default AstraValue;
