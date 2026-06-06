/**
 * AstraCite — the shared DOI→citation join used by the prior-insight block
 * renderer AND the inline preview overlays.
 *
 * The main text resolves citations through the stock CiteRenderer: a build-time
 * transform turns doi.org links into `cite` nodes (author–year children) keyed
 * into `references.cite.data`. AstraCite joins the other way (store DOI →
 * resolved cite node found in `references.article`) so the SAME pipeline
 * renders inside the overlays. These tests pin both branches:
 *   - GIVEN page references with a matching resolved cite → the author–year
 *     citation renders (block + overlay).
 *   - GIVEN no references / no match → plain doi.org link fallback.
 */
import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import type { GenericNode, References } from 'myst-common';
import { renderWithProviders } from './helpers/renderWithProviders';
import { makeStore } from './helpers/store';

import { AstraCite, buildDoiCiteIndex, normalizeDoi } from '~/astra/cite';
import { AstraPriorInsight } from '~/astra/renderers/AstraPriorInsight';
import { AstraInlineRef } from '~/astra/renderers/AstraInlineRef';

const DOI = '10.1051/0004-6361/202039070';

/** A cite node as the MyST DOI transform leaves it in the page AST. */
function makeCiteNode(): GenericNode {
  return {
    type: 'cite',
    kind: 'narrative',
    label: 'Asgari_2021',
    identifier: `https://doi.org/${DOI}`,
    children: [{ type: 'text', value: 'Asgari et al. (2021)' }],
  };
}

/** Page references as ArticlePage provides them (cite table + page AST). */
function makeReferences(citeNode: GenericNode = makeCiteNode()): References {
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
      children: [{ type: 'paragraph', children: [citeNode] }],
    },
  } as References;
}

/** The store with a DOI + quote on the prior insight (as the plugin emits). */
function makeStoreWithDoi() {
  const store = makeStore();
  store.prior_insights.kids_s8_low = {
    ...store.prior_insights.kids_s8_low,
    doi: DOI,
    quote: 'S8 is lower than Planck.',
  };
  return store;
}

/* --------------------------------------------------------------- *
 * Pure join helpers
 * --------------------------------------------------------------- */
describe('buildDoiCiteIndex / normalizeDoi', () => {
  it('indexes resolved cite nodes by normalized DOI', () => {
    const citeNode = makeCiteNode();
    const index = buildDoiCiteIndex(makeReferences(citeNode));
    expect(index.get(normalizeDoi(DOI)!)).toBe(citeNode);
    // Tolerant of URL / doi:-prefixed / case-varying store strings.
    expect(normalizeDoi(`https://doi.org/${DOI}`)).toBe(normalizeDoi(DOI));
    expect(normalizeDoi(`doi: ${DOI.toUpperCase()}`)).toBe(normalizeDoi(DOI));
  });

  it('falls back to the cite node identifier when the cite table lacks a doi', () => {
    const citeNode = makeCiteNode();
    const refs = makeReferences(citeNode);
    delete (refs.cite!.data.Asgari_2021 as { doi?: string }).doi;
    const index = buildDoiCiteIndex(refs);
    expect(index.get(normalizeDoi(DOI)!)).toBe(citeNode);
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
 * Block renderer + overlay card use the same citation join
 * --------------------------------------------------------------- */
describe('citation resolution in insight surfaces', () => {
  const blockNode: GenericNode = {
    type: 'admonition',
    class: 'astra-prior-insight',
    identifier: 'prior_insight-kids_s8_low',
    children: [{ type: 'text', value: 'stock seealso body' }],
  };

  const inlineNode: GenericNode = {
    type: 'span',
    class: 'astra-ref astra-ref--prior_insight',
    data: { astra: { kind: 'prior_insight', id: 'kids_s8_low' } },
    children: [{ type: 'text', value: 'KiDS S8 low ref' }],
  };

  it('AstraPriorInsight (main text) renders the resolved citation', () => {
    renderWithProviders(
      <AstraPriorInsight node={blockNode} />,
      makeStoreWithDoi(),
      makeReferences(),
    );
    expect(screen.getByText('Asgari et al. (2021)')).toBeInTheDocument();
  });

  it('AstraInlineRef insight overlay renders the resolved citation', () => {
    const { container } = renderWithProviders(
      <AstraInlineRef node={inlineNode} />,
      makeStoreWithDoi(),
      makeReferences(),
    );
    const trigger = container.querySelector('.astra-ref-trigger');
    expect(trigger).toBeInTheDocument();
    fireEvent.focus(trigger!);
    // The portaled card resolves the DOI through the same cite pipeline.
    expect(screen.getByText('Asgari et al. (2021)')).toBeInTheDocument();
  });

  it('overlay degrades to the raw DOI link when the page has no citation', () => {
    const { container } = renderWithProviders(
      <AstraInlineRef node={inlineNode} />,
      makeStoreWithDoi(),
    );
    const trigger = container.querySelector('.astra-ref-trigger');
    fireEvent.focus(trigger!);
    const card = document.querySelector('.astra-card .astra-cite');
    expect(card).toBeTruthy();
    const link = card!.querySelector('a');
    expect(link).toHaveAttribute('href', `https://doi.org/${DOI}`);
  });
});
