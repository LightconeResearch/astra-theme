import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MyST } from 'myst-to-react';
import { useEntryByIdentifier } from '../store/useAstraStore';
import { labelFor } from '../glyphs';
import { AstraCite } from '../cite';
import { StoreProse } from '../storeProse';
export const AstraPriorInsight = ({ node }) => {
    const entry = useEntryByIdentifier(node.identifier);
    // Preserve the carrier's astra-* classes so the stylesheet applies. The
    // plugin emits "astra-prior-insight" on `node.class`; keep whatever is there.
    const className = ['astra-prior-insight', node.class]
        .filter(Boolean)
        .join(' ')
        .trim();
    // No store entry → fall back to the stock seealso admonition children.
    if (!entry) {
        return (_jsx("aside", { className: className || 'astra-prior-insight', children: _jsx(MyST, { ast: node.children }) }));
    }
    const { label, claim, scope, doi, quote } = entry;
    return (_jsxs("aside", { className: className || 'astra-prior-insight', children: [_jsxs("div", { className: "astra-prior-insight__kind", children: [labelFor('prior_insight'), scope ? (_jsx("span", { className: "astra-scope-chip", children: _jsx(StoreProse, { text: scope }) })) : null] }), label ? _jsx("div", { className: "astra-card__title", children: label }) : null, claim ? (_jsx("div", { className: "astra-insight__claim", children: _jsx(StoreProse, { text: claim }) })) : null, quote ? (_jsx("blockquote", { className: "astra-quote", children: _jsx(StoreProse, { text: quote }) })) : null, doi ? (_jsxs("div", { className: "astra-cite", children: [_jsx("span", { className: "astra-cite__label", children: "Source" }), _jsx(AstraCite, { doi: doi })] })) : null, !label && !claim && !quote && !doi ? (_jsx(MyST, { ast: node.children })) : null] }));
};
export default AstraPriorInsight;
//# sourceMappingURL=AstraPriorInsight.js.map