import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const packagePaths = { paths: [resolve('../../packages/astra')] };
const assets = [
  ['pdfjs-dist/legacy/build/pdf.min.mjs', 'public/pdf.mjs'],
  ['pdfjs-dist/legacy/build/pdf.worker.min.mjs', 'public/pdf.worker.min.mjs'],
];

for (const [source, destination] of assets) {
  const output = resolve(destination);
  mkdirSync(dirname(output), { recursive: true });
  copyFileSync(require.resolve(source, packagePaths), output);
}
