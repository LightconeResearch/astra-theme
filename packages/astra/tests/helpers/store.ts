import type { ResolvedStore } from '@astra-spec/store-types';

/** A populated ResolvedStore for component rendering tests. */
export function makeStore(): ResolvedStore {
  return {
    analysis: { id: 'demo', name: 'Demo', slug: 'demo' },
    inputs: {
      shear_catalog: { id: 'shear_catalog', label: 'Shear catalog' },
    },
    outputs: {
      sigma8_metric: {
        id: 'sigma8_metric',
        label: 'sigma8 metric',
        type: 'metric',
        description: 'The recovered sigma8.',
        metric: { value: 0.811, uncertainty: 0.012, unit: 'dimensionless' },
      },
      shear_plot: {
        id: 'shear_plot',
        label: 'Shear correlation plot',
        type: 'figure',
        resolved_path: '/results/shear_plot.png',
      },
    },
    decisions: {
      cov_source: {
        id: 'cov_source',
        label: 'Covariance source',
        rationale: 'Analytic covariance is fastest and validated here.',
        selected: 'analytic',
        options: { analytic: 'Analytic', jackknife: 'Jackknife' },
        option_insights: { analytic: ['kids_s8_low'] },
      },
    },
    findings: {
      s8_consistent: {
        id: 's8_consistent',
        label: 'S8 consistent with Planck',
        claim: 'The recovered S8 is consistent with the Planck 2018 value.',
        notes: 'Consistency holds across both binning choices.',
        scope: 'All tomographic bins.',
        evidence: [
          {
            artifact: 'shear_plot',
            quote: 'The recovered band sits on the Planck prediction.',
          },
        ],
      },
    },
    prior_insights: {
      kids_s8_low: {
        id: 'kids_s8_low',
        label: 'KiDS S8 low',
        claim: 'KiDS reported a lower S8.',
      },
    },
    subanalyses: {
      calibration: {
        id: 'calibration',
        name: 'Calibration',
        summary: 'Shear calibration sub-analysis.',
        url: '/calibration',
        decisions: 2,
        outputs: 3,
      },
    },
  };
}

/** An empty ResolvedStore (every table empty) — exercises graceful fallback. */
export function emptyStore(): ResolvedStore {
  return {
    analysis: { slug: 'demo' },
    inputs: {},
    outputs: {},
    decisions: {},
    findings: {},
    prior_insights: {},
    subanalyses: {},
  };
}
