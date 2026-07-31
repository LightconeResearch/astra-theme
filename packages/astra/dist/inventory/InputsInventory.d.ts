import { type InventoryModel } from './model';
import type { InventoryRecord, InventoryScope } from './types';
interface InputsInventoryProps {
    model: InventoryModel;
    scopeId: string;
    onOpenInput: (input: InventoryRecord, scope: InventoryScope) => void;
}
export declare function InputDialog({ record, scope, onBack, onClose, }: {
    record: InventoryRecord;
    scope: InventoryScope;
    onBack?: () => void;
    onClose: () => void;
}): import("react").JSX.Element;
export declare function InputsInventory({ model, scopeId, onOpenInput }: InputsInventoryProps): import("react").JSX.Element;
export {};
