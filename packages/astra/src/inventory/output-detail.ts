/**
 * Small host-facing entrypoint for rendering ASTRA output details without
 * importing the complete inventory application.
 */
export { OutputDetail } from './OutputsInventory';
export type { OutputDetailProps } from './OutputsInventory';
export { InventoryDetailSurface } from './InventoryPrimitives';
export type { InventoryDetailSurfaceProps } from './InventoryPrimitives';
export {
  createInventoryModel,
  inventoryRecordTitle,
  resolveInventoryRecordReference,
} from './model';
export type { InventoryModel } from './model';
export type {
  InventoryDiagnostic,
  InventoryRecord,
  InventoryScope,
  InventorySnapshot,
} from './types';
