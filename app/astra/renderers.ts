/**
 * ASTRA_RENDERERS — the theme's override map, merged OVER `DEFAULT_RENDERERS`.
 *
 * MyST keys renderers by node TYPE, and within a type matches `unist-util-select`
 * CSS selectors (reversed → last matching entry wins) with a `base` fallback
 * (see `myst-to-react`'s `selectRenderer`). So we override stock types but branch
 * on the `astra-*` class only.
 *
 * Selectors use the SUBSTRING attribute form `type[class*="astra-…"]`, NOT
 * `.class` (rejected by unist-util-select) and NOT `[class~="…"]` (which treats
 * the multi-class `class` string as a single token and never matches
 * `"astra-ref astra-ref--decision"`). See DEVELOPING.md → Gotchas.
 *
 * We deliberately set NO `base` keys: `mergeRenderers` merges per-type buckets
 * (`{ ...prev, ...next }`), so the `base` accumulated from the maps merged
 * before this one (book-theme defaults, Jupyter's `container: Figure`, …)
 * survives, and every non-ASTRA node renders exactly as in stock book-theme.
 * Every ASTRA component itself degrades to `<MyST ast={node.children} />` when
 * its store entry is missing.
 *
 * Selector ordering note (reversed match, last wins): for `span` we list
 * `span[class*="astra-ref"]` first and `span[class*="astra-ref--value"]` LAST, so
 * a value token (which carries BOTH classes) is matched by the value renderer.
 */
import type { NodeRenderers } from '@myst-theme/providers';

import { AstraInlineRef } from './renderers/AstraInlineRef';
import { AstraValue } from './renderers/AstraValue';
import { AstraDecision } from './renderers/AstraDecision';
import { AstraOutput } from './renderers/AstraOutput';
import { AstraFinding } from './renderers/AstraFinding';
import { AstraPriorInsight } from './renderers/AstraPriorInsight';
import { AstraDataSources } from './renderers/AstraDataSources';
import { AstraSubanalysis } from './renderers/AstraSubanalysis';

export const ASTRA_RENDERERS: NodeRenderers = {
  // Inline tokens. `--value` listed last so it wins for value spans (which carry
  // both `.astra-ref` and `.astra-ref--value`).
  span: {
    'span[class*="astra-ref"]': AstraInlineRef,
    'span[class*="astra-ref--value"]': AstraValue,
  },

  // An output block (`:::{astra} outputs/<id>`) — the carrier is usually a
  // `container` (figure/table), but a metric/data output lands on a `paragraph`
  // carrier. Register both so either carrier type resolves to AstraOutput.
  container: {
    'container[class*="astra-output"]': AstraOutput,
  },
  paragraph: {
    'paragraph[class*="astra-output"]': AstraOutput,
  },

  // Decision + finding blocks. Since MySTRA#11 the plugin emits a `div`
  // carrier with the whole neutral fallback nested inside (replacing the
  // carrier replaces the fallback — no double render); plugin releases
  // ≤ v0.0.5 stamped the classes on a bare `heading` carrier with the
  // fallback as siblings, so both buckets stay registered for back-compat.
  // The component body (rationale/options, claim/notes/scope) comes from the
  // store entry keyed by the carrier identifier, not the carrier's children.
  // (An option heading (`astra-option`) intentionally has no override: a
  // single placed option reads fine as the stock heading + prose.)
  div: {
    'div[class*="astra-decision"]': AstraDecision,
    'div[class*="astra-finding"]': AstraFinding,
  },
  heading: {
    'heading[class*="astra-decision"]': AstraDecision,
    'heading[class*="astra-finding"]': AstraFinding,
  },

  // A prior-insight block — admonition(seealso). (class `astra-prior-insight`.)
  admonition: {
    'admonition[class*="astra-prior-insight"]': AstraPriorInsight,
  },

  // Registry tables (`:::{astra} inputs` / `:::{astra} outputs`). A
  // single-input table (class `astra-input`, singular) and a universe
  // selection table (`astra-universe`) deliberately stay on the stock table
  // renderer — they are already resolved, readable tables.
  table: {
    'table[class*="astra-inputs"]': AstraDataSources,
    'table[class*="astra-outputs"]': AstraDataSources,
  },

  // A sub-analysis nav card (class `astra-subanalysis`, id `analysis-<id>`).
  // The plugin emits the sub-analysis carrier as a `card`.
  card: {
    'card[class*="astra-subanalysis"]': AstraSubanalysis,
  },
};

export default ASTRA_RENDERERS;
