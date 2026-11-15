import * as React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { indexResolvedAnalysis } from '@astra-spec/sdk/reports';
import type { GenericNode } from 'myst-common';
import { MyST } from 'myst-to-react';
import { describe, expect, it } from 'vitest';

import { AstraDataSources } from '../src/renderers/AstraDataSources';
import { AstraDecision } from '../src/renderers/AstraDecision';
import { AstraFinding } from '../src/renderers/AstraFinding';
import { AstraInlineRef } from '../src/renderers/AstraInlineRef';
import { AstraOutput } from '../src/renderers/AstraOutput';
import { AstraPriorInsight } from '../src/renderers/AstraPriorInsight';
import { AstraSubanalysis } from '../src/renderers/AstraSubanalysis';
import { AstraValue } from '../src/renderers/AstraValue';
import { makePublication, TEST_DOI } from './helpers/publication';
import { renderWithProviders } from './helpers/renderWithProviders';

describe('canonical SDK-backed ASTRA renderers', () => {
  it('keeps the rich decision panel and falls back without canonical metadata', () => {
    const node: GenericNode = {
      type: 'div',
      class: 'astra-decision',
      identifier: 'decision-cov_source',
      data: {
        astra: {
          kind: 'decision',
          id: 'cov_source',
          canonicalPath: 'decisions.cov_source',
        },
      },
      children: [
        { type: 'text', key: 'neutral-decision', value: 'neutral decision' },
      ],
    };
    const { container, unmount } = renderWithProviders(
      <AstraDecision node={node} />,
      makePublication(),
    );
    expect(container.querySelector('details.astra-decision')).toBeTruthy();
    expect(
      screen.getByText('Analytic covariance is fastest and validated here.'),
    ).toBeVisible();
    expect(screen.getByText(/selected: Analytic · 2 options/)).toBeVisible();

    const viewGroup = screen.getByRole('group', { name: 'Decision view' });
    const rationaleButton = within(viewGroup).getByRole('button', {
      name: 'Rationale',
    });
    const optionsButton = within(viewGroup).getByRole('button', {
      name: 'Options',
    });
    expect(rationaleButton).toHaveAttribute('aria-pressed', 'true');
    expect(optionsButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();

    fireEvent.click(optionsButton);
    expect(rationaleButton).toHaveAttribute('aria-pressed', 'false');
    expect(optionsButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Analytic')).toBeVisible();

    unmount();
    renderWithProviders(
      <AstraDecision node={{ ...node, data: undefined }} />,
      makePublication(),
    );
    expect(screen.getByText('neutral decision')).toBeVisible();
  });

  it('honors a request universe independently of the page and keeps alternatives available', () => {
    const node = {
      type: 'div',
      class: 'astra-decision',
      data: {
        astra: {
          kind: 'decision',
          canonicalPath: 'decisions.cov_source',
          universe: 'universes.alternate',
        },
      },
    } as GenericNode;
    const { container } = renderWithProviders(
      <AstraDecision node={node} />,
      makePublication(),
    );
    expect(screen.getByText(/selected: Jackknife/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    expect(screen.getByText('Jackknife').closest('li')).toHaveClass(
      'astra-option--selected',
    );
    expect(screen.getByText('Analytic').closest('li')).not.toHaveClass(
      'astra-option--excluded',
    );
  });

  it('keeps a per-reference universe through its preview and detail dialog', async () => {
    const node = {
      type: 'span',
      class: 'astra-ref astra-ref--output',
      data: {
        astra: {
          kind: 'output',
          canonicalPath: 'outputs.shear_plot',
          universe: 'universes.alternate',
        },
      },
      children: [
        { type: 'text', key: 'alternate-plot-label', value: 'alternate plot' },
      ],
    } as GenericNode;
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      makePublication(),
    );
    const trigger = container.querySelector('.astra-ref-trigger')!;
    fireEvent.focus(trigger);
    const preview = await screen.findByRole('dialog', {
      name: /Shear correlation plot output preview/i,
    });
    expect(preview.querySelector('img')).toHaveAttribute(
      'src',
      '/myst-assets/shear_plot-alternate.png',
    );
    fireEvent.click(trigger);
    const detail = await screen.findByRole('dialog', {
      name: 'Shear correlation plot',
    });
    expect(detail.querySelector('img')).toHaveAttribute(
      'src',
      '/myst-assets/shear_plot-alternate.png',
    );
  });

  it('keeps a pinned citation universe through nested output hover and details', async () => {
    const publication = makePublication();
    publication.document.analyses[0]!.findings[0]!.evidence[0]!.cites = [
      'shear_plot#alternate',
    ];
    const node = {
      type: 'span',
      class: 'astra-ref astra-ref--finding',
      data: {
        astra: { kind: 'finding', canonicalPath: 'findings.s8_consistent' },
      },
      children: [
        { type: 'text', key: 'pinned-finding-label', value: 'the finding' },
      ],
    } as GenericNode;
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      publication,
    );
    fireEvent.focus(container.querySelector('.astra-ref-trigger')!);
    const findingPreview = await screen.findByRole('dialog', {
      name: /S8 consistent with Planck finding preview/i,
    });
    expect(findingPreview.querySelector('img')).toHaveAttribute(
      'src',
      '/myst-assets/shear_plot-alternate.png',
    );
    const outputTrigger = within(findingPreview).getByRole('button', {
      name: /Open output details: Shear correlation plot/i,
    });
    fireEvent.focus(outputTrigger);
    const outputPreview = await screen.findByRole('dialog', {
      name: /Shear correlation plot output preview/i,
    });
    expect(outputPreview.querySelector('img')).toHaveAttribute(
      'src',
      '/myst-assets/shear_plot-alternate.png',
    );
    fireEvent.click(outputTrigger);
    const detail = await screen.findByRole('dialog', {
      name: 'Shear correlation plot',
    });
    expect(detail.querySelector('img')).toHaveAttribute(
      'src',
      '/myst-assets/shear_plot-alternate.png',
    );
  });

  it('retains finding block classes and SDK prose', () => {
    const node: GenericNode = {
      type: 'div',
      class: 'astra-finding',
      identifier: 'finding-s8_consistent',
      data: {
        astra: {
          kind: 'finding',
          id: 's8_consistent',
          canonicalPath: 'findings.s8_consistent',
        },
      },
      children: [
        {
          type: 'heading',
          children: [{ type: 'text', value: 'S8 consistent with Planck' }],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'Consistency holds across both binning choices.',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'emphasis',
              children: [
                { type: 'text', value: 'Scope: All tomographic bins.' },
              ],
            },
          ],
        },
      ],
    };
    const { container } = renderWithProviders(
      <AstraFinding node={node} />,
      makePublication(),
    );
    expect(container.querySelector('.astra-finding__kind')).toHaveTextContent(
      'FINDING',
    );
    expect(
      screen.getByText(/consistent with the Planck 2018 value/),
    ).toBeVisible();
    expect(screen.getByText('All tomographic bins.')).toBeVisible();
  });

  it('honours finding show/hide choices preserved by the neutral subtree', () => {
    const node: GenericNode = {
      type: 'div',
      class: 'astra-finding',
      identifier: 'finding-s8_consistent',
      data: {
        astra: {
          kind: 'finding',
          id: 's8_consistent',
          canonicalPath: 'findings.s8_consistent',
        },
      },
      children: [
        {
          type: 'heading',
          children: [
            {
              type: 'text',
              value:
                'The recovered S8 is consistent with the Planck 2018 value.',
            },
          ],
        },
      ],
    };

    renderWithProviders(<AstraFinding node={node} />, makePublication());
    expect(
      screen.getByText(/consistent with the Planck 2018 value/),
    ).toBeVisible();
    expect(screen.queryByText('All tomographic bins.')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Consistency holds across both binning choices.'),
    ).not.toBeInTheDocument();
  });

  it('keeps a prior-insight quote paired with its own DOI evidence', () => {
    const publication = makePublication({ doi: TEST_DOI });
    const insight = publication.document.analyses[0]!.prior_insights[0]!;
    insight.evidence = [
      {
        quote: { exact: 'A quote from a different source.' },
      },
      {
        doi: TEST_DOI,
        quote: { exact: 'The quote from the cited paper.' },
      },
    ];
    const node: GenericNode = {
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
    };

    renderWithProviders(<AstraPriorInsight node={node} />, publication);
    expect(screen.getByText('The quote from the cited paper.')).toBeVisible();
    expect(
      screen.queryByText('A quote from a different source.'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: TEST_DOI })).toHaveAttribute(
      'href',
      `https://doi.org/${TEST_DOI}`,
    );
  });

  it('uses RecordPreview/PreviewPopover for canonical inline records', async () => {
    const node: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--decision',
      data: {
        astra: {
          kind: 'decision',
          id: 'cov_source',
          canonicalPath: 'decisions.cov_source',
        },
      },
      children: [
        { type: 'text', key: 'covariance-choice', value: 'covariance choice' },
      ],
    };
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      makePublication(),
    );
    const trigger = container.querySelector('.astra-ref-trigger');
    expect(trigger).toBeTruthy();
    fireEvent.focus(trigger!);
    const preview = await screen.findByRole('dialog', {
      name: /Covariance source decision preview/i,
    });
    expect(preview).toHaveAttribute('data-slot', 'preview-popover');
    expect(preview.querySelector('[data-slot="record-preview"]')).toBeTruthy();
    expect(
      preview.querySelector('.astra-record-preview__relation-trigger'),
    ).toBeTruthy();
    expect(preview.querySelector('.astra-ref-trigger')).toBeNull();
    const portal = preview.closest('[data-slot="preview-popover-portal"]');
    expect(portal).toHaveClass('lightcone-brand');
    expect(portal).toHaveAttribute('data-entry-kind', 'record');
    expect(portal).toHaveAttribute('data-lightcone-color-scheme', 'light');
    expect(portal).toHaveAttribute('data-astra-color-scheme', 'light');
  });

  it('retains the released prior-insight preview label', async () => {
    const node: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--prior_insight',
      data: {
        astra: {
          kind: 'prior_insight',
          id: 'kids_s8_low',
          canonicalPath: 'prior_insights.kids_s8_low',
        },
      },
      children: [{ type: 'text', key: 'kids-result', value: 'KiDS result' }],
    };
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      makePublication(),
    );
    fireEvent.focus(container.querySelector('.astra-ref-trigger')!);
    const preview = await screen.findByRole('dialog', {
      name: /KiDS S8 low prior insight preview/i,
    });
    expect(
      preview.querySelector('.astra-record-preview__kind'),
    ).toHaveTextContent('Prior insight');
  });

  it('keeps the repository input path visible in its preview', async () => {
    const publication = makePublication();
    const input = publication.document.analyses[0]!.inputs[0]!;
    input.path = 'data/reconstruction.csv';
    const node: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--input',
      data: {
        astra: {
          kind: 'input',
          id: 'shear_catalog',
          canonicalPath: input.ref,
        },
      },
      children: [{ type: 'text', key: 'input-alias', value: 'catalog alias' }],
    };
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      publication,
    );
    fireEvent.focus(container.querySelector('.astra-ref-trigger')!);
    const preview = await screen.findByRole('dialog', {
      name: /Shear catalog input preview/i,
    });
    expect(preview).toHaveTextContent('data/reconstruction.csv');
    expect(preview).not.toHaveTextContent(
      'reconstruction.outputs.post_recon_catalog_lrg_full',
    );
  });

  it('retains the released decision overflow copy', async () => {
    const publication = makePublication();
    const analysis = publication.document.analyses[0]!;
    const source = analysis.prior_insights[0]!;
    const paths = [source.ref];
    for (let number = 2; number <= 4; number += 1) {
      const canonicalPath = `prior_insights.support_${number}`;
      analysis.prior_insights.push({
        ...source,
        ref: canonicalPath,
        label: `Supporting insight ${number}`,
      });
      paths.push(canonicalPath);
    }
    analysis.decisions[0]!.options[0]!.insights = paths;
    publication.index = indexResolvedAnalysis(publication.document);

    const node: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--decision',
      data: {
        astra: {
          kind: 'decision',
          id: 'cov_source',
          canonicalPath: 'decisions.cov_source',
        },
      },
      children: [
        { type: 'text', key: 'overflow-decision', value: 'covariance choice' },
      ],
    };
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      publication,
    );
    fireEvent.focus(container.querySelector('.astra-ref-trigger')!);
    expect(
      await screen.findByText('+ 1 more in the decision panel'),
    ).toBeVisible();
  });

  it('opens one scoped detail dialog and preserves it through drill-down/back', async () => {
    const node: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--decision',
      data: {
        astra: {
          kind: 'decision',
          id: 'cov_source',
          canonicalPath: 'decisions.cov_source',
        },
      },
      children: [
        {
          type: 'text',
          key: 'covariance-detail-text',
          value: 'covariance choice',
        },
      ],
    };
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      makePublication({ doi: TEST_DOI }),
    );
    const trigger = container.querySelector<HTMLElement>('.astra-ref-trigger');
    expect(trigger).toHaveAttribute('role', 'button');
    expect(trigger?.firstElementChild).toHaveClass(
      'astra-ref',
      'astra-ref--decision',
    );

    fireEvent.click(trigger!);
    const decisionDialog = await screen.findByRole('dialog', {
      name: 'Covariance source',
    });
    const dialogScope = decisionDialog.parentElement;
    expect(dialogScope).toHaveClass(
      'lightcone-brand',
      'astra-ui',
      'astra-isolate',
    );
    expect(dialogScope?.closest('article')).toBeNull();
    expect(dialogScope).toHaveStyle({ display: 'contents' });
    expect(dialogScope).toHaveAttribute('data-lightcone-color-scheme', 'light');
    expect(dialogScope).toHaveAttribute('data-astra-color-scheme', 'light');
    expect(decisionDialog.closest('.astra-ui')).toBe(dialogScope);
    expect(
      document.querySelectorAll('dialog[data-slot="dialog"]'),
    ).toHaveLength(1);

    fireEvent.click(
      within(decisionDialog).getByRole('button', {
        name: 'Open insight details: KiDS S8 low',
      }),
    );
    const insightDialog = await screen.findByRole('dialog', {
      name: 'KiDS S8 low',
    });
    expect(insightDialog).toBe(decisionDialog);
    expect(
      document.querySelectorAll('dialog[data-slot="dialog"]'),
    ).toHaveLength(1);
    expect(
      insightDialog.querySelector('.astra-dialog__crumb'),
    ).toHaveTextContent('Covariance source');

    fireEvent.click(
      // The insight's source control names the action, not the DOI; it opens the paper dialog.
      within(insightDialog).getByRole('button', {
        name: /Locate passage in paper|Open source paper/,
      }),
    );
    const paperDialog = await screen.findByRole('dialog', { name: TEST_DOI });
    expect(paperDialog).toBe(decisionDialog);
    expect(paperDialog.querySelector('.astra-dialog__crumb')).toHaveTextContent(
      'KiDS S8 low',
    );

    fireEvent.click(
      within(paperDialog).getByRole('button', {
        name: 'Back to previous record',
      }),
    );
    expect(await screen.findByRole('dialog', { name: 'KiDS S8 low' })).toBe(
      decisionDialog,
    );

    fireEvent.click(
      within(insightDialog).getByRole('button', {
        name: 'Back to previous record',
      }),
    );
    expect(
      await screen.findByRole('dialog', { name: 'Covariance source' }),
    ).toBe(decisionDialog);

    fireEvent.click(
      within(decisionDialog).getByRole('button', {
        name: 'Close decision details',
      }),
    );
    expect(
      screen.queryByRole('dialog', { name: 'Covariance source' }),
    ).not.toBeInTheDocument();
  });

  it('opens record details from the keyboard with Enter', async () => {
    const node: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--decision',
      data: {
        astra: {
          kind: 'decision',
          id: 'cov_source',
          canonicalPath: 'decisions.cov_source',
        },
      },
      children: [
        {
          type: 'text',
          key: 'keyboard-detail-text',
          value: 'covariance choice',
        },
      ],
    };
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      makePublication(),
    );

    fireEvent.keyDown(container.querySelector('.astra-ref-trigger')!, {
      key: 'Enter',
    });
    expect(
      await screen.findByRole('dialog', { name: 'Covariance source' }),
    ).toBeVisible();
  });

  it('keeps an analysis link as the direct popover trigger', async () => {
    const node: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--analysis',
      data: {
        astra: {
          kind: 'analysis',
          id: 'calibration',
          analysisPath: 'calibration',
          href: '/calibration',
        },
      },
      children: [
        {
          type: 'text',
          key: 'calibration-analysis',
          value: 'calibration analysis',
        },
      ],
    };
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      makePublication(),
    );
    const anchor = container.querySelector('a.astra-ref-anchor');
    expect(anchor).toHaveAttribute('href', '/calibration');
    expect(anchor).not.toHaveAttribute('role', 'button');
    expect(anchor?.parentElement?.classList.contains('astra-ref-trigger')).toBe(
      false,
    );
    expect(anchor).toHaveAttribute('aria-haspopup', 'dialog');
    fireEvent.focus(anchor!);
    const preview = await screen.findByRole('dialog', {
      name: /Calibration analysis preview/i,
    });
    expect(
      preview.querySelector('.astra-record-preview__kind'),
    ).toHaveTextContent('Sub-analysis');
    expect(preview).toHaveTextContent('0 decisions · 0 outputs');
    expect(preview).not.toHaveTextContent('Shear calibration sub-analysis.');
  });

  it('previews a value while keeping MySTRA formatted children authoritative', async () => {
    const node: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--value astra-ref--metric',
      data: {
        astra: {
          kind: 'value',
          id: 'sigma8_metric',
          canonicalPath: 'outputs.sigma8_metric',
          type: 'metric',
          product: 'sigma8 metric',
          unit: 'dimensionless',
        },
      },
      children: [{ type: 'text', key: 'metric-value', value: '0.811 ± 0.012' }],
    };
    const { container } = renderWithProviders(
      <AstraValue node={node} />,
      makePublication(),
    );
    expect(container).toHaveTextContent('0.811 ± 0.012');
    const trigger = container.querySelector<HTMLElement>('.astra-ref-trigger');
    expect(trigger).toHaveAttribute('role', 'button');
    fireEvent.focus(trigger!);
    const preview = await screen.findByRole('dialog', {
      name: /sigma8 metric output preview/i,
    });
    expect(preview).toHaveTextContent('dimensionless');
    expect(preview).toHaveTextContent('The recovered sigma8.');
    expect(
      preview.closest('[data-slot="preview-popover-portal"]'),
    ).toHaveAttribute('data-entry-kind', 'value');
    expect(
      preview.closest('[data-slot="preview-popover-portal"]'),
    ).toHaveAttribute('data-value-product', '');

    fireEvent.keyDown(trigger!, { key: ' ' });
    expect(
      await screen.findByRole('dialog', { name: 'sigma8 metric' }),
    ).toBeVisible();
  });

  it('marks a value product only when the preview actually renders one', async () => {
    const publication = makePublication();
    publication.document.analyses[0]!.outputs[0]!.label = undefined;
    const node: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--value astra-ref--metric',
      data: {
        astra: {
          kind: 'value',
          id: 'sigma8_metric',
          canonicalPath: 'outputs.sigma8_metric',
          filter: 'tracer=elg1, recon=Pre',
          selection: 'alpha1_std',
        },
      },
      children: [
        { type: 'text', key: 'value-without-product', value: '0.0696' },
      ],
    };
    const { container } = renderWithProviders(
      <AstraValue node={node} />,
      publication,
    );
    fireEvent.focus(container.querySelector('.astra-ref-trigger')!);
    const preview = await screen.findByRole('dialog', {
      name: /sigma8_metric output preview/i,
    });
    expect(
      preview.closest('[data-slot="preview-popover-portal"]'),
    ).not.toHaveAttribute('data-value-product');
    expect(
      preview.querySelector('.astra-record-preview__selection span'),
    ).toHaveTextContent('tracer=elg1, recon=Pre');
  });

  it('renders only the transport-verified artifact URL in output previews', async () => {
    const node: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--output',
      data: {
        astra: {
          kind: 'output',
          id: 'shear_plot',
          canonicalPath: 'outputs.shear_plot',
        },
      },
      children: [{ type: 'text', key: 'shear-plot', value: 'shear plot' }],
    };
    const { container } = renderWithProviders(
      <AstraInlineRef node={node} />,
      makePublication(),
    );
    fireEvent.focus(container.querySelector('.astra-ref-trigger')!);
    const preview = await screen.findByRole('dialog', {
      name: /Shear correlation plot output preview/i,
    });
    const image = preview.querySelector('.astra-output__thumb img');
    expect(image).toHaveAttribute('src', '/myst-assets/shear_plot.png');
    expect(image?.closest('[data-slot="artifact-preview"]')).toHaveAttribute(
      'data-compact',
    );

    fireEvent.click(container.querySelector('.astra-ref-trigger')!);
    const detail = await screen.findByRole('dialog', {
      name: 'Shear correlation plot',
    });
    expect(
      detail.querySelector('[data-slot="artifact-preview"] img'),
    ).toHaveAttribute('src', '/myst-assets/shear_plot.png');
    expect(detail.querySelector('.astra-output__thumb')).toBeNull();
  });

  it('recovers metric display parts and terminal source provenance', () => {
    const node: GenericNode = {
      type: 'div',
      class: 'astra-output astra-output--metric',
      identifier: 'output-sigma8_metric',
      data: {
        astra: {
          kind: 'output',
          id: 'sigma8_metric',
          canonicalPath: 'outputs.sigma8_metric',
        },
      },
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'strong',
              children: [{ type: 'text', value: 'sigma8 metric: ' }],
            },
            { type: 'text', value: '0.811' },
            { type: 'text', value: ' ± 0.012' },
            { type: 'text', value: ' dimensionless' },
          ],
        },
      ],
    };
    const { container } = renderWithProviders(
      <AstraOutput node={node} />,
      makePublication(),
    );
    expect(container.querySelector('.astra-metric__value')).toHaveTextContent(
      '0.811',
    );
    expect(
      container.querySelector('.astra-metric__uncertainty'),
    ).toHaveTextContent('0.012');
    expect(
      container.querySelector('.astra-output__provenance'),
    ).toHaveTextContent('shear_catalog');
  });

  it('keeps decision provenance without exposing direct inputs as source data', () => {
    const node: GenericNode = {
      type: 'div',
      class: 'astra-output astra-output--figure',
      identifier: 'output-shear_plot',
      data: {
        astra: {
          kind: 'output',
          id: 'shear_plot',
          canonicalPath: 'outputs.shear_plot',
        },
      },
    };
    const { container } = renderWithProviders(
      <AstraOutput node={node} />,
      makePublication(),
    );
    const provenance = container.querySelector('.astra-output__provenance');
    expect(provenance).toHaveTextContent('Decisions (1)');
    expect(provenance).toHaveTextContent('Covariance source');
    expect(provenance).not.toHaveTextContent('Source data');
  });

  it('does not present an intermediate output as source data', () => {
    const publication = makePublication();
    publication.document.results[0]!.inputs = [
      { entry: 'shear_plot', result: 'shear_plot#default' },
    ];
    const node: GenericNode = {
      type: 'div',
      class: 'astra-output astra-output--metric',
      identifier: 'output-sigma8_metric',
      data: {
        astra: {
          kind: 'output',
          id: 'sigma8_metric',
          canonicalPath: 'outputs.sigma8_metric',
        },
      },
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'strong', children: [{ type: 'text', value: 'sigma8: ' }] },
            { type: 'text', value: '0.811' },
          ],
        },
      ],
    };
    const { container } = renderWithProviders(
      <AstraOutput node={node} />,
      publication,
    );
    const provenance = container.querySelector('.astra-output__provenance');
    expect(provenance).toHaveTextContent('Covariance source');
    expect(provenance).not.toHaveTextContent('Source data');
    expect(provenance).not.toHaveTextContent('shear_plot');
  });

  it('keeps depth-first result provenance order and terminates cyclic branches', () => {
    const publication = makePublication();
    const analysis = publication.document.analyses[0]!;
    analysis.inputs.push({
      ref: 'inputs.second_catalog',
      path: 'data/second.csv',
      label: 'Second catalog',
      tags: [],
    });
    analysis.decisions.push(
      {
        ref: 'decisions.nested_method',
        label: 'Nested method',
        tags: [],
        options: [],
      },
      {
        ref: 'decisions.branch_method',
        label: 'Branch method',
        tags: [],
        options: [],
      },
    );
    analysis.outputs.push(
      {
        ref: 'outputs.nested_stage',
        label: 'Nested stage',
        type: 'data',
        format: 'json',
        tags: [],
        decisions: ['decisions.nested_method'],
      },
      {
        ref: 'outputs.second_branch',
        label: 'Second branch',
        type: 'data',
        format: 'json',
        tags: [],
        decisions: ['decisions.branch_method'],
      },
    );
    publication.document.results[0]!.inputs = [
      { entry: 'shear_plot', result: 'shear_plot#default' },
      { entry: 'second_branch', result: 'second_branch#default' },
    ];
    publication.document.results[1]!.inputs = [
      { entry: 'nested_stage', result: 'nested_stage#default' },
    ];
    publication.document.results.push(
      {
        id: 'nested_stage#default',
        output: 'outputs.nested_stage',
        universe: 'universes.default',
        places: [],
        inputs: [
          { entry: 'shear_catalog', input: 'inputs.shear_catalog' },
          { entry: 'loop', result: 'sigma8_metric#default' },
        ],
      },
      {
        id: 'second_branch#default',
        output: 'outputs.second_branch',
        universe: 'universes.default',
        places: [],
        inputs: [{ entry: 'second_catalog', input: 'inputs.second_catalog' }],
      },
    );
    publication.index = indexResolvedAnalysis(publication.document);
    const node = {
      type: 'div',
      class: 'astra-output astra-output--metric',
      data: {
        astra: { kind: 'output', canonicalPath: 'outputs.sigma8_metric' },
      },
      children: [],
    } as GenericNode;
    const { container } = renderWithProviders(
      <AstraOutput node={node} />,
      publication,
    );
    const provenance = container.querySelector('.astra-output__provenance')!;
    expect(
      [...provenance.querySelectorAll('.astra-output__prov-decisions li')].map(
        (item) => item.querySelector('.astra-ref--decision')?.textContent,
      ),
    ).toEqual(['◇Covariance source', '◇Nested method', '◇Branch method']);
    expect(
      [...provenance.querySelectorAll('.astra-output__prov-row > code')].map(
        (item) => item.textContent,
      ),
    ).toEqual(['shear_catalog', 'second_catalog']);
  });

  it('uses a pinned result universe when showing upstream decision selections', () => {
    const publication = makePublication();
    publication.document.results[0]!.inputs = [
      { entry: 'shear_plot#alternate', result: 'shear_plot#alternate' },
    ];
    const node = {
      type: 'div',
      class: 'astra-output astra-output--metric',
      data: {
        astra: { kind: 'output', canonicalPath: 'outputs.sigma8_metric' },
      },
      children: [],
    } as GenericNode;
    const { container } = renderWithProviders(
      <AstraOutput node={node} />,
      publication,
    );
    expect(container.querySelector('.astra-prov-selection')).toHaveTextContent(
      'Jackknife',
    );
  });

  it('shows switch-only provenance decisions in the selected universe', () => {
    const publication = makePublication();
    const analysis = publication.document.analyses[0]!;
    analysis.outputs[0]!.inputs = [
      { entry: 'chosen', target: 'switches.chosen' },
    ];
    analysis.switches = [{
      ref: 'switches.chosen',
      decision: 'decisions.cov_source',
      cases: {
        analytic: { entry: 'analytic_data', target: 'outputs.analytic_data' },
        jackknife: { entry: 'jackknife_data', target: 'outputs.jackknife_data' },
      },
    }];
    for (const method of ['analytic', 'jackknife']) {
      analysis.outputs.push({
        ref: `outputs.${method}_data`,
        type: 'data', format: 'json', tags: [], decisions: [], inputs: [],
      });
      publication.document.results.push({
        id: `${method}_data`, output: `outputs.${method}_data`,
        places: [], inputs: [],
      });
    }
    publication.document.results.find((result) => result.id === 'sigma8_metric#default')!.inputs = [
      { entry: 'chosen', result: 'analytic_data' },
    ];
    publication.document.results.find((result) => result.id === 'sigma8_metric#alternate')!.inputs = [
      { entry: 'chosen', result: 'jackknife_data' },
    ];
    publication.index = indexResolvedAnalysis(publication.document);
    const node = {
      type: 'div', class: 'astra-output astra-output--metric',
      data: { astra: { kind: 'output', canonicalPath: 'outputs.sigma8_metric' } },
      children: [],
    } as GenericNode;
    for (const [universe, option] of [['default', 'Analytic'], ['alternate', 'Jackknife']]) {
      const { container, unmount } = renderWithProviders(
        <AstraOutput node={node} />,
        { ...publication, universe: `universes.${universe}` },
      );
      const provenance = container.querySelector('.astra-output__provenance');
      expect(provenance).toHaveTextContent('Decisions (1)');
      expect(provenance).toHaveTextContent('Covariance source');
      expect(provenance?.querySelector('.astra-prov-selection')).toHaveTextContent(option);
      unmount();
    }
  });

  it.each(['Analytic', 'Jackknife'])(
    'keeps both pinned provenance options and the %s preview context',
    async (option) => {
      const publication = makePublication();
      publication.document.results[0]!.inputs = [
        { entry: 'shear_plot#default', result: 'shear_plot#default' },
        { entry: 'shear_plot#alternate', result: 'shear_plot#alternate' },
      ];
      const node = {
        type: 'div', class: 'astra-output astra-output--metric',
        data: { astra: { kind: 'output', canonicalPath: 'outputs.sigma8_metric' } },
        children: [],
      } as GenericNode;
      const { container } = renderWithProviders(<AstraOutput node={node} />, publication);
      const provenance = container.querySelector('.astra-output__provenance')!;
      expect(provenance).toHaveTextContent('Decisions (2)');
      const rows = [...provenance.querySelectorAll('.astra-output__prov-decisions li')];
      expect(rows.map((row) => row.querySelector('.astra-prov-selection')?.textContent)).toEqual([
        'Analytic', 'Jackknife',
      ]);
      fireEvent.click(provenance.querySelector('summary')!);
      const row = rows.find((item) => item.querySelector('.astra-prov-selection')?.textContent === option)!;
      const trigger = row.querySelector('.astra-ref-trigger')!;
      fireEvent.focus(trigger);
      const preview = await screen.findByRole('dialog', { name: /Covariance source decision preview/i });
      expect(preview.querySelector('li[data-selected] strong')).toHaveTextContent(option);
      fireEvent.click(trigger);
      const detail = await screen.findByRole('dialog', { name: 'Covariance source' });
      expect(detail.querySelector('.astra-decision-options li[data-selected] strong')).toHaveTextContent(option);
    },
  );

  it('keeps inherited provenance decisions as navigation-only links', () => {
    const publication = makePublication();
    const analysis = publication.document.analyses[0]!;
    const calibration = publication.document.analyses[1]!;
    calibration.decisions.push({
      ref: 'calibration.decisions.photo_z',
      tags: [],
      label: 'Photo-z calibration',
      options: [],
    });
    analysis.outputs[0]!.decisions = ['calibration.decisions.photo_z'];
    publication.index = indexResolvedAnalysis(publication.document);
    const node: GenericNode = {
      type: 'div',
      class: 'astra-output astra-output--metric',
      identifier: 'output-sigma8_metric',
      data: {
        astra: {
          kind: 'output',
          id: 'sigma8_metric',
          canonicalPath: 'outputs.sigma8_metric',
        },
      },
      children: [],
    };
    renderWithProviders(<AstraOutput node={node} />, publication);
    const link = screen.getByText('Photo-z calibration');
    expect(link).toHaveAttribute('href', '/calibration#decision-photo_z');
    expect(link.parentElement).not.toHaveClass('astra-ref-trigger');
  });

  it('preserves MySTRA data/report outputs as stock collapsed details', () => {
    const node: GenericNode = {
      type: 'details',
      class: 'myst-dropdown astra-output astra-output--data',
      open: false,
      identifier: 'output-catalog_summary',
      data: {
        astra: {
          kind: 'output',
          id: 'catalog_summary',
          canonicalPath: 'outputs.catalog_summary',
        },
      },
      children: [
        {
          type: 'summary',
          key: 'catalog-summary-title',
          children: [
            {
              type: 'text',
              key: 'catalog-summary-title-text',
              value: 'Catalog summary',
            },
          ],
        },
        {
          type: 'paragraph',
          key: 'catalog-summary-body',
          children: [
            {
              type: 'text',
              key: 'catalog-summary-body-text',
              value: 'Neutral tabular content',
            },
          ],
        },
      ],
    } as GenericNode;

    const { container } = renderWithProviders(
      <MyST ast={node} />,
      makePublication(),
    );
    const details = container.querySelector<HTMLDetailsElement>(
      'details.astra-output',
    );
    expect(details).toBeTruthy();
    expect(details?.open).toBe(false);
    expect(details?.querySelector('summary')).toHaveTextContent(
      'Catalog summary',
    );
    expect(details).toHaveTextContent('Neutral tabular content');
    expect(details?.querySelector('.astra-output__provenance')).toBeNull();
  });

  it('uses registry row canonical paths and analysisPath for cards', () => {
    const publication = makePublication();
    publication.document.analyses[0]!.inputs[0]!.path =
      'data/reconstruction.csv';
    const registry: GenericNode = {
      type: 'table',
      class: 'astra-inputs',
      children: [
        { type: 'tableRow', children: [] },
        {
          type: 'tableRow',
          identifier: 'input-shear_catalog',
          data: {
            astra: {
              kind: 'input',
              id: 'shear_catalog',
              canonicalPath: 'inputs.shear_catalog',
            },
          },
          children: [],
        },
      ],
    };
    const card: GenericNode = {
      type: 'card',
      class: 'astra-subanalysis',
      identifier: 'analysis-calibration',
      data: {
        astra: {
          kind: 'analysis',
          id: 'calibration',
          analysisPath: 'calibration',
          href: '/calibration',
        },
      },
    };
    const { unmount } = renderWithProviders(
      <AstraDataSources node={registry} />,
      publication,
    );
    expect(screen.getByText('shear_catalog')).toHaveAttribute(
      'href',
      '#input-shear_catalog',
    );
    expect(screen.getByText('shear_catalog').closest('tr')).toHaveAttribute(
      'id',
      'input-shear_catalog',
    );
    expect(screen.getByText('shear_catalog').closest('tr')).toHaveTextContent(
      'data/reconstruction.csv',
    );
    expect(
      screen.getByText('shear_catalog').closest('tr'),
    ).not.toHaveTextContent(
      'reconstruction.outputs.post_recon_catalog_lrg_full',
    );
    unmount();
    renderWithProviders(<AstraSubanalysis node={card} />, publication);
    expect(screen.getByText('Calibration')).toHaveAttribute(
      'href',
      '/calibration',
    );
    expect(screen.getByText('0 decisions · 0 outputs')).toBeVisible();
  });

  it('only links a registry output when its page anchor is present', () => {
    const registry: GenericNode = {
      type: 'table',
      class: 'astra-outputs',
      children: [
        { type: 'tableRow', children: [] },
        {
          type: 'tableRow',
          data: {
            astra: {
              kind: 'output',
              id: 'shear_plot',
              canonicalPath: 'outputs.shear_plot',
            },
          },
          children: [],
        },
      ],
    };
    const publication = makePublication();
    const { unmount } = renderWithProviders(
      <AstraDataSources node={registry} />,
      publication,
    );
    expect(screen.getByText('shear_plot').tagName).toBe('SPAN');
    expect(screen.getByText('shear_plot').closest('tr')).toHaveTextContent(
      '/myst-assets/shear_plot.png',
    );
    expect(screen.getByText('shear_plot').closest('tr')).not.toHaveTextContent(
      'results/shear_plot.png',
    );

    unmount();
    renderWithProviders(<AstraDataSources node={registry} />, {
      ...publication,
      placedIdentifiers: new Set(['output-shear_plot']),
    });
    expect(screen.getByText('shear_plot')).toHaveAttribute(
      'href',
      '#output-shear_plot',
    );
  });

  it('delegates a failed subanalysis lookup to the full stock card node', () => {
    const node: GenericNode = {
      type: 'card',
      class: 'astra-subanalysis author-card',
      identifier: 'analysis-missing',
      title: 'Neutral calibration',
      children: [],
    } as GenericNode;
    const { container } = renderWithProviders(
      <AstraSubanalysis node={node} />,
      makePublication(),
    );
    expect(screen.getByText('Neutral calibration')).toBeVisible();
    expect(container.querySelector('.myst-card')).not.toHaveClass(
      'astra-subanalysis',
    );
  });

  it('falls back once, strips dispatch tokens, and preserves near-match author classes', () => {
    const node: GenericNode = {
      type: 'div',
      class: [
        'author-carrier',
        'not-astra-output',
        'astra-output',
        'astra-output--figure',
        'astra-output-ish',
      ],
      children: [
        {
          type: 'paragraph',
          key: 'fallback-paragraph',
          children: [
            {
              type: 'text',
              key: 'fallback-text',
              value: 'Neutral output remains readable',
            },
          ],
        },
      ],
    };

    const { container } = renderWithProviders(
      <MyST ast={node} />,
      makePublication(),
    );
    const fallback = container.querySelector('div.author-carrier');

    expect(screen.getByText('Neutral output remains readable')).toBeVisible();
    expect(fallback).toBeTruthy();
    expect(fallback).not.toHaveClass('astra-output');
    expect(fallback).not.toHaveClass('astra-output--figure');
    expect(fallback).toHaveClass('not-astra-output');
    expect(fallback).toHaveClass('astra-output-ish');
    expect(container.querySelectorAll('div.author-carrier')).toHaveLength(1);
  });
});
