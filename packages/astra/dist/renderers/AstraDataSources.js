import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MyST } from 'myst-to-react';
import { useAstraStore } from '../store/useAstraStore';
import { StoreProse } from '../storeProse';
/** The class string the plugin stamps onto the table carrier (string | array). */
function nodeClass(node) {
    const cls = node.class;
    if (typeof cls === 'string')
        return cls;
    if (Array.isArray(cls))
        return cls.join(' ');
    return '';
}
/** Branch the carrier onto its registry table, or `undefined` if neither. */
function registryOf(node) {
    const cls = nodeClass(node);
    if (/\bastra-outputs\b/.test(cls))
        return 'outputs';
    if (/\bastra-inputs\b/.test(cls))
        return 'inputs';
    return undefined;
}
/** Carrier-id prefix + anchor target per registry. */
const PREFIX = { inputs: 'input', outputs: 'output' };
/** Pull the ordered rows for a registry from the store (empty array on miss). */
function rowsFor(store, registry) {
    var _a, _b;
    if (registry === 'inputs') {
        return Object.values((_a = store.inputs) !== null && _a !== void 0 ? _a : {}).map((e) => {
            var _a;
            return ({
                id: e.id,
                label: e.label,
                type: e.type,
                description: e.description,
                source: (_a = e.source) !== null && _a !== void 0 ? _a : e.from,
            });
        });
    }
    return Object.values((_b = store.outputs) !== null && _b !== void 0 ? _b : {}).map((e) => {
        var _a, _b, _c;
        return ({
            id: e.id,
            label: e.label,
            type: e.type,
            description: e.description,
            source: (_c = (_b = (_a = e.recipe) === null || _a === void 0 ? void 0 : _a.command) !== null && _b !== void 0 ? _b : e.resolved_path) !== null && _c !== void 0 ? _c : e.from,
        });
    });
}
/** Maps a registry + entry type to a `.astra-type-glyph--<modifier>` suffix. */
function glyphModifier(registry, type) {
    if (registry === 'inputs')
        return 'input';
    const t = (type !== null && type !== void 0 ? type : '').toLowerCase();
    if (t === 'figure' || t === 'fig' || t === 'image')
        return 'figure';
    if (t === 'table' || t === 'tbl')
        return 'table';
    if (t === 'metric' || t === 'value' || t === 'number')
        return 'metric';
    // default to the generic output glyph
    return 'figure';
}
export const AstraDataSources = ({ node }) => {
    const store = useAstraStore();
    const registry = registryOf(node);
    const cls = nodeClass(node);
    // No registry class, no store, or an empty registry → defer to stock children.
    const rows = store && registry ? rowsFor(store, registry) : [];
    if (!store || !registry || rows.length === 0) {
        return _jsx(MyST, { ast: node.children });
    }
    const prefix = PREFIX[registry];
    const heading = registry === 'inputs' ? 'Inputs' : 'Outputs';
    const firstCol = registry === 'inputs' ? 'Input' : 'Output';
    return (
    // The wrapper keeps a wide registry (long mono ids + source paths)
    // scrolling inside the article column instead of panning the whole page —
    // stock MyST tables get the same treatment from the book theme.
    _jsx("div", { className: "astra-registry-scroll", children: _jsxs("table", { className: cls || `astra-${registry}`, children: [_jsx("caption", { children: heading }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: firstCol }), _jsx("th", { scope: "col", children: "Type" }), _jsx("th", { scope: "col", children: "Description" })] }) }), _jsx("tbody", { children: rows.map((row) => {
                        var _a;
                        const anchor = `#${prefix}-${row.id}`;
                        const mod = glyphModifier(registry, row.type);
                        return (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("span", { className: `astra-type-glyph astra-type-glyph--${mod}`, "aria-hidden": "true" }), _jsx("a", { className: "astra-id", href: anchor, children: row.id }), row.label ? (_jsxs("span", { className: "astra-ds__label", children: [" ", row.label] })) : null] }), _jsx("td", { children: (_a = row.type) !== null && _a !== void 0 ? _a : '—' }), _jsxs("td", { children: [row.description ? (_jsx("span", { className: "astra-ds__desc", children: _jsx(StoreProse, { text: row.description }) })) : null, row.source ? (_jsx("code", { className: "astra-ds__source", children: row.source })) : !row.description ? ('—') : null] })] }, row.id));
                    }) })] }) }));
};
export default AstraDataSources;
//# sourceMappingURL=AstraDataSources.js.map