import { describe, expect, it } from 'vitest';
import {
  citationTitleFromHtml,
  directCitationPdfUrl,
  doiHref,
  normalizeDoi,
} from '../src/inventory/citationMetadata';

describe('inventory citation metadata', () => {
  it('extracts an APA journal article title instead of the italicized journal', () => {
    const html = [
      'Smith, J. (2024). The actual article title.',
      '<i>Journal of Tests</i>, <i>12</i>, 1–4.',
      '<a href="https://doi.org/10.1234/test">10.1234/test</a>',
    ].join(' ');

    expect(citationTitleFromHtml(html)).toBe('The actual article title');
  });

  it('uses the italicized title for an APA book or report', () => {
    expect(
      citationTitleFromHtml('Smith, J. (2024). <i>A useful report</i>. Test Press.'),
    ).toBe('A useful report');
  });

  it('stops a non-italicized title before the DOI link and decodes entities', () => {
    expect(
      citationTitleFromHtml(
        'Smith, J. (2024). Signals &amp; systems. '
        + '<a href="https://doi.org/10.1234/test">10.1234/test</a>',
      ),
    ).toBe('Signals & systems');
  });

  it('normalizes common DOI wrappers before creating links', () => {
    expect(normalizeDoi(' DOI: 10.1234/ABC ')).toBe('10.1234/abc');
    expect(normalizeDoi('https://doi.org/10.1234/ABC')).toBe('10.1234/abc');
    expect(doiHref('https://doi.org/10.1234/ABC')).toBe(
      'https://doi.org/10.1234/abc',
    );
  });

  it('accepts only URLs that clearly identify PDF resources', () => {
    expect(directCitationPdfUrl('https://example.org/paper.pdf?download=1')).toBe(
      'https://example.org/paper.pdf?download=1',
    );
    expect(directCitationPdfUrl('https://arxiv.org/pdf/2401.01234')).toBe(
      'https://arxiv.org/pdf/2401.01234',
    );
    expect(directCitationPdfUrl('https://doi.org/10.1234/test')).toBeUndefined();
  });
});
