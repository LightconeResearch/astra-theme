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
for (const entry of await readdir(buildDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.css') continue;
  const dir = entry.parentPath ?? entry.path;
  const source = await readFile(path.join(dir, entry.name), 'utf8');
  const output = relativizeCss(source, path.relative(buildDir, dir).split(path.sep).join('/'));
  if (output === source) continue;
  await writeFile(path.join(dir, entry.name), output);
  count += 1;
}
console.log(`asset urls made relative in ${count} stylesheets under ${buildDir}`);
