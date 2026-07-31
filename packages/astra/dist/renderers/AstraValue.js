import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MyST } from 'myst-to-react';
import { useAstraEntry } from '../store/useAstraStore';
import { PreviewCard } from '../card/PreviewCard';
import { KindLabel, Title, Desc } from '../card';
import { StoreProse } from '../storeProse';
/** Pull the inline `data.astra` payload off the node, tolerating absence. */
function inlineAstra(node) {
    var _a, _b;
    const data = ((_a = node === null || node === void 0 ? void 0 : node.data) !== null && _a !== void 0 ? _a : {});
    return (_b = data.astra) !== null && _b !== void 0 ? _b : {};
}
/**
 * Compose the root className: preserve whatever astra-* classes the plugin
 * stamped on the node (e.g. `astra-ref astra-ref--value astra-ref--metric`) so
 * the design system applies. Fall back to the canonical pair if absent.
 */
function rootClassName(node) {
    const cls = node.class;
    return typeof cls === 'string' && cls.trim()
        ? cls.trim()
        : 'astra-ref astra-ref--value';
}
export const AstraValue = ({ node }) => {
    var _a, _b, _c, _d;
    const astra = inlineAstra(node);
    const id = astra.id;
    // Join the value to its source product/output (kind 'value' -> outputs table).
    // The path key resolves cross-scope products (merged from sub-analyses).
    const entry = useAstraEntry('output', id, astra.path);
    // The visible number is always the node's own children — rendered through the
    // stock pipeline so any inline markup inside it survives.
    const number = _jsx(MyST, { ast: node.children });
    const valueSpan = _jsx("span", { className: rootClassName(node), children: number });
    // No join target (missing store / unknown id): degrade to the bare number.
    if (!entry) {
        return valueSpan;
    }
    // Surface the underlying metric unit when this value came from a metric output.
    const unit = (_b = (_a = entry.metric) === null || _a === void 0 ? void 0 : _a.unit) !== null && _b !== void 0 ? _b : (_c = entry.metric) === null || _c === void 0 ? void 0 : _c.units;
    // The selection that produced THIS number — the plugin stamps the role's
    // `col=` / `where=` options (and the product label) onto the span, so the
    // card can say which cell of which product it is, not just repeat the
    // product's caption (which is identical for every value pulled from it).
    const col = astra.col;
    const where = astra.filter;
    const product = (_d = entry.label) !== null && _d !== void 0 ? _d : astra.product;
    return (_jsxs(PreviewCard, { kind: "value", trigger: valueSpan, children: [_jsx(KindLabel, { kind: "output" }), _jsx(Title, { children: _jsxs("span", { className: "astra-ref astra-ref--value", children: [number, unit ? _jsxs("span", { className: "astra-card__unit", children: [" ", unit] }) : null] }) }), col || where || product ? (_jsxs("div", { className: "astra-value__selection", children: [col ? _jsx("code", { className: "astra-value__col", children: col }) : null, where ? _jsx("span", { className: "astra-value__where", children: where }) : null, product ? (_jsxs("span", { className: "astra-value__product", children: ["from ", product] })) : null] })) : null, entry.description ? (_jsx(Desc, { children: _jsx(StoreProse, { text: entry.description }) })) : null] }));
};
export default AstraValue;
//# sourceMappingURL=AstraValue.js.map