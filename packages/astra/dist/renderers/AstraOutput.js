import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { MyST } from 'myst-to-react';
import { useAstraStore, useEntryByIdentifier } from '../store/useAstraStore';
import { PreviewCard } from '../card/PreviewCard';
import { DecisionCard } from './AstraInlineRef';
import { StoreProse } from '../storeProse';
import { TABLE_PREVIEW_DISPLAY_COLUMNS, TABLE_PREVIEW_DISPLAY_ROWS, } from '../tablePreview';
/** Read the node's class string regardless of which key the AST used. */
function classNameOf(node) {
    var _a;
    const raw = (_a = node.class) !== null && _a !== void 0 ? _a : node.className;
    if (typeof raw === 'string')
        return raw;
    if (Array.isArray(raw))
        return raw.filter((c) => typeof c === 'string').join(' ');
    return '';
}
/** Determine the output subtype from the carrier's modifier class. */
function subtypeOf(node) {
    const cls = classNameOf(node);
    if (cls.includes('astra-output--figure'))
        return 'figure';
    if (cls.includes('astra-output--table'))
        return 'table';
    if (cls.includes('astra-output--metric'))
        return 'metric';
    return 'unknown';
}
/** Coerce a metric scalar (number | string | undefined) to a display string. */
function fmtScalar(v) {
    if (v == null || v === '')
        return undefined;
    return typeof v === 'number' ? String(v) : v;
}
/* ------------------------------------------------------------------ *
 * Provenance drawer — "what affects this result":
 *   DECISIONS    every decision on the chain (direct or `via <scope>`),
 *                as live decision refs (hover card when the decision is in
 *                the page store) with the selected option spelled out
 *   SOURCE DATA  analysis-level input files at the chain's roots
 * The recipe command line and artifact path are intentionally not shown
 * (decided via the design-mirror Proposals page, June 2026).
 * Falls back to the direct ids when the store predates the transitive
 * fields. Rendered as a native <details> so the CSS marker rotation works.
 * ------------------------------------------------------------------ */
/** Anchor for a decision carrier: same page when direct, scope page when via. */
function decisionHref(d) {
    const anchor = `#decision-${d.id}`;
    if (!d.via)
        return anchor;
    return d.via === 'root' ? `/${anchor}` : `/${d.via.split('.').join('/')}${anchor}`;
}
const ProvDecisionRef = ({ d }) => {
    var _a, _b;
    const store = useAstraStore();
    const entry = (_a = store === null || store === void 0 ? void 0 : store.decisions) === null || _a === void 0 ? void 0 : _a[d.id];
    const token = (_jsx("a", { className: "astra-ref astra-ref--decision", href: decisionHref(d), children: (_b = d.label) !== null && _b !== void 0 ? _b : d.id }));
    // Live ref: hover card when the decision is joinable in the page store.
    return entry ? (_jsx(PreviewCard, { kind: "decision", trigger: token, children: _jsx(DecisionCard, { entry: entry }) })) : (token);
};
const ProvenanceDrawer = ({ output }) => {
    var _a, _b, _c, _d;
    // Prefer the transitive fields; degrade to the direct ids for old stores.
    const decisions = (_a = output.decisions_transitive) !== null && _a !== void 0 ? _a : ((_b = output.decisions) !== null && _b !== void 0 ? _b : []).map((id) => ({ id }));
    const roots = (_c = output.inputs_root) !== null && _c !== void 0 ? _c : ((_d = output.inputs) !== null && _d !== void 0 ? _d : []).map((id) => ({ id }));
    if (decisions.length === 0 && roots.length === 0)
        return null;
    return (_jsxs("details", { className: "astra-output__provenance", children: [_jsx("summary", { children: "Provenance" }), decisions.length > 0 ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "astra-card__section", children: ["Decisions (", decisions.length, ")"] }), _jsx("ul", { className: "astra-output__prov-decisions", children: decisions.map((d) => (_jsxs("li", { className: "astra-output__prov-row", children: [_jsx(ProvDecisionRef, { d: d }), d.via ? _jsxs("span", { className: "astra-prov-via", children: ["via ", d.via] }) : null, d.selection ? (_jsx("span", { className: "astra-prov-selection", children: d.selection })) : null] }, d.id))) })] })) : null, roots.length > 0 ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "astra-card__section", children: ["Source data (", roots.length, ")"] }), _jsx("div", { className: "astra-output__prov-row", children: roots.map((r) => {
                            var _a;
                            return (_jsx("code", { className: "astra-flow__node", title: (_a = r.label) !== null && _a !== void 0 ? _a : r.id, children: r.id }, r.id));
                        }) })] })) : null] }));
};
/* ------------------------------------------------------------------ *
 * Metric stat — the big number + unit + ± uncertainty + label.
 * ------------------------------------------------------------------ */
const MetricStat = ({ output }) => {
    var _a, _b, _c;
    const m = output.metric;
    if (!m)
        return null;
    const value = fmtScalar(m.value);
    const unit = (_a = m.unit) !== null && _a !== void 0 ? _a : m.units;
    const uncertainty = fmtScalar((_b = m.uncertainty) !== null && _b !== void 0 ? _b : m.error);
    const label = (_c = m.label) !== null && _c !== void 0 ? _c : output.label;
    if (value == null)
        return null;
    return (_jsxs("div", { className: "astra-metric", children: [_jsx("span", { className: "astra-metric__value", children: value }), uncertainty != null ? (_jsx("span", { className: "astra-metric__uncertainty", children: uncertainty })) : null, unit ? _jsx("span", { className: "astra-metric__unit", children: unit }) : null, label ? _jsx("span", { className: "astra-metric__label", children: label }) : null] }));
};
/* ------------------------------------------------------------------ *
 * Fallback table built from the bounded output preview when the carrier has
 * no stock table children to render.
 * ------------------------------------------------------------------ */
const TableFromData = ({ output }) => {
    var _a, _b;
    const data = (_a = output.table_preview) !== null && _a !== void 0 ? _a : output.table_data;
    if (!data || !Array.isArray(data.rows) || data.rows.length === 0)
        return null;
    const headers = ((_b = data.headers) !== null && _b !== void 0 ? _b : []).slice(0, TABLE_PREVIEW_DISPLAY_COLUMNS);
    const rows = data.rows.slice(0, TABLE_PREVIEW_DISPLAY_ROWS);
    return (_jsxs("table", { className: "astra-outputs", children: [headers.length > 0 ? (_jsx("thead", { children: _jsx("tr", { children: headers.map((h, i) => (_jsx("th", { children: h }, `${h}-${i}`))) }) })) : null, _jsx("tbody", { children: rows.map((row, ri) => (_jsx("tr", { children: row.slice(0, TABLE_PREVIEW_DISPLAY_COLUMNS).map((cell, ci) => (_jsx("td", { children: cell }, ci))) }, ri))) })] }));
};
/** A short editorial caption line beneath the artifact. */
const OutputCaption = ({ output }) => {
    var _a;
    const text = (_a = output.description) !== null && _a !== void 0 ? _a : output.label;
    if (!text)
        return null;
    return (_jsx("div", { className: "astra-output__caption", children: _jsx(StoreProse, { text: text }) }));
};
export function AstraOutput({ node }) {
    var _a, _b;
    const identifier = (_a = node.identifier) !== null && _a !== void 0 ? _a : node.id;
    const entry = useEntryByIdentifier(identifier);
    const subtype = subtypeOf(node);
    // Preserve the carrier's astra-* classes so the stylesheet applies, and make
    // sure the base `astra-output` + subtype modifier are present even if the AST
    // class string only carried one of them.
    const baseClass = classNameOf(node);
    const className = baseClass && baseClass.includes('astra-output')
        ? baseClass
        : ['astra-output', subtype !== 'unknown' ? `astra-output--${subtype}` : '', baseClass]
            .filter(Boolean)
            .join(' ');
    const stockChildren = _jsx(MyST, { ast: node.children });
    // No store entry → degrade gracefully to the node's own stock children, but
    // keep the carrier wrapper so the layout/classes still apply. Never throw.
    const output = entry && isOutput(entry) ? entry : undefined;
    if (!output) {
        return (_jsx("div", { className: className, id: identifier, children: stockChildren }));
    }
    const hasStockChildren = Array.isArray(node.children) && node.children.length > 0;
    // A metric is presentable when the entry carries a metric value.
    const hasMetricValue = fmtScalar((_b = output.metric) === null || _b === void 0 ? void 0 : _b.value) != null;
    let body;
    if (subtype === 'metric') {
        if (hasMetricValue) {
            // Prefer the rich stat.
            body = _jsx(MetricStat, { output: output });
        }
        else if (hasStockChildren) {
            // No inlined value → fall back to the stock children.
            body = stockChildren;
        }
        else {
            body = _jsx(OutputCaption, { output: output });
        }
    }
    else if (subtype === 'table') {
        // Render the stock table when present; otherwise synthesize from preview data.
        body = hasStockChildren ? stockChildren : _jsx(TableFromData, { output: output });
    }
    else {
        // figure (and unknown) — render the stock figure children verbatim.
        body = hasStockChildren ? stockChildren : null;
    }
    // A metric carries its own label inside MetricStat; for figure/table show a
    // caption only when the stock children did not already supply one.
    const showCaption = subtype !== 'metric' && !hasStockChildren;
    return (_jsxs("div", { className: className, id: identifier, children: [body, showCaption ? _jsx(OutputCaption, { output: output }) : null, _jsx(ProvenanceDrawer, { output: output })] }));
}
/** Narrow an opaque store entry to a `SerializedOutput` (has an `id`). */
function isOutput(entry) {
    return (typeof entry === 'object' &&
        entry !== null &&
        typeof entry.id === 'string');
}
export default AstraOutput;
//# sourceMappingURL=AstraOutput.js.map