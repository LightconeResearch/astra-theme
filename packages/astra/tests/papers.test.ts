import type { ResolvedInsight } from '@astra-spec/sdk';
import { describe, expect, it } from 'vitest';

import { arxivIdFromDoi, arxivPdfUrl, citedPaperMetadata } from '../src/papers';
import { makePublication, TEST_DOI } from './helpers/publication';

const NEW_STYLE = '10.48550/arXiv.1807.06209';
const OLD_STYLE = '10.48550/arXiv.astro-ph/0604362';

describe('arxivIdFromDoi', () => {
  it('reads new- and old-style identifiers from arXiv DOIs', () => {
    expect(arxivIdFromDoi(NEW_STYLE)).toBe('1807.06209');
    expect(arxivIdFromDoi(OLD_STYLE)).toBe('astro-ph/0604362');
    expect(arxivIdFromDoi('10.48550/arXiv.math.GT/0309136')).toBe('math.gt/0309136');
    expect(arxivIdFromDoi('10.48550/arXiv.cond-mat.mes-hall/0507011')).toBe(
      'cond-mat.mes-hall/0507011',
    );
  });

  it('tolerates DOI URLs, labels and case', () => {
    expect(arxivIdFromDoi('https://doi.org/10.48550/ARXIV.2402.14070')).toBe('2402.14070');
    expect(arxivIdFromDoi('doi: 10.48550/arXiv.2402.14070')).toBe('2402.14070');
  });

  it('rejects every other DOI and malformed identifiers', () => {
    for (const doi of [
      TEST_DOI,
      '10.48550/arXiv.',
      '10.48550/arXiv.1807',
      '10.48550/arXiv.1807.06209/../pdf',
      '10.48550/arXiv.astro-ph/0604362v2',
      '10.48550/zenodo.1807.06209',
      '10.5281/zenodo.1807',
    ]) {
      expect(arxivIdFromDoi(doi), doi).toBeUndefined();
    }
  });
});

describe('arxivPdfUrl', () => {
  it('pins the cited revision when there is one', () => {
    expect(arxivPdfUrl(NEW_STYLE)).toBe('https://arxiv.org/pdf/1807.06209');
    expect(arxivPdfUrl(NEW_STYLE, 2)).toBe('https://arxiv.org/pdf/1807.06209v2');
    expect(arxivPdfUrl(OLD_STYLE, 1)).toBe('https://arxiv.org/pdf/astro-ph/0604362v1');
  });

  it('ignores revisions that are not positive integers', () => {
    for (const version of [0, -1, 1.5, Number.NaN]) {
      expect(arxivPdfUrl(NEW_STYLE, version), String(version)).toBe(
        'https://arxiv.org/pdf/1807.06209',
      );
    }
  });

  it('yields nothing for a DOI that is not on arXiv', () => {
    expect(arxivPdfUrl(TEST_DOI)).toBeUndefined();
  });
});

describe('citedPaperMetadata', () => {
  it('lists every cited arXiv paper once, keyed by normalized DOI', () => {
    const { document } = makePublication({
      doi: 'https://doi.org/10.48550/arXiv.1807.06209',
    });
    expect(citedPaperMetadata(document)).toEqual({
      '10.48550/arxiv.1807.06209': { pdfUrl: 'https://arxiv.org/pdf/1807.06209' },
    });
  });

  it('omits papers that are neither on arXiv nor named by the page', () => {
    const { document } = makePublication({ doi: TEST_DOI });
    expect(citedPaperMetadata(document)).toEqual({});
  });

  it('names papers as the page cites them, with or without a PDF', () => {
    const titles = new Map([
      [TEST_DOI, 'Asgari et al. (2021)'],
      ['10.48550/arxiv.1807.06209', 'Aghanim et al. (2020)'],
    ]);
    expect(citedPaperMetadata(makePublication({ doi: TEST_DOI }).document, titles)).toEqual({
      [TEST_DOI]: { title: 'Asgari et al. (2021)' },
    });
    expect(citedPaperMetadata(makePublication({ doi: NEW_STYLE }).document, titles)).toEqual({
      '10.48550/arxiv.1807.06209': {
        title: 'Aghanim et al. (2020)',
        pdfUrl: 'https://arxiv.org/pdf/1807.06209',
      },
    });
  });

  it('prefers the highest cited revision across the whole document', () => {
    const { document } = makePublication({ doi: NEW_STYLE });
    document.analysis.prior_insights[0]!.evidence[0]!.version = 1;
    const later: ResolvedInsight = {
      kind: 'finding',
      canonicalPath: 'calibration.findings.later',
      id: 'later',
      claim: 'A later revision says more.',
      created_at: '2026-01-02',
      evidence: [
        { id: 'paper', doi: NEW_STYLE, version: 3 },
        { id: 'classic', doi: OLD_STYLE },
      ],
    };
    document.analysis.analyses[0]!.findings.push(later);

    expect(citedPaperMetadata(document)).toEqual({
      '10.48550/arxiv.1807.06209': { pdfUrl: 'https://arxiv.org/pdf/1807.06209v3' },
      '10.48550/arxiv.astro-ph/0604362': {
        pdfUrl: 'https://arxiv.org/pdf/astro-ph/0604362',
      },
    });
  });
});
