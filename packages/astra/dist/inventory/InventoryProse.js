import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
/**
 * A deliberately small prose renderer for inventory metadata strings.
 *
 * The normal ASTRA report keeps using StoreProse and MyST's renderer registry.
 * The inventory snapshot carries plain strings rather than parsed MyST nodes,
 * so this renders the inline code and math forms used by ASTRA metadata without
 * mounting a second document pipeline.
 */
import * as React from 'react';
import katex from 'katex';
/** Balanced tokens: display math first, then `code`, then inline math. */
const PROSE_TOKEN = /(\$\$[\s\S]+?\$\$|`[^`\n]+`|\$[^$\n]+\$)/g;
function inlineMathNode(value) {
    return {
        type: 'inlineMath',
        value,
        html: katex.renderToString(value, { throwOnError: false }),
    };
}
function displayMathNode(value) {
    return {
        type: 'math',
        value,
        html: katex.renderToString(value, { displayMode: true, throwOnError: false }),
    };
}
export function parseInventoryProse(text) {
    var _a;
    const nodes = [];
    let last = 0;
    for (const match of text.matchAll(PROSE_TOKEN)) {
        const index = (_a = match.index) !== null && _a !== void 0 ? _a : 0;
        if (index > last)
            nodes.push({ type: 'text', value: text.slice(last, index) });
        const token = match[0];
        if (token.startsWith('$$')) {
            nodes.push(displayMathNode(token.slice(2, -2).trim()));
        }
        else if (token.startsWith('`')) {
            nodes.push({ type: 'inlineCode', value: token.slice(1, -1) });
        }
        else {
            nodes.push(inlineMathNode(token.slice(1, -1)));
        }
        last = index + token.length;
    }
    if (last < text.length)
        nodes.push({ type: 'text', value: text.slice(last) });
    return nodes;
}
export const InventoryProse = ({ text }) => {
    if (!text)
        return null;
    if (!/[`$]/.test(text))
        return _jsx(_Fragment, { children: text });
    return (_jsx(_Fragment, { children: parseInventoryProse(text).map((node, index) => {
            if (node.type === 'inlineCode')
                return _jsx("code", { children: node.value }, index);
            if (node.type === 'inlineMath') {
                return (_jsx("span", { dangerouslySetInnerHTML: { __html: node.html } }, index));
            }
            if (node.type === 'math') {
                return (_jsx("div", { className: "inventory-prose__display-math", dangerouslySetInnerHTML: { __html: node.html } }, index));
            }
            return _jsx(React.Fragment, { children: node.value }, index);
        }) }));
};
export default InventoryProse;
//# sourceMappingURL=InventoryProse.js.map