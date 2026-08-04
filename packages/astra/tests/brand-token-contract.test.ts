import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  join(process.cwd(), 'packages/astra/styles/astra.css'),
  'utf8',
);
const articlePage = readFileSync(
  join(process.cwd(), 'themes/article/app/components/ArticlePage.tsx'),
  'utf8',
);
const bookRoute = readFileSync(
  join(process.cwd(), 'themes/book/app/routes/$.tsx'),
  'utf8',
);

const CANONICAL_BRAND_TOKENS = [
  '--astra-canvas',
  '--astra-panel',
  '--astra-raised',
  '--astra-hover',
  '--astra-artifact-paper',
  '--astra-artifact-ink',
  '--astra-paper',
  '--astra-surface',
  '--astra-surface-2',
  '--astra-ink',
  '--astra-ink-soft',
  '--astra-muted',
  '--astra-faint',
  '--astra-rule-subtle',
  '--astra-rule',
  '--astra-rule-strong',
  '--astra-action',
  '--astra-focus',
  '--astra-accent',
  '--astra-link',
  '--astra-accent-soft',
  '--astra-kicker',
  '--astra-c-decision',
  '--astra-c-decision-ink',
  '--astra-c-finding',
  '--astra-c-insight',
  '--astra-c-insight-ink',
  '--astra-c-analysis',
  '--astra-c-output',
  '--astra-c-input',
  '--astra-c-value',
  '--astra-c-result',
  '--astra-c-danger',
  '--astra-c-input-soft',
  '--astra-c-analysis-soft',
  '--astra-c-output-soft',
  '--astra-c-decision-soft',
  '--astra-c-finding-soft',
  '--astra-c-insight-soft',
  '--astra-c-value-soft',
  '--astra-c-danger-soft',
  '--astra-heading',
  '--astra-serif',
  '--astra-label',
  '--astra-ui',
  '--astra-mono',
  '--astra-measure',
  '--astra-card-w',
  '--astra-radius',
  '--astra-shadow',
  '--astra-kind',
];

describe('portable brand-token boundary', () => {
  it('keeps a root fallback and explicit publication light/dark scopes', () => {
    const light = css.match(
      /:root,\s*\.astra-brand\[data-astra-color-scheme="light"\]\s*\{([\s\S]*?)\}/,
    )?.[1];
    const dark = css.match(
      /html\.dark,\s*\.astra-brand\[data-astra-color-scheme="dark"\]\s*\{([\s\S]*?)\}/,
    )?.[1];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    for (const token of CANONICAL_BRAND_TOKENS) {
      expect(light).toContain(`${token}:`);
    }
    for (const token of [
      '--astra-artifact-paper',
      '--astra-artifact-ink',
      '--astra-action',
      '--astra-focus',
      '--astra-c-input',
      '--astra-c-analysis',
      '--astra-c-output',
      '--astra-c-decision',
      '--astra-c-decision-ink',
      '--astra-c-finding',
      '--astra-c-insight',
      '--astra-c-insight-ink',
      '--astra-c-result',
      '--astra-c-danger',
    ]) {
      expect(dark).toContain(`${token}:`);
    }
  });

  it('uses the approved blue ink and antique gold roles', () => {
    expect(css).toMatch(/--astra-action:\s*#4E5A70/i);
    expect(css).toMatch(/--astra-focus:\s*#3F7280/i);
    expect(css).toMatch(/--astra-accent:\s*var\(--astra-action\)/);
    expect(css).toMatch(/--astra-link:\s*var\(--astra-action\)/);
    expect(css).toMatch(/--astra-c-decision:\s*#A67C3C/i);
    expect(css).toMatch(/--astra-c-decision-ink:\s*#765A2F/i);
    expect(css).toMatch(/--astra-c-insight-ink:\s*#4E5A70/i);
    expect(css).toMatch(
      /\.astra-decision__toggle button\.is-active\s*\{[\s\S]*?background:\s*var\(--astra-c-decision-soft\)/,
    );
  });

  it('uses one link colour for underlined publication references', () => {
    expect(css).toMatch(
      /\.astra-ref\s*\{[\s\S]*?color:\s*var\(--astra-link\)[\s\S]*?text-decoration-color:\s*color-mix\(in srgb, var\(--astra-link\)/,
    );
    expect(css).toMatch(
      /\.astra-ref--value\s*\{[\s\S]*?color:\s*var\(--astra-link\)[\s\S]*?text-decoration:[^;]*var\(--astra-link\)/,
    );
    expect(css).toMatch(
      /\.astra-ref-trigger \.astra-evidence__name\s*\{[\s\S]*?color:\s*var\(--astra-link\)/,
    );
    expect(css).toMatch(/\.astra-cite a\s*\{[\s\S]*?color:\s*var\(--astra-link\)/);
    expect(css).toMatch(
      /\.astra-subanalysis__link:hover\s*\{[\s\S]*?color:\s*var\(--astra-link\)[\s\S]*?text-decoration-color:\s*var\(--astra-link\)/,
    );
  });

  it('keeps evidence kind tags inside their row when insight names are long', () => {
    expect(css).toMatch(
      /\.astra-evidence__title\s*\{[\s\S]*?grid-template-columns:\s*auto minmax\(0, 1fr\) auto/,
    );
    expect(css).toMatch(
      /\.astra-evidence__item > \.astra-ref-trigger\s*\{[\s\S]*?min-width:\s*0/,
    );
    expect(css).toMatch(
      /\.astra-evidence__name\s*\{[\s\S]*?min-width:\s*0[\s\S]*?overflow-wrap:\s*anywhere/,
    );
    expect(css).toMatch(
      /\.astra-evidence__tag\s*\{[\s\S]*?white-space:\s*nowrap/,
    );
  });

  it('keeps paper typography editorial and technical chrome sans/mono', () => {
    expect(css).toMatch(/--astra-heading:\s*"Quattrocento"/);
    expect(css).toMatch(/--astra-serif:\s*"Newsreader"/);
    expect(css).toMatch(/--astra-ui:\s*"IBM Plex Sans"/);
    expect(css).toMatch(/article,\s*article :is\(p, li, dd, dt, blockquote\)\s*\{[\s\S]*?font-family:\s*var\(--astra-serif\)/);
    expect(css).toMatch(/\.astra-card__kind\s*\{[\s\S]*?font-family:\s*var\(--astra-ui\)/);
  });

  it('keeps scientific artifacts on a paper-and-ink canvas', () => {
    expect(css).toMatch(/--astra-artifact-paper:\s*#FFFFFF/i);
    expect(css).toMatch(/--astra-artifact-ink:\s*#221F20/i);
    expect(css).toMatch(/\.astra-output--table table\s*\{[\s\S]*?background:\s*var\(--astra-artifact-paper\)/);
    expect(css).toMatch(/\.astra-output--table table\s*\{[\s\S]*?color:\s*var\(--astra-artifact-ink\)/);
  });

  it('contains no viewer application or graph styling', () => {
    expect(css).not.toMatch(/\.astra-inventory(?:\b|__)/);
    expect(css).not.toMatch(/\.astra-graph(?:\b|__)/);
    expect(css).not.toMatch(/@import\s+["']@lightcone-research\/astra-viewer-(?:react|model)/);
  });

  it.each([
    ['article', articlePage],
    ['book', bookRoute],
  ])('%s publication opts into the brand scope and follows MyST dark mode', (_, source) => {
    expect(source).toContain('astra-brand');
    expect(source).toContain('data-astra-color-scheme={theme ?? undefined}');
    expect(source).toContain('useThemeSwitcher');
  });
});
