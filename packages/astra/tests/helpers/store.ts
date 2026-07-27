import type { ResolvedStore } from '@astra-spec/store-types';
import type {
  InventoryRecord,
  InventorySnapshot,
} from '../../src/inventory/types';

/** A populated ResolvedStore for component rendering tests. */
export function makeStore(): ResolvedStore {
  return {
    analysis: { id: 'demo', name: 'Demo', slug: 'demo' },
    inputs: {
      shear_catalog: {
        id: 'shear_catalog',
        path: 'inputs.shear_catalog',
        kind: 'input',
        label: 'Shear catalog',
      },
    },
    outputs: {
      sigma8_metric: {
        id: 'sigma8_metric',
        path: 'outputs.sigma8_metric',
        kind: 'output',
        label: 'sigma8 metric',
        type: 'metric',
        description: 'The recovered sigma8.',
        metric: { value: 0.811, uncertainty: 0.012, unit: 'dimensionless' },
      },
      shear_plot: {
        id: 'shear_plot',
        path: 'outputs.shear_plot',
        kind: 'output',
        label: 'Shear correlation plot',
        type: 'figure',
        resolved_path: '/results/shear_plot.png',
      },
    },
    decisions: {
      cov_source: {
        id: 'cov_source',
        path: 'decisions.cov_source',
        kind: 'decision',
        label: 'Covariance source',
        rationale: 'Analytic covariance is fastest and validated here.',
        selected: 'analytic',
        options: { analytic: 'Analytic', jackknife: 'Jackknife' },
        option_insights: { analytic: ['kids_s8_low'] },
        active: true,
      },
    },
    findings: {
      s8_consistent: {
        id: 's8_consistent',
        path: 'findings.s8_consistent',
        kind: 'finding',
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
        path: 'prior_insights.kids_s8_low',
        kind: 'prior_insight',
        label: 'KiDS S8 low',
        claim: 'KiDS reported a lower S8.',
      },
    },
    subanalyses: {
      calibration: {
        id: 'calibration',
        path: 'analyses.calibration',
        kind: 'analysis',
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

export function makeInventorySnapshot(): InventorySnapshot {
  const store = makeStore();
  const records = [
    ...Object.values(store.outputs),
    ...Object.values(store.decisions),
    ...Object.values(store.inputs),
    ...Object.values(store.findings),
    ...Object.values(store.prior_insights),
  ] as InventoryRecord[];
  return {
    version: 1,
    analysis: { id: 'demo', name: 'Demo' },
    scopes: [{
      id: 'root',
      path: 'demo',
      name: 'Demo',
      children: [],
      records,
    }],
  };
}
