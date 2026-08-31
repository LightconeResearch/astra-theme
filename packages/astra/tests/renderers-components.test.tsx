import * as React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import type { ResolvedInsight } from '@astra-spec/sdk';
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
      within(insightDialog).getByRole('button', { name: new RegExp(TEST_DOI) }),
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

  it('keeps an analysis link as the direct popover trigger', () => {
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

    fireEvent.keyDown(trigger!, { key: ' ' });
    expect(
      await screen.findByRole('dialog', { name: 'sigma8 metric' }),
    ).toBeVisible();
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

  it('recovers metric display parts from neutral children and adds provenance', () => {
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
              id: 'sigma8_metric',
              canonicalPath: 'outputs.sigma8_metric',
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
    expect(screen.getByText('sigma8_metric').tagName).toBe('SPAN');

    unmount();
    renderWithProviders(
      <AstraDataSources node={registry} />,
      {
        ...publication,
        placedIdentifiers: new Set(['output-sigma8_metric']),
      },
    );
    expect(screen.getByText('sigma8_metric')).toHaveAttribute(
      'href',
      '#output-sigma8_metric',
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
