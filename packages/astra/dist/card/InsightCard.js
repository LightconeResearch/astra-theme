import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { AstraCite } from '../cite';
import { KindLabel, Desc } from './CardChrome';
import { PreviewCard } from './PreviewCard';
import { StoreProse } from '../storeProse';
import { InsightEvidenceTitle } from './InsightEvidenceTitle';
import { insightEvidenceName } from './insightEvidenceName';
/** Reference-row name: authored label → insight id. */
function useInsightDisplayName(entry) {
    return insightEvidenceName(entry);
}
/** The full prior-insight hover-card body (untitled: the claim leads). */
export const InsightCard = ({ entry }) => {
    return (_jsxs(_Fragment, { children: [_jsx(KindLabel, { kind: "prior_insight" }), entry.claim ? (_jsx(Desc, { children: _jsx(StoreProse, { text: entry.claim }) })) : null, entry.quote ? (_jsx("div", { className: "astra-quote", children: _jsx(StoreProse, { text: entry.quote }) })) : null, entry.doi ? (_jsx("div", { className: "astra-cite", children: _jsx(AstraCite, { doi: entry.doi }) })) : null] }));
};
/**
 * A hoverable insight reference row (◈ + display name [+ tag]); hovering or
 * focusing it opens the full InsightCard as a nested preview card.
 */
export const InsightRef = ({ entry, tag, }) => {
    const name = useInsightDisplayName(entry);
    return (_jsx(PreviewCard, { kind: "prior_insight", trigger: _jsx(InsightEvidenceTitle, { entry: entry, name: name, tag: tag }), children: _jsx(InsightCard, { entry: entry }) }));
};
//# sourceMappingURL=InsightCard.js.map