import { type InventoryPaperMetadataMap } from './PapersInventory';
import type { InventoryOpenReference, InventorySnapshot } from './types';
export interface InventoryOutlineProps {
    snapshot?: InventorySnapshot;
    scopeId?: string;
    paperMetadata?: InventoryPaperMetadataMap;
    /** Host-specific directory containing the PDF.js runtime assets. */
    paperPdfAssetBaseUrl?: string;
    decisionTagLabels?: Readonly<Record<string, string>>;
    dialogsOnly?: boolean;
    openReference?: InventoryOpenReference;
    /** Notified when the shared detail stack closes from its UI. */
    onClose?: () => void;
    /**
     * Optional host boundary for selections made from the inventory overview.
     * When provided, initial selections are delegated to the host while links
     * inside an open detail continue to use this component's back stack.
     */
    onOpenReference?: (reference: InventoryOpenReference, scopeId: string) => void;
}
export declare function InventoryExplorer({ snapshot, scopeId, paperMetadata, paperPdfAssetBaseUrl, decisionTagLabels, dialogsOnly, openReference, onClose, onOpenReference, }: InventoryOutlineProps): import("react").JSX.Element;
/** Backwards-compatible name for the inventory's original public entry point. */
export declare const InventoryOutline: typeof InventoryExplorer;
