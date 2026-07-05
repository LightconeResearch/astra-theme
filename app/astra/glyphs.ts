/**
 * Uppercase kind labels used in the card kind-row, keyed by ASTRA kind string.
 * The per-kind glyphs (◇ ◈ ● ◐ ◆ ▤) and accent colours are supplied entirely
 * by the stylesheet (`--astra-glyph` / `--astra-kind` on the `astra-*` kind
 * modifier classes), so the components only ever render the text label.
 */
export const KIND_LABELS: Record<string, string> = {
  decision: 'DECISION',
  prior_insight: 'PRIOR INSIGHT',
  finding: 'FINDING',
  analysis: 'SUB-ANALYSIS',
  output: 'OUTPUT',
  input: 'INPUT',
};

/** Kind-label lookup that degrades gracefully for unknown kinds. */
export function labelFor(kind: string): string {
  return KIND_LABELS[kind] ?? kind.toUpperCase();
}
