export function decisionEvidenceIds(decision) {
    var _a;
    const { selected, option_insights: byOption = {} } = decision;
    const ordered = [
        ...(selected ? (_a = byOption[selected]) !== null && _a !== void 0 ? _a : [] : []),
        ...Object.entries(byOption)
            .filter(([optId]) => optId !== selected)
            .flatMap(([, ids]) => ids !== null && ids !== void 0 ? ids : []),
    ];
    return [...new Set(ordered)];
}
export function decisionEvidenceInsights(decision, store) {
    return decisionEvidenceIds(decision)
        .map((id) => { var _a; return (_a = store === null || store === void 0 ? void 0 : store.prior_insights) === null || _a === void 0 ? void 0 : _a[id]; })
        .filter((ins) => ins != null);
}
//# sourceMappingURL=decisionEvidence.js.map