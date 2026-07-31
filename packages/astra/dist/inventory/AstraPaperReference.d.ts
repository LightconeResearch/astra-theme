import type { ReactNode } from 'react';
import type { InventoryPaper } from './PapersInventory';
export interface AstraPaperReferenceProps {
    /** Paper derived from one or more prior-insight DOI evidence records. */
    paper: InventoryPaper;
    /** Visible prose label. Defaults to the resolved paper title. */
    label?: ReactNode;
    /** Opens the host's paper detail surface on click, Enter, or Space. */
    onActivate?: () => void;
    className?: string;
}
/**
 * Host-neutral paper reference using the same token and hover-card grammar as
 * ASTRA record references. Papers are keyed by DOI because they are derived
 * resources rather than native astra.yaml records.
 */
export declare function AstraPaperReference({ paper, label, onActivate, className, }: AstraPaperReferenceProps): import("react").JSX.Element;
