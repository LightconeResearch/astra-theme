import * as React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { indexAnalysis, type ResolvedInsight } from '@astra-spec/sdk';
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
    expect(screen.getByText('Analytic covariance is fastest and validated here.')).toBeVisible();
    expect(screen.getByText(/default: Analytic · 2 options/)).toBeVisible();

    const viewGroup = screen.getByRole('group', { name: 'Decision view' });
    const narrativeButton = within(viewGroup).getByRole('button', { name: 'Narrative' });
    const optionsButton = within(viewGroup).getByRole('button', { name: 'Options' });
    expect(narrativeButton).toHaveAttribute('aria-pressed', 'true');
    expect(optionsButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();

    fireEvent.click(optionsButton);
    expect(narrativeButton).toHaveAttribute('aria-pressed', 'false');
    expect(optionsButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Analytic')).toBeVisible();

    unmount();
    renderWithProviders(
      <AstraDecision node={{ ...node, data: undefined }} />,
      makePublication(),
    );
    expect(screen.getByText('neutral decision')).toBeVisible();
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
    expect(container.querySelector('.astra-finding__kind')).toHaveTextContent('FINDING');
    expect(screen.getByText(/consistent with the Planck 2018 value/)).toBeVisible();
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
              value: 'The recovered S8 is consistent with the Planck 2018 value.',
            },
          ],
        },
      ],
    };

    renderWithProviders(<AstraFinding node={node} />, makePublication());
    expect(screen.getByText(/consistent with the Planck 2018 value/)).toBeVisible();
    expect(screen.queryByText('All tomographic bins.')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Consistency holds across both binning choices.'),
    ).not.toBeInTheDocument();
  });

  it('uses the exact neutral finding when field visibility is ambiguous', () => {
    const publication = makePublication();
    const finding = publication.index.recordByPath.get(
      'findings.s8_consistent',
    ) as ResolvedInsight;
    finding.notes = finding.claim;
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
          depth: 3,
          key: 'ambiguous-finding-heading',
          children: [
            {
              type: 'text',
              key: 'ambiguous-finding-heading-text',
              value: finding.claim,
            },
          ],
        },
      ],
    };

    const { container } = renderWithProviders(
      <AstraFinding node={node} />,
      publication,
    );
    expect(container.querySelector('.astra-finding')).toBeNull();
    expect(container.querySelector('.astra-finding__notes')).toBeNull();
    expect(screen.getByRole('heading')).toHaveTextContent(finding.claim);
  });

  it('preserves neutral finding notes when Markdown changes their rendered text', () => {
    const publication = makePublication();
    const finding = publication.index.recordByPath.get(
      'findings.s8_consistent',
    ) as ResolvedInsight;
    finding.notes = '[A &amp; B][guide]\n\n[guide]: https://example.test/guide';
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
          depth: 3,
          key: 'markdown-finding-heading',
          children: [
            {
              type: 'text',
              key: 'markdown-finding-heading-text',
              value: finding.claim,
            },
          ],
        },
        {
          type: 'paragraph',
          key: 'markdown-finding-notes',
          children: [
            {
              type: 'link',
              key: 'markdown-finding-notes-link',
              url: 'https://example.test/guide',
              children: [
                {
                  type: 'text',
                  key: 'markdown-finding-notes-link-text',
                  value: 'A & B',
                },
              ],
            },
          ],
        },
      ],
    };

    const { container } = renderWithProviders(
      <AstraFinding node={node} />,
      publication,
    );
    expect(container.querySelector('.astra-finding')).toBeNull();
    expect(screen.getByRole('link', { name: 'A & B' })).toHaveAttribute(
      'href',
      'https://example.test/guide',
    );
  });

  it('keeps a prior-insight quote paired with its own DOI evidence', () => {
    const publication = makePublication({ doi: TEST_DOI });
    const insight = publication.index.recordByPath.get(
      'prior_insights.kids_s8_low',
    ) as ResolvedInsight;
    insight.evidence = [
      {
        id: 'quote-only',
        quote: { exact: 'A quote from a different source.' },
      },
      {
        id: 'primary-paper',
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
    expect(preview.querySelector('.astra-record-preview__relation-trigger')).toBeTruthy();
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
    expect(preview.querySelector('.astra-record-preview__kind')).toHaveTextContent(
      'Prior insight',
    );
  });

  it('keeps an authored input alias visible in its preview', async () => {
    const publication = makePublication();
    const input = publication.document.analysis.inputs[0]!;
    input.from = '../reconstruction.post_recon_catalog_lrg_full';
    input.resolvedFrom =
      'reconstruction.outputs.post_recon_catalog_lrg_full';
    const node: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--input',
      data: {
        astra: {
          kind: 'input',
          id: input.id,
          canonicalPath: input.canonicalPath,
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
    expect(preview).toHaveTextContent(
      '../reconstruction.post_recon_catalog_lrg_full',
    );
    expect(preview).not.toHaveTextContent(
      'reconstruction.outputs.post_recon_catalog_lrg_full',
    );
  });

  it('retains the released decision overflow copy', async () => {
    const publication = makePublication();
    const analysis = publication.document.analysis;
    const source = analysis.prior_insights[0]!;
    const paths = [source.canonicalPath];
    for (let number = 2; number <= 4; number += 1) {
      const canonicalPath = `prior_insights.support_${number}`;
      analysis.prior_insights.push({
        ...source,
        id: `support_${number}`,
        canonicalPath,
        label: `Supporting insight ${number}`,
      });
      paths.push(canonicalPath);
    }
    analysis.decisions[0]!.options[0]!.resolvedInsightPaths = paths;
    publication.index = indexAnalysis(publication.document);

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
        { type: 'text', key: 'covariance-detail-text', value: 'covariance choice' },
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
    expect(dialogScope).toHaveClass('lightcone-brand', 'astra-ui');
    expect(dialogScope).toHaveStyle({ display: 'contents' });
    expect(dialogScope).toHaveAttribute(
      'data-lightcone-color-scheme',
      'light',
    );
    expect(dialogScope).toHaveAttribute('data-astra-color-scheme', 'light');
    expect(decisionDialog.closest('.astra-ui')).toBe(dialogScope);
    expect(document.querySelectorAll('dialog[data-slot="dialog"]')).toHaveLength(1);

    fireEvent.click(
      within(decisionDialog).getByRole('button', {
        name: 'Open insight details: KiDS S8 low',
      }),
    );
    const insightDialog = await screen.findByRole('dialog', {
      name: 'KiDS S8 low',
    });
    expect(insightDialog).toBe(decisionDialog);
    expect(document.querySelectorAll('dialog[data-slot="dialog"]')).toHaveLength(1);
    expect(insightDialog.querySelector('.astra-dialog__crumb')).toHaveTextContent(
      'Covariance source',
    );

    fireEvent.click(
      // The insight's source control names the action, not the DOI; it opens the paper dialog.
      within(insightDialog).getByRole('button', { name: /Locate passage in paper|Open source paper/ }),
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
    expect(
      await screen.findByRole('dialog', { name: 'KiDS S8 low' }),
    ).toBe(decisionDialog);

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
        { type: 'text', key: 'keyboard-detail-text', value: 'covariance choice' },
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
    expect(anchor?.parentElement?.classList.contains('astra-ref-trigger')).toBe(false);
    expect(anchor).toHaveAttribute('aria-haspopup', 'dialog');
    fireEvent.focus(anchor!);
    const preview = await screen.findByRole('dialog', {
      name: /Calibration analysis preview/i,
    });
    expect(preview.querySelector('.astra-record-preview__kind')).toHaveTextContent(
      'Sub-analysis',
    );
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
      children: [
        { type: 'text', key: 'metric-value', value: '0.811 ± 0.012' },
      ],
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
    publication.document.analysis.outputs[0]!.label = undefined;
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
      children: [{ type: 'text', key: 'value-without-product', value: '0.0696' }],
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
    expect(preview.querySelector('.astra-record-preview__selection span')).toHaveTextContent(
      'tracer=elg1, recon=Pre',
    );
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
    expect(detail.querySelector('[data-slot="artifact-preview"] img')).toHaveAttribute(
      'src',
      '/myst-assets/shear_plot.png',
    );
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
            { type: 'strong', children: [{ type: 'text', value: 'sigma8 metric: ' }] },
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
    expect(container.querySelector('.astra-metric__value')).toHaveTextContent('0.811');
    expect(container.querySelector('.astra-metric__uncertainty')).toHaveTextContent('0.012');
    expect(container.querySelector('.astra-output__provenance')).toHaveTextContent(
      'shear_catalog',
    );
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
    publication.document.analysis.outputs[0]!.provenance.inputPaths = [
      'outputs.shear_plot',
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

  it('keeps depth-first provenance order and terminates cyclic branches', () => {
    const publication = makePublication();
    const analysis = publication.document.analysis;
    const target = analysis.outputs[0]!;
    const firstBranch = analysis.outputs[1]!;

    analysis.inputs.push({
      kind: 'input',
      canonicalPath: 'inputs.second_catalog',
      id: 'second_catalog',
      label: 'Second catalog',
      type: 'data',
    });
    analysis.decisions.push(
      {
        kind: 'decision',
        canonicalPath: 'decisions.nested_method',
        id: 'nested_method',
        label: 'Nested method',
        active: true,
        options: [],
      },
      {
        kind: 'decision',
        canonicalPath: 'decisions.branch_method',
        id: 'branch_method',
        label: 'Branch method',
        active: true,
        options: [],
      },
    );
    analysis.outputs.push(
      {
        kind: 'output',
        canonicalPath: 'outputs.nested_stage',
        id: 'nested_stage',
        label: 'Nested stage',
        type: 'data',
        format: 'json',
        active: true,
        provenance: {
          inputPaths: ['inputs.shear_catalog', target.canonicalPath],
          decisionPaths: ['decisions.nested_method'],
        },
      },
      {
        kind: 'output',
        canonicalPath: 'outputs.second_branch',
        id: 'second_branch',
        label: 'Second branch',
        type: 'data',
        format: 'json',
        active: true,
        provenance: {
          inputPaths: ['inputs.second_catalog'],
          decisionPaths: ['decisions.branch_method'],
        },
      },
    );
    firstBranch.provenance.inputPaths = ['outputs.nested_stage'];
    target.provenance.inputPaths = [
      firstBranch.canonicalPath,
      'outputs.second_branch',
    ];
    publication.index = indexAnalysis(publication.document);

    const node: GenericNode = {
      type: 'div',
      class: 'astra-output astra-output--metric',
      identifier: 'output-sigma8_metric',
      data: {
        astra: {
          kind: 'output',
          id: target.id,
          canonicalPath: target.canonicalPath,
        },
      },
      children: [],
    };
    const { container } = renderWithProviders(
      <AstraOutput node={node} />,
      publication,
    );
    const provenance = container.querySelector('.astra-output__provenance')!;
    expect(
      [...provenance.querySelectorAll('.astra-output__prov-decisions li')].map(
        (item) => item.querySelector('.astra-ref--decision')?.textContent,
      ),
    ).toEqual(['Covariance source', 'Nested method', 'Branch method']);
    expect(
      [...provenance.querySelectorAll('.astra-output__prov-row > code')].map(
        (item) => item.textContent,
      ),
    ).toEqual(['shear_catalog', 'second_catalog']);
  });

  it('keeps inherited provenance decisions as navigation-only links', () => {
    const publication = makePublication();
    const analysis = publication.document.analysis;
    const calibration = analysis.analyses[0]!;
    calibration.decisions.push({
      kind: 'decision',
      canonicalPath: 'calibration.decisions.photo_z',
      id: 'photo_z',
      label: 'Photo-z calibration',
      active: true,
      options: [],
    });
    analysis.outputs[0]!.provenance.decisionPaths = [
      'calibration.decisions.photo_z',
    ];
    publication.index = indexAnalysis(publication.document);
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
    publication.document.analysis.inputs[0]!.from =
      '../reconstruction.post_recon_catalog_lrg_full';
    publication.document.analysis.inputs[0]!.resolvedFrom =
      'reconstruction.outputs.post_recon_catalog_lrg_full';
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
    expect(screen.getByText('shear_catalog')).toHaveAttribute('href', '#input-shear_catalog');
    expect(screen.getByText('shear_catalog').closest('tr')).toHaveAttribute(
      'id',
      'input-shear_catalog',
    );
    expect(screen.getByText('shear_catalog').closest('tr')).toHaveTextContent(
      '../reconstruction.post_recon_catalog_lrg_full',
    );
    expect(screen.getByText('shear_catalog').closest('tr')).not.toHaveTextContent(
      'reconstruction.outputs.post_recon_catalog_lrg_full',
    );
    unmount();
    renderWithProviders(<AstraSubanalysis node={card} />, publication);
    expect(screen.getByText('Calibration')).toHaveAttribute('href', '/calibration');
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
    renderWithProviders(
      <AstraDataSources node={registry} />,
      {
        ...publication,
        placedIdentifiers: new Set(['output-shear_plot']),
      },
    );
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
    expect(container.querySelector('.myst-card')).not.toHaveClass('astra-subanalysis');
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
