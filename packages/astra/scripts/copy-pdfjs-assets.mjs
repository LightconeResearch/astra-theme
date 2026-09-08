#!/usr/bin/env node
// Copy the pdf.js runtime into a theme's public/ directory.
//
// The ASTRA overlay imports pdf.js by URL at runtime (packages/astra/src/pdf.ts
// expects /pdfjs/pdf.min.mjs and /pdfjs/pdf.worker.min.mjs) rather than
// bundling it. Themes run this as `copy-pdfjs-assets ./public` from their
// build and dev scripts, next to `copy-thebe-assets`, so the files land in
// public/ and travel with the built theme. The legacy build is the one
// astra-ui validates: it and its worker polyfill the viewer's browser floor
// together.
import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

const outputDir = process.argv[2];
if (!outputDir) {
  console.error('Usage: copy-pdfjs-assets.mjs <public-dir>');
  process.exit(1);
}

const require = createRequire(import.meta.url);
// The unminified module is the package's exported entry; the minified files sit beside it.
const build = dirname(require.resolve('pdfjs-dist/legacy/build/pdf.mjs'));
const target = resolve(outputDir, 'pdfjs');

await mkdir(target, { recursive: true });
for (const name of ['pdf.min.mjs', 'pdf.worker.min.mjs']) {
  await copyFile(join(build, name), join(target, name));
}
console.log(`pdf.js runtime copied to ${target}`);
