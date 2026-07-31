/**
 * Compiled host-facing entrypoint for ASTRA references and full record details.
 *
 * Hosts provide a resolved inventory snapshot/model; this module owns no ASTRA
 * loading and does not require MyST document nodes.
 */
export { AstraRecordReference, consolidatedStoreFromInventoryModel, } from './AstraRecordReference';
export type { AstraRecordReferenceProps, } from './AstraRecordReference';
export { AstraPaperReference, } from './AstraPaperReference';
export type { AstraPaperReferenceProps, } from './AstraPaperReference';
export { InventoryExplorer } from './InventoryOutline';
export type { InventoryOutlineProps } from './InventoryOutline';
export { OverviewInventory } from './OverviewInventory';
export { createInventoryModel, getInventoryScope, inventoryRecordTitle, resolveInventoryRecordReference, } from './model';
export type { InventoryModel, LocatedInventoryRecord, } from './model';
export { paperRecords, paperMetadataFromCitations, } from './PapersInventory';
export type { InventoryPaper, InventoryPaperMetadata, InventoryPaperMetadataMap, } from './PapersInventory';
export type { InventoryDiagnostic, InventoryOpenReference, InventoryPaperReference, InventoryRecord, InventoryRecordReference, InventoryScope, InventorySnapshot, } from './types';
