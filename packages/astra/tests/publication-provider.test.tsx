import * as React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProjectViewModelV1 } from '@astra-spec/sdk/view-model';
import type { ResolvedStore } from '@astra-spec/store-types';

import {
  AstraPublicationProvider,
  createStaticViewerHost,
  findAstraPublication,
  postReferenceToParent,
  usePublicationOpenReference,
  type AstraPublicationData,
} from '../src/publication/AstraPublicationProvider';
import { AstraOutput } from '../src/renderers/AstraOutput';
import { AstraStoreProvider } from '../src/store/AstraStoreProvider';

const model: ProjectViewModelV1 = {
  schemaVersion: 'project-view-model.v1',
  revision: { analysis: 'analysis-revision' },
  project: { id: 'demo', name: 'Demo analysis' },
  selection: {
    availableUniverses: [],
    decisions: {},
    source: 'default',
  },
  scopes: [
    {
      id: 'root',
      canonicalPath: 'root',
      name: 'Demo analysis',
      childIds: [],
      recordIds: ['root:decision:method', 'root:output:table'],
    },
  ],
  records: [
    {
      id: 'root:decision:method',
      localId: 'method',
      canonicalPath: 'decisions.method',
      scopeId: 'root',
      kind: 'decision',
      label: 'Fit method',
      selectedOptionId: 'grid',
      options: [{ id: 'grid', label: 'Grid search', selected: true }],
      relations: [],
    },
    {
      id: 'root:output:table',
      localId: 'table',
      canonicalPath: 'outputs.table',
      scopeId: 'root',
      kind: 'output',
      label: 'Measurements',
      outputType: 'table',
      resourceIds: ['resource:table'],
      provenance: { inputs: [], decisions: [] },
      relations: [],
    },
  ],
  resources: [
    {
      id: 'resource:table',
      kind: 'table',
      mediaType: 'text/csv',
      fileName: 'table.csv',
      availability: 'available',
      source: 'materialized',
      outputRecordId: 'root:output:table',
    },
  ],
  diagnostics: [],
};

const publication: AstraPublicationData = {
  bundle: {
    schemaVersion: 'astra-publication-bundle.v1',
    revision: 'publication-revision',
    activeScopeId: 'root',
    model,
  },
  resources: new Map([
    [
      'resource:table',
      {
        id: 'resource:table',
        recordId: 'root:output:table',
        recordPath: 'outputs.table',
        mediaType: 'text/csv',
        byteSize: 32,
        revision: 'resource-revision',
        url: '/_static/table.abc123.csv',
      },
    ],
  ]),
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('canonical publication data', () => {
  it('reads the project model and joins rewritten resource URLs', () => {
    const found = findAstraPublication({
      type: 'root',
      children: [
        {
          type: 'div',
          class: 'astra-publication-bundle',
          data: { astraPublication: publication.bundle },
        },
        {
          type: 'div',
          class: 'astra-publication-resources',
          children: [
            {
              type: 'link',
              url: '/_static/table.abc123.csv',
              data: {
                astraResource: {
                  id: 'resource:table',
                  recordId: 'root:output:table',
                  recordPath: 'outputs.table',
                  mediaType: 'text/csv',
                  byteSize: 32,
                  revision: 'resource-revision',
                },
              },
            },
          ],
        },
      ],
    });
    expect(found?.bundle.model).toBe(model);
    expect(found?.resources.get('resource:table')?.url).toBe(
      '/_static/table.abc123.csv',
    );
  });

  it('serves bounded CSV previews and download URLs through the static host', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('tracer,value\nLRG,19.88\nELG,0.0696\n')),
    );
    const host = createStaticViewerHost(publication);
    await expect(
      host.getPreview?.('resource:table', { maxRows: 1, maxColumns: 2 }),
    ).resolves.toEqual({
      kind: 'table',
      headers: ['tracer', 'value'],
      rows: [['LRG', '19.88']],
      totalRows: 2,
      totalColumns: 2,
      truncated: true,
    });
    await expect(host.getDownloadUrl?.('resource:table')).resolves.toBe(
      '/_static/table.abc123.csv',
    );
  });
});

function DetailTrigger() {
  const open = usePublicationOpenReference();
  return (
    <button
      type="button"
      onClick={() =>
        open?.({
          kind: 'decision',
          id: 'method',
          canonicalPath: 'decisions.method',
        })
      }
    >
      Inspect method
    </button>
  );
}

describe('publication reference routing', () => {
  it('opens the shared kind-specific dialog locally in a standalone publication', () => {
    render(
      <AstraPublicationProvider publication={publication}>
        <DetailTrigger />
      </AstraPublicationProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Inspect method' }));
    expect(screen.getByRole('dialog', { name: 'Fit method' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Close decision details' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Fit method' })).toBeVisible();
    expect(screen.getByText('Grid search')).toBeVisible();
  });

  it('opens a placed table in astra-ui OutputDialog without a provenance disclosure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('tracer,value\nLRG,19.88\nELG,0.0696\n')),
    );
    const store: ResolvedStore = {
      analysis: { id: 'demo', name: 'Demo analysis', slug: 'demo' },
      inputs: {},
      decisions: {},
      findings: {},
      prior_insights: {},
      subanalyses: {},
      outputs: {
        table: {
          id: 'table',
          label: 'Measurements',
          type: 'table',
          table_data: { headers: ['placed'], rows: [['summary']] },
        },
      },
    };
    render(
      <AstraPublicationProvider publication={publication}>
        <AstraStoreProvider store={store}>
          <AstraOutput
            node={{
              type: 'container',
              class: 'astra-output astra-output--table',
              identifier: 'output-table',
              children: [],
            }}
          />
        </AstraStoreProvider>
      </AstraPublicationProvider>,
    );

    expect(screen.queryByText('Provenance')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Open table details: Measurements' }),
    );

    const dialog = screen.getByRole('dialog', { name: 'Measurements' });
    expect(dialog).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'Close output details' }),
    ).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'View table full screen' }),
    ).toBeVisible();
    await waitFor(() => {
      expect(within(dialog).getByRole('cell', { name: 'LRG' })).toBeVisible();
    });
  });

  it('posts the existing astra:open-reference envelope when embedded', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'parent');
    const postMessage = vi.fn();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage },
    });
    const reference = {
      kind: 'output' as const,
      id: 'root:output:table',
      canonicalPath: 'outputs.table',
    };
    expect(postReferenceToParent(reference)).toBe(true);
    expect(postMessage).toHaveBeenCalledWith(
      { type: 'astra:open-reference', reference },
      '*',
    );
    if (descriptor) Object.defineProperty(window, 'parent', descriptor);
  });
});
