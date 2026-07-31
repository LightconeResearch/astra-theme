/**
 * Compiled host-facing entrypoint for ASTRA references and full record details.
 *
 * Hosts provide a resolved inventory snapshot/model; this module owns no ASTRA
 * loading and does not require MyST document nodes.
 */
export { AstraRecordReference, consolidatedStoreFromInventoryModel, } from './AstraRecordReference';
export { AstraPaperReference, } from './AstraPaperReference';
export { InventoryExplorer } from './InventoryOutline';
export { OverviewInventory } from './OverviewInventory';
export { createInventoryModel, getInventoryScope, inventoryRecordTitle, resolveInventoryRecordReference, } from './model';
export { paperRecords, paperMetadataFromCitations, } from './PapersInventory';
//# sourceMappingURL=record-detail.js.map