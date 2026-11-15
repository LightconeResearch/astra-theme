import {
  indexResolvedAnalysis,
  type ResolvedAnalysis,
  type StatusReport,
} from '@astra-spec/sdk/reports';
import type { AstraPublication } from '../../src/publication/AstraPublicationProvider';

export const TEST_DOI = '10.1051/0004-6361/202039070';
export type Mutable<T> = T extends readonly (infer U)[]
  ? Mutable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: Mutable<T[K]> }
    : T;
export type TestPublication = Omit<AstraPublication, 'document' | 'status'> & {
  document: Mutable<ResolvedAnalysis>;
  status: Mutable<StatusReport>;
};

export function makePublication(
  options: { doi?: string } = {},
): TestPublication {
  const document: Mutable<ResolvedAnalysis> = {
    schema_version: 'astra-tools.resolved-analysis.v1',
    spec_version: '0.1.0',
    notes: [],
    analyses: [
      {
        key: '',
        folder: '',
        label: 'Demo',
        tags: [],
        declares: { calibration: 'calibration' },
        inputs: [
          {
            ref: 'inputs.shear_catalog',
            path: 'data/shear.csv',
            label: 'Shear catalog',
            tags: [],
          },
        ],
        outputs: [
          {
            ref: 'outputs.sigma8_metric',
            label: 'sigma8 metric',
            type: 'metric',
            format: 'json',
            description: 'The recovered sigma8.',
            decisions: [],
            tags: [],
          },
          {
            ref: 'outputs.shear_plot',
            label: 'Shear correlation plot',
            type: 'figure',
            format: 'png',
            decisions: ['decisions.cov_source'],
            tags: [],
          },
        ],
        decisions: [
          {
            ref: 'decisions.cov_source',
            label: 'Covariance source',
            tags: [],
            rationale: 'Analytic covariance is fastest and validated here.',
            options: [
              {
                id: 'analytic',
                label: 'Analytic',
                tags: [],
                insights: ['prior_insights.kids_s8_low'],
              },
              { id: 'jackknife', label: 'Jackknife', tags: [], insights: [] },
            ],
          },
        ],
        findings: [
          {
            kind: 'finding',
            ref: 'findings.s8_consistent',
            label: 'S8 consistent with Planck',
            tags: [],
            claim: 'The recovered S8 is consistent with the Planck 2018 value.',
            scope: 'All tomographic bins.',
            evidence: [
              {
                artifact: 'shear_plot',
                cites: ['shear_plot#default', 'shear_plot#alternate'],
                quote: {
                  exact: 'The recovered band sits on the Planck prediction.',
                },
              },
            ],
          },
        ],
        prior_insights: [
          {
            kind: 'prior_insight',
            ref: 'prior_insights.kids_s8_low',
            label: 'KiDS S8 low',
            tags: [],
            claim: 'KiDS reported a lower S8.',
            evidence: options.doi
              ? [
                  {
                    doi: options.doi,
                    quote: { exact: 'S8 is lower than Planck.' },
                  },
                ]
              : [],
          },
        ],
        universes: [
          {
            ref: 'universes.default',
            label: 'Default',
            selection: { 'decisions.cov_source': 'analytic' },
            tags: [],
          },
          {
            ref: 'universes.alternate',
            label: 'Alternate',
            selection: { 'decisions.cov_source': 'jackknife' },
            tags: [],
          },
        ],
      },
      {
        key: 'calibration',
        folder: 'calibration',
        label: 'Calibration',
        tags: [],
        description: 'Shear calibration sub-analysis.',
        declares: { parent: '' },
        inputs: [],
        outputs: [],
        decisions: [],
        findings: [],
        prior_insights: [],
        universes: [],
      },
    ],
    results: ['default', 'alternate'].flatMap((universe) => [
      {
        id: `sigma8_metric#${universe}`,
        output: 'outputs.sigma8_metric',
        universe: `universes.${universe}`,
        inputs: [{ entry: 'shear_catalog', input: 'inputs.shear_catalog' }],
        places: [
          {
            address: `sigma8_metric#${universe}`,
            record_path: `.astra/records/${universe}/sigma8_metric.json`,
            file_path: `results/${universe}/sigma8_metric.json`,
          },
        ],
      },
      {
        id: `shear_plot#${universe}`,
        output: 'outputs.shear_plot',
        universe: `universes.${universe}`,
        inputs: [],
        places: [
          {
            address: `shear_plot#${universe}`,
            record_path: `.astra/records/${universe}/shear_plot.json`,
            file_path: `results/${universe}/shear_plot.png`,
          },
        ],
      },
    ]),
  };
  const status: Mutable<StatusReport> = {
    schema_version: 'astra-tools.status-report.v1',
    inputs: {},
    evidence: [],
    statuses: Object.fromEntries(
      document.results.map((result) => [
        result.id,
        {
          state: 'missing' as const,
          why: [],
          stale_inputs: [],
          bytes: { state: 'present' as const },
        },
      ]),
    ),
  };
  return {
    document,
    status,
    index: indexResolvedAnalysis(document),
    activeAnalysis: document.analyses[0]!,
    universe: 'universes.default',
    resources: {
      'shear_plot#default': { cacheToken: 'plot-v1' },
      'shear_plot#alternate': { cacheToken: 'plot-v2' },
    },
    artifactUrls: new Map([
      ['shear_plot#default', '/myst-assets/shear_plot.png'],
      ['shear_plot#alternate', '/myst-assets/shear_plot-alternate.png'],
    ]),
    placedIdentifiers: new Set(),
  };
}

export function publicationEnvelope(
  publication: AstraPublication = makePublication(),
  overrides: Record<string, unknown> = {},
) {
  return {
    schemaVersion: 'astra-publication-bundle.v2',
    activeAnalysisKey: publication.activeAnalysis.key,
    universe: publication.universe,
    analysis: publication.document,
    status: publication.status,
    resources: publication.resources,
    ...overrides,
  };
}
