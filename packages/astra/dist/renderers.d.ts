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
export declare const ASTRA_RENDERERS: NodeRenderers;
export default ASTRA_RENDERERS;
