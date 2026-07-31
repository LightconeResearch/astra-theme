import { type InventoryModel } from './model';
import type { InventoryDecisionRecord, InventoryInsightRecord, InventoryScope } from './types';
interface PapersInventoryProps {
    model: InventoryModel;
    scopeId: string;
    paperMetadata?: InventoryPaperMetadataMap;
    onOpenPaper: (paper: InventoryPaper, scope: InventoryScope) => void;
}
export interface InventoryPaper {
    doi: string;
    title: string;
    authors?: string;
    pdfUrl?: string;
    insights: InventoryInsightRecord[];
    decisions: InventoryDecisionRecord[];
}
export interface InventoryPaperMetadata {
    title?: string;
    authors?: string;
    pdfUrl?: string;
}
export type InventoryPaperMetadataMap = Readonly<Record<string, InventoryPaperMetadata>>;
export declare function paperMetadataFromCitations(citations: unknown): InventoryPaperMetadataMap;
export declare function paperRecords(model: InventoryModel, scope: InventoryScope, paperMetadata?: InventoryPaperMetadataMap): InventoryPaper[];
export declare function PaperDialog({ paper, scope, initialFocusInsight, pdfAssetBaseUrl, onOpenInsight, onOpenDecision, onBack, onClose, }: {
    paper: InventoryPaper;
    scope: InventoryScope;
    initialFocusInsight?: InventoryInsightRecord;
    pdfAssetBaseUrl?: string;
    onOpenInsight: (insight: InventoryInsightRecord) => void;
    onOpenDecision: (decision: InventoryDecisionRecord) => void;
    onBack?: () => void;
    onClose: () => void;
}): import("react").JSX.Element;
export declare function PapersInventory({ model, scopeId, paperMetadata, onOpenPaper, }: PapersInventoryProps): import("react").JSX.Element;
export {};
