/**
 * StoreProse — render a raw prose string from the resolved store.
 *
 * Store entries carry their prose fields (claim, rationale, notes,
 * description, quote, …) as RAW strings, exactly as authored in `astra.yaml`:
 * the plugin parses that markdown only for the nodes it PLACES in the page —
 * the store is data. A card that interpolates the string directly shows
 * `$\alpha_\mathrm{iso}$` and `` `qiso` `` literally.
 *
 * This helper tokenizes the two inline forms that actually occur in spec
 * prose — dollar-math and backtick code — into stock mdast nodes and renders
 * them through `<MyST>`, so the KaTeX and inline-code treatments apply exactly
 * as they do in page prose. Everything else stays plain text.
 *
 * Graceful by construction: an empty/undefined string renders nothing, a
 * string with no markup renders as-is, and an unbalanced `$`/backtick simply
 * stays literal text (the tokenizer only matches balanced pairs).
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';
import katex from 'katex';

/** Balanced inline tokens: `code` (may contain $) or $math$ (single-line). */
const INLINE_TOKEN = /(`[^`\n]+`|\$[^$\n]+\$)/g;

/**
 * An inlineMath node with the KaTeX HTML baked in. The stock myst-to-react
 * math renderer does NOT run KaTeX — it injects a pre-rendered `node.html`
 * (MyST's build pipeline adds it) and shows an inline ERROR token when the
 * field is missing. Store strings never pass through that pipeline, so we
 * render here; `throwOnError: false` makes bad TeX display literally (in
 * KaTeX's error colour) instead of breaking the card.
 */
function inlineMathNode(value: string): GenericNode {
  return {
    type: 'inlineMath',
    value,
    html: katex.renderToString(value, { throwOnError: false }),
  };
}

/** Tokenize a raw store-prose string into stock mdast inline nodes. */
export function parseStoreProse(text: string): GenericNode[] {
  const nodes: GenericNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE_TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) nodes.push({ type: 'text', value: text.slice(last, idx) });
    const tok = m[0];
    if (tok.startsWith('`')) {
      nodes.push({ type: 'inlineCode', value: tok.slice(1, -1) });
    } else {
      nodes.push(inlineMathNode(tok.slice(1, -1)));
    }
    last = idx + tok.length;
  }
  if (last < text.length) nodes.push({ type: 'text', value: text.slice(last) });
  return nodes;
}

/** Render a store prose string with inline math / code resolved. */
export const StoreProse: React.FC<{ text?: string }> = ({ text }) => {
  if (!text) return null;
  // Fast path: nothing to parse — avoid the MyST pipeline for plain strings.
  if (!/[`$]/.test(text)) return <>{text}</>;
  return <MyST ast={parseStoreProse(text)} />;
};

export default StoreProse;
