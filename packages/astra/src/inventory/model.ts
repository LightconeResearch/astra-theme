import { decisionEvidenceIds } from '../store/decisionEvidence';
import type {
  InventoryKind,
  InventoryRecord,
  InventoryScope,
  InventorySnapshot,
} from './types';

export interface LocatedInventoryRecord {
  record: InventoryRecord;
  scope: InventoryScope;
}

/**
 * Read-only indexes over one inventory snapshot. Components receive this model
 * instead of repeatedly scanning every scope for the same records.
 */
export interface InventoryModel {
  snapshot: InventorySnapshot;
  scopeById: ReadonlyMap<string, InventoryScope>;
  scopeByPath: ReadonlyMap<string, InventoryScope>;
  recordByPath: ReadonlyMap<string, LocatedInventoryRecord>;
  recordsById: ReadonlyMap<string, readonly LocatedInventoryRecord[]>;
}

export function createInventoryModel(snapshot: InventorySnapshot): InventoryModel {
  const scopeById = new Map(snapshot.scopes.map((scope) => [scope.id, scope]));
  const scopeByPath = new Map(snapshot.scopes.map((scope) => [scope.path, scope]));
  const recordByPath = new Map<string, LocatedInventoryRecord>();
  const recordsById = new Map<string, LocatedInventoryRecord[]>();

  for (const scope of snapshot.scopes) {
    for (const record of scope.records) {
      const located = { record, scope };
      recordByPath.set(record.path, located);
      const matches = recordsById.get(record.id) ?? [];
      matches.push(located);
      recordsById.set(record.id, matches);
    }
  }

  return { snapshot, scopeById, scopeByPath, recordByPath, recordsById };
}

export function getInventoryScope(
  model: InventoryModel,
  scopeId: string,
): InventoryScope | undefined {
  return model.scopeById.get(scopeId);
}

export function inventoryRecordsOfKind(
  scope: InventoryScope,
  kind: InventoryKind,
): InventoryRecord[] {
  return scope.records.filter((record) => record.kind === kind);
}

export function inventoryRecordTitle(record: InventoryRecord): string {
  return record.label ?? record.id;
}

export function selectedOptionLabel(record: InventoryRecord): string {
  if (!record.selected) return 'Not selected';
  return record.options?.[record.selected] ?? record.selected;
}

/** Root inventory views include descendants; a sub-analysis stays local. */
export function inventoryScopesForView(
  model: InventoryModel,
  scope: InventoryScope,
): InventoryScope[] {
  return scope.parent ? [scope] : model.snapshot.scopes;
}

export function inventoryScopeForRecord(
  model: InventoryModel,
  record: InventoryRecord,
  fallback?: InventoryScope,
): InventoryScope | undefined {
  return model.recordByPath.get(record.path)?.scope ?? fallback;
}

/** Resolve local ids, fully-qualified ASTRA paths, and scope-qualified ids. */
export function resolveInventoryRecordReference(
  model: InventoryModel,
  scope: InventoryScope,
  reference: string,
): LocatedInventoryRecord | undefined {
  const exact = model.recordByPath.get(reference);
  if (exact) return exact;

  const parts = reference.split('.');
  if (parts.length > 1) {
    const id = parts[parts.length - 1] ?? reference;
    const scopePath = parts.slice(0, -1).join('.');
    if (scopePath === 'inputs' || scopePath === 'outputs') {
      const local = scope.records.find((record) => record.id === id);
      if (local) return { record: local, scope };
    }
    const owner = model.scopeByPath.get(scopePath) ?? model.scopeById.get(scopePath);
    const qualified = owner?.records.find((record) => record.id === id);
    if (owner && qualified) return { record: qualified, scope: owner };
  }

  const local = scope.records.find((record) => record.id === reference);
  if (local) return { record: local, scope };
  const matches = model.recordsById.get(reference) ?? [];
  return matches.length === 1 ? matches[0] : undefined;
}

export function inventoryDecisionInsights(
  _model: InventoryModel,
  scope: InventoryScope,
  decision: InventoryRecord,
): InventoryRecord[] {
  const insights = new Map(
    inventoryRecordsOfKind(scope, 'prior_insight')
      .map((record) => [record.id, record] as const),
  );
  return decisionEvidenceIds(decision)
    .map((id) => insights.get(id))
    .filter((record): record is InventoryRecord => record != null);
}

export function inventoryInformedDecisions(
  model: InventoryModel,
  scope: InventoryScope,
  insight: InventoryRecord,
): InventoryRecord[] {
  const decisions = new Map<string, InventoryRecord>();
  for (const candidate of inventoryScopesForView(model, scope)) {
    for (const decision of inventoryRecordsOfKind(candidate, 'decision')) {
      if (
        decisionEvidenceIds(decision).includes(insight.id)
        && !decisions.has(decision.path)
      ) {
        decisions.set(decision.path, decision);
      }
    }
  }
  return [...decisions.values()];
}
