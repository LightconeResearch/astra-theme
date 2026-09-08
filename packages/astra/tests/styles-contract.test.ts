import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const entry = resolve(process.cwd(), 'packages/astra/styles/astra.css');
const css = readFileSync(entry, 'utf8');

const require_ = createRequire(entry);

/** Every rule the browser ends up with: this sheet plus what it @imports. */
function loadCascade(file: string, seen = new Set<string>()): string {
  if (seen.has(file)) return '';
  seen.add(file);
  const source = readFileSync(file, 'utf8');
  let cascade = source;
  for (const [, specifier] of source.matchAll(/@import\s+"([^"]+)"/g)) {
    const target = specifier.startsWith('.')
      ? resolve(dirname(file), specifier)
      : require_.resolve(specifier);
    cascade += `\n${loadCascade(target, seen)}`;
  }
  return cascade;
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
    item.isDirectory()
      ? sourceFiles(join(dir, item.name))
      : /\.tsx?$/.test(item.name)
        ? [join(dir, item.name)]
        : [],
  );
}

/**
 * Class tokens the renderers write into the DOM. Interpolated names
 * (`astra-type-glyph--${…}`) carry no literal to check, so they are skipped.
 */
function emittedClasses(): Map<string, string> {
  const patterns = [
    /className=\{?["'`]([^"'`]+)["'`]/g,
    /className:\s*["'`]([^"'`]+)["'`]/g,
    /nodeClassName\([^,]+,\s*["'`]([^"'`]+)["'`]\)/g,
    /triggerClassName\s*=\s*["'`]([^"'`]+)["'`]/g,
  ];
  const emitted = new Map<string, string>();
  for (const file of sourceFiles(resolve(process.cwd(), 'packages/astra/src'))) {
    const source = readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      for (const [, value] of source.matchAll(pattern)) {
        for (const token of value.split(/\s+/)) {
          if (!token.startsWith('astra-') || token.includes('${')) continue;
          if (!emitted.has(token)) emitted.set(token, file);
        }
      }
    }
  }
  return emitted;
}

/**
 * Classes that are vocabulary rather than presentation, so they are expected
 * to have no rule of their own:
 *  - `astra-ref--value` is a MyST dispatch selector (see src/renderers.ts);
 *  - `astra-ref--decision` echoes the AST class MySTRA emits for decision
 *    refs, keeping the provenance anchor's markup identical to inline ones.
 */
const UNSTYLED_BY_DESIGN = new Set(['astra-ref--value', 'astra-ref--decision']);

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
    expect(css).toContain('--astra-c-finding: var(--astra-color-kind-finding);');
  });

  it('styles every class the renderers emit', () => {
    const cascade = loadCascade(entry);
    const styled = new Set(
      [...cascade.matchAll(/\.(astra-[A-Za-z0-9_-]+)/g)].map(([, name]) => name),
    );

    const orphans = [...emittedClasses()]
      .filter(([token]) => !styled.has(token) && !UNSTYLED_BY_DESIGN.has(token))
      .map(([token, file]) => `${token} (${file})`);

    expect(orphans).toEqual([]);
  });

  it('keeps registry identifiers visually identical when no anchor is available', () => {
    expect(css).toMatch(
      /\.astra-inputs \.astra-id,\s*\.astra-outputs \.astra-id \{[^}]*font-weight: 500;[^}]*text-decoration: underline;/,
    );
  });
});
