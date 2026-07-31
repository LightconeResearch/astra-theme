import * as React from 'react';
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
export declare const KindLabel: React.FC<{
    kind: string;
    className?: string;
}>;
/** Serif card title. */
export declare const Title: React.FC<{
    children: React.ReactNode;
}>;
/** Muted card description / body line. */
export declare const Desc: React.FC<{
    children: React.ReactNode;
}>;
/** A shared small uppercase section label, defaulting to the card treatment. */
export declare const SectionLabel: React.FC<{
    children: React.ReactNode;
    className?: string;
    as?: 'div' | 'h3' | 'span';
}>;
