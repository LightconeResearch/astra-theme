import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  resolve(process.cwd(), 'packages/astra/styles/astra.css'),
  'utf8',
);

describe('shared ASTRA stylesheet contract', () => {
  it('loads the published brand adapter before astra-ui views', () => {
    const brandImport =
      '@import "@lightcone-research/brand/adapters/astra.css";';
    const uiImport = '@import "@astra-spec/ui/views.css";';

    expect(css.indexOf(brandImport)).toBe(0);
    expect(css.indexOf(uiImport)).toBeGreaterThan(css.indexOf(brandImport));
    expect(css.indexOf(uiImport)).toBeLessThan(css.indexOf(':root'));
  });

  it('delegates UI appearance to the shared packages', () => {
    expect(css).toContain('@import "@astra-spec/ui/isolate.css";');
    expect(css).not.toMatch(/--astra-font-size(?:-|:)/);
    expect(css).not.toContain('.astra-record-preview__header');
    expect(css).not.toContain('.astra-ref::before');
    expect(css).toContain('--astra-serif: var(--lc-font-body);');
    expect(css).toContain('--astra-mono: var(--lc-font-mono);');
    expect(css).toContain('--astra-c-finding: var(--lc-astra-color-kind-finding);');
  });

  it('keeps registry identifiers visually identical when no anchor is available', () => {
    expect(css).toMatch(
      /\.astra-inputs \.astra-id,\s*\.astra-outputs \.astra-id \{[^}]*font-weight: 500;[^}]*text-decoration: underline;/,
    );
  });
});
