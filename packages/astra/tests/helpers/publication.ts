import {
  RESOLVED_ANALYSIS_SCHEMA_VERSION,
  type ResolvedAnalysisBundle,
} from '@astra-spec/sdk';
import type { GenericNode } from 'myst-common';

import {
  ASTRA_PUBLICATION_SCHEMA_VERSION,
  type AstraPublicationBundleV1,
} from '../../src/publication/AstraPublicationProvider';

export const OUTPUT_PATH = 'outputs.plot';
export const ARTIFACT_URL = '/myst_assets/plot-a1b2.png';
export const TABLE_PATH = 'outputs.summary';
export const TABLE_URL = '/myst_assets/summary-a1b2.csv';
export const METRIC_PATH = 'outputs.score';
export const METRIC_URL = '/myst_assets/score-a1b2.json';
export const PDF_PATH = 'outputs.pdf_plot';
export const PDF_URL = '/myst_assets/pdf-plot-a1b2.pdf';
export const LARGE_FIGURE_PATH = 'outputs.large_plot';
export const LARGE_FIGURE_URL = '/myst_assets/large-plot-a1b2.png';

export const bundle: ResolvedAnalysisBundle = {
  document: {
    schemaVersion: RESOLVED_ANALYSIS_SCHEMA_VERSION,
    universe: {
      universeId: 'baseline',
      availableUniverseIds: ['baseline'],
      source: 'explicit',
    },
    analysis: {
      version: '1.0',
      name: 'Example analysis',
      canonicalPath: '$',
      inputs: [],
      outputs: [
        {
          id: 'plot',
          label: 'Summary plot',
          kind: 'output',
          type: 'figure',
          format: 'png',
          active: true,
          canonicalPath: OUTPUT_PATH,
          provenance: { inputPaths: [], decisionPaths: [] },
          artifact: { byteSize: 128 },
        },
        {
          id: 'summary',
          label: 'Summary table',
          kind: 'output',
          type: 'table',
          format: 'csv',
          active: true,
          canonicalPath: TABLE_PATH,
          provenance: { inputPaths: [], decisionPaths: [] },
          artifact: { byteSize: 64 },
        },
        {
          id: 'score',
          label: 'Fit score',
          kind: 'output',
          type: 'metric',
          format: 'json',
          active: true,
          canonicalPath: METRIC_PATH,
          provenance: { inputPaths: [], decisionPaths: [] },
          artifact: { byteSize: 32 },
        },
        {
          id: 'pdf_plot',
          label: 'PDF plot',
          kind: 'output',
          type: 'figure',
          format: 'pdf',
          active: true,
          canonicalPath: PDF_PATH,
          provenance: { inputPaths: [], decisionPaths: [] },
          artifact: { byteSize: 256 },
        },
        {
          id: 'large_plot',
          label: 'Large plot',
          kind: 'output',
          type: 'figure',
          format: 'png',
          active: true,
          canonicalPath: LARGE_FIGURE_PATH,
          provenance: { inputPaths: [], decisionPaths: [] },
          artifact: { byteSize: 30 * 1024 * 1024 },
        },
      ],
      decisions: [],
      prior_insights: [],
      findings: [],
      analyses: [],
    },
  },
  bindings: [
    {
      outputPath: OUTPUT_PATH,
      path: 'results/baseline/plot.png',
      cacheToken: 'plot-token',
    },
    {
      outputPath: TABLE_PATH,
      path: 'results/baseline/summary.csv',
      cacheToken: 'table-token',
    },
    {
      outputPath: METRIC_PATH,
      path: 'results/baseline/score.json',
      cacheToken: 'metric-token',
    },
    {
      outputPath: PDF_PATH,
      path: 'results/baseline/pdf-plot.pdf',
      cacheToken: 'pdf-token',
    },
    {
      outputPath: LARGE_FIGURE_PATH,
      path: 'results/baseline/large-plot.png',
      cacheToken: 'large-token',
    },
  ],
};

export const publication: AstraPublicationBundleV1 = {
  schemaVersion: ASTRA_PUBLICATION_SCHEMA_VERSION,
  activeAnalysisPath: '$',
  bundle,
};

export function publicationTree(
  overrides: {
    publication?: unknown;
    cacheToken?: string;
    activeAnalysisPath?: string;
    staticResource?: boolean;
    artifactUrl?: string;
  } = {},
): GenericNode {
  const carrier = {
    ...publication,
    ...(overrides.activeAnalysisPath
      ? { activeAnalysisPath: overrides.activeAnalysisPath }
      : {}),
  };
  return {
    type: 'root',
    children: [
      {
        type: 'div',
        class: 'astra-publication-bundle',
        data: { astraPublication: overrides.publication ?? carrier },
        children: [],
      },
      {
        type: 'div',
        class: 'astra-publication-resources',
        children: [
          [
            OUTPUT_PATH,
            overrides.artifactUrl ?? ARTIFACT_URL,
            overrides.cacheToken ?? 'plot-token',
          ],
          [TABLE_PATH, TABLE_URL, 'table-token'],
          [METRIC_PATH, METRIC_URL, 'metric-token'],
          [PDF_PATH, PDF_URL, 'pdf-token'],
          [LARGE_FIGURE_PATH, LARGE_FIGURE_URL, 'large-token'],
        ].map(([outputPath, url, cacheToken]) => ({
          type: 'link',
          url,
          static: overrides.staticResource ?? true,
          data: {
            astraArtifact: {
              outputPath,
              cacheToken,
            },
          },
          children: [{ type: 'text', value: outputPath }],
        })),
      },
    ],
  } as GenericNode;
}

export function referenceNodeFor(
  canonicalPath: string,
  label: string,
): GenericNode {
  return {
    type: 'span',
    class: 'astra-ref astra-ref--output',
    data: { astra: { canonicalPath } },
    children: [
      { type: 'text', value: label, key: `reference-${canonicalPath}` },
    ],
  };
}

export const referenceNode = referenceNodeFor(OUTPUT_PATH, 'the summary plot');
