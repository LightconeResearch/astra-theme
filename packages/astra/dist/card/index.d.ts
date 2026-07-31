/**
 * Barrel for the shared card primitives + diagram sub-views used by both the
 * inline-token preview cards and the block renderers.
 */
export { PreviewCard } from './PreviewCard';
export type { PreviewCardProps } from './PreviewCard';
export { KindLabel, Title, Desc, SectionLabel } from './CardChrome';
export { InsightCard, InsightRef } from './InsightCard';
export { InsightEvidenceTitle } from './InsightEvidenceTitle';
export { insightEvidenceName } from './insightEvidenceName';
export { DataFlow } from './diagrams';
export type { DataFlowProps } from './diagrams';
export declare const CardChrome: {
    KindLabel: import("react").FC<{
        kind: string;
        className?: string;
    }>;
    Title: import("react").FC<{
        children: React.ReactNode;
    }>;
    Desc: import("react").FC<{
        children: React.ReactNode;
    }>;
    SectionLabel: import("react").FC<{
        children: React.ReactNode;
        className?: string;
        as?: "div" | "h3" | "span";
    }>;
};
