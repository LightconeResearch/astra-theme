import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { insightEvidenceName } from './insightEvidenceName';
export function InsightEvidenceTitle({ entry, name = insightEvidenceName(entry), tag, }) {
    return (_jsxs("span", { className: "astra-evidence__title", children: [_jsx("span", { className: "astra-evidence__glyph--insight", "aria-hidden": "true", children: "\u25C8" }), _jsx("span", { className: "astra-evidence__name", children: name }), tag ? _jsx("span", { className: "astra-evidence__tag", children: tag }) : null] }));
}
//# sourceMappingURL=InsightEvidenceTitle.js.map