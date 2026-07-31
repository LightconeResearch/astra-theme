import { jsx as _jsx } from "react/jsx-runtime";
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
export const KindLabel = ({ kind, className = 'astra-card__kind', }) => {
    const label = labelFor(kind);
    if (!label)
        return null;
    return _jsx("div", { className: className, children: label });
};
/** Serif card title. */
export const Title = ({ children }) => {
    if (children == null || children === '')
        return null;
    return _jsx("div", { className: "astra-card__title", children: children });
};
/** Muted card description / body line. */
export const Desc = ({ children }) => {
    if (children == null || children === '')
        return null;
    return _jsx("div", { className: "astra-card__desc", children: children });
};
/** A shared small uppercase section label, defaulting to the card treatment. */
export const SectionLabel = ({ children, className = 'astra-card__section', as: Component = 'div' }) => {
    if (children == null || children === '')
        return null;
    return _jsx(Component, { className: className, children: children });
};
//# sourceMappingURL=CardChrome.js.map