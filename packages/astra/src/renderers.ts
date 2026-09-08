/**
 * ASTRA_RENDERERS — the theme's override map, merged OVER `DEFAULT_RENDERERS`.
 *
 * MyST keys renderers by node TYPE, and within a type matches `unist-util-select`
 * CSS selectors (reversed → last matching entry wins) with a `base` fallback
 * (see `myst-to-react`'s `selectRenderer`). So we override stock types but branch
 * on the `astra-*` class only.
 *
 * unist-util-select rejects `.class`, represents MyST classes as either a
 * space-joined string or an array, and applies different attribute semantics
 * to each. `classTokenSelector` combines boundary-safe string selectors with
 * `[class~=]` for arrays. This avoids both false-positive author classes and
 * recursion when an enrichment falls back to stock MyST.
 *
 * We deliberately set NO `base` keys: `mergeRenderers` merges per-type buckets
 * (`{ ...prev, ...next }`), so the `base` accumulated from the maps merged
 * before this one (book-theme defaults, Jupyter's `container: Figure`, …)
 * survives, and every non-ASTRA node renders exactly as in stock book-theme.
 * Every ASTRA component delegates its full neutral carrier back to stock MyST
 * when canonical publication data is missing.
 *
 * Selector ordering note (reversed match, last wins): for `span` we list
 * the complete `astra-ref` token first and `astra-ref--value` LAST, so a value
 * node (which carries BOTH classes) is matched by the value renderer.
 */
import type { NodeRenderers } from '@myst-theme/providers';
import { createElement } from 'react';

import { AstraInventoryButton } from './publication/AstraPublicationProvider';
import { AstraInlineRef } from './renderers/AstraInlineRef';
import { AstraValue } from './renderers/AstraValue';
import { AstraDecision } from './renderers/AstraDecision';
import { AstraOutput } from './renderers/AstraOutput';
import { AstraFinding } from './renderers/AstraFinding';
import { AstraPriorInsight } from './renderers/AstraPriorInsight';
import { AstraDataSources } from './renderers/AstraDataSources';
import { AstraSubanalysis } from './renderers/AstraSubanalysis';

/** Match one complete class token for both MyST class representations. */
export function classTokenSelector(type: string, token: string): string {
  return [
    `${type}[class~="${token}"]`,
    `${type}[class="${token}"]`,
    `${type}[class^="${token} "]`,
    `${type}[class$=" ${token}"]`,
    `${type}[class*=" ${token} "]`,
  ].join(', ');
}

const SPAN_REF = classTokenSelector('span', 'astra-ref');
const SPAN_VALUE = classTokenSelector('span', 'astra-ref--value');
const CONTAINER_OUTPUT = classTokenSelector('container', 'astra-output');
const PARAGRAPH_OUTPUT = classTokenSelector('paragraph', 'astra-output');
const DIV_OUTPUT = classTokenSelector('div', 'astra-output');
const DIV_DECISION = classTokenSelector('div', 'astra-decision');
const DIV_FINDING = classTokenSelector('div', 'astra-finding');
const ADMONITION_INSIGHT = classTokenSelector(
  'admonition',
  'astra-prior-insight',
);
const TABLE_INPUTS = classTokenSelector('table', 'astra-inputs');
const TABLE_OUTPUTS = classTokenSelector('table', 'astra-outputs');
const CARD_SUBANALYSIS = classTokenSelector('card', 'astra-subanalysis');

export const ASTRA_RENDERERS: NodeRenderers = {
  // Inline tokens. `--value` listed last so it wins for value spans (which carry
  // both `.astra-ref` and `.astra-ref--value`).
  span: {
    [SPAN_REF]: AstraInlineRef,
    [SPAN_VALUE]: AstraValue,
  },

  // An output block (`:::{astra} outputs/<id>`) — the carrier is usually a
  // `container` (figure/table), but a metric/data output lands on a `paragraph`
  // carrier. Register both so either carrier type resolves to AstraOutput.
  container: {
    [CONTAINER_OUTPUT]: AstraOutput,
  },
  paragraph: {
    [PARAGRAPH_OUTPUT]: AstraOutput,
  },

  // Decision + finding blocks use current MySTRA `div` carriers whose full
  // neutral fallback is nested inside.
  // The enriched body comes from the SDK record keyed by data.astra.canonicalPath;
  // the full carrier remains the neutral fallback.
  // (An option heading (`astra-option`) intentionally has no override: a
  // single placed option reads fine as the stock heading + prose.)
  div: {
    [classTokenSelector('div', 'astra-inventory-button')]: () => createElement(AstraInventoryButton),
    [DIV_DECISION]: AstraDecision,
    [DIV_FINDING]: AstraFinding,
    // Metric, data and unproduced output embeds use a `div` carrier.
    [DIV_OUTPUT]: AstraOutput,
  },
  // A prior-insight block — admonition(seealso). (class `astra-prior-insight`.)
  admonition: {
    [ADMONITION_INSIGHT]: AstraPriorInsight,
  },

  // Registry tables (`:::{astra} inputs` / `:::{astra} outputs`). A
  // single-input table (class `astra-input`, singular) and a universe
  // selection table (`astra-universe`) deliberately stay on the stock table
  // renderer — they are already resolved, readable tables.
  table: {
    [TABLE_INPUTS]: AstraDataSources,
    [TABLE_OUTPUTS]: AstraDataSources,
  },

  // A sub-analysis nav card (class `astra-subanalysis`, id `analysis-<id>`).
  // The plugin emits the sub-analysis carrier as a `card`.
  card: {
    [CARD_SUBANALYSIS]: AstraSubanalysis,
  },
};

export default ASTRA_RENDERERS;
