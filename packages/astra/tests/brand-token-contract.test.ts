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
  '--astra-paper',
  '--astra-surface',
  '--astra-surface-2',
  '--astra-ink',
  '--astra-ink-soft',
  '--astra-muted',
  '--astra-faint',
  '--astra-rule',
  '--astra-rule-strong',
  '--astra-accent',
  '--astra-link',
  '--astra-accent-soft',
  '--astra-kicker',
  '--astra-c-decision',
  '--astra-c-finding',
  '--astra-c-insight',
  '--astra-c-analysis',
  '--astra-c-output',
  '--astra-c-input',
  '--astra-c-value',
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
  it('keeps the publication palette on the canonical shared token names', () => {
    const light = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1];
    const dark = css.match(/html\.dark\s*\{([\s\S]*?)\}/)?.[1];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    for (const token of CANONICAL_BRAND_TOKENS) {
      expect(light).toContain(`${token}:`);
    }
  });

  it('contains no project-inventory styling', () => {
    expect(css).not.toMatch(/\.astra-inventory(?:\b|__)/);
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
