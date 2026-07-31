import { type InventoryModel } from './model';
import type { InventoryRecord, InventoryScope } from './types';
interface OutputsInventoryProps {
    model: InventoryModel;
    scopeId: string;
    onOpenOutput: (output: InventoryRecord, scope: InventoryScope) => void;
}
export interface OutputDetailProps {
    record: InventoryRecord;
    scope: InventoryScope;
    model: InventoryModel;
    onOpenDependency?: (record: InventoryRecord, scope: InventoryScope) => void;
}
/**
 * Host-neutral output detail body.
 *
 * MyST renders this inside InventoryDetailDialog. Other hosts, such as
 * JupyterLab, can supply their own panel chrome while preserving the exact
 * ASTRA result, description, recipe, and provenance presentation.
 */
export declare function OutputDetail({ record, scope, model, onOpenDependency, }: OutputDetailProps): import("react").JSX.Element;
export declare function OutputDialog({ record, scope, model, onOpenDependency, onBack, onClose, }: OutputDetailProps & {
    onOpenDependency: (record: InventoryRecord, scope: InventoryScope) => void;
    onBack?: () => void;
    onClose: () => void;
}): import("react").JSX.Element;
export declare function OutputsInventory({ model, scopeId, onOpenOutput }: OutputsInventoryProps): import("react").JSX.Element;
export {};
