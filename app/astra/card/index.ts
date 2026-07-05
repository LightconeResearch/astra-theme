/**
 * Barrel for the shared card primitives + diagram sub-views used by both the
 * inline-token preview cards and the block renderers.
 */
export { PreviewCard } from './PreviewCard';
export type { PreviewCardProps } from './PreviewCard';

export { KindLabel, Title, Desc, SectionLabel } from './CardChrome';

export { InsightCard, InsightRef } from './InsightCard';

export { DataFlow } from './diagrams';
export type { DataFlowProps } from './diagrams';

/**
 * Namespace import convenience: `import { CardChrome } from '../card'` then
 * `<CardChrome.Title>…</CardChrome.Title>` etc., matching the import
 * convention in the renderer files.
 */
import { KindLabel, Title, Desc, SectionLabel } from './CardChrome';
export const CardChrome = { KindLabel, Title, Desc, SectionLabel };
