import * as React from 'react';
import { Prose } from '@astra-spec/ui/primitives';
import type { GenericNode } from 'myst-common';

import { useAstraPublication } from '../publication/AstraPublicationProvider';
import {
  astraMetadata,
  NeutralNode,
  nodeClassName,
  nodeHtmlId,
  stringMetadata,
} from '../rendererUtils';
import type { AstraPublication } from '../publication/AstraPublicationProvider';

type Registry = 'inputs' | 'outputs';

interface Row {
  id: string;
  anchorId?: string;
  label?: string;
  type?: string;
  description?: string;
  source?: string;
}

function registryOf(node: GenericNode): Registry | undefined {
  const classes = new Set(nodeClassName(node).split(/\s+/).filter(Boolean));
  if (classes.has('astra-outputs')) return 'outputs';
  if (classes.has('astra-inputs')) return 'inputs';
  return undefined;
}

function glyphModifier(registry: Registry, type?: string): string {
  if (registry === 'inputs') return 'input';
  if (type === 'table') return 'table';
  if (type === 'metric') return 'metric';
  return 'figure';
}

/** Join registry data rows in neutral AST order; the table has no scope identity. */
function rowsFor(
  publication: AstraPublication,
  node: GenericNode,
  registry: Registry,
): Row[] | undefined {
  const dataRows = (node.children ?? []).slice(1);
  if (!dataRows.length) return undefined;
  const rows: Row[] = [];

  for (const row of dataRows) {
    const metadata = astraMetadata(row);
    const expectedKind = registry === 'inputs' ? 'input' : 'output';
    const canonicalPath = stringMetadata(metadata, 'canonicalPath');
    if (metadata?.kind !== expectedKind || !canonicalPath) return undefined;
    const record = publication.index.recordByPath.get(canonicalPath);

    if (registry === 'inputs') {
      if (record?.kind !== 'input') return undefined;
      rows.push({
        id: record.id,
        anchorId: nodeHtmlId(row),
        label: record.label,
        type: record.type,
        description: record.description,
        source:
          record.source ?? record.from ?? record.ref ?? record.resolvedFrom,
      });
    } else {
      if (record?.kind !== 'output' || !record.active) return undefined;
      rows.push({
        id: record.id,
        anchorId: nodeHtmlId(row),
        label: record.label,
        type: record.type,
        description: record.description,
        source:
          record.recipe?.command ??
          publication.artifactUrls.get(record.canonicalPath) ??
          record.from ??
          record.resolvedFrom,
      });
    }
  }
  return rows;
}

export const AstraDataSources: React.FC<{ node: GenericNode }> = ({ node }) => {
  const publication = useAstraPublication();
  const registry = registryOf(node);
  const className = nodeClassName(node);

  const rows = publication && registry
    ? rowsFor(publication, node, registry)
    : undefined;

  if (!publication || !registry || !rows?.length) {
    return (
      <NeutralNode
        node={node}
        recognitionClass={['astra-inputs', 'astra-outputs']}
      />
    );
  }

  const prefix = registry === 'inputs' ? 'input' : 'output';
  const heading = registry === 'inputs' ? 'Inputs' : 'Outputs';
  return (
    <div className="astra-registry-scroll">
      <table className={className || `astra-${registry}`}>
        <caption>{heading}</caption>
        <thead>
          <tr>
            <th scope="col">{registry === 'inputs' ? 'Input' : 'Output'}</th>
            <th scope="col">Type</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const expectedAnchor = `${prefix}-${row.id}`;
            const anchor =
              row.anchorId ??
              (publication.placedIdentifiers.has(expectedAnchor)
                ? expectedAnchor
                : undefined);
            return (
              <tr key={row.id} id={row.anchorId}>
                <td>
                  <span
                    className={`astra-type-glyph astra-type-glyph--${glyphModifier(
                      registry,
                      row.type,
                    )}`}
                    aria-hidden="true"
                  />
                  {anchor ? (
                    <a className="astra-id" href={`#${anchor}`}>
                      {row.id}
                    </a>
                  ) : (
                    <span className="astra-id">{row.id}</span>
                  )}
                  {row.label ? (
                    <span> {row.label}</span>
                  ) : null}
                </td>
                <td>{row.type ?? '—'}</td>
                <td>
                  {row.description ? (
                    <span>
                      <Prose text={row.description} field="description" />
                    </span>
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
    </div>
  );
};

export default AstraDataSources;
