import type { ReactNode } from 'react';
import { CardChrome } from '../card';
import { PreviewCard } from '../card/PreviewCard';
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
export function AstraPaperReference({
  paper,
  label,
  onActivate,
  className,
}: AstraPaperReferenceProps) {
  const tokenClassName = [
    'astra-ref',
    'astra-ref--paper',
    className,
  ].filter(Boolean).join(' ');

  return (
    <PreviewCard
      kind="paper"
      onActivate={onActivate}
      trigger={
        <span className={tokenClassName}>
          {label ?? paper.title}
        </span>
      }
    >
      <CardChrome.KindLabel kind="paper" />
      <CardChrome.Title>{paper.title}</CardChrome.Title>
      {paper.authors ? (
        <CardChrome.Desc>{paper.authors}</CardChrome.Desc>
      ) : null}
      <CardChrome.SectionLabel>SUPPORTS</CardChrome.SectionLabel>
      <div className="astra-paper-card__counts">
        {paper.insights.length} {paper.insights.length === 1 ? 'insight' : 'insights'}
        {' · '}
        {paper.decisions.length} {paper.decisions.length === 1 ? 'decision' : 'decisions'}
      </div>
      <code className="astra-paper-card__doi">{paper.doi}</code>
    </PreviewCard>
  );
}
