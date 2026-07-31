/**
 * AstraDataSources — block registry tables (`astra:inputs` / `astra:outputs`).
 *
 * The plugin emits a stock `table` node carrying either `astra-inputs` or
 * `astra-outputs` on `node.class`, with one data `tableRow` per registry entry
 * (each carrying `identifier` `input-<id>` / `output-<id>`). The neutral table
 * is a perfectly readable fallback; here we re-render it as a clean editorial
 * registry table joined to the page `ResolvedStore`:
 *
 *   inputs  → store.inputs   columns: [type glyph, id (mono), label, type, source/description]
 *   outputs → store.outputs  columns: [type glyph, id (mono), label, type, source/description]
 *
 * Each id is a mono cross-link to its placed carrier (`#input-<id>` /
 * `#output-<id>`). The original `astra-*` class is preserved on the root so the
 * stylesheet applies.
 *
 * GRACEFUL DEGRADATION (CONTRACT §0): if the store is missing, or carries no
 * rows for this table, we fall back to the node's own stock children via
 * `<MyST ast={node.children} />`. We never throw.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
export declare const AstraDataSources: React.FC<{
    node: GenericNode;
}>;
export default AstraDataSources;
