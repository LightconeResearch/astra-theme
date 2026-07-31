import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
export const DataFlow = ({ nodes }) => {
    const items = (nodes !== null && nodes !== void 0 ? nodes : []).filter((n) => n != null && n !== '');
    if (items.length === 0)
        return null;
    return (_jsx("div", { className: "astra-flow", role: "img", "aria-label": items.join(' to '), children: items.map((label, i) => (_jsxs(React.Fragment, { children: [i > 0 ? (_jsx("span", { className: "astra-flow__arrow", "aria-hidden": "true", children: "\u25B8" })) : null, _jsx("span", { className: "astra-flow__node", title: label, children: label })] }, `${label}-${i}`))) }));
};
//# sourceMappingURL=diagrams.js.map