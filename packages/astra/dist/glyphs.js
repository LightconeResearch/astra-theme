/**
 * Uppercase kind labels used in the card kind-row, keyed by ASTRA kind string.
 * The per-kind glyphs (◇ ◈ ● ◐ ◆ ▤) and accent colours are supplied entirely
 * by the stylesheet (`--astra-glyph` / `--astra-kind` on the `astra-*` kind
 * modifier classes), so the components only ever render the text label.
 */
const KIND_LABELS = {
    decision: 'DECISION',
    prior_insight: 'PRIOR INSIGHT',
    finding: 'FINDING',
    analysis: 'SUB-ANALYSIS',
    output: 'OUTPUT',
    input: 'INPUT',
};
/** Kind-label lookup that degrades gracefully for unknown kinds. */
export function labelFor(kind) {
    var _a;
    return (_a = KIND_LABELS[kind]) !== null && _a !== void 0 ? _a : kind.toUpperCase();
}
//# sourceMappingURL=glyphs.js.map