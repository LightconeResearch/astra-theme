#!/usr/bin/env node
// Make the compiled stylesheets reference their sibling assets relatively.
//
// Remix emits every url() in public/build/**/*.css against the
// `/myst_assets_folder/` public path. The express server rewrites that path
// when it serves under a prefix, but `myst build --html` only rewrites html,
// js and json, so on a static host under a base URL the brand and KaTeX font
// files 404 and the paper falls back to Georgia. Fonts sit beside the
// stylesheets under build/, so a relative url() resolves in every mode:
// static export, the express server with or without a prefix, and remix dev.
// Themes run this as `relativize-css-assets ./public` right after `remix build`.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_PATH = '/myst_assets_folder/';

const publicDir = process.argv[2];
if (!publicDir) {
  console.error('Usage: relativize-css-assets.mjs <public-dir>');
  process.exit(1);
}

/** Rewrite each `url(/myst_assets_folder/...)` relative to the stylesheet's own location. */
function relativizeCss(css, stylesheetPath) {
  const from = path.posix.dirname(stylesheetPath);
  return css.replace(
    /url\(\s*(["']?)\/myst_assets_folder\/([^"')\s]+)\1\s*\)/g,
    (_match, quote, target) => `url(${quote}${path.posix.relative(from, target)}${quote})`,
  );
}

const buildDir = path.resolve(publicDir, 'build');
let count = 0;
for (const entry of await readdir(buildDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.css') continue;
  const file = path.join(entry.parentPath ?? entry.path, entry.name);
  const source = await readFile(file, 'utf8');
  if (!source.includes(PUBLIC_PATH)) continue;
  // Paths inside build/ are what the public path maps to, so they anchor the relative urls.
  const stylesheetPath = path.relative(buildDir, file).split(path.sep).join(path.posix.sep);
  await writeFile(file, relativizeCss(source, stylesheetPath));
  count += 1;
}
console.log(`asset urls made relative in ${count} stylesheet${count === 1 ? '' : 's'} under ${buildDir}`);
