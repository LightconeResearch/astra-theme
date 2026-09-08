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

  it('keeps the preview compatibility layer branded and scheme-aware', () => {
    expect(css).toContain(
      ':where(.lightcone-brand.astra-ui, .lightcone-brand .astra-ui)',
    );
    expect(css).toContain('data-lightcone-color-scheme="dark"');
    expect(css).toContain('data-astra-color-scheme="dark"');
    expect(css).toContain(
      '--astra-color-kind-output: var(--lc-palette-blue-ink);',
    );
    expect(css).toContain(
      '--astra-color-kind-finding: var(--lc-palette-vert-de-gris);',
    );
    expect(css).toContain(
      '--astra-color-kind-insight: var(--lc-palette-wax-red);',
    );
    expect(css).toContain(
      '--astra-color-canvas: var(--lc-palette-charcoal);',
    );
    expect(css).toContain(
      '--astra-color-text: var(--lc-palette-darker-parchment);',
    );
    expect(css).toContain('--astra-radius-preview: 3px;');
    expect(css).toContain('--astra-shadow-preview: var(--astra-shadow);');
    expect(css).toContain('--astra-z-preview: 60;');
    expect(css).toContain(
      '.lightcone-brand.astra-ui[data-entry-kind="value"]',
    );
    expect(css).toContain(
      '--astra-color-kind-output: var(--astra-c-value);',
    );
    expect(css).toContain('max-width: calc(100vw - 2rem);');
    expect(css).toContain(
      'border: 1px solid color-mix(in srgb, var(--astra-kind) 55%, transparent);',
    );
    expect(css).toContain('.astra-preview-popover__arrow path');
    expect(css).toContain('fill: #000;');
    expect(css).toMatch(
      /\.lightcone-brand\.astra-ui\.astra-preview-popover-portal\[data-astra-color-scheme="dark"\][^{}]*\.astra-preview-popover__arrow path \{\s*fill: #fff;/,
    );
    expect(css).toContain('font: 600 20px/1.25 var(--astra-label);');
    expect(css).toContain('font: 500 10px/1.5 var(--astra-label);');
    expect(css).toContain('border-left: 2px solid var(--astra-rule-strong);');
    expect(css).toContain('font: 400 11px/1.5 var(--astra-mono);');
    expect(css).toContain('data-value-product');
    expect(css).toContain('color: #60a5fa;');
    expect(css).toContain('color: #3b82f6;');
    expect(css).toContain('color: #93c5fd;');
    expect(css).toContain('.astra-citation-preview-portal');
    expect(css).toContain('.astra-citation-preview');
    expect(css).toContain('z-index: 70;');
    expect(css).toContain(
      '.astra-record-preview__artifact > .astra-output__thumb > img',
    );
    expect(css).toContain(
      '.astra-record-preview[data-kind="input"]',
    );
    expect(css).toContain('content: "\\25A4";');
  });

  it('preserves the externally loaded italic and mono families first', () => {
    expect(css).toContain(
      '--astra-serif: "Newsreader", var(--lc-font-body,',
    );
    expect(css).toContain(
      '--astra-font-body: "Newsreader", var(--lc-font-body);',
    );
    expect(css).toContain(
      '--astra-mono: "JetBrains Mono", var(--lc-font-mono,',
    );
    expect(css).toContain(
      '--astra-font-mono: "JetBrains Mono", var(--lc-font-mono);',
    );
  });

  it('keeps registry identifiers visually identical when no anchor is available', () => {
    expect(css).toMatch(
      /\.astra-inputs \.astra-id,\s*\.astra-outputs \.astra-id \{[^}]*font-weight: 500;[^}]*text-decoration: underline;/,
    );
  });
});
