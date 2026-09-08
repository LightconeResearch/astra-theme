/**
 * Reading a cited paper from the record dialog. The route is the one readers
 * take: an insight's detail offers "Locate passage in paper", which opens the
 * paper entry; astra-ui then streams the PDF from arXiv through the loader
 * the provider supplies, or keeps its DOI-link state for any other paper.
 */
import * as React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { PdfJsLoader } from '@astra-spec/ui/lib';
import { ThemeProvider } from '@myst-theme/providers';
import type { References } from 'myst-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AstraPublicationProvider,
  useAstraPublication,
  useAstraPublicationDetails,
  type AstraPublication,
} from '../src/publication/AstraPublicationProvider';
import { fakePdfRuntime, mockPdfBrowser } from './helpers/pdfRuntime';
import { makePublication, TEST_DOI } from './helpers/publication';

const ARXIV_DOI = '10.48550/arXiv.1807.06209';
const INSIGHT = 'prior_insights.kids_s8_low';

function OpenInsight() {
  const publication = useAstraPublication();
  const details = useAstraPublicationDetails();
  return (
    <button
      type="button"
      onClick={() => {
        const record = publication?.index.recordByPath.get(INSIGHT);
        const analysis = publication?.index.analysisByRecordPath.get(INSIGHT);
        if (record && analysis) details?.onOpenRecord(record, analysis);
      }}
    >
      Open insight
    </button>
  );
}

function Host({
  publication,
  references,
  loadPdfJs,
}: {
  publication: AstraPublication;
  references?: References;
  loadPdfJs: PdfJsLoader;
}) {
  return (
    <ThemeProvider theme={null} setTheme={() => undefined}>
      <AstraPublicationProvider
        publication={publication}
        references={references}
        loadPdfJs={loadPdfJs}
      >
        <OpenInsight />
      </AstraPublicationProvider>
    </ThemeProvider>
  );
}

/** Page references as the themes pass them: the cite table plus the page AST holding the resolved cite node. */
function citedAs(doi: string, text: string): References {
  return {
    cite: {
      order: ['ref'],
      data: { ref: { label: 'ref', html: `<div>${text}</div>`, enumerator: '1', doi } },
    },
    article: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'cite',
              kind: 'narrative',
              label: 'ref',
              identifier: `https://doi.org/${doi}`,
              children: [{ type: 'text', value: text }],
            },
          ],
        },
      ],
    },
  } as References;
}

async function openPaperFromInsight(): Promise<HTMLElement> {
  fireEvent.click(screen.getByRole('button', { name: 'Open insight' }));
  const insight = await screen.findByRole('dialog', { name: 'KiDS S8 low' });
  fireEvent.click(within(insight).getByRole('button', { name: /Locate passage in paper/ }));
  return screen.findByRole('dialog', { name: /^10\./ });
}

describe('reading a cited paper', () => {
  beforeEach(() => {
    mockPdfBrowser();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('streams an arXiv paper in place and locates the quoted passage', async () => {
    const runtime = fakePdfRuntime(['S8 is lower than Planck.']);
    render(<Host publication={makePublication({ doi: ARXIV_DOI })} loadPdfJs={runtime.load} />);

    const paper = await openPaperFromInsight();

    expect(paper).toHaveAccessibleName('10.48550/arxiv.1807.06209');
    await waitFor(() => {
      expect(runtime.getDocument).toHaveBeenCalledWith({
        url: 'https://arxiv.org/pdf/1807.06209',
      });
    });
    expect(within(paper).getByRole('group', { name: /^PDF viewer for/ })).toBeInTheDocument();
    expect(await within(paper).findByText('Quote highlighted on page 1 of 1')).toBeInTheDocument();
    expect(
      within(paper).getByRole('button', { name: 'Locate source passage 1 in paper' }),
    ).not.toHaveAttribute('aria-disabled');
  });

  it('names the paper as the page cites it', async () => {
    const runtime = fakePdfRuntime();
    render(
      <Host
        publication={makePublication({ doi: ARXIV_DOI })}
        references={citedAs(ARXIV_DOI, 'Aghanim et al. (2020)')}
        loadPdfJs={runtime.load}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open insight' }));
    const insight = await screen.findByRole('dialog', { name: 'KiDS S8 low' });
    fireEvent.click(within(insight).getByRole('button', { name: /Locate passage in paper/ }));

    const paper = await screen.findByRole('dialog', { name: 'Aghanim et al. (2020)' });
    expect(within(paper).getByRole('group', { name: 'PDF viewer for Aghanim et al. (2020)' }))
      .toBeInTheDocument();
  });

  it('keeps the DOI link for a paper that is not on arXiv', async () => {
    const runtime = fakePdfRuntime();
    render(<Host publication={makePublication({ doi: TEST_DOI })} loadPdfJs={runtime.load} />);

    const paper = await openPaperFromInsight();

    expect(paper).toHaveAccessibleName(TEST_DOI);
    expect(within(paper).queryByRole('group', { name: /^PDF viewer for/ })).toBeNull();
    expect(within(paper).getByRole('link', { name: 'DOI' })).toHaveAttribute(
      'href',
      `https://doi.org/${TEST_DOI}`,
    );
    expect(runtime.load).not.toHaveBeenCalled();
  });

  it('reports a paper that cannot be loaded and leaves the dialog usable', async () => {
    const runtime = fakePdfRuntime([], { fail: new Error('arXiv is unreachable') });
    render(<Host publication={makePublication({ doi: ARXIV_DOI })} loadPdfJs={runtime.load} />);

    const paper = await openPaperFromInsight();

    expect(await within(paper).findByText('The PDF could not be loaded.')).toBeInTheDocument();
    // The failure reaches the rail one render after the viewer reports it.
    await waitFor(() => {
      expect(
        within(paper).getByRole('button', { name: 'Locate source passage 1 in paper' }),
      ).toHaveAttribute('aria-disabled', 'true');
    });
    expect(within(paper).getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      'https://arxiv.org/pdf/1807.06209',
    );
  });
});
