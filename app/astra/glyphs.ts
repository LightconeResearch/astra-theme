import type { AstraKind } from '@astra-spec/store-types';

/**
 * Vellum design-language glyphs — one per ASTRA kind. These prefix the inline
 * `{astra:*}` reference tokens and label the kind row of every preview / block
 * card. `value` is self-describing (the computed number is the text) and gets
 * no glyph.
 */
export const GLYPHS: Record<AstraKind, string> = {
  decision: '◇',
  prior_insight: '◈',
  finding: '●',
  analysis: '◐',
  output: '◆',
  value: '',
};

/**
 * Uppercase kind labels used in the card kind-row. Keyed by ASTRA kind string.
 * `value` is intentionally absent (value refs never show a kind label).
 */
export const KIND_LABELS: Record<string, string> = {
  decision: 'DECISION',
  prior_insight: 'PRIOR INSIGHT',
  finding: 'FINDING',
  analysis: 'SUB-ANALYSIS',
  output: 'OUTPUT',
};

/**
 * Maps an ASTRA kind to the CSS custom property holding its (desaturated)
 * accent color. The card / inline-token CSS reads this var to tint the glyph,
 * kind label and rules per kind.
 */
export const kindToCssVar: Record<string, string> = {
  decision: '--astra-c-decision',
  prior_insight: '--astra-c-insight',
  finding: '--astra-c-finding',
  analysis: '--astra-c-analysis',
  output: '--astra-c-output',
  value: '--astra-c-value',
};

/** Glyph lookup that degrades gracefully for unknown kinds. */
export function glyphFor(kind: string): string {
  return (GLYPHS as Record<string, string>)[kind] ?? '';
}

/** Kind-label lookup that degrades gracefully for unknown kinds. */
export function labelFor(kind: string): string {
  return KIND_LABELS[kind] ?? kind.toUpperCase();
}

/** CSS-var lookup that degrades gracefully for unknown kinds. */
export function cssVarFor(kind: string): string {
  return kindToCssVar[kind] ?? '--astra-accent';
}
