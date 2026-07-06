/**
 * Renderer components mounted through @testing-library/react with the providers
 * they require (MyST node-renderers + AstraStore). For each component we assert
 * BOTH branches of the load-bearing strict-additivity invariant:
 *   - GIVEN a matching store entry → renders the rich treatment.
 *   - GIVEN a missing entry (empty store) → renders the node's own children as a
 *     graceful fallback, without throwing and without the rich card chrome.
 */
import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import type { GenericNode } from 'myst-common';
import { renderWithProviders } from './helpers/renderWithProviders';
import { makeStore, emptyStore } from './helpers/store';

import { AstraDecision } from '../src/renderers/AstraDecision';
import { AstraFinding } from '../src/renderers/AstraFinding';
import { AstraInlineRef } from '../src/renderers/AstraInlineRef';
import { AstraValue } from '../src/renderers/AstraValue';

/* --------------------------------------------------------------- *
 * AstraDecision (heading carrier, joined by identifier)
 * --------------------------------------------------------------- */
describe('AstraDecision', () => {
  const node: GenericNode = {
    type: 'heading',
    class: 'astra-decision',
    identifier: 'decision-cov_source',
    children: [{ type: 'text', value: 'Covariance source heading' }],
  };

  it('renders the decision label, rationale and option meta from the store', () => {
    const { container } = renderWithProviders(
      <AstraDecision node={node} />,
      makeStore(),
    );
    // Rich treatment: the <details> panel with the kind label + title.
    expect(container.querySelector('details.astra-decision')).toBeTruthy();
    expect(screen.getByText('DECISION')).toBeInTheDocument();
    expect(screen.getByText('Covariance source')).toBeInTheDocument();
    // Default narrative view shows the rationale.
    expect(
      screen.getByText(/Analytic covariance is fastest/),
    ).toBeInTheDocument();
    // Footer summarises the default selection + option count.
    expect(screen.getByText(/default: Analytic/)).toBeInTheDocument();
    expect(screen.getByText(/2 options/)).toBeInTheDocument();
  });

  it('falls back to the heading children when the entry is missing', () => {
    const { container } = renderWithProviders(
      <AstraDecision node={node} />,
      emptyStore(),
    );
    // No rich chrome.
    expect(container.querySelector('details.astra-decision')).toBeNull();
    expect(screen.queryByText('DECISION')).not.toBeInTheDocument();
    // The node's own children are rendered instead.
    expect(screen.getByText('Covariance source heading')).toBeInTheDocument();
  });

  it('shows the Evidence view with the insights cited by the options', () => {
    renderWithProviders(<AstraDecision node={node} />, makeStore());
    // The third segment renders because cov_source.option_insights resolves.
    const tab = screen.getByRole('tab', { name: 'Evidence' });
    fireEvent.click(tab);
    expect(screen.getByText('KiDS S8 low')).toBeInTheDocument();
    expect(screen.getByText('KiDS reported a lower S8.')).toBeInTheDocument();
  });

  it('omits the Evidence segment when no option cites an insight', () => {
    const store = makeStore();
    delete store.decisions.cov_source.option_insights;
    renderWithProviders(<AstraDecision node={node} />, store);
    expect(screen.queryByRole('tab', { name: 'Evidence' })).not.toBeInTheDocument();
  });
});

/* --------------------------------------------------------------- *
 * AstraFinding (heading carrier, joined by identifier)
 * --------------------------------------------------------------- */
describe('AstraFinding', () => {
  const node: GenericNode = {
    type: 'heading',
    class: 'astra-finding',
    identifier: 'finding-s8_consistent',
    children: [{ type: 'text', value: 'S8 finding heading' }],
  };

  it('renders the claim, scope chip and notes from the store', () => {
    const { container } = renderWithProviders(
      <AstraFinding node={node} />,
      makeStore(),
    );
    expect(container.querySelector('.astra-finding__kind')).toBeTruthy();
    expect(
      screen.getByText(/recovered S8 is consistent with the Planck/),
    ).toBeInTheDocument();
    expect(
      container.querySelector('.astra-finding__claim'),
    ).toBeInTheDocument();
    expect(screen.getByText('All tomographic bins.')).toBeInTheDocument();
    expect(
      screen.getByText(/Consistency holds across both binning/),
    ).toBeInTheDocument();
  });

  it('falls back to the heading children when the entry is missing', () => {
    const { container } = renderWithProviders(
      <AstraFinding node={node} />,
      emptyStore(),
    );
    expect(container.querySelector('.astra-finding__claim')).toBeNull();
    expect(screen.getByText('S8 finding heading')).toBeInTheDocument();
  });
});

/* --------------------------------------------------------------- *
 * AstraInlineRef (inline span, joined by data.astra.{kind,id})
 * --------------------------------------------------------------- */
describe('AstraInlineRef', () => {
  const node: GenericNode = {
    type: 'span',
    class: 'astra-ref astra-ref--decision',
    data: { astra: { kind: 'decision', id: 'cov_source' } },
    children: [{ type: 'text', value: 'covariance source' }],
  };

  it('wraps the token in a PreviewCard trigger when the entry resolves', () => {
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      makeStore(),
    );
    // The PreviewCard wraps the token in a .astra-ref-trigger span.
    const trigger = container.querySelector('.astra-ref-trigger');
    expect(trigger).toBeInTheDocument();
    // The carrier span (with its astra-ref classes) is preserved inside it.
    expect(
      trigger!.querySelector('span.astra-ref.astra-ref--decision'),
    ).toBeInTheDocument();
    // The visible label is still rendered.
    expect(screen.getByText('covariance source')).toBeInTheDocument();

    // Focusing the trigger portals in the kind-specific decision card body.
    fireEvent.focus(trigger!);
    expect(screen.getByText('DECISION')).toBeInTheDocument();
    expect(screen.getByText('Covariance source')).toBeInTheDocument();
    expect(
      screen.getByText(/Analytic covariance is fastest/),
    ).toBeInTheDocument();
  });

  it('renders just the bare labelled span when the entry is missing', () => {
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      emptyStore(),
    );
    // No PreviewCard trigger chrome.
    expect(container.querySelector('.astra-ref-trigger')).toBeNull();
    // Bare carrier span with its classes + label.
    const span = container.querySelector('span.astra-ref.astra-ref--decision');
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent('covariance source');
  });

  it('shows the SUPPORTED BY insights on the decision hover card', () => {
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      makeStore(),
    );
    fireEvent.focus(container.querySelector('.astra-ref-trigger')!);
    expect(screen.getByText('SUPPORTED BY')).toBeInTheDocument();
    expect(screen.getByText('KiDS S8 low')).toBeInTheDocument();
  });

  it('insight chips are recursively hoverable: focusing one opens the insight card', () => {
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      makeStore(),
    );
    fireEvent.focus(container.querySelector('.astra-ref-trigger')!);
    // The chip itself is a nested PreviewCard trigger inside the floating card.
    const chipTrigger = document
      .querySelector('.astra-evidence .astra-ref-trigger')!;
    fireEvent.focus(chipTrigger);
    // The nested insight card portals in with the full claim…
    expect(screen.getByText('KiDS reported a lower S8.')).toBeInTheDocument();
    // …while the parent decision card stays mounted (FloatingTree).
    expect(screen.getByText('SUPPORTED BY')).toBeInTheDocument();
  });

  it('falls back to the claim for insight chips authored without a label', () => {
    const store = makeStore();
    delete store.prior_insights.kids_s8_low.label;
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      store,
    );
    fireEvent.focus(container.querySelector('.astra-ref-trigger')!);
    // No label → the chip shows the claim's opening, never the raw id.
    expect(screen.getByText('KiDS reported a lower S8.')).toBeInTheDocument();
    expect(screen.queryByText('kids_s8_low')).not.toBeInTheDocument();
  });

  it('clips long unlabelled claims to their opening; hover shows the entirety', () => {
    const store = makeStore();
    const long =
      'KiDS reported a lower S8 than Planck across all tomographic bins, a tension ' +
      'that persists under both binning choices and survey footprints';
    store.prior_insights.kids_s8_low = {
      id: 'kids_s8_low',
      claim: long,
    };
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      store,
    );
    fireEvent.focus(container.querySelector('.astra-ref-trigger')!);
    // The chip carries a clipped opening (ellipsis), not the raw id.
    const name = document.querySelector('.astra-evidence__name')!;
    expect(name.textContent).toMatch(/^KiDS reported a lower S8 than Planck/);
    expect(name.textContent).toMatch(/…$/);
    // Focusing the chip opens the insight card with the full claim.
    fireEvent.focus(document.querySelector('.astra-evidence .astra-ref-trigger')!);
    expect(screen.getByText(long)).toBeInTheDocument();
  });

  it('shows the finding card evidence: artifact thumb, label, and quote', () => {
    const findingNode: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--finding',
      data: { astra: { kind: 'finding', id: 's8_consistent' } },
      children: [{ type: 'text', value: 'the S8 finding' }],
    };
    const { container } = renderWithProviders(
      <AstraInlineRef node={findingNode} />,
      makeStore(),
    );
    fireEvent.focus(container.querySelector('.astra-ref-trigger')!);
    expect(screen.getByText('EVIDENCE')).toBeInTheDocument();
    // Joined output label + type tag, the quote, and the figure thumbnail.
    expect(screen.getByText('Shear correlation plot')).toBeInTheDocument();
    expect(screen.getByText('figure')).toBeInTheDocument();
    expect(
      screen.getByText('The recovered band sits on the Planck prediction.'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('.astra-evidence__thumb img[src="/results/shear_plot.png"]'),
    ).toBeInTheDocument();
  });

  it('finding evidence artifacts are recursively hoverable: focusing opens the output card', () => {
    const findingNode: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--finding',
      data: { astra: { kind: 'finding', id: 's8_consistent' } },
      children: [{ type: 'text', value: 'the S8 finding' }],
    };
    const { container } = renderWithProviders(
      <AstraInlineRef node={findingNode} />,
      makeStore(),
    );
    fireEvent.focus(container.querySelector('.astra-ref-trigger')!);
    const artifactTrigger = document
      .querySelector('.astra-evidence .astra-ref-trigger')!;
    fireEvent.focus(artifactTrigger);
    // The nested output card portals in (kind label + a second title instance).
    expect(screen.getByText('OUTPUT')).toBeInTheDocument();
    expect(screen.getAllByText('Shear correlation plot').length).toBeGreaterThan(1);
  });

  it('renders the bare token (no card) for the value kind which it does not card', () => {
    // AstraInlineRef is registered for non-value inline kinds; even if handed a
    // value node it must degrade to the bare token rather than throw/card.
    const valueNode: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--value',
      data: { astra: { kind: 'value', id: 'sigma8_metric' } },
      children: [{ type: 'text', value: '0.811' }],
    };
    const { container } = renderWithProviders(
      <AstraInlineRef node={valueNode} />,
      makeStore(),
    );
    expect(container.querySelector('.astra-ref-trigger')).toBeNull();
    expect(screen.getByText('0.811')).toBeInTheDocument();
  });
});

/* --------------------------------------------------------------- *
 * AstraValue (inline value span, joined to outputs table)
 * --------------------------------------------------------------- */
describe('AstraValue', () => {
  const node: GenericNode = {
    type: 'span',
    class: 'astra-ref astra-ref--value astra-ref--metric',
    data: {
      astra: { kind: 'value', id: 'sigma8_metric', col: 'value', type: 'metric' },
    },
    children: [{ type: 'text', value: '0.811' }],
  };

  it('wraps the number in a PreviewCard trigger and exposes the description on focus', () => {
    const { container } = renderWithProviders(
      <AstraValue node={node} />,
      makeStore(),
    );
    const trigger = container.querySelector('.astra-ref-trigger');
    expect(trigger).toBeInTheDocument();
    // The visible number is always the node's own children (never recomputed).
    expect(screen.getAllByText('0.811').length).toBeGreaterThan(0);

    // The floating card body is portaled in only when the trigger is focused.
    fireEvent.focus(trigger!);
    // Card body shows the joined output's description (no meta footer).
    expect(screen.getByText(/The recovered sigma8/)).toBeInTheDocument();
  });

  it('renders the bare number span when the output is missing', () => {
    const { container } = renderWithProviders(
      <AstraValue node={node} />,
      emptyStore(),
    );
    expect(container.querySelector('.astra-ref-trigger')).toBeNull();
    const span = container.querySelector('span.astra-ref.astra-ref--value');
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent('0.811');
  });
});
