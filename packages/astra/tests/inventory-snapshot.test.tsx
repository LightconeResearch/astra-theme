import { render, screen } from '@testing-library/react';
import {
  findInventorySnapshot,
  hasInventorySnapshot,
  InventoryExplorer,
} from '../src/inventory';

const snapshot = {
  version: 1,
  analysis: { id: 'analysis', name: 'Production analysis' },
  scopes: [
    {
      id: '',
      name: 'Production analysis',
      children: ['child'],
      records: [
        {
          id: 'figure',
          path: 'outputs.figure',
          kind: 'output',
          type: 'figure',
          label: 'Live figure',
          resolved_path: 'results/baseline/figure/figure.png',
        },
        {
          id: 'published_support',
          path: 'prior_insights.published_support',
          kind: 'prior_insight',
          claim: 'The published result supports this analysis.',
          evidence: [{
            doi: '10.1234/example',
            quote: 'The measured signal agrees with the prediction.',
            page: 7,
          }],
        },
      ],
    },
    {
      id: 'child',
      name: 'Child analysis',
      parent: '',
      children: [],
      records: [],
    },
  ],
};

function carrierTree(payload: unknown = snapshot) {
  return {
    type: 'root',
    children: [
      {
        type: 'div',
        identifier: 'astra-inventory',
        data: { astraInventory: payload },
        children: [],
      },
      {
        type: 'div',
        children: [
          {
            type: 'image',
            url: '/myst_assets_folder/figure.abc123.png',
            data: { astraInventoryAsset: 'outputs.figure' },
          },
        ],
      },
    ],
  };
}

test('extracts snapshot v1, rejoins image assets, and preserves paired evidence', () => {
  const resolved = findInventorySnapshot(carrierTree());
  expect(resolved?.scopes[0]).toMatchObject({ id: 'root', path: '' });
  expect(resolved?.scopes[1]).toMatchObject({
    id: 'child',
    path: 'child',
    parent: 'root',
  });
  expect(resolved?.scopes[0].records[0].resultPreview).toBe(
    '/myst_assets_folder/figure.abc123.png',
  );
  expect(resolved?.scopes[0].records[1]).toMatchObject({
    doi: '10.1234/example',
    quote: 'The measured signal agrees with the prediction.',
    page: 7,
  });
  expect(resolved?.scopes[0].records[1].evidence).toEqual([{
    doi: '10.1234/example',
    quote: 'The measured signal agrees with the prediction.',
    page: 7,
  }]);
  expect(hasInventorySnapshot(carrierTree())).toBe(true);
});

test('rejects absent, malformed, and unsupported inventory carriers', () => {
  expect(findInventorySnapshot(undefined)).toBeUndefined();
  expect(findInventorySnapshot(carrierTree({ version: 2 }))).toBeUndefined();
  expect(findInventorySnapshot(carrierTree({
    version: 1,
    analysis: { id: 'broken' },
    scopes: [],
  }))).toBeUndefined();
  const emptySnapshot = {
    version: 1,
    analysis: { id: 'broken', name: 'Broken' },
    scopes: [],
  };
  expect(findInventorySnapshot(carrierTree(emptySnapshot))).toBeUndefined();
  expect(hasInventorySnapshot(carrierTree(emptySnapshot))).toBe(false);
  expect(findInventorySnapshot(carrierTree({
    version: 1,
    analysis: { id: 'broken', name: 'Broken' },
    scopes: [{ id: '', name: 'Broken' }],
  }))).toBeUndefined();
  expect(findInventorySnapshot(carrierTree({
    version: 1,
    analysis: { id: 'broken', name: 'Broken' },
    scopes: [{
      id: '',
      name: 'Broken',
      children: [],
      records: [{ id: 'bad', path: 'bad', kind: 'unknown' }],
    }],
  }))).toBeUndefined();
  expect(findInventorySnapshot(carrierTree({
    ...snapshot,
    scopes: [
      snapshot.scopes[0],
      { ...snapshot.scopes[1], id: 'root' },
    ],
  }))).toBeUndefined();
});

test('keeps partial records usable after extraction', () => {
  const resolved = findInventorySnapshot(carrierTree())!;
  render(
    <InventoryExplorer
      snapshot={resolved}
      scopeId="root"
    />,
  );

  expect(screen.getByRole('button', { name: /Live figure/i })).toBeInTheDocument();
  expect(screen.getByRole('button', {
    name: /10\.1234\/example.*1 insight.*0 decisions/i,
  })).toBeInTheDocument();
});
