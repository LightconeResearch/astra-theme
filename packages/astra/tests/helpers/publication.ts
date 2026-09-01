import {
  indexAnalysis,
  type ResolvedAnalysisBundle,
  type ResolvedAnalysisDocument,
} from '@astra-spec/sdk';

import type { AstraPublication } from '../../src/publication/AstraPublicationProvider';

export const TEST_DOI = '10.1051/0004-6361/202039070';

export function makePublication(options: { doi?: string } = {}): AstraPublication {
  const document: ResolvedAnalysisDocument = {
    schemaVersion: 'astra-resolved-analysis.v1',
    universe: {
      universeId: 'default',
      availableUniverseIds: [],
      source: 'none',
    },
    analysis: {
      version: '1',
      name: 'Demo',
      canonicalPath: '$',
      inputs: [
        {
          kind: 'input',
          canonicalPath: 'inputs.shear_catalog',
          id: 'shear_catalog',
          label: 'Shear catalog',
          type: 'data',
        },
      ],
      outputs: [
        {
          kind: 'output',
          canonicalPath: 'outputs.sigma8_metric',
          id: 'sigma8_metric',
          label: 'sigma8 metric',
          type: 'metric',
          format: 'json',
          description: 'The recovered sigma8.',
          active: true,
          provenance: { inputPaths: ['inputs.shear_catalog'], decisionPaths: [] },
          artifact: { byteSize: 64 },
        },
        {
          kind: 'output',
          canonicalPath: 'outputs.shear_plot',
          id: 'shear_plot',
          label: 'Shear correlation plot',
          type: 'figure',
          format: 'png',
          active: true,
          provenance: { inputPaths: [], decisionPaths: ['decisions.cov_source'] },
          artifact: { byteSize: 100 },
        },
      ],
      decisions: [
        {
          kind: 'decision',
          canonicalPath: 'decisions.cov_source',
          id: 'cov_source',
          label: 'Covariance source',
          rationale: 'Analytic covariance is fastest and validated here.',
          active: true,
          selectedOptionId: 'analytic',
          options: [
            {
              id: 'analytic',
              label: 'Analytic',
              resolvedInsightPaths: ['prior_insights.kids_s8_low'],
            },
            {
              id: 'jackknife',
              label: 'Jackknife',
              resolvedInsightPaths: [],
            },
          ],
        },
      ],
      findings: [
        {
          kind: 'finding',
          canonicalPath: 'findings.s8_consistent',
          id: 's8_consistent',
          label: 'S8 consistent with Planck',
          claim: 'The recovered S8 is consistent with the Planck 2018 value.',
          created_at: '2026-01-01',
          notes: 'Consistency holds across both binning choices.',
          scope: 'All tomographic bins.',
          evidence: [
            {
              id: 'plot',
              artifact: 'shear_plot',
              resolvedOutputPath: 'outputs.shear_plot',
              quote: { exact: 'The recovered band sits on the Planck prediction.' },
            },
          ],
        },
      ],
      prior_insights: [
        {
          kind: 'prior_insight',
          canonicalPath: 'prior_insights.kids_s8_low',
          id: 'kids_s8_low',
          label: 'KiDS S8 low',
          claim: 'KiDS reported a lower S8.',
          created_at: '2026-01-01',
          evidence: options.doi
            ? [
                {
                  id: 'paper',
                  doi: options.doi,
                  quote: { exact: 'S8 is lower than Planck.' },
                },
              ]
            : [],
        },
      ],
      analyses: [
        {
          id: 'calibration',
          name: 'Calibration',
          description: 'Shear calibration sub-analysis.',
          canonicalPath: 'calibration',
          inputs: [],
          outputs: [],
          decisions: [],
          findings: [],
          prior_insights: [],
          analyses: [],
        },
      ],
    },
  };
  const bundle: ResolvedAnalysisBundle = {
    document,
    bindings: [
      {
        outputPath: 'outputs.shear_plot',
        path: 'results/shear_plot.png',
        cacheToken: 'plot-v1',
      },
    ],
  };
  return {
    bundle,
    document,
    index: indexAnalysis(document),
    activeAnalysis: document.analysis,
    artifactUrls: new Map([
      ['outputs.shear_plot', '/myst-assets/shear_plot.png'],
    ]),
    placedIdentifiers: new Set(),
  };
}
