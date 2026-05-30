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
import { MyST } from 'myst-to-react';
import { useAstraStore } from '../store/useAstraStore';
import type {
  ResolvedStore,
  SerializedInput,
  SerializedOutput,
} from '@astra-spec/store-types';

/** Which registry this carrier is, derived from its preserved `astra-*` class. */
type Registry = 'inputs' | 'outputs';

/** The class string the plugin stamps onto the table carrier (string | array). */
function nodeClass(node: GenericNode): string {
  const cls = (node as { class?: unknown }).class;
  if (typeof cls === 'string') return cls;
  if (Array.isArray(cls)) return cls.join(' ');
  return '';
}

/** Branch the carrier onto its registry table, or `undefined` if neither. */
function registryOf(node: GenericNode): Registry | undefined {
  const cls = nodeClass(node);
  if (/\bastra-outputs\b/.test(cls)) return 'outputs';
  if (/\bastra-inputs\b/.test(cls)) return 'inputs';
  return undefined;
}

/** Carrier-id prefix + anchor target per registry. */
const PREFIX: Record<Registry, string> = { inputs: 'input', outputs: 'output' };

/**
 * Normalised view of one registry row, abstracting input vs output so the table
 * body is rendered once. `source` is the most specific provenance-ish field
 * available for the kind (input.source / output.recipe.command / from-alias).
 */
interface Row {
  id: string;
  label?: string;
  type?: string;
  description?: string;
  source?: string;
}

function inputRow(e: SerializedInput): Row {
  return {
    id: e.id,
    label: e.label,
    type: e.type,
    description: e.description,
    source: e.source ?? e.from,
  };
}

function outputRow(e: SerializedOutput): Row {
  return {
    id: e.id,
    label: e.label,
    type: e.type,
    description: e.description,
    source: e.recipe?.command ?? e.resolved_path ?? e.from,
  };
}

/** Pull the ordered rows for a registry from the store (empty array on miss). */
function rowsFor(store: ResolvedStore, registry: Registry): Row[] {
  if (registry === 'inputs') {
    return Object.values(store.inputs ?? {}).map(inputRow);
  }
  return Object.values(store.outputs ?? {}).map(outputRow);
}

/** Maps a registry + entry type to a `.astra-type-glyph--<modifier>` suffix. */
function glyphModifier(registry: Registry, type?: string): string {
  if (registry === 'inputs') return 'input';
  const t = (type ?? '').toLowerCase();
  if (t === 'figure' || t === 'fig' || t === 'image') return 'figure';
  if (t === 'table' || t === 'tbl') return 'table';
  if (t === 'metric' || t === 'value' || t === 'number') return 'metric';
  // default to the generic output glyph
  return 'figure';
}

export const AstraDataSources: React.FC<{ node: GenericNode }> = ({ node }) => {
  const store = useAstraStore();
  const registry = registryOf(node);
  const cls = nodeClass(node);

  // No registry class, no store, or an empty registry → defer to stock children.
  const rows = store && registry ? rowsFor(store, registry) : [];
  if (!store || !registry || rows.length === 0) {
    return <MyST ast={node.children} />;
  }

  const prefix = PREFIX[registry];
  const heading = registry === 'inputs' ? 'Inputs' : 'Outputs';
  const firstCol = registry === 'inputs' ? 'Input' : 'Output';

  return (
    <table className={cls || `astra-${registry}`}>
      <caption>{heading}</caption>
      <thead>
        <tr>
          <th scope="col">{firstCol}</th>
          <th scope="col">Type</th>
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const anchor = `#${prefix}-${row.id}`;
          const mod = glyphModifier(registry, row.type);
          return (
            <tr key={row.id}>
              <td>
                <span
                  className={`astra-type-glyph astra-type-glyph--${mod}`}
                  aria-hidden="true"
                />
                <a className="astra-id" href={anchor}>
                  {row.id}
                </a>
                {row.label ? (
                  <span className="astra-ds__label"> {row.label}</span>
                ) : null}
              </td>
              <td>{row.type ?? '—'}</td>
              <td>
                {row.description ? (
                  <span className="astra-ds__desc">{row.description}</span>
                ) : null}
                {row.source ? (
                  <code className="astra-ds__source">{row.source}</code>
                ) : !row.description ? (
                  '—'
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default AstraDataSources;
