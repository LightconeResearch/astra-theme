import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  join(process.cwd(), 'packages/astra/styles/astra.css'),
  'utf8',
);
const brandCss = readFileSync(
  join(process.cwd(), 'node_modules/@lightcone-research/lightcone-brand/brand.css'),
  'utf8',
);
const articleRoot = readFileSync(
  join(process.cwd(), 'themes/article/app/root.tsx'),
  'utf8',
);
const bookRoot = readFileSync(
  join(process.cwd(), 'themes/book/app/root.tsx'),
  'utf8',
);
// The article theme's brand scope lives on the page wrapper so the header
// band and footer resolve tokens too.
const articlePageWrapper = readFileSync(
  join(process.cwd(), 'themes/article/app/components/ArticlePageAndNavigation.tsx'),
  'utf8',
);
const bookRoute = readFileSync(
  join(process.cwd(), 'themes/book/app/routes/$.tsx'),
  'utf8',
);

const PORTABLE_BRAND_TOKENS = [
  '--astra-canvas',
  '--astra-panel',
  '--astra-raised',
  '--astra-hover',
  '--astra-artifact-paper',
  '--astra-artifact-ink',
  '--astra-ink',
  '--astra-ink-soft',
  '--astra-muted',
  '--astra-faint',
  '--astra-rule-subtle',
  '--astra-rule',
  '--astra-rule-strong',
  '--astra-action',
  '--astra-focus',
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
  '--astra-mono',
  '--astra-measure',
  '--astra-card-w',
  '--astra-radius',
  '--astra-shadow',
  '--astra-kind',
];

describe('portable brand-token boundary', () => {
  it('imports the official portable brand contract in both publication themes', () => {
    for (const root of [articleRoot, bookRoot]) {
      expect(root).toContain("@lightcone-research/lightcone-brand/theme.css");
      expect(root).toContain("@lightcone-research/astra-ui/components.css");
    }
    const light = brandCss.match(
      /\.lightcone-brand,\s*\.lightcone-brand \.astra-ui,\s*\.astra-ui\[data-astra-theme="brand-light"\]\s*\{([\s\S]*?)\}/,
    )?.[1];
    const dark = brandCss.match(
      /\.lightcone-brand\[data-astra-color-scheme="dark"\],[\s\S]*?\.astra-ui\[data-astra-theme="brand-dark"\]\s*\{([\s\S]*?)\}/,
    )?.[1];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    for (const token of PORTABLE_BRAND_TOKENS) {
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
    // The page ground is the brand canvas (parchment/charcoal); raised
    // surfaces are panels — paper on parchment.
    expect(css).toMatch(/\.lightcone-brand\s*\{[\s\S]*?--astra-paper:\s*var\(--astra-canvas\)/);
    expect(css).toMatch(/\.lightcone-brand\s*\{[\s\S]*?--astra-surface:\s*var\(--astra-panel\)/);
    expect(css).toMatch(
      /\.astra-card-portal\.lightcone-brand\s*\{[\s\S]*?min-height:\s*0/,
    );
    expect(css).not.toMatch(/--astra-action:\s*#[0-9a-f]{6}/i);
  });

  it('uses the approved blue ink and antique gold roles', () => {
    expect(brandCss).toMatch(/--astra-action:\s*#4e5a70/i);
    expect(brandCss).toMatch(/--astra-focus:\s*#3f7280/i);
    expect(css).toMatch(/--astra-accent:\s*var\(--astra-action\)/);
    expect(brandCss).toMatch(/--astra-link:\s*var\(--astra-action\)/);
    expect(brandCss).toMatch(/--astra-c-decision:\s*#a67c3c/i);
    expect(brandCss).toMatch(/--astra-c-decision-ink:\s*#765a2f/i);
    expect(brandCss).toMatch(/--astra-c-insight-ink:\s*#4e5a70/i);
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

  it('keeps paper typography editorial and technical chrome sans/mono', () => {
    expect(brandCss).toMatch(/--astra-heading:\s*"Quattrocento"/);
    expect(brandCss).toMatch(/--astra-serif:\s*"Newsreader"/);
    expect(css).toMatch(/--astra-ui:\s*var\(--astra-label\)/);
    expect(css).toMatch(/article,\s*article :is\(p, li, dd, dt, blockquote\)\s*\{[\s\S]*?font-family:\s*var\(--astra-serif\)/);
    expect(css).toMatch(/\.astra-card__kind\s*\{[\s\S]*?font-family:\s*var\(--astra-ui\)/);
  });

  it('keeps scientific artifacts on a paper-and-ink canvas', () => {
    expect(brandCss).toMatch(/--astra-artifact-paper:\s*#ffffff/i);
    expect(brandCss).toMatch(/--astra-artifact-ink:\s*#221f20/i);
    expect(css).toMatch(/\.astra-output--table table\s*\{[\s\S]*?background:\s*var\(--astra-artifact-paper\)/);
    expect(css).toMatch(/\.astra-output--table table\s*\{[\s\S]*?color:\s*var\(--astra-artifact-ink\)/);
  });

  it('contains no viewer application or graph styling', () => {
    expect(css).not.toMatch(/\.astra-inventory(?:\b|__)/);
    expect(css).not.toMatch(/\.astra-graph(?:\b|__)/);
    expect(css).not.toMatch(/@import\s+["']@lightcone-research\/astra-viewer-(?:react|model)/);
  });

  it.each([
    ['article', articlePageWrapper],
    ['book', bookRoute],
  ])('%s publication opts into the brand scope and follows MyST dark mode', (_, source) => {
    expect(source).toContain('lightcone-brand');
    expect(source).toContain('data-astra-color-scheme={theme ?? undefined}');
    expect(source).toContain('useThemeSwitcher');
  });
});
