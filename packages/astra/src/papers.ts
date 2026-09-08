/**
 * Cited papers the theme can read in place.
 *
 * The publication carries DOIs, never PDF URLs. A DOI resolves to an HTML
 * landing page, so no generic rule can turn one into a PDF. arXiv is the
 * exception that matters for this theme's readers: its DOIs embed the arXiv
 * identifier, and `arxiv.org/pdf/<id>` serves the PDF with a permissive CORS
 * policy and byte-range support, which is what astra-ui's viewer needs to
 * stream it from the browser.
 *
 * Every other DOI, and any arXiv DOI whose PDF fails to load at runtime, keeps
 * astra-ui's own "no paper content" state, which links to the DOI instead.
 */
import { normalizeDoi, walkAnalyses, type ResolvedAnalysisDocument } from '@astra-spec/sdk';
import type { InventoryPaperMetadata, InventoryPaperMetadataMap } from '@astra-spec/ui/model';

const ARXIV_DOI_PREFIX = '10.48550/arxiv.';

/** New-style `YYMM.NNNNN` identifiers. */
const NEW_STYLE_ID = /^\d{4}\.\d{4,5}$/;
/**
 * Old-style `archive[.subject-class]/YYMMNNN` identifiers, such as
 * `astro-ph/0604362` or `cond-mat.mes-hall/0507011`.
 */
const OLD_STYLE_ID = /^[a-z][a-z-]*(?:\.[a-z][a-z-]*)?\/\d{7}$/;

/** The arXiv identifier named by a DOI, or undefined for any other DOI. */
export function arxivIdFromDoi(doi: string): string | undefined {
  const key = normalizeDoi(doi);
  if (!key.startsWith(ARXIV_DOI_PREFIX)) return undefined;
  const id = key.slice(ARXIV_DOI_PREFIX.length);
  return NEW_STYLE_ID.test(id) || OLD_STYLE_ID.test(id) ? id : undefined;
}

/** A cited arXiv revision: a positive integer; anything else means "latest". */
function citedVersion(version: unknown): number | undefined {
  return typeof version === 'number' && Number.isInteger(version) && version > 0
    ? version
    : undefined;
}

function arxivPdfUrlFor(id: string, version: number | undefined): string {
  return `https://arxiv.org/pdf/${id}${version === undefined ? '' : `v${version}`}`;
}

/**
 * The browser-loadable PDF for an arXiv DOI. A positive integer version pins
 * the exact revision (`…v2`); without one arXiv serves its latest revision.
 */
export function arxivPdfUrl(doi: string, version?: number): string | undefined {
  const id = arxivIdFromDoi(doi);
  return id ? arxivPdfUrlFor(id, citedVersion(version)) : undefined;
}

/** How the page names cited papers, keyed by normalized DOI. */
export type PaperTitles = ReadonlyMap<string, string>;

interface CitedPaper {
  /** The arXiv identifier, for DOIs that name one. */
  id: string | undefined;
  /** The highest revision the evidence cites. */
  version: number | undefined;
}

/**
 * astra-ui paper metadata for every DOI cited anywhere in the document, keyed
 * by normalized DOI: a `pdfUrl` when the DOI names an arXiv paper and a
 * `title` when the page has a name for it. Papers with neither are omitted.
 *
 * The evidence cites a revision; when several insights cite different
 * revisions of one paper the highest wins, since astra-ui reads one file per
 * DOI and the latest revision is the one most likely to still contain every
 * quoted passage.
 *
 * The walk repeats the SDK's `collectCitedDois`, which yields DOIs only; this
 * needs each evidence entry's `version` as well.
 */
export function citedPaperMetadata(
  document: ResolvedAnalysisDocument,
  titles?: PaperTitles,
): InventoryPaperMetadataMap {
  const cited = new Map<string, CitedPaper>();
  for (const analysis of walkAnalyses(document)) {
    for (const insight of [...analysis.prior_insights, ...analysis.findings]) {
      for (const evidence of insight.evidence) {
        if (typeof evidence.doi !== 'string') continue;
        const key = normalizeDoi(evidence.doi);
        if (!key) continue;
        const paper = cited.get(key) ?? { id: arxivIdFromDoi(key), version: undefined };
        const version = citedVersion(evidence.version);
        if (version !== undefined && (paper.version === undefined || version > paper.version)) {
          paper.version = version;
        }
        cited.set(key, paper);
      }
    }
  }

  const metadata: Record<string, InventoryPaperMetadata> = {};
  for (const [doi, paper] of cited) {
    const title = titles?.get(doi);
    if (!paper.id && !title) continue;
    metadata[doi] = {
      ...(title ? { title } : {}),
      ...(paper.id ? { pdfUrl: arxivPdfUrlFor(paper.id, paper.version) } : {}),
    };
  }
  return metadata;
}
