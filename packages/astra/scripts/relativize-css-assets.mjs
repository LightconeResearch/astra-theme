#!/usr/bin/env node
// Make the compiled stylesheets reference their sibling assets relatively.
//
// Remix emits every url() in public/build/**/*.css against the
// `/myst_assets_folder/` public path, which `myst build --html` substitutes in
// html, js and json but not in CSS (see README, "Local development"). A url
// relative to the stylesheet resolves wherever the build is hosted, so themes
// run this as `relativize-css-assets ./public` right after `remix build`.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_PATH = '/myst_assets_folder/';

const publicDir = process.argv[2];
if (!publicDir) {
  console.error('Usage: relativize-css-assets.mjs <public-dir>');
  process.exit(1);
}

/** Rewrite each `url(/myst_assets_folder/...)` relative to the stylesheet's directory under build/. */
function relativizeCss(css, from) {
  return css.replace(
    /url\((["']?)\/myst_assets_folder\/([^"')]+)\1\)/g,
    (_match, quote, target) => `url(${quote}${path.posix.relative(from, target)}${quote})`,
  );
}

const buildDir = path.resolve(publicDir, 'build');
let count = 0;
for (const file of await readdir(buildDir, { recursive: true })) {
  if (path.extname(file).toLowerCase() !== '.css') continue;
  const source = await readFile(path.join(buildDir, file), 'utf8');
  const output = relativizeCss(source, path.posix.dirname(file.split(path.sep).join('/')));
  // Any reference the rewrite did not recognise would 404 on a static host; fail the build instead.
  if (output.includes(PUBLIC_PATH)) {
    console.error(`${path.join(buildDir, file)} still references ${PUBLIC_PATH} after the rewrite`);
    process.exit(1);
  }
  if (output === source) continue;
  await writeFile(path.join(buildDir, file), output);
  count += 1;
}
console.log(`asset urls made relative in ${count} stylesheets under ${buildDir}`);
