import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CardChrome } from '../card';
import { PreviewCard } from '../card/PreviewCard';
/**
 * Host-neutral paper reference using the same token and hover-card grammar as
 * ASTRA record references. Papers are keyed by DOI because they are derived
 * resources rather than native astra.yaml records.
 */
export function AstraPaperReference({ paper, label, onActivate, className, }) {
    const tokenClassName = [
        'astra-ref',
        'astra-ref--paper',
        className,
    ].filter(Boolean).join(' ');
    return (_jsxs(PreviewCard, { kind: "paper", onActivate: onActivate, trigger: _jsx("span", { className: tokenClassName, children: label !== null && label !== void 0 ? label : paper.title }), children: [_jsx(CardChrome.KindLabel, { kind: "paper" }), _jsx(CardChrome.Title, { children: paper.title }), paper.authors ? (_jsx(CardChrome.Desc, { children: paper.authors })) : null, _jsx(CardChrome.SectionLabel, { children: "SUPPORTS" }), _jsxs("div", { className: "astra-paper-card__counts", children: [paper.insights.length, " ", paper.insights.length === 1 ? 'insight' : 'insights', ' · ', paper.decisions.length, " ", paper.decisions.length === 1 ? 'decision' : 'decisions'] }), _jsx("code", { className: "astra-paper-card__doi", children: paper.doi })] }));
}
//# sourceMappingURL=AstraPaperReference.js.map