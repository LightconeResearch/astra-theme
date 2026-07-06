import * as React from 'react';
import { labelFor } from '../glyphs';

/**
 * The kind row of a card: the glyph is supplied by CSS via the kind element's
 * `::before { content: var(--astra-glyph) }`, so we render ONLY the uppercase
 * text label here (rendering a literal glyph too would double it).
 *
 * By default the row carries `astra-card__kind` (used by the floating preview
 * cards, whose `.astra-card--<kind>` modifier defines `--astra-glyph`). Block
 * renderers placed inside `.astra-finding` / `.astra-subanalysis` etc. pass
 * their block's own kind class (e.g. `astra-finding__kind`) via `className` so
 * the block's `::before` glyph + accent applies instead of the card one.
 */
export const KindLabel: React.FC<{ kind: string; className?: string }> = ({
  kind,
  className = 'astra-card__kind',
}) => {
  const label = labelFor(kind);
  if (!label) return null;
  return <div className={className}>{label}</div>;
};

/** Serif card title. */
export const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (children == null || children === '') return null;
  return <div className="astra-card__title">{children}</div>;
};

/** Muted card description / body line. */
export const Desc: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (children == null || children === '') return null;
  return <div className="astra-card__desc">{children}</div>;
};

/** A small uppercase section label inside a card (e.g. "PROVENANCE"). */
export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (children == null || children === '') return null;
  return <div className="astra-card__section">{children}</div>;
};
