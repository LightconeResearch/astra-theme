// @vitest-environment node
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, expect, it } from 'vitest';

const script = path.resolve(__dirname, '../scripts/relativize-css-assets.mjs');
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

async function publicDir(files: Record<string, string>): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), 'astra-css-assets-'));
  directories.push(directory);
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(directory, 'public', name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  return path.join(directory, 'public');
}

it('rewrites public-path urls relative to each stylesheet under build/', async () => {
  const dir = await publicDir({
    'build/_assets/astra-ABC.css':
      '@font-face{src:url(/myst_assets_folder/_assets/Newsreader-DEF.woff2) format("woff2")}' +
      '.a{background:url("/myst_assets_folder/_assets/mark-GHI.svg")}' +
      ".b{background:url( '/myst_assets_folder/images/logo.png' )}" +
      '.c{background:url(data:image/png;base64,AAAA)}' +
      '.d{background:url(https://example.org/remote.png)}',
    'build/nested/deep/page.css': '.e{cursor:url(/myst_assets_folder/_assets/cursor.cur)}',
    'build/_assets/untouched.css': '.f{color:red}',
    'build/_assets/entry.js': 'export const css = "/myst_assets_folder/_assets/astra-ABC.css";',
    'thebe-core.css': '.g{background:url(/myst_assets_folder/_assets/outside.png)}',
  });

  const { stdout } = await promisify(execFile)(process.execPath, [script, dir]);
  expect(stdout).toContain('2 stylesheets');

  expect(await readFile(path.join(dir, 'build/_assets/astra-ABC.css'), 'utf8')).toBe(
    '@font-face{src:url(Newsreader-DEF.woff2) format("woff2")}' +
      '.a{background:url("mark-GHI.svg")}' +
      ".b{background:url('../images/logo.png')}" +
      '.c{background:url(data:image/png;base64,AAAA)}' +
      '.d{background:url(https://example.org/remote.png)}'
  );
  expect(await readFile(path.join(dir, 'build/nested/deep/page.css'), 'utf8')).toBe(
    '.e{cursor:url(../../_assets/cursor.cur)}'
  );
  // Files without the public path, scripts, and stylesheets outside build/ stay as they were.
  expect(await readFile(path.join(dir, 'build/_assets/untouched.css'), 'utf8')).toBe('.f{color:red}');
  expect(await readFile(path.join(dir, 'build/_assets/entry.js'), 'utf8')).toContain(
    '/myst_assets_folder/_assets/astra-ABC.css'
  );
  expect(await readFile(path.join(dir, 'thebe-core.css'), 'utf8')).toContain('/myst_assets_folder/');
});

it('fails without a public directory argument', async () => {
  await expect(promisify(execFile)(process.execPath, [script])).rejects.toMatchObject({
    code: 1,
  });
});
