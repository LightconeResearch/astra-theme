// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it, onTestFinished } from 'vitest';

const script = path.resolve(__dirname, '../scripts/relativize-css-assets.mjs');

/** A public/ directory holding the given files, removed when the test ends. */
async function publicDir(files: Record<string, string>): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), 'astra-css-assets-'));
  onTestFinished(() => rm(directory, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(directory, name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  return directory;
}

it('rewrites public-path urls relative to each stylesheet under build/', async () => {
  const dir = await publicDir({
    'build/_assets/astra-ABC.css':
      '@font-face{src:url(/myst_assets_folder/_assets/Newsreader-DEF.woff2) format("woff2")}' +
      '.a{background:url("/myst_assets_folder/_assets/mark-GHI.svg")}' +
      ".b{background:url('/myst_assets_folder/images/logo.png')}" +
      '.c{background:url(data:image/png;base64,AAAA)}',
    'build/nested/deep/page.css': '.d{cursor:url(/myst_assets_folder/_assets/cursor.cur)}',
    'build/_assets/entry.js': 'export const css = "/myst_assets_folder/_assets/astra-ABC.css";',
    'thebe-core.css': '.e{background:url(/myst_assets_folder/_assets/outside.png)}',
  });

  execFileSync(process.execPath, [script, dir], { stdio: 'pipe' });

  expect(await readFile(path.join(dir, 'build/_assets/astra-ABC.css'), 'utf8')).toBe(
    '@font-face{src:url(Newsreader-DEF.woff2) format("woff2")}' +
      '.a{background:url("mark-GHI.svg")}' +
      ".b{background:url('../images/logo.png')}" +
      '.c{background:url(data:image/png;base64,AAAA)}'
  );
  expect(await readFile(path.join(dir, 'build/nested/deep/page.css'), 'utf8')).toBe(
    '.d{cursor:url(../../_assets/cursor.cur)}'
  );
  // Scripts and stylesheets outside build/ keep the public path.
  expect(await readFile(path.join(dir, 'build/_assets/entry.js'), 'utf8')).toContain(
    '/myst_assets_folder/'
  );
  expect(await readFile(path.join(dir, 'thebe-core.css'), 'utf8')).toContain('/myst_assets_folder/');
});

it('fails the build when a public-path reference survives the rewrite', async () => {
  const css = '@import "/myst_assets_folder/_assets/other.css";';
  const dir = await publicDir({ 'build/_assets/astra-ABC.css': css });

  expect(() => execFileSync(process.execPath, [script, dir], { stdio: 'pipe' })).toThrow(
    expect.objectContaining({ status: 1 })
  );
  expect(await readFile(path.join(dir, 'build/_assets/astra-ABC.css'), 'utf8')).toBe(css);
});

it('fails without a public directory argument', () => {
  expect(() => execFileSync(process.execPath, [script], { stdio: 'pipe' })).toThrow(
    expect.objectContaining({ status: 1 })
  );
});
