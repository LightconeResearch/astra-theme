import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { indexResolvedAnalysis, type Output } from '@astra-spec/sdk/reports';
import { ThemeProvider } from '@myst-theme/providers';
import type { GenericNode } from 'myst-common';
import { describe, expect, it } from 'vitest';

import {
  AstraPublicationProvider,
  createAstraArtifactRenderer,
  useAstraPublication,
  useAstraPublicationDetails,
  type AstraPublication,
} from '../src/publication/AstraPublicationProvider';
import { makePublication, publicationEnvelope } from './helpers/publication';

const mdast = {
  type: 'root',
  children: [
    {
      type: 'div',
      class: 'astra-publication-bundle',
      data: { astraPublication: publicationEnvelope() },
    },
  ],
} as GenericNode;

function Probe() {
  const publication = useAstraPublication();
  return (
    <output data-testid="publication">
      {publication ? publication.activeAnalysis.key || 'root' : 'neutral'}
    </output>
  );
}

function DetailProbe() {
  const publication = useAstraPublication();
  const details = useAstraPublicationDetails();
  const entry = publication?.index.elementByRef.get('decisions.cov_source');
  const record = entry?.collection === 'decisions' ? entry.element : undefined;
  const analysis = entry?.analysis;
  return (
    <button
      type="button"
      onClick={() => {
        if (record && analysis) details?.onOpenRecord(record, analysis);
      }}
    >
      Open details
    </button>
  );
}

function Host({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={null} setTheme={() => undefined}>
      {children}
    </ThemeProvider>
  );
}

describe('AstraPublicationProvider', () => {
  it('exposes an explicit publication without changing child DOM topology', () => {
    const publication = {
      activeAnalysis: { key: 'explicit' },
    } as AstraPublication;
    const { container } = render(
      <Host>
        <AstraPublicationProvider mdast={mdast} publication={publication}>
          <Probe />
        </AstraPublicationProvider>
      </Host>,
    );

    expect(screen.getByTestId('publication')).toHaveTextContent('explicit');
    expect(container.firstElementChild?.tagName).toBe('OUTPUT');
    expect(container.children).toHaveLength(1);
    expect(document.documentElement).toHaveClass('lightcone-brand');
  });

  it('decodes its mdast input for consumers', () => {
    render(
      <Host>
        <AstraPublicationProvider mdast={mdast}>
          <Probe />
        </AstraPublicationProvider>
      </Host>,
    );

    expect(screen.getByTestId('publication')).toHaveTextContent('root');
  });

  it('fails neutrally when no publication is available', () => {
    render(
      <Host>
        <AstraPublicationProvider>
          <Probe />
        </AstraPublicationProvider>
      </Host>,
    );

    expect(screen.getByTestId('publication')).toHaveTextContent('neutral');
  });

  it('omits unavailable compact artifacts while retaining full-detail states', () => {
    const publication = {
      ...makePublication(),
      artifactUrls: new Map<string, string>(),
    };
    const figure = publication.document.analyses[0]!.outputs[1];
    const metric = publication.document.analyses[0]!.outputs[0];
    expect(figure?.ref).toBe('outputs.shear_plot');
    expect(metric?.ref).toBe('outputs.sigma8_metric');
    const renderArtifact = createAstraArtifactRenderer(publication);

    const { container, rerender } = render(
      <>{renderArtifact(figure as Output, { compact: true })}</>,
    );
    expect(
      container.querySelector('[data-slot="artifact-preview"]'),
    ).toBeNull();

    const table = { ...figure, type: 'table' } as Output;
    rerender(<>{renderArtifact(table, { compact: false })}</>);
    expect(
      container.querySelector('[data-slot="artifact-preview"]'),
    ).toHaveTextContent('This output has no valid provenance record.');
    expect(renderArtifact(metric as Output, { compact: false })).toBeNull();
  });

  it('does not leak page-universe assets when the selected universe has no planned result', () => {
    const publication = makePublication();
    publication.document.results = publication.document.results.filter(
      (result) => result.id !== 'shear_plot#alternate',
    );
    publication.index = indexResolvedAnalysis(publication.document);
    const figure = publication.document.analyses[0]!.outputs[1]!;
    const renderArtifact = createAstraArtifactRenderer(publication);
    const { container } = render(
      <>
        {renderArtifact(figure, {
          compact: false,
          universeRef: 'universes.alternate',
        })}
      </>,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(
      container.querySelector('[data-slot="artifact-preview"]'),
    ).toHaveTextContent('No result is planned for this output in the selected universe.');
  });

  it('uses the shared unavailable state when a verified figure fails to load', () => {
    const publication = makePublication();
    publication.status.statuses['shear_plot#default']!.bytes = {
      state: 'absent',
    };
    const figure = publication.document.analyses[0]!.outputs[1];
    expect(figure?.ref).toBe('outputs.shear_plot');
    const renderArtifact = createAstraArtifactRenderer(publication);

    const { container } = render(
      <>{renderArtifact(figure as Output, { compact: true })}</>,
    );
    fireEvent.error(container.querySelector('img')!);
    expect(
      container.querySelector('[data-slot="artifact-preview"]'),
    ).toHaveTextContent('Figure preview unavailable');
  });

  it('owns one detail surface and clears it when the publication changes', async () => {
    const first = makePublication();
    const { rerender } = render(
      <Host>
        <AstraPublicationProvider publication={first}>
          <DetailProbe />
        </AstraPublicationProvider>
      </Host>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open details' }));
    expect(
      await screen.findByRole('dialog', { name: 'Covariance source' }),
    ).toBeVisible();
    expect(
      document.querySelectorAll('dialog[data-slot="dialog"]'),
    ).toHaveLength(1);

    rerender(
      <Host>
        <AstraPublicationProvider publication={makePublication()}>
          <DetailProbe />
        </AstraPublicationProvider>
      </Host>,
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Covariance source' }),
      ).not.toBeInTheDocument();
    });
  });
});
