import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  createPdfJsLoader,
  PDFJS_MODULE_PATH,
  PDFJS_WORKER_PATH,
  type PdfJsModule,
} from '../src/pdf';

function fakeModule(): PdfJsModule {
  return { GlobalWorkerOptions: { workerSrc: '' } } as unknown as PdfJsModule;
}

describe('createPdfJsLoader', () => {
  it('imports the site copy of pdf.js and points it at the matching worker', async () => {
    const pdfjs = fakeModule();
    const importModule = vi.fn(async () => pdfjs);

    const loaded = await createPdfJsLoader(undefined, importModule)();

    expect(loaded).toBe(pdfjs);
    expect(importModule).toHaveBeenCalledWith('/pdfjs/pdf.min.mjs');
    expect(importModule).toHaveBeenCalledWith(PDFJS_MODULE_PATH);
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/pdfjs/pdf.worker.min.mjs');
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe(PDFJS_WORKER_PATH);
  });

  it('honours the site base URL for both files', async () => {
    const pdfjs = fakeModule();
    const importModule = vi.fn(async () => pdfjs);

    await createPdfJsLoader('/reports', importModule)();

    expect(importModule).toHaveBeenCalledWith('/reports/pdfjs/pdf.min.mjs');
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/reports/pdfjs/pdf.worker.min.mjs');
  });
});

describe('copy-pdfjs-assets', () => {
  it('copies the runtime and its worker where the loader expects them', () => {
    const publicDir = mkdtempSync(join(tmpdir(), 'astra-pdfjs-'));
    try {
      execFileSync(
        process.execPath,
        [join(__dirname, '../scripts/copy-pdfjs-assets.mjs'), publicDir],
        { stdio: 'pipe' },
      );
      for (const path of [PDFJS_MODULE_PATH, PDFJS_WORKER_PATH]) {
        expect(statSync(join(publicDir, path)).size, path).toBeGreaterThan(100_000);
      }
    } finally {
      rmSync(publicDir, { recursive: true, force: true });
    }
  });
});
