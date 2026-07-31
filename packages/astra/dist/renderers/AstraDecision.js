import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AstraDecision — block renderer for the `:::{astra:decision}` carrier.
 *
 * The plugin emits a stock `heading` node carrying the `astra-decision` class
 * and an `identifier` of the form `decision-<id>`; the decision body follows as
 * sibling nodes. This component joins that id to the per-page store's
 * `decisions` table and renders the rich Vellum "decision panel" entirely from
 * the store entry: a kind label + title, a segmented narrative|options|evidence
 * toggle, the rationale prose (narrative), the option list (options), or the
 * prior insights cited by the options (evidence — segment only shown when at
 * least one option cites an insight), and a muted footer summarising the
 * default selection and option count.
 *
 * Graceful degradation (CONTRACT §"degrade gracefully"): if the store entry is
 * missing we fall back to the node's own stock children (`<MyST>` over the
 * heading title text) and never throw.
 */
import * as React from 'react';
import { MyST } from 'myst-to-react';
import { useAstraStore, useEntryByIdentifier } from '../store/useAstraStore';
import { decisionEvidenceInsights } from '../store/decisionEvidence';
import { InsightRef } from '../card';
import { AstraCite } from '../cite';
import { labelFor } from '../glyphs';
import { StoreProse } from '../storeProse';
const KIND = 'decision';
/**
 * Type guard: a store entry is a `SerializedDecision` when it exposes an
 * `options` record. (The shared `AstraEntry` union is structural, so we narrow
 * here rather than trust the carrier prefix alone.)
 */
function isDecision(entry) {
    return (!!entry &&
        typeof entry === 'object' &&
        'options' in entry);
}
/**
 * One Evidence-view row: hoverable insight reference (opens the full insight
 * card), the claim as a plain-language note (only when the row is named by an
 * authored label — an unlabelled row is already named by the claim's opening,
 * and the hover card shows it in its entirety), and the resolved citation.
 */
const EvidenceItem = ({ ins }) => {
    return (_jsxs("li", { className: "astra-evidence__item", children: [_jsx(InsightRef, { entry: ins, tag: "prior insight" }), ins.label && ins.claim ? (_jsx("div", { className: "astra-evidence__note", children: _jsx(StoreProse, { text: ins.claim }) })) : null, ins.doi ? (_jsx("div", { className: "astra-cite", children: _jsx(AstraCite, { doi: ins.doi }) })) : null] }));
};
export const AstraDecision = ({ node }) => {
    var _a, _b, _c;
    const entry = useEntryByIdentifier(node.identifier);
    const store = useAstraStore();
    const [view, setView] = React.useState('narrative');
    // Preserve whatever astra-* classes the carrier already declares so the
    // stylesheet's `.astra-decision` (and any future modifiers) still apply, and
    // self-set the kind modifier that plumbs the per-kind accent var. The Set
    // dedupes against the carrier's own `astra-decision`.
    const rootClass = Array.from(new Set([
        'astra-decision',
        ...String((_a = node.class) !== null && _a !== void 0 ? _a : '').split(/\s+/).filter(Boolean),
    ])).join(' ');
    // ── Graceful fallback ──────────────────────────────────────────────────────
    // No store, no table, or no matching id → render the stock details children.
    if (!isDecision(entry)) {
        return _jsx(MyST, { ast: node.children });
    }
    const { label, rationale, selected, options } = entry;
    const optionIds = Object.keys(options !== null && options !== void 0 ? options : {});
    const optionCount = optionIds.length;
    const selectedLabel = (_c = (_b = (selected != null ? options[selected] : undefined)) !== null && _b !== void 0 ? _b : selected) !== null && _c !== void 0 ? _c : '—';
    // The prior insights cited by the options — shown under the Evidence segment
    // (the segment itself only renders when at least one insight resolves).
    const evidence = decisionEvidenceInsights(entry, store);
    const views = evidence.length > 0 ? ['narrative', 'options', 'evidence'] : ['narrative', 'options'];
    return (
    // The carrier's `decision-<id>` identifier becomes the anchor id — the
    // provenance drawer links to `/<scope>#decision-<id>` and cross-page
    // MyST anchors rely on it.
    _jsxs("details", { className: rootClass, "data-kind": KIND, id: node.identifier, open: true, children: [_jsx("summary", { className: "astra-decision__head", children: labelFor(KIND) }), label ? _jsx("div", { className: "astra-decision__title", children: label }) : null, _jsx("div", { className: "astra-decision__toggle", role: "tablist", "aria-label": "Decision view", children: views.map((v) => (_jsx("button", { type: "button", role: "tab", "aria-selected": view === v, className: view === v ? 'is-active' : undefined, "data-view": v, onClick: () => setView(v), children: v[0].toUpperCase() + v.slice(1) }, v))) }), view === 'narrative' && rationale ? (_jsx("div", { className: "astra-decision__rationale", children: _jsx("p", { children: _jsx(StoreProse, { text: rationale }) }) })) : null, view === 'options' ? (_jsx("ul", { className: "astra-options", children: optionIds.map((optId) => {
                    var _a;
                    const isSelected = optId === selected;
                    const optClass = [
                        'astra-option',
                        isSelected ? 'astra-option--selected' : 'astra-option--excluded',
                    ].join(' ');
                    const optLabel = (_a = options[optId]) !== null && _a !== void 0 ? _a : optId;
                    return (_jsxs("li", { className: optClass, "aria-current": isSelected ? 'true' : undefined, children: [_jsx("span", { className: "astra-option__dot", "aria-hidden": "true" }), _jsx("span", { className: "astra-option__label", children: optLabel })] }, optId));
                }) })) : null, view === 'evidence' ? (_jsx("ul", { className: "astra-evidence", children: evidence.map((ins) => (_jsx(EvidenceItem, { ins: ins }, ins.id))) })) : null, _jsxs("div", { className: "astra-decision__meta", children: ["default: ", selectedLabel, " \u00B7 ", optionCount, " option", optionCount === 1 ? '' : 's'] })] }));
};
export default AstraDecision;
//# sourceMappingURL=AstraDecision.js.map