import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MyST } from 'myst-to-react';
import { useEntryByIdentifier } from '../store/useAstraStore';
import { KindLabel } from '../card';
import { StoreProse } from '../storeProse';
/**
 * Decide whether this finding is in `:compact:` form (no notes). The plugin may
 * surface the directive option in a few neutral ways depending on stock-node
 * shape — a modifier class, a `data.compact` / `data.astra.compact` flag, or a
 * plain node property — so we look in all of them and degrade to `false`.
 */
function isCompact(node) {
    var _a, _b;
    const data = ((_a = node.data) !== null && _a !== void 0 ? _a : {});
    return (/\bastra-finding--compact\b/.test(typeof node.class === 'string' ? node.class : '') ||
        data.compact === true ||
        ((_b = data.astra) === null || _b === void 0 ? void 0 : _b.compact) === true ||
        node.compact === true);
}
/**
 * Render the finding carrier as a finding card. Falls back to the node's stock
 * children whenever the store entry cannot be resolved.
 */
export function AstraFinding({ node }) {
    var _a;
    const entry = useEntryByIdentifier(node.identifier);
    // Preserve the carrier's own astra-* (and any other) classes on the root so
    // the stylesheet's `.astra-finding` treatment applies regardless of branch.
    const rootClass = typeof node.class === 'string' ? node.class : 'astra-finding';
    // Graceful degradation: no joined entry -> render the node's stock children.
    if (!entry) {
        return (_jsx("div", { className: rootClass, id: node.identifier, children: _jsx(MyST, { ast: node.children }) }));
    }
    const compact = isCompact(node);
    const claim = (_a = entry.claim) !== null && _a !== void 0 ? _a : entry.label;
    return (
    // The carrier's `finding-<id>` identifier becomes the anchor id so
    // cross-page `#finding-<id>` links resolve to the placed card.
    _jsxs("div", { className: rootClass, id: node.identifier, children: [_jsx(KindLabel, { kind: "finding", className: "astra-finding__kind" }), claim ? (_jsx("div", { className: "astra-finding__claim", children: _jsx(StoreProse, { text: claim }) })) : null, entry.scope ? (_jsx("span", { className: "astra-scope-chip", children: _jsx(StoreProse, { text: entry.scope }) })) : null, !compact && entry.notes ? (_jsx("div", { className: "astra-finding__notes", children: _jsx(StoreProse, { text: entry.notes }) })) : null] }));
}
export default AstraFinding;
//# sourceMappingURL=AstraFinding.js.map