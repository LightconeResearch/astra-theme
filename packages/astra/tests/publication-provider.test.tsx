import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Theme, ThemeProvider, mergeRenderers } from '@myst-theme/providers';
import { DEFAULT_RENDERERS } from 'myst-to-react';
import { renderToString } from 'react-dom/server';
import type { GenericNode } from 'myst-common';

import { ASTRA_RENDERERS } from '../src/renderers';
import { AstraInlineRef } from '../src/renderers/AstraInlineRef';
import {
  AstraPublicationProvider,
  findAstraPublication,
} from '../src/publication/AstraPublicationProvider';
import {
  ARTIFACT_URL,
  LARGE_FIGURE_PATH,
  METRIC_PATH,
  METRIC_URL,
  OUTPUT_PATH,
  PDF_PATH,
  TABLE_PATH,
  TABLE_URL,
  publication,
  publicationTree,
  referenceNode,
  referenceNodeFor,
} from './helpers/publication';

const RENDERERS = mergeRenderers([DEFAULT_RENDERERS, ASTRA_RENDERERS]);

function referenceView(
  mdast: GenericNode = publicationTree(),
  node: GenericNode = referenceNode,
  theme: Theme | null = Theme.light,
) {
  return (
    <ThemeProvider
      theme={theme}
      setTheme={() => undefined}
      renderers={RENDERERS}
    >
      <AstraPublicationProvider mdast={mdast}>
        <p>
          <AstraInlineRef node={node} />
        </p>
      </AstraPublicationProvider>
    </ThemeProvider>
  );
}

function renderReference(
  mdast: GenericNode = publicationTree(),
  node: GenericNode = referenceNode,
  theme: Theme | null = Theme.light,
) {
  return render(referenceView(mdast, node, theme));
}

function streamingArtifactResponse(
  chunks: Uint8Array[],
  contentType?: string,
  contentLength?: string,
): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    },
  });
  return {
    ok: true,
    status: 200,
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'content-type') return contentType ?? null;
        if (name.toLowerCase() === 'content-length')
          return contentLength ?? null;
        return null;
      },
    },
    body,
  } as unknown as Response;
}

function artifactResponse(body: string, contentType?: string): Response {
  return streamingArtifactResponse(
    [new TextEncoder().encode(body)],
    contentType,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('findAstraPublication', () => {
  it('indexes the SDK document and rejoins MyST-rewritten artifact URLs', () => {
    const found = findAstraPublication(publicationTree());
    expect(found?.publication).toStrictEqual(publication);
    expect(found?.index.recordByPath.get(OUTPUT_PATH)?.id).toBe('plot');
    expect(found?.resources.get(OUTPUT_PATH)).toEqual({
      outputPath: OUTPUT_PATH,
      cacheToken: 'plot-token',
      path: 'results/baseline/plot.png',
      url: ARTIFACT_URL,
    });
  });

  it('ignores a stale resource whose cache token does not match the SDK binding', () => {
    expect(
      findAstraPublication(
        publicationTree({ cacheToken: 'stale' }),
      )?.resources.has(OUTPUT_PATH),
    ).toBe(false);
  });

  it('accepts only static links from the dedicated resource carrier', () => {
    expect(
      findAstraPublication(publicationTree({ staticResource: false }))
        ?.resources.size,
    ).toBe(0);
  });

  it('rejects active URL schemes from rewritten resource links', () => {
    expect(
      findAstraPublication(
        publicationTree({ artifactUrl: 'javascript:alert(1)' }),
      )?.resources.has(OUTPUT_PATH),
    ).toBe(false);
    expect(
      findAstraPublication(
        publicationTree({ artifactUrl: 'data:image/png;base64,AA==' }),
      )?.resources.has(OUTPUT_PATH),
    ).toBe(false);
    expect(
      findAstraPublication(
        publicationTree({ artifactUrl: '/\\evil.example/plot.png' }),
      )?.resources.has(OUTPUT_PATH),
    ).toBe(false);
  });

  it('requires a bundle div and consumes resources only from sibling divs', () => {
    const wrongElement = publicationTree();
    const wrongElementChildren = wrongElement.children as GenericNode[];
    wrongElementChildren[0].type = 'section';
    expect(findAstraPublication(wrongElement)).toBeUndefined();

    const nestedResources = publicationTree();
    const nestedChildren = nestedResources.children as GenericNode[];
    const resources = nestedChildren.pop() as GenericNode;
    nestedChildren.push({ type: 'section', children: [resources] });
    expect(findAstraPublication(nestedResources)?.resources.size).toBe(0);
  });

  it('accepts a bundle with no bindings and no resource carrier', () => {
    const tree = publicationTree({
      publication: {
        ...publication,
        bundle: { ...publication.bundle, bindings: [] },
      },
    });
    (tree.children as GenericNode[]).pop();

    const found = findAstraPublication(tree);
    expect(found?.publication.bundle.bindings).toEqual([]);
    expect(found?.resources.size).toBe(0);
  });

  it('rejects unsupported and invalid carrier data without throwing', () => {
    expect(findAstraPublication(undefined)).toBeUndefined();
    expect(
      findAstraPublication(
        publicationTree({
          publication: {
            ...publication,
            schemaVersion: 'astra-publication-bundle.v2',
          },
        }),
      ),
    ).toBeUndefined();
    expect(
      findAstraPublication(publicationTree({ activeAnalysisPath: 'missing' })),
    ).toBeUndefined();
    expect(
      findAstraPublication(
        publicationTree({
          publication: {
            ...publication,
            bundle: {
              ...publication.bundle,
              bindings: [{ outputPath: OUTPUT_PATH, cacheToken: 'plot-token' }],
            },
          },
        }),
      ),
    ).toBeUndefined();
    expect(
      findAstraPublication(
        publicationTree({
          publication: {
            ...publication,
            bundle: {
              ...publication.bundle,
              document: {
                ...publication.bundle.document,
                analysis: {
                  ...publication.bundle.document.analysis,
                  outputs: undefined,
                },
              },
            },
          },
        }),
      ),
    ).toBeUndefined();

    const [firstOutput, ...otherOutputs] =
      publication.bundle.document.analysis.outputs;
    expect(
      findAstraPublication(
        publicationTree({
          publication: {
            ...publication,
            bundle: {
              ...publication.bundle,
              document: {
                ...publication.bundle.document,
                analysis: {
                  ...publication.bundle.document.analysis,
                  outputs: [
                    { ...firstOutput, label: { malformed: true } },
                    ...otherOutputs,
                  ],
                },
              },
            },
          },
        }),
      ),
    ).toBeUndefined();
  });
});

describe('AstraPublicationProvider', () => {
  it('opens astra-ui RecordDialog from a canonical inline reference', () => {
    renderReference();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open output details: Summary plot',
      }),
    );

    const dialog = screen.getByRole('dialog');
    const dialogScope = dialog.parentElement;
    expect(dialog).toHaveClass('astra-dialog');
    expect(dialog).not.toHaveClass('astra-ui');
    expect(dialogScope).toHaveClass(
      'lightcone-brand',
      'astra-ui',
      'astra-publication-dialog-scope',
    );
    expect(dialog.closest('.astra-ui')).toBe(dialogScope);
    expect(
      screen.getByRole('heading', { name: 'Summary plot' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Summary plot' })).toHaveAttribute(
      'src',
      ARTIFACT_URL,
    );
  });

  it('is DOM-transparent so upstream grid children remain direct siblings', () => {
    const { container } = renderReference();
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.tagName).toBe('P');
    expect(container.querySelector('.astra-publication-scope')).toBeNull();
  });

  it('reports a missing rewritten artifact resource', () => {
    renderReference(publicationTree({ cacheToken: 'stale' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open output details: Summary plot',
      }),
    );

    expect(
      screen.getByText('The rewritten artifact resource is not available.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('distinguishes an unmaterialized output from a missing resource', () => {
    const pendingPath = 'outputs.pending';
    const pendingPublication = {
      ...publication,
      bundle: {
        ...publication.bundle,
        document: {
          ...publication.bundle.document,
          analysis: {
            ...publication.bundle.document.analysis,
            outputs: [
              ...publication.bundle.document.analysis.outputs,
              {
                id: 'pending',
                label: 'Pending plot',
                kind: 'output' as const,
                type: 'figure' as const,
                format: 'png',
                active: true,
                canonicalPath: pendingPath,
                provenance: { inputPaths: [], decisionPaths: [] },
              },
            ],
          },
        },
      },
    };
    renderReference(
      publicationTree({ publication: pendingPublication }),
      referenceNodeFor(pendingPath, 'the pending plot'),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open output details: Pending plot',
      }),
    );

    expect(
      screen.getByText('This output has not been materialized.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('The rewritten artifact resource is not available.'),
    ).not.toBeInTheDocument();
  });

  it('loads bounded CSV tables through astra-ui preview helpers', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        artifactResponse('name,value\nalpha,1\n', 'text/csv; charset=utf-8'),
      );
    renderReference(
      publicationTree(),
      referenceNodeFor(TABLE_PATH, 'the summary table'),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open output details: Summary table',
      }),
    );

    expect(
      await screen.findByRole('columnheader', { name: 'name' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'alpha' })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      TABLE_URL,
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it('loads bounded JSON metrics through astra-ui preview helpers', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        artifactResponse('{"value":42,"unit":"km"}', 'application/json'),
      );
    renderReference(
      publicationTree(),
      referenceNodeFor(METRIC_PATH, 'the fit score'),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open output details: Fit score',
      }),
    );

    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(screen.getByText('km')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      METRIC_URL,
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it('rejects missing and unexpected text media types', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(artifactResponse('name,value\nalpha,1\n'));
    const first = renderReference(
      publicationTree(),
      referenceNodeFor(TABLE_PATH, 'the summary table'),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open output details: Summary table',
      }),
    );
    expect(
      await screen.findByText(
        'The artifact response has an unexpected media type.',
      ),
    ).toBeInTheDocument();

    first.unmount();
    fetch.mockResolvedValue(
      artifactResponse('name,value\nalpha,1\n', 'application/octet-stream'),
    );
    renderReference(
      publicationTree(),
      referenceNodeFor(TABLE_PATH, 'the summary table'),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open output details: Summary table',
      }),
    );
    expect(
      await screen.findByText(
        'The artifact response has an unexpected media type.',
      ),
    ).toBeInTheDocument();
  });

  it('stops reading a streamed text response at the byte limit', async () => {
    const oversized = [new Uint8Array(700_000), new Uint8Array(700_000)];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      streamingArtifactResponse(oversized, 'text/csv'),
    );
    renderReference(
      publicationTree(),
      referenceNodeFor(TABLE_PATH, 'the summary table'),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open output details: Summary table',
      }),
    );

    expect(
      await screen.findByText('The artifact response is too large to preview.'),
    ).toBeInTheDocument();
  });

  it('does not fetch or image-render unsupported and oversized figures', () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const first = renderReference(
      publicationTree(),
      referenceNodeFor(PDF_PATH, 'the PDF plot'),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open output details: PDF plot',
      }),
    );
    expect(
      screen.getByText('This figure format has no safe browser preview.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();

    first.unmount();
    renderReference(
      publicationTree(),
      referenceNodeFor(LARGE_FIGURE_PATH, 'the large plot'),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open output details: Large plot',
      }),
    );
    expect(
      screen.getByText('This figure is too large to preview.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('defers color-scheme attributes until after hydration', () => {
    const markup = renderToString(
      referenceView(publicationTree(), referenceNode, Theme.dark),
    );
    expect(markup).not.toContain('data-lightcone-color-scheme');
    expect(markup).not.toContain('data-astra-color-scheme');

    const { container } = renderReference(
      publicationTree(),
      referenceNode,
      Theme.dark,
    );
    const inlineScope = container.querySelector(
      '.astra-publication-inline-scope',
    );
    expect(inlineScope).toHaveAttribute('data-lightcone-color-scheme', 'dark');
    expect(inlineScope).toHaveAttribute('data-astra-color-scheme', 'dark');
  });

  it('resets an open detail stack when publication identity changes', () => {
    const result = renderReference();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open output details: Summary plot',
      }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    result.rerender(referenceView(publicationTree()));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('preserves the upstream span id and inline style contract', () => {
    const node = {
      ...referenceNode,
      html_id: 'summary-reference',
      style: { color: 'rgb(12, 34, 56)' },
    };
    renderReference(publicationTree(), node);
    const wrapper = screen
      .getByRole('button', {
        name: 'Open output details: Summary plot',
      })
      .closest('span');
    expect(wrapper).toHaveAttribute('id', 'summary-reference');
    expect(wrapper).toHaveStyle({ color: 'rgb(12, 34, 56)' });
  });

  it('keeps the neutral inline fallback when no publication resolves', () => {
    renderReference({ type: 'root', children: [] });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('the summary plot')).toHaveClass('astra-ref');
  });
});
