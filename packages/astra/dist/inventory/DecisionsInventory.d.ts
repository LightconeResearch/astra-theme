import { type InventoryModel } from './model';
import type { InventoryInsightRecord, InventoryRecord, InventoryScope } from './types';
interface DecisionsInventoryProps {
    model: InventoryModel;
    scopeId: string;
    tagLabels?: Readonly<Record<string, string>>;
    onOpenDecision: (decision: InventoryRecord, scope: InventoryScope) => void;
}
export declare function DecisionDialog({ record, scope, model, onOpenInsight, onBack, onClose, }: {
    record: InventoryRecord;
    scope: InventoryScope;
    model: InventoryModel;
    onOpenInsight: (insight: InventoryInsightRecord) => void;
    onBack?: () => void;
    onClose: () => void;
}): import("react").JSX.Element;
export declare function DecisionsInventory({ model, scopeId, tagLabels, onOpenDecision, }: DecisionsInventoryProps): import("react").JSX.Element;
export {};
