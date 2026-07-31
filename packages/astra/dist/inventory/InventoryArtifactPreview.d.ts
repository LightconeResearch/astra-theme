import type { InventoryRecord } from './types';
export declare function inventoryFileName(record: InventoryRecord): string;
export declare function inventoryFileExtension(record: InventoryRecord): string;
export declare function InventoryArtifactPreview({ record, compact }: {
    record: InventoryRecord;
    compact?: boolean;
}): import("react").JSX.Element;
