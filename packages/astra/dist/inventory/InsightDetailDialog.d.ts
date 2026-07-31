import { type InventoryModel } from './model';
import type { InventoryDecisionRecord, InventoryInsightRecord, InventoryScope } from './types';
export declare function InsightDetailTrigger({ insight, onOpen, tag, variant, }: {
    insight: InventoryInsightRecord;
    onOpen: () => void;
    tag?: string;
    variant?: 'title' | 'claim';
}): import("react").JSX.Element;
export declare function InsightDetailDialog({ insight, model, scope, onOpenSource, onOpenDecision, onBack, onClose, }: {
    insight: InventoryInsightRecord;
    model: InventoryModel;
    scope: InventoryScope;
    onOpenSource?: () => void;
    onOpenDecision?: (decision: InventoryDecisionRecord) => void;
    onBack?: () => void;
    onClose: () => void;
}): import("react").JSX.Element;
