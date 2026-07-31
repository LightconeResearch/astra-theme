import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { MyST } from 'myst-to-react';
import katex from 'katex';
/** Balanced inline tokens: `code` (may contain $) or $math$ (single-line). */
const INLINE_TOKEN = /(`[^`\n]+`|\$[^$\n]+\$)/g;
/**
 * An inlineMath node with the KaTeX HTML baked in. The stock myst-to-react
 * math renderer does NOT run KaTeX — it injects a pre-rendered `node.html`
 * (MyST's build pipeline adds it) and shows an inline ERROR token when the
 * field is missing. Store strings never pass through that pipeline, so we
 * render here; `throwOnError: false` makes bad TeX display literally (in
 * KaTeX's error colour) instead of breaking the card.
 */
function inlineMathNode(value) {
    return {
        type: 'inlineMath',
        value,
        html: katex.renderToString(value, { throwOnError: false }),
    };
}
/** Tokenize a raw store-prose string into stock mdast inline nodes. */
export function parseStoreProse(text) {
    var _a;
    const nodes = [];
    let last = 0;
    for (const m of text.matchAll(INLINE_TOKEN)) {
        const idx = (_a = m.index) !== null && _a !== void 0 ? _a : 0;
        if (idx > last)
            nodes.push({ type: 'text', value: text.slice(last, idx) });
        const tok = m[0];
        if (tok.startsWith('`')) {
            nodes.push({ type: 'inlineCode', value: tok.slice(1, -1) });
        }
        else {
            nodes.push(inlineMathNode(tok.slice(1, -1)));
        }
        last = idx + tok.length;
    }
    if (last < text.length)
        nodes.push({ type: 'text', value: text.slice(last) });
    return nodes;
}
/** Render a store prose string with inline math / code resolved. */
export const StoreProse = ({ text }) => {
    if (!text)
        return null;
    // Fast path: nothing to parse — avoid the MyST pipeline for plain strings.
    if (!/[`$]/.test(text))
        return _jsx(_Fragment, { children: text });
    return _jsx(MyST, { ast: parseStoreProse(text) });
};
export default StoreProse;
//# sourceMappingURL=storeProse.js.map