/**
 * AstraCite — the shared SDK-evidence DOI→citation join used by the
 * prior-insight block renderer AND the inline preview overlays.
 *
 * The main text resolves citations through the stock CiteRenderer: a build-time
 * transform turns doi.org links into `cite` nodes (author–year children) keyed
 * into `references.cite.data`. AstraCite joins the other way (evidence DOI →
 * resolved cite node found in `references.article`) so the SAME pipeline
 * renders inside the overlays. These tests pin both branches:
 *   - GIVEN page references with a matching resolved cite → the author–year
 *     citation renders (block + overlay).
 *   - GIVEN no references / no match → plain doi.org link fallback.
 */
import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PreviewPopover } from '@astra-spec/ui/primitives';
import { SiteProvider } from '@myst-theme/providers';
import type { GenericNode, References } from 'myst-common';
import { renderWithProviders } from './helpers/renderWithProviders';
import { makePublication } from './helpers/publication';

import {
  AstraCite,
  AstraPreviewCite,
  buildDoiCiteIndex,
  normalizeDoi,
} from '../src/cite';
import { AstraPriorInsight } from '../src/renderers/AstraPriorInsight';
import { AstraInlineRef } from '../src/renderers/AstraInlineRef';

const DOI = '10.1051/0004-6361/202039070';

/** A cite node as the MyST DOI transform leaves it in the page AST. */
function makeCiteNode(kind: 'narrative' | 'parenthetical' = 'narrative'): GenericNode {
  return {
    type: 'cite',
    kind,
    label: 'Asgari_2021',
    enumerator: '1',
    identifier: `https://doi.org/${DOI}`,
    children: [
      {
        type: 'text',
        key: `cite-${kind}`,
        value: kind === 'narrative' ? 'Asgari et al. (2021)' : 'Asgari et al., 2021',
      },
    ],
  };
}

/** Page references as ArticlePage provides them (cite table + page AST). */
function makeReferences(...citeNodes: GenericNode[]): References {
  if (citeNodes.length === 0) citeNodes = [makeCiteNode()];
  return {
    cite: {
      order: ['Asgari_2021'],
      data: {
        Asgari_2021: {
          label: 'Asgari_2021',
          html: '<div class="csl-entry">Asgari, M., et al. (2021). KiDS-1000 cosmology.</div>',
          enumerator: '1',
          doi: DOI,
        },
      },
    },
    article: {
      type: 'root',
      children: [{ type: 'paragraph', children: citeNodes }],
    },
  } as References;
}

/* --------------------------------------------------------------- *
 * Pure join helpers
 * --------------------------------------------------------------- */
describe('buildDoiCiteIndex / normalizeDoi', () => {
  it('indexes resolved cite nodes by normalized DOI, one slot per kind', () => {
    const narrative = makeCiteNode();
    const parenthetical = makeCiteNode('parenthetical');
    const index = buildDoiCiteIndex(makeReferences(narrative, parenthetical));
    expect(index.get(normalizeDoi(DOI)!)?.narrative).toBe(narrative);
    expect(index.get(normalizeDoi(DOI)!)?.parenthetical).toBe(parenthetical);
    // Tolerant of URL / doi:-prefixed / case-varying store strings.
    expect(normalizeDoi(`https://doi.org/${DOI}`)).toBe(normalizeDoi(DOI));
    expect(normalizeDoi(`doi: ${DOI.toUpperCase()}`)).toBe(normalizeDoi(DOI));
  });

  it('falls back to the cite node identifier when the cite table lacks a doi', () => {
    const citeNode = makeCiteNode();
    const refs = makeReferences(citeNode);
    delete (refs.cite!.data.Asgari_2021 as { doi?: string }).doi;
    const index = buildDoiCiteIndex(refs);
    expect(index.get(normalizeDoi(DOI)!)?.narrative).toBe(citeNode);
  });

  it('returns an empty index without references and skips errored cites', () => {
    expect(buildDoiCiteIndex(undefined).size).toBe(0);
    const refs = makeReferences();
    (refs.article!.children[0] as GenericNode).children![0].error = true;
    expect(buildDoiCiteIndex(refs).size).toBe(0);
  });
});

/* --------------------------------------------------------------- *
 * <AstraCite/> — resolved vs fallback rendering
 * --------------------------------------------------------------- */
describe('AstraCite', () => {
  it('renders the resolved citation through the stock cite pipeline', () => {
    const { container } = renderWithProviders(
      <AstraCite doi={DOI} />,
      undefined,
      makeReferences(),
    );
    // The stock CiteRenderer emits a <cite> with the author–year link.
    expect(container.querySelector('cite')).toBeInTheDocument();
    const link = screen.getByText('Asgari et al. (2021)').closest('a');
    expect(link).toHaveAttribute('href', `https://doi.org/${DOI}`);
    expect(screen.queryByText(DOI)).not.toBeInTheDocument();
  });

  it('falls back to a plain doi.org link when no citation resolves', () => {
    const { container } = renderWithProviders(<AstraCite doi={DOI} />);
    expect(container.querySelector('cite')).toBeNull();
    const link = screen.getByText(DOI).closest('a');
    expect(link).toHaveAttribute('href', `https://doi.org/${DOI}`);
  });
});

/* --------------------------------------------------------------- *
 * <AstraPreviewCite/> — shared nested preview adapter
 * --------------------------------------------------------------- */
describe('AstraPreviewCite', () => {
  it('preserves MyST citation markup inside a nested shared preview', () => {
    const references = makeReferences();
    renderWithProviders(
      <PreviewPopover
        trigger={<button type="button">Preview record</button>}
        label="Record preview"
      >
        <div>
          Nested citation: <AstraPreviewCite doi={DOI} />
        </div>
      </PreviewPopover>,
      undefined,
      references,
    );

    fireEvent.focus(screen.getByRole('button', { name: 'Preview record' }));
    const outer = screen.getByRole('dialog', { name: 'Record preview' });
    const cite = outer.querySelector('cite');
    expect(cite).toBeInTheDocument();
    const link = cite!.querySelector('a');
    expect(link).toHaveAttribute('tabindex', '0');
    expect(link).toHaveClass('hover-link');
    expect(link).toHaveAttribute('href', `https://doi.org/${DOI}`);
    expect(link).toHaveTextContent('Asgari et al. (2021)');

    fireEvent.focus(link!);
    const nested = screen.getByRole('dialog', {
      name: `${DOI} citation preview`,
    });
    expect(outer).toBeInTheDocument();
    expect(nested).toHaveAttribute('data-kind', 'paper');
    expect(nested).toHaveClass('exclude-from-outline', 'astra-citation-preview');
    const portal = nested.closest('[data-slot="preview-popover-portal"]');
    expect(portal).toHaveClass('astra-citation-preview-portal');
    expect(portal).toHaveAttribute('data-astra-color-scheme', 'light');
    const document = nested.querySelector('.hover-document');
    expect(document).toHaveClass(
      'article',
      'w-[500px]',
      'sm:max-w-[500px]',
      'p-3',
    );
    expect(document?.innerHTML).toBe(
      references.cite!.data.Asgari_2021.html,
    );
    // The nested card belongs to the same FloatingTree; no Radix hover-card
    // portal is introduced inside or alongside the shared preview.
    expect(globalThis.document.querySelector('.hover-card-content')).toBeNull();
  });

  it('falls back to the raw DOI link without citation references', () => {
    const { container } = renderWithProviders(<AstraPreviewCite doi={DOI} />);
    expect(container.querySelector('cite')).toBeNull();
    expect(screen.getByText(DOI).closest('a')).toHaveAttribute(
      'href',
      `https://doi.org/${DOI}`,
    );
    expect(
      globalThis.document.querySelector('.astra-citation-preview-portal'),
    ).toBeNull();
  });

  it('keeps resolved citation text without opening an empty partial-data card', () => {
    const references = makeReferences();
    delete references.cite;
    const { container } = renderWithProviders(
      <AstraPreviewCite doi={DOI} />,
      undefined,
      references,
    );
    const cite = container.querySelector('cite');
    expect(cite).toHaveTextContent('Asgari et al. (2021)');
    expect(cite?.querySelector('a')).toHaveAttribute(
      'href',
      `https://doi.org/${DOI}`,
    );
    expect(
      globalThis.document.querySelector('.astra-citation-preview-portal'),
    ).toBeNull();
  });

  it('matches MyST numbered parenthetical citation contents', () => {
    renderWithProviders(
      <SiteProvider
        config={{
          version: 1,
          myst: '1.3.0',
          options: { numbered_references: true },
        }}
      >
        <AstraPreviewCite doi={DOI} parenthetical />
      </SiteProvider>,
      undefined,
      makeReferences(makeCiteNode('parenthetical')),
    );
    expect(screen.getByText('1').closest('cite')?.parentElement).toHaveTextContent(
      '(1)',
    );
  });
});

/* --------------------------------------------------------------- *
 * Block renderer + overlay card use the same citation join
 * --------------------------------------------------------------- */
describe('citation resolution in insight surfaces', () => {
  const blockNode: GenericNode = {
    type: 'admonition',
    class: 'astra-prior-insight',
    identifier: 'prior_insight-kids_s8_low',
    data: {
      astra: {
        kind: 'prior_insight',
        id: 'kids_s8_low',
        canonicalPath: 'prior_insights.kids_s8_low',
      },
    },
    children: [
      { type: 'text', key: 'prior-insight-body', value: 'stock seealso body' },
    ],
  };

  const inlineNode: GenericNode = {
    type: 'span',
    class: 'astra-ref astra-ref--prior_insight',
    data: {
      astra: {
        kind: 'prior_insight',
        id: 'kids_s8_low',
        canonicalPath: 'prior_insights.kids_s8_low',
      },
    },
    children: [
      { type: 'text', key: 'prior-insight-reference', value: 'KiDS S8 low ref' },
    ],
  };

  it('AstraPriorInsight (main text) renders the resolved citation', () => {
    renderWithProviders(
      <AstraPriorInsight node={blockNode} />,
      makePublication({ doi: DOI }),
      makeReferences(),
    );
    expect(screen.getByText('Asgari et al. (2021)')).toBeInTheDocument();
  });

  it('AstraInlineRef insight overlay renders the resolved citation', () => {
    const { container } = renderWithProviders(
      <AstraInlineRef node={inlineNode} />,
      makePublication({ doi: DOI }),
      makeReferences(),
    );
    const trigger = container.querySelector('.astra-ref-trigger');
    expect(trigger).toBeInTheDocument();
    fireEvent.focus(trigger!);
    // The portaled card resolves the DOI through the same cite pipeline. (The
    // auto-appended inline citation matches the same text — scope to the card.)
    const card = document.querySelector('.astra-record-preview__citation');
    expect(card).toHaveTextContent('Asgari et al. (2021)');
  });

  it('overlay degrades to the raw DOI link when the page has no citation', () => {
    const { container } = renderWithProviders(
      <AstraInlineRef node={inlineNode} />,
      makePublication({ doi: DOI }),
    );
    const trigger = container.querySelector('.astra-ref-trigger');
    fireEvent.focus(trigger!);
    const card = document.querySelector('.astra-record-preview__citation');
    expect(card).toBeTruthy();
    const link = card!.querySelector('a');
    expect(link).toHaveAttribute('href', `https://doi.org/${DOI}`);
  });

  it('auto-appends the parenthetical citation after inline prior-insight tokens', () => {
    const { container } = renderWithProviders(
      <AstraInlineRef node={inlineNode} />,
      makePublication({ doi: DOI }),
      makeReferences(makeCiteNode(), makeCiteNode('parenthetical')),
    );
    // Without any hover/focus: token + " (Asgari et al., 2021)" in prose.
    const citation = container.querySelector('.astra-ref-citation');
    expect(citation).toBeTruthy();
    expect(citation!.textContent).toBe(' (Asgari et al., 2021)');
    // The citation sits OUTSIDE the hover trigger (own link, own hover).
    expect(citation!.closest('.astra-ref-trigger')).toBeNull();
  });

  it('auto-citation falls back to the narrative form, bare, when no parenthetical cite resolved', () => {
    const { container } = renderWithProviders(
      <AstraInlineRef node={inlineNode} />,
      makePublication({ doi: DOI }),
      makeReferences(), // narrative only (older bundles)
    );
    const citation = container.querySelector('.astra-ref-citation');
    // Narrative form already carries its own parens — no doubling.
    expect(citation!.textContent).toBe(' Asgari et al. (2021)');
  });

  it('appends no citation when the insight has no DOI', () => {
    const { container } = renderWithProviders(
      <AstraInlineRef node={inlineNode} />,
      makePublication(), // kids_s8_low without doi
      makeReferences(),
    );
    expect(container.querySelector('.astra-ref-citation')).toBeNull();
  });
});
