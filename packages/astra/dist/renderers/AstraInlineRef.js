import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { MyST } from 'myst-to-react';
import { useAstraEntry, useAstraStore } from '../store/useAstraStore';
import { StoreProse } from '../storeProse';
import { decisionEvidenceInsights } from '../store/decisionEvidence';
import { PreviewCard } from '../card/PreviewCard';
import { CardChrome, DataFlow, InsightCard, InsightRef } from '../card';
import { AstraCite } from '../cite';
import { useInventoryDialogTrigger } from '../inventory/DialogContext';
/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
/** Pull the typed inline payload off the node, tolerating missing data. */
function readInline(node) {
    var _a;
    const astra = (_a = node === null || node === void 0 ? void 0 : node.data) === null || _a === void 0 ? void 0 : _a.astra;
    if (!astra || !astra.kind || !astra.id)
        return undefined;
    return astra;
}
/** Filter + trim a list of possibly-empty strings down to real values. */
function clean(values) {
    return (values !== null && values !== void 0 ? values : [])
        .map((v) => (v == null ? '' : String(v).trim()))
        .filter((v) => v !== '');
}
function inventoryReference(inline) {
    if (!inline
        || ![
            'input',
            'decision',
            'output',
            'finding',
            'prior_insight',
        ].includes(inline.kind))
        return undefined;
    return {
        kind: inline.kind,
        id: inline.id,
        path: inline.path,
    };
}
/** Reconstruct the visible carrier `<span>` (preserves its astra-* classes). */
function tokenSpan(node) {
    const className = typeof node.class === 'string' && node.class.trim() !== ''
        ? node.class
        : 'astra-ref';
    return (_jsx("span", { className: className, children: _jsx(MyST, { ast: node.children }) }));
}
/* ------------------------------------------------------------------ *
 * Per-kind card bodies
 * ------------------------------------------------------------------ */
/** Compact cards cap the SUPPORTED BY list; the panel shows the full set. */
const MAX_SUPPORTING = 3;
/** Exported for reuse: the provenance drawer's decision refs hover this card. */
export const DecisionCard = ({ entry }) => {
    var _a, _b;
    const store = useAstraStore();
    const optionIds = Object.keys((_a = entry.options) !== null && _a !== void 0 ? _a : {});
    const optionCount = optionIds.length;
    const selected = entry.selected;
    const supporting = decisionEvidenceInsights(entry, store);
    return (_jsxs(_Fragment, { children: [_jsx(CardChrome.KindLabel, { kind: "decision" }), _jsx(CardChrome.Title, { children: (_b = entry.label) !== null && _b !== void 0 ? _b : entry.id }), entry.rationale ? (_jsx(CardChrome.Desc, { children: _jsx(StoreProse, { text: entry.rationale }) })) : null, optionCount > 0 ? (_jsxs(_Fragment, { children: [_jsx(CardChrome.SectionLabel, { children: "OPTION DETAIL" }), _jsx("ul", { className: "astra-options", children: optionIds.map((oid) => {
                            var _a, _b;
                            const isSelected = selected != null && oid === selected;
                            return (_jsx("li", { className: 'astra-option' +
                                    (isSelected
                                        ? ' astra-option--selected'
                                        : ' astra-option--excluded'), children: _jsx("span", { className: "astra-option__label", children: (_b = (_a = entry.options) === null || _a === void 0 ? void 0 : _a[oid]) !== null && _b !== void 0 ? _b : oid }) }, oid));
                        }) })] })) : null, supporting.length > 0 ? (_jsxs(_Fragment, { children: [_jsx(CardChrome.SectionLabel, { children: "SUPPORTED BY" }), _jsxs("ul", { className: "astra-evidence astra-evidence--compact", children: [supporting.slice(0, MAX_SUPPORTING).map((ins) => (_jsx("li", { className: "astra-evidence__item", children: _jsx(InsightRef, { entry: ins }) }, ins.id))), supporting.length > MAX_SUPPORTING ? (_jsxs("li", { className: "astra-evidence__more", children: ["+ ", supporting.length - MAX_SUPPORTING, " more in the decision panel"] })) : null] })] })) : null] }));
};
const FindingCard = ({ entry }) => {
    var _a, _b;
    const store = useAstraStore();
    const title = (_a = entry.label) !== null && _a !== void 0 ? _a : entry.id;
    const evidence = (_b = entry.evidence) !== null && _b !== void 0 ? _b : [];
    return (_jsxs(_Fragment, { children: [_jsx(CardChrome.KindLabel, { kind: "finding" }), _jsx(CardChrome.Title, { children: title }), entry.claim ? (_jsx("div", { className: "astra-finding__claim", children: _jsx(StoreProse, { text: entry.claim }) })) : null, entry.scope ? (_jsx("span", { className: "astra-scope-chip", children: _jsx(StoreProse, { text: entry.scope }) })) : null, entry.notes ? (_jsx(CardChrome.Desc, { children: _jsx("span", { className: "astra-finding__notes", children: _jsx(StoreProse, { text: entry.notes }) }) })) : null, evidence.length > 0 ? (_jsxs(_Fragment, { children: [_jsx(CardChrome.SectionLabel, { children: "EVIDENCE" }), _jsx("ul", { className: "astra-evidence", children: evidence.map((ev, i) => {
                            var _a, _b, _c, _d, _e;
                            const artifact = ev.artifact ? (_a = store === null || store === void 0 ? void 0 : store.outputs) === null || _a === void 0 ? void 0 : _a[ev.artifact] : undefined;
                            const thumb = (artifact === null || artifact === void 0 ? void 0 : artifact.type) === 'figure' ? artifact.resolved_path : undefined;
                            const titleRow = ev.artifact ? (_jsxs("span", { className: "astra-evidence__title", children: [_jsx("span", { className: "astra-evidence__glyph--output", "aria-hidden": "true", children: "\u25C6" }), _jsx("span", { className: artifact ? 'astra-evidence__name' : undefined, children: (_b = artifact === null || artifact === void 0 ? void 0 : artifact.label) !== null && _b !== void 0 ? _b : ev.artifact }), (artifact === null || artifact === void 0 ? void 0 : artifact.type) ? (_jsx("span", { className: "astra-evidence__tag", children: artifact.type })) : null] })) : null;
                            return (_jsxs("li", { className: "astra-evidence__item", children: [thumb ? (_jsx("div", { className: "astra-evidence__thumb", children: _jsx("img", { src: thumb, alt: (_c = artifact === null || artifact === void 0 ? void 0 : artifact.label) !== null && _c !== void 0 ? _c : ev.artifact, loading: "lazy" }) })) : null, titleRow && artifact ? (_jsx(PreviewCard, { kind: "output", trigger: titleRow, children: _jsx(OutputCard, { entry: artifact }) })) : (titleRow), ev.quote ? (_jsx("div", { className: "astra-evidence__quote", children: _jsx(StoreProse, { text: ev.quote }) })) : null, ev.doi ? (_jsx("div", { className: "astra-cite", children: _jsx(AstraCite, { doi: ev.doi }) })) : null] }, (_e = (_d = ev.artifact) !== null && _d !== void 0 ? _d : ev.doi) !== null && _e !== void 0 ? _e : i));
                        }) })] })) : null] }));
};
/** Pluralize a count for the sub-analysis footer ("1 decision · 8 outputs"). */
function plural(n, one) {
    return `${n} ${n === 1 ? one : `${one}s`}`;
}
const AnalysisCard = ({ entry }) => {
    var _a;
    const title = (_a = entry.name) !== null && _a !== void 0 ? _a : entry.id;
    return (_jsxs(_Fragment, { children: [_jsx(CardChrome.KindLabel, { kind: "analysis" }), _jsx(CardChrome.Title, { children: entry.url ? (_jsx("a", { className: "astra-subanalysis__link", href: entry.url, children: title })) : (title) }), entry.summary ? (_jsx(CardChrome.Desc, { children: _jsx(StoreProse, { text: entry.summary }) })) : null, _jsxs("div", { className: "astra-subanalysis__counts", children: [plural(entry.decisions, 'decision'), " \u00B7 ", plural(entry.outputs, 'output')] })] }));
};
const OutputCard = ({ entry }) => {
    var _a, _b, _c, _d, _e, _f;
    const title = (_a = entry.label) !== null && _a !== void 0 ? _a : entry.id;
    const inputs = clean(entry.inputs);
    const recipe = (_c = (_b = entry.recipe) === null || _b === void 0 ? void 0 : _b.command) !== null && _c !== void 0 ? _c : (_d = entry.recipe) === null || _d === void 0 ? void 0 : _d.container;
    const provNodes = clean([
        inputs.length > 0 ? inputs.join(', ') : undefined,
        recipe,
        (_e = entry.resolved_path) !== null && _e !== void 0 ? _e : entry.id,
    ]);
    return (_jsxs(_Fragment, { children: [_jsx(CardChrome.KindLabel, { kind: "output" }), _jsx(CardChrome.Title, { children: title }), entry.description ? (_jsx(CardChrome.Desc, { children: _jsx(StoreProse, { text: entry.description }) })) : null, entry.resolved_path ? (_jsx("div", { className: "astra-output__thumb", children: _jsx("img", { src: entry.resolved_path, alt: (_f = entry.label) !== null && _f !== void 0 ? _f : entry.id, loading: "lazy" }) })) : null, provNodes.length > 1 ? (_jsxs(_Fragment, { children: [_jsx(CardChrome.SectionLabel, { children: "PROVENANCE" }), _jsx(DataFlow, { nodes: provNodes })] })) : null] }));
};
const InputCard = ({ entry }) => {
    var _a, _b;
    const source = (_a = entry.source) !== null && _a !== void 0 ? _a : entry.from;
    return (_jsxs(_Fragment, { children: [_jsx(CardChrome.KindLabel, { kind: "input" }), _jsx(CardChrome.Title, { children: (_b = entry.label) !== null && _b !== void 0 ? _b : entry.id }), entry.description ? (_jsx(CardChrome.Desc, { children: _jsx(StoreProse, { text: entry.description }) })) : null, source ? (_jsxs(_Fragment, { children: [_jsx(CardChrome.SectionLabel, { children: "SOURCE" }), _jsx("code", { className: "astra-ds__source", children: source })] })) : null] }));
};
/* ------------------------------------------------------------------ *
 * Card dispatch
 * ------------------------------------------------------------------ */
function renderCardBody(kind, entry) {
    switch (kind) {
        case 'decision':
            return _jsx(DecisionCard, { entry: entry });
        case 'finding':
            return _jsx(FindingCard, { entry: entry });
        case 'prior_insight':
            return _jsx(InsightCard, { entry: entry });
        case 'analysis':
            return _jsx(AnalysisCard, { entry: entry });
        case 'output':
            return _jsx(OutputCard, { entry: entry });
        case 'input':
            return _jsx(InputCard, { entry: entry });
        default:
            // `value` has its own renderer; option / evidence / universe (and any
            // future kind) have no store table — the token degrades gracefully.
            return null;
    }
}
/**
 * Host-neutral access to the exact card body used by MyST inline references.
 *
 * The MyST adapter below supplies a record joined from its page store. Other
 * hosts can pass the same serialized record directly without manufacturing a
 * MyST node.
 */
export const AstraRecordPreview = ({ record, }) => _jsx(_Fragment, { children: renderCardBody(record.kind, record) });
/* ------------------------------------------------------------------ *
 * The renderer component
 * ------------------------------------------------------------------ */
export const AstraInlineRef = ({ node }) => {
    const inline = readInline(node);
    const openInventoryDialog = useInventoryDialogTrigger();
    const kind = inline === null || inline === void 0 ? void 0 : inline.kind;
    const id = inline === null || inline === void 0 ? void 0 : inline.id;
    // Always call the hook (stable order); it returns undefined on any miss.
    // The path key resolves cross-scope refs (entries merged from sub-analyses).
    const entry = useAstraEntry(kind, id, inline === null || inline === void 0 ? void 0 : inline.path);
    const token = tokenSpan(node);
    // No payload, no entry, or a kind we don't card (e.g. value) → bare token.
    if (!kind || !entry) {
        return _jsx(_Fragment, { children: token });
    }
    const body = renderCardBody(kind, entry);
    if (!body) {
        return _jsx(_Fragment, { children: token });
    }
    // A sub-analysis token is a real navigation target — its page URL is in the
    // store — so make the click do what the pointer cursor promises. The link
    // wraps the token INSIDE the hover trigger: hover still previews, click
    // navigates. Other kinds have no canonical page and stay hover-only.
    const analysisUrl = kind === 'analysis' ? entry.url : undefined;
    const trigger = analysisUrl ? (_jsx("a", { className: "astra-ref-anchor", href: analysisUrl, children: token })) : (token);
    // Prior insights are literature claims: when the insight carries a DOI the
    // resolved citation is appended inline — "…consistent α's (Chen et al.,
    // 2024)" — exactly as a manually-cited sentence would read. The citation is
    // a SIBLING of the hover trigger: it keeps its own bibliography link/hover
    // while the gold token keeps the insight card.
    const insightDoi = kind === 'prior_insight' ? entry.doi : undefined;
    const detailReference = inventoryReference(inline);
    const onActivate = detailReference && openInventoryDialog
        ? () => openInventoryDialog(detailReference)
        : undefined;
    return (_jsxs(_Fragment, { children: [_jsx(PreviewCard, { kind: kind, trigger: trigger, onActivate: onActivate, children: body }), insightDoi ? (_jsxs("span", { className: "astra-ref-citation", children: [' ', _jsx(AstraCite, { doi: insightDoi, parenthetical: true })] })) : null] }));
};
export default AstraInlineRef;
//# sourceMappingURL=AstraInlineRef.js.map