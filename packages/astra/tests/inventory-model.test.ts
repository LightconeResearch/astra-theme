import { describe, expect, it } from 'vitest';
import {
  createInventoryModel,
  inventoryDecisionInsights,
  inventoryInformedDecisions,
  inventoryRecordsOfKind,
  resolveInventoryRecordReference,
} from '../src/inventory/model';
import type { InventorySnapshot } from '../src/inventory/types';

const snapshot: InventorySnapshot = {
  version: 1,
  fixture: {
    label: 'Model fixture',
    source: 'test',
    frozen: '2026-07-22',
    disclaimer: 'Test data.',
  },
  analysis: { id: 'root', name: 'Root', description: 'Test analysis.' },
  scopes: [
    {
      id: 'root',
      path: '',
      name: 'Root',
      children: ['child'],
      records: [
        { id: 'catalog', path: 'inputs.catalog', kind: 'input' },
        {
          id: 'method',
          path: 'decisions.method',
          kind: 'decision',
          selected: 'baseline',
          options: { baseline: 'Baseline' },
          option_insights: { baseline: ['support'] },
        },
        {
          id: 'support',
          path: 'prior_insights.support',
          kind: 'prior_insight',
          claim: 'The baseline is supported.',
        },
      ],
    },
    {
      id: 'child',
      path: 'child',
      name: 'Child',
      parent: 'root',
      children: [],
      records: [
        { id: 'catalog', path: 'child.inputs.catalog', kind: 'input' },
        {
          id: 'support',
          path: 'child.prior_insights.support',
          kind: 'prior_insight',
          claim: 'A child-scoped copy must not replace the root insight.',
        },
        { id: 'result', path: 'child.outputs.result', kind: 'output' },
      ],
    },
  ],
  diagnostics: [],
};

describe('inventory model', () => {
  it('indexes scopes and records once and selects records by kind', () => {
    const model = createInventoryModel(snapshot);
    const root = model.scopeById.get('root')!;

    expect(model.recordByPath.get('child.outputs.result')?.scope.id).toBe('child');
    expect(model.recordsById.get('catalog')).toHaveLength(2);
    expect(model.recordsById.get('support')).toHaveLength(2);
    expect(inventoryRecordsOfKind(root, 'decision').map((record) => record.id)).toEqual([
      'method',
    ]);
  });

  it('resolves exact, local collection, and unique references without guessing ambiguities', () => {
    const model = createInventoryModel(snapshot);
    const root = model.scopeById.get('root')!;
    const child = model.scopeById.get('child')!;

    expect(resolveInventoryRecordReference(model, root, 'child.outputs.result')?.record.id)
      .toBe('result');
    expect(resolveInventoryRecordReference(model, child, 'outputs.result')?.record.path)
      .toBe('child.outputs.result');
    expect(resolveInventoryRecordReference(model, child, 'result')?.record.path)
      .toBe('child.outputs.result');
    expect(resolveInventoryRecordReference(model, root, 'catalog')?.record.path)
      .toBe('inputs.catalog');
  });

  it('keeps decision insights local when descendant scopes repeat insight ids', () => {
    const model = createInventoryModel(snapshot);
    const root = model.scopeById.get('root')!;
    const decision = root.records.find((record) => record.id === 'method')!;
    const insight = root.records.find((record) => record.id === 'support')!;

    expect(inventoryDecisionInsights(model, root, decision)).toEqual([insight]);
    expect(inventoryInformedDecisions(model, root, insight)).toEqual([decision]);
  });
});
