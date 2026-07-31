import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MyST } from 'myst-to-react';
import { useEntryByIdentifier } from '../store/useAstraStore';
import { KindLabel } from '../card';
import { StoreProse } from '../storeProse';
/** Type guard: the resolved entry is a sub-analysis (has the nav fields). */
function isSubAnalysis(entry) {
    return (!!entry &&
        typeof entry === 'object' &&
        'url' in entry &&
        'decisions' in entry &&
        'outputs' in entry);
}
/**
 * The class string from the carrier node, defaulting to the kind class. The
 * `.astra-subanalysis` block already defines its own `--astra-kind`/`--astra-glyph`,
 * so we do NOT append `astra-card`/`astra-card--analysis` (that would draw a
 * second card box around the block — see FIX 3e).
 */
function rootClass(node) {
    const cls = node.class;
    return typeof cls === 'string' && cls.trim() ? cls : 'astra-subanalysis';
}
/** Pluralize "decision"/"output" counts for the footer ("1 decision · 2 outputs"). */
function plural(n, one) {
    return `${n} ${n === 1 ? one : `${one}s`}`;
}
export const AstraSubanalysis = ({ node }) => {
    const entry = useEntryByIdentifier(node.identifier);
    // Graceful fallback: no joinable entry → render the stock card children.
    if (!isSubAnalysis(entry)) {
        return _jsx(MyST, { ast: node.children });
    }
    const name = entry.name || entry.id;
    const counts = `${plural(entry.decisions, 'decision')} · ${plural(entry.outputs, 'output')}`;
    return (_jsxs("div", { className: rootClass(node), id: node.identifier, children: [_jsx(KindLabel, { kind: "analysis", className: "astra-subanalysis__kind" }), _jsx("div", { className: "astra-subanalysis__name", children: entry.url ? (_jsx("a", { className: "astra-subanalysis__link", href: entry.url, children: name })) : (name) }), entry.summary ? (_jsx("div", { className: "astra-subanalysis__summary", children: _jsx(StoreProse, { text: entry.summary }) })) : null, _jsx("div", { className: "astra-subanalysis__counts", children: counts })] }));
};
export default AstraSubanalysis;
//# sourceMappingURL=AstraSubanalysis.js.map