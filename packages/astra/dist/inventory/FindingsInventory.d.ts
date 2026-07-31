import { type InventoryModel } from './model';
import type { InventoryRecord, InventoryScope } from './types';
interface FindingsInventoryProps {
    model: InventoryModel;
    scopeId: string;
    onOpenFinding: (finding: InventoryRecord, scope: InventoryScope) => void;
}
export declare function FindingDialog({ record, scope, model, onOpenEvidence, onBack, onClose, }: {
    record: InventoryRecord;
    scope: InventoryScope;
    model: InventoryModel;
    onOpenEvidence: (output: InventoryRecord, scope: InventoryScope) => void;
    onBack?: () => void;
    onClose: () => void;
}): import("react").JSX.Element;
export declare function FindingsInventory({ model, scopeId, onOpenFinding, }: FindingsInventoryProps): import("react").JSX.Element;
export {};
