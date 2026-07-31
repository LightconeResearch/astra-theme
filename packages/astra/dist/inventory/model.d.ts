import type { InventoryKind, InventoryDecisionRecord, InventoryFindingRecord, InventoryInputRecord, InventoryInsightRecord, InventoryOutputRecord, InventoryRecord, InventoryScope, InventorySnapshot } from './types';
export interface LocatedInventoryRecord {
    record: InventoryRecord;
    scope: InventoryScope;
}
interface InventoryRecordByKind {
    input: InventoryInputRecord;
    decision: InventoryDecisionRecord;
    output: InventoryOutputRecord;
    finding: InventoryFindingRecord;
    prior_insight: InventoryInsightRecord;
}
export type InventoryRecordForKind<Kind extends keyof InventoryRecordByKind> = InventoryRecordByKind[Kind];
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
export declare function createInventoryModel(snapshot: InventorySnapshot): InventoryModel;
export declare function getInventoryScope(model: InventoryModel, scopeId: string): InventoryScope | undefined;
export declare function inventoryRecordsOfKind<Kind extends keyof InventoryRecordByKind>(scope: InventoryScope, kind: Kind): InventoryRecordForKind<Kind>[];
export declare function inventoryRecordTitle(record: InventoryRecord): string;
export declare function selectedOptionLabel(record: InventoryRecord): string;
/** Root inventory views include descendants; a sub-analysis stays local. */
export declare function inventoryScopesForView(model: InventoryModel, scope: InventoryScope): InventoryScope[];
export declare function inventoryScopeForRecord(model: InventoryModel, record: InventoryRecord, fallback?: InventoryScope): InventoryScope | undefined;
/** Resolve local ids, relative aliases, and fully-qualified ASTRA paths. */
export declare function resolveInventoryRecordReference(model: InventoryModel, scope: InventoryScope, reference: string, kind?: InventoryKind): LocatedInventoryRecord | undefined;
export declare function inventoryDecisionInsights(model: InventoryModel, scope: InventoryScope, decision: InventoryRecord): InventoryInsightRecord[];
export declare function inventoryInformedDecisions(model: InventoryModel, scope: InventoryScope, insight: InventoryRecord): InventoryDecisionRecord[];
export {};
