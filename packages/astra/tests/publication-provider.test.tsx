import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ResolvedAnalysisBundle, ResolvedOutput } from '@astra-spec/sdk';
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
import { makePublication } from './helpers/publication';

const bundle: ResolvedAnalysisBundle = {
  document: {
    schemaVersion: 'astra-resolved-analysis.v1',
    universe: {
      universeId: 'default',
      availableUniverseIds: [],
      source: 'none',
    },
    analysis: {
      version: '1',
      name: 'Provider publication',
      canonicalPath: '$',
      inputs: [],
      outputs: [],
      decisions: [],
      prior_insights: [],
      findings: [],
      analyses: [],
    },
  },
  bindings: [],
};

const mdast = {
  type: 'root',
  children: [
    {
      type: 'div',
      class: 'astra-publication-bundle',
      data: {
        astraPublication: {
          schemaVersion: 'astra-publication-bundle.v1',
          activeAnalysisPath: '$',
          bundle,
        },
      },
    },
  ],
} as GenericNode;

function Probe() {
  const publication = useAstraPublication();
  return (
    <output data-testid="publication">
      {publication?.activeAnalysis.canonicalPath ?? 'neutral'}
    </output>
  );
}

function DetailProbe() {
  const publication = useAstraPublication();
  const details = useAstraPublicationDetails();
  const record = publication?.index.recordByPath.get('decisions.cov_source');
  const analysis = publication?.index.analysisByRecordPath.get(
    'decisions.cov_source',
  );
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
      activeAnalysis: { canonicalPath: 'explicit' },
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

    expect(screen.getByTestId('publication')).toHaveTextContent('$');
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

  it('keeps shared unavailable states for visual artifacts the host cannot render', () => {
    const publication = {
      ...makePublication(),
      artifactUrls: new Map<string, string>(),
    };
    const figure = publication.index.recordByPath.get('outputs.shear_plot');
    const metric = publication.index.recordByPath.get('outputs.sigma8_metric');
    expect(figure?.kind).toBe('output');
    expect(metric?.kind).toBe('output');
    const renderArtifact = createAstraArtifactRenderer(publication);

    const { container, rerender } = render(
      <>{renderArtifact(figure as ResolvedOutput, { compact: true })}</>,
    );
    expect(container.querySelector('[data-slot="artifact-preview"]')).toHaveTextContent(
      'This host has not supplied an artifact preview.',
    );

    const table = { ...figure, type: 'table' } as ResolvedOutput;
    rerender(<>{renderArtifact(table, { compact: false })}</>);
    expect(container.querySelector('[data-slot="artifact-preview"]')).toHaveTextContent(
      'This host has not supplied an artifact preview.',
    );
    expect(renderArtifact(metric as ResolvedOutput, { compact: false })).toBeNull();
  });

  it('uses the shared unavailable state when a verified figure fails to load', () => {
    const publication = makePublication();
    const figure = publication.index.recordByPath.get('outputs.shear_plot');
    expect(figure?.kind).toBe('output');
    const renderArtifact = createAstraArtifactRenderer(publication);

    const { container } = render(
      <>{renderArtifact(figure as ResolvedOutput, { compact: true })}</>,
    );
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('[data-slot="artifact-preview"]')).toHaveTextContent(
      'Figure preview unavailable',
    );
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
    expect(document.querySelectorAll('dialog[data-slot="dialog"]')).toHaveLength(1);

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
