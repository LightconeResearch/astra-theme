import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AstraPaperReference,
  AstraRecordReference,
  InventoryExplorer,
  createInventoryModel,
  type InventoryPaper,
} from '../src/inventory/record-detail';
import { makeInventorySnapshot } from './helpers/store';

describe('host-neutral record details', () => {
  it('renders the exact decision preview and activates without a MyST node', () => {
    const snapshot = makeInventorySnapshot();
    const model = createInventoryModel(snapshot);
    const record = model.recordByPath.get('decisions.cov_source')!.record;
    const onActivate = vi.fn();
    const { container } = render(
      <AstraRecordReference
        record={record}
        model={model}
        label="the covariance choice"
        onActivate={onActivate}
      />,
    );

    const trigger = container.querySelector('.astra-ref-trigger')!;
    expect(trigger.querySelector('.astra-ref--decision')).toHaveTextContent(
      'the covariance choice',
    );
    fireEvent.focus(trigger);
    expect(screen.getByText('DECISION')).toBeInTheDocument();
    expect(screen.getByText('Covariance source')).toBeInTheDocument();
    expect(screen.getByText('SUPPORTED BY')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(onActivate).toHaveBeenCalledOnce();
  });

  it('renders DOI-derived papers with the shared token and card chrome', () => {
    const paper: InventoryPaper = {
      doi: '10.1234/example',
      title: 'An example paper',
      authors: 'A. Researcher',
      insights: [],
      decisions: [],
    };
    const { container } = render(
      <AstraPaperReference paper={paper} label="the reference study" />,
    );

    const trigger = container.querySelector('.astra-ref-trigger')!;
    expect(trigger.querySelector('.astra-ref--paper')).toHaveTextContent(
      'the reference study',
    );
    fireEvent.focus(trigger);
    expect(screen.getByText('PAPER')).toBeInTheDocument();
    expect(screen.getByText('An example paper')).toBeInTheDocument();
    expect(screen.getByText('10.1234/example')).toBeInTheDocument();
  });

  it('opens a paper directly by DOI and notifies an external close handler', () => {
    const snapshot = makeInventorySnapshot();
    const insight = snapshot.scopes[0].records.find(
      (record) => record.kind === 'prior_insight',
    )!;
    insight.doi = '10.1234/example';
    insight.evidence = [{
      doi: '10.1234/example',
      quote: 'Supporting source text.',
    }];
    const onClose = vi.fn();

    render(
      <InventoryExplorer
        snapshot={snapshot}
        dialogsOnly
        openReference={{ kind: 'paper', doi: '10.1234/example' }}
        onClose={onClose}
      />,
    );

    expect(
      screen.getByRole('dialog', { name: '10.1234/example' }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Close paper details' }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('delegates overview selections to the host without replacing the detail stack', () => {
    const onOpenReference = vi.fn();

    render(
      <InventoryExplorer
        snapshot={makeInventorySnapshot()}
        onOpenReference={onOpenReference}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Shear correlation plot/i }),
    );
    expect(onOpenReference).toHaveBeenCalledWith(
      {
        kind: 'output',
        id: 'shear_plot',
        path: 'outputs.shear_plot',
      },
      'root',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
