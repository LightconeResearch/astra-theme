/**
 * pdf.js for astra-ui's paper viewer.
 *
 * The runtime is never bundled. Remix 1.19 folds every dependency into the
 * server build, and pdf.js's legacy build optionally imports the native
 * `canvas` package for Node rendering, which breaks that build whenever the
 * package is present. Instead, each theme's build copies `pdf.min.mjs` and
 * its worker into `public/pdfjs/` (see `scripts/copy-pdfjs-assets.mjs`) and this
 * module imports them by URL in the browser, honouring the site's base URL.
 * The bundler leaves a non-literal `import()` alone, and nothing here runs on
 * the server: the viewer calls the loader from an effect.
 */
import * as React from 'react';
import type { PdfJs, PdfJsLoader } from '@astra-spec/ui/lib';
import { useBaseurl, withBaseurl } from '@myst-theme/providers';

/** Site-relative locations written by `scripts/copy-pdfjs-assets.mjs`. */
export const PDFJS_MODULE_PATH = '/pdfjs/pdf.min.mjs';
export const PDFJS_WORKER_PATH = '/pdfjs/pdf.worker.min.mjs';

/** The part of the pdf.js module the loader touches beyond astra-ui's contract. */
export interface PdfJsModule extends PdfJs {
  GlobalWorkerOptions: { workerSrc: string };
}

export type PdfJsImporter = (url: string) => Promise<PdfJsModule>;

const importByUrl: PdfJsImporter = (url) => import(/* webpackIgnore: true */ url);

/**
 * A loader for astra-ui's `loadPdfJs`. pdf.js starts one worker per document
 * from `workerSrc` and terminates it with the document; the module itself is
 * imported once per page by the browser's module cache.
 */
export function createPdfJsLoader(
  baseurl?: string,
  importModule: PdfJsImporter = importByUrl,
): PdfJsLoader {
  return async () => {
    const pdfjs = await importModule(withBaseurl(PDFJS_MODULE_PATH, baseurl));
    pdfjs.GlobalWorkerOptions.workerSrc = withBaseurl(PDFJS_WORKER_PATH, baseurl);
    return pdfjs;
  };
}

/** The loader for the current site, stable while the base URL is. */
export function usePdfJsLoader(): PdfJsLoader {
  const baseurl = useBaseurl();
  return React.useMemo(() => createPdfJsLoader(baseurl), [baseurl]);
}
