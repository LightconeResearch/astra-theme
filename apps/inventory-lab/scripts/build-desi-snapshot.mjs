import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(
  here,
  '../../../../desi-myst-proto/_build/site/content',
);
const outputPath = resolve(here, '../public/fixtures/desi.snapshot.json');
const fixtureProject = resolve(here, '../../../../desi-myst-proto');

function findStore(node) {
  if (!node || typeof node !== 'object') return undefined;
  if (node.identifier === 'astra-store' && node.data?.astra) {
    return node.data.astra;
  }
  for (const child of node.children ?? []) {
    const store = findStore(child);
    if (store) return store;
  }
  return undefined;
}

function loadStore(slug) {
  const page = JSON.parse(readFileSync(resolve(contentDir, `${slug}.json`), 'utf8'));
  const store = findStore(page.mdast);
  if (!store) throw new Error(`No ASTRA store found for ${slug}`);
  return store;
}

function loadSpec(relativePath) {
  return parse(readFileSync(resolve(fixtureProject, relativePath), 'utf8'));
}

const collectionKinds = {
  inputs: 'input',
  decisions: 'decision',
  outputs: 'output',
  findings: 'finding',
  prior_insights: 'prior_insight',
};

function recordsFor(store, scopePath, spec) {
  const decisionTags = new Map(
    Object.entries(spec.decisions ?? {}).map(([id, decision]) => [id, decision.tags ?? []]),
  );
  return Object.entries(collectionKinds).flatMap(([collection, kind]) =>
    Object.entries(store[collection] ?? {})
      .filter(([key]) => !key.includes('.'))
      .map(([key, value]) => {
        const path = [scopePath, collection, key].filter(Boolean).join('.');
        const resultPreview =
          value.type === 'figure' &&
          ['bao_fit_plot', 'bao_detection_plot', 'hubble_diagram_plot'].includes(key)
            ? `/fixtures/assets/${key}.png`
            : undefined;
        const tags = kind === 'decision' ? decisionTags.get(key) : undefined;
        return { ...value, id: key, path, kind, resultPreview, ...(tags?.length ? { tags } : {}) };
      }),
  );
}

const root = loadStore('index');
const reconstruction = loadStore('reconstruction');
const clustering = loadStore('clustering');
const rootSpec = loadSpec('astra.yaml');
const reconstructionSpec = loadSpec('analyses/reconstruction/astra.yaml');
const clusteringSpec = loadSpec('analyses/clustering/astra.yaml');

const snapshot = {
  version: 1,
  fixture: {
    label: 'DESI DR1 BAO — representative snapshot',
    source: 'EiffL/myst_proto',
    frozen: '2026-07-21',
    disclaimer:
      'Frontend design prototype. Representative static data; not a canonical ASTRA rendering. No YAML parsing, execution, or live backend.',
  },
  analysis: {
    id: 'desi_dr1_bao',
    name: root.analysis.name ?? 'DESI DR1 BAO Analysis',
    description:
      'Configuration-space baryon acoustic oscillation measurements across eight tracer-redshift bins.',
  },
  scopes: [
    {
      id: 'root',
      path: '',
      name: root.analysis.name ?? 'DESI DR1 BAO Analysis',
      children: ['reconstruction', 'clustering'],
      records: recordsFor(root, '', rootSpec),
    },
    {
      id: 'reconstruction',
      path: 'reconstruction',
      name: reconstruction.analysis.name ?? 'Reconstruction',
      parent: 'root',
      children: [],
      records: recordsFor(reconstruction, 'reconstruction', reconstructionSpec),
    },
    {
      id: 'clustering',
      path: 'clustering',
      name: clustering.analysis.name ?? 'Clustering',
      parent: 'root',
      children: [],
      records: recordsFor(clustering, 'clustering', clusteringSpec),
    },
  ],
  diagnostics: [],
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);

const assetDir = resolve(here, '../public/fixtures/assets');
mkdirSync(assetDir, { recursive: true });
for (const id of ['bao_fit_plot', 'bao_detection_plot', 'hubble_diagram_plot']) {
  copyFileSync(
    resolve(fixtureProject, `results/baseline/${id}/${id}.png`),
    resolve(assetDir, `${id}.png`),
  );
}
console.log(`Wrote ${outputPath}`);
