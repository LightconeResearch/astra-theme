import * as React from 'react';
export interface PreviewCardProps {
    /** The inline token that the card hangs off of (the reference span/text). */
    trigger: React.ReactNode;
    /** The card body — typically <CardChrome.* /> + diagrams. */
    children: React.ReactNode;
    /** ASTRA kind string, used to tint the card via `astra-card--<kind>`. */
    kind: string;
    /** Optional detail action for click, Enter, or Space on the trigger. */
    onActivate?: () => void;
}
/**
 * Public entry: the outermost card creates the FloatingTree; nested cards
 * (rendered inside another card's floating body) attach to the existing tree.
 */
export declare const PreviewCard: React.FC<PreviewCardProps>;
export default PreviewCard;
