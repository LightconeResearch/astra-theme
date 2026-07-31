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
/** Tokenize a raw store-prose string into stock mdast inline nodes. */
export declare function parseStoreProse(text: string): GenericNode[];
/** Render a store prose string with inline math / code resolved. */
export declare const StoreProse: React.FC<{
    text?: string;
}>;
export default StoreProse;
