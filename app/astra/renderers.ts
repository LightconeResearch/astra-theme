/**
 * ASTRA_RENDERERS — the theme's override map, merged OVER `DEFAULT_RENDERERS`.
 *
 * MyST keys renderers by node TYPE, and within a type matches `unist-util-select`
 * CSS selectors (reversed → last matching entry wins) with a `base` fallback
 * (see `myst-to-react`'s `selectRenderer`). So we override stock types but branch
 * on the `astra-*` class, and always provide a `base` that defers to the stock
 * book-theme renderer for non-ASTRA nodes.
 *
 * Selectors use the SUBSTRING attribute form `type[class*="astra-…"]`, NOT
 * `.class` (rejected by unist-util-select) and NOT `[class~="…"]` (which treats
 * the multi-class `class` string as a single token and never matches
 * `"astra-ref astra-ref--decision"`). See DEVELOPING.md → Gotchas.
 *
 * Because this map is merged over `DEFAULT_RENDERERS`, the `base` we set is the
 * stock renderer for that type — a plain `span`/`container`/`table` etc. renders
 * exactly as it would without ASTRA. Every ASTRA component itself degrades to
 * `<MyST ast={node.children} />` when its store entry is missing.
 *
 * Selector ordering note (reversed match, last wins): for `span` we list
 * `span[class*="astra-ref"]` first and `span[class*="astra-ref--value"]` LAST, so
 * a value token (which carries BOTH classes) is matched by the value renderer.
 */
import type { NodeRenderers, NodeRenderer } from '@myst-theme/providers';
import { DEFAULT_RENDERERS } from 'myst-to-react';

import { AstraInlineRef } from './renderers/AstraInlineRef';
import { AstraValue } from './renderers/AstraValue';
import { AstraDecision } from './renderers/AstraDecision';
import { AstraOutput } from './renderers/AstraOutput';
import { AstraFinding } from './renderers/AstraFinding';
import { AstraPriorInsight } from './renderers/AstraPriorInsight';
import { AstraDataSources } from './renderers/AstraDataSources';
import { AstraSubanalysis } from './renderers/AstraSubanalysis';

/** Stock renderer for a type, or undefined — used as the `base` fallback. A
 *  type's renderer set is a `{ selector: Component, base }` record; index it as
 *  such (NodeRenderers' value type is a union with a single-renderer form). */
function base(type: string): NodeRenderer {
  const bucket = (DEFAULT_RENDERERS as Record<string, Record<string, NodeRenderer>>)[type];
  // Stock types (span/container/table/heading/…) always carry a `base`; the cast
  // satisfies the non-optional `base` field of NodeRenderers (selectRenderer also
  // tolerates a missing base by falling back to DefaultComponent).
  return bucket?.base as NodeRenderer;
}

export const ASTRA_RENDERERS: NodeRenderers = {
  // Inline tokens. `--value` listed last so it wins for value spans (which carry
  // both `.astra-ref` and `.astra-ref--value`).
  span: {
    'span[class*="astra-ref"]': AstraInlineRef,
    'span[class*="astra-ref--value"]': AstraValue,
    base: base('span'),
  },

  // astra:output — the carrier is usually a `container` (figure/table), but a
  // metric/data output lands on a `paragraph` carrier. Register both so either
  // carrier type resolves to AstraOutput.
  container: {
    'container[class*="astra-output"]': AstraOutput,
    base: base('container'),
  },
  paragraph: {
    'paragraph[class*="astra-output"]': AstraOutput,
    base: base('paragraph'),
  },

  // astra:decision + astra:finding — the plugin stamps `astra-decision` /
  // `astra-finding` on a `heading` carrier (verified against the real build).
  // The component body (rationale/options, claim/notes/scope) comes from the
  // store entry keyed by the heading identifier, not the heading's children.
  heading: {
    'heading[class*="astra-decision"]': AstraDecision,
    'heading[class*="astra-finding"]': AstraFinding,
    base: base('heading'),
  },

  // astra:prior-insight — admonition(seealso). (class `astra-prior-insight`.)
  admonition: {
    'admonition[class*="astra-prior-insight"]': AstraPriorInsight,
    base: base('admonition'),
  },

  // astra:inputs / astra:outputs — registry tables.
  table: {
    'table[class*="astra-inputs"]': AstraDataSources,
    'table[class*="astra-outputs"]': AstraDataSources,
    base: base('table'),
  },

  // astra:subanalysis — nav card (class `astra-subanalysis`, id `analysis-<id>`).
  // The plugin emits the sub-analysis carrier as a `card`.
  card: {
    'card[class*="astra-subanalysis"]': AstraSubanalysis,
    base: base('card'),
  },
};

export default ASTRA_RENDERERS;
