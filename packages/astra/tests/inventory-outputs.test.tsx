import { fireEvent, render, screen, within } from '@testing-library/react';
import { InventoryOutline, OverviewInventory } from '../src/inventory';
import type { InventoryPaperMetadataMap, InventorySnapshot } from '../src/inventory';

const paperMetadata: InventoryPaperMetadataMap = {
  '10.48550/arXiv.0812.2905': {
    title: 'Reconstructing Baryon Oscillations: A Lagrangian Theory Perspective',
    authors: 'Nikhil Padmanabhan, Martin White, J. D. Cohn',
    pdfUrl: 'https://arxiv.org/pdf/0812.2905#view=FitH',
  },
};

const snapshot: InventorySnapshot = {
  version: 1,
  fixture: {
    label: 'Test fixture',
    source: 'test',
    frozen: '2026-07-21',
    disclaimer: 'Static test data.',
  },
  analysis: {
    id: 'analysis',
    name: 'Analysis',
    description: 'Test analysis',
  },
  scopes: [
    {
      id: 'root',
      path: '',
      name: 'Analysis',
      children: ['child'],
      records: [
        {
          id: 'catalog',
          path: 'inputs.catalog',
          kind: 'input',
          type: 'data',
          label: 'Source catalog',
          description: 'The source observations.',
          source: 'data/catalog.fits',
        },
        {
          id: 'fit',
          path: 'decisions.fit',
          kind: 'decision',
          label: 'Fit choice',
          tags: ['modeling', 'method'],
          rationale: 'The baseline fit matches the declared reference analysis.',
          selected: 'baseline',
          options: {
            baseline: 'Baseline fit',
            alternate: 'Alternate fit',
          },
          option_insights: {
            baseline: ['baseline_evidence', 'unlabeled_evidence'],
          },
        },
        {
          id: 'calibration',
          path: 'decisions.calibration',
          kind: 'decision',
          label: 'Calibration choice',
          tags: ['priors'],
          selected: 'standard',
          options: { standard: 'Standard calibration' },
        },
        {
          id: 'baseline_evidence',
          path: 'prior_insights.baseline_evidence',
          kind: 'prior_insight',
          label: 'Baseline calibration evidence',
          claim: 'The baseline calibration is supported by the reference analysis.',
          doi: '10.48550/arXiv.0812.2905',
          quote: 'Reconstruction reduces the damping of the oscillations.',
          evidence: [
            {
              doi: '10.48550/arXiv.0812.2905',
              quote: 'Reconstruction reduces the damping of the oscillations.',
              page: 4,
            },
            {
              doi: '10.48550/arXiv.0812.2905',
              quote: 'A second excerpt from the same supporting paper.',
              page: 5,
            },
          ],
        },
        {
          id: 'unlabeled_evidence',
          path: 'prior_insights.unlabeled_evidence',
          kind: 'prior_insight',
          claim: 'This complete unlabeled insight explains why the selected decision remains appropriate for the analysis.',
        },
        {
          id: 'result_figure',
          path: 'outputs.result_figure',
          kind: 'output',
          type: 'figure',
          label: 'Result figure',
          description: 'The main result.',
          resultPreview: '/result.png',
          resolved_path: 'results/result_figure.png',
          inputs: ['result_table'],
          inputs_root: [{ id: 'catalog', label: 'Source catalog' }],
          decisions: ['fit'],
          decisions_transitive: [
            { id: 'fit', label: 'Fit choice', selection: 'Baseline fit' },
            {
              id: 'calibration',
              label: 'Calibration choice',
              selection: 'Standard calibration',
              via: 'root',
            },
          ],
          recipe: { command: 'python make_figure.py' },
        },
        {
          id: 'samples',
          path: 'outputs.samples',
          kind: 'output',
          type: 'data',
          description: 'Posterior samples file.',
          resolved_path: 'results/samples.npy',
        },
        {
          id: 'result_table',
          path: 'outputs.result_table',
          kind: 'output',
          type: 'table',
          label: 'Result table',
          table_data: {
            headers: ['bin', 'value'],
            rows: [[1, 2.5]],
          },
        },
        {
          id: 'result_is_consistent',
          path: 'findings.result_is_consistent',
          kind: 'finding',
          label: 'Consistent result',
          claim: 'The recovered measurement is consistent with the reference analysis.',
          notes: 'The comparison remains within the declared uncertainty across the fitted range.',
          scope: 'Baseline universe, full fitted range.',
          evidence: [{
            artifact: 'result_figure',
            quote: 'The recovered curve remains inside the reference uncertainty band.',
          }],
        },
      ],
    },
    {
      id: 'child',
      path: 'child',
      name: 'Child analysis',
      parent: 'root',
      children: [],
      records: [
        {
          id: 'baseline_evidence',
          path: 'child.prior_insights.baseline_evidence',
          kind: 'prior_insight',
          claim: 'A child-scoped copy must not replace root decision evidence.',
          doi: '10.48550/arXiv.1807.06209',
          quote: 'A child-scoped quote.',
        },
        {
          id: 'child_result',
          path: 'child.outputs.child_result',
          kind: 'output',
          type: 'data',
        },
      ],
    },
  ],
  diagnostics: [],
};

test('promotes visual outputs, lists additional files, and opens declared provenance', () => {
  render(<InventoryOutline snapshot={snapshot} paperMetadata={paperMetadata} />);

  expect(screen.getByRole('button', { name: /Result figure/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Figures' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Tables' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Result table/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Files' })).toHaveClass('exclude-from-outline');
  expect(screen.getByRole('heading', { name: 'Figures' })).toHaveClass('exclude-from-outline');
  expect(screen.getByRole('heading', { name: 'Tables' })).toHaveClass('exclude-from-outline');
  expect(screen.getByRole('button', { name: /samples.npy/i })).toBeInTheDocument();
  expect(screen.queryByText('Posterior samples file.')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Result figure/i }));

  const outputDialog = screen.getByRole('dialog', { name: 'Result figure' });
  expect(outputDialog).toBeInTheDocument();
  expect(within(outputDialog).queryByText('Declared provenance')).not.toBeInTheDocument();
  expect(within(outputDialog).getByText('Recipe')).toBeInTheDocument();
  expect(within(outputDialog).getByText('Decision dependencies')).toBeInTheDocument();
  expect(within(outputDialog).getByText('Fit choice')).toBeInTheDocument();
  expect(within(outputDialog).queryByText('Direct · Baseline fit')).not.toBeInTheDocument();
  expect(within(outputDialog).queryByText('fit', { selector: 'code' })).not.toBeInTheDocument();
  expect(within(outputDialog).queryByText('Calibration choice')).not.toBeInTheDocument();
  const includeIndirect = within(outputDialog).getByRole('checkbox', {
    name: 'Include indirect decision dependencies',
  });
  expect(includeIndirect).not.toBeChecked();
  fireEvent.click(includeIndirect);
  expect(includeIndirect).toBeChecked();
  expect(within(outputDialog).getByText('Calibration choice')).toBeInTheDocument();
  expect(
    within(outputDialog).queryByText('Indirect via root · Standard calibration'),
  ).not.toBeInTheDocument();
  expect(within(outputDialog).queryByText('calibration', { selector: 'code' })).not.toBeInTheDocument();
  expect(within(outputDialog).getByText('Source catalog')).toBeInTheDocument();
  expect(within(outputDialog).queryByText('catalog', { selector: 'code' })).not.toBeInTheDocument();
  expect(within(outputDialog).queryByText('result_table', { selector: 'code' })).not.toBeInTheDocument();
  expect(within(outputDialog).queryByText('ASTRA address')).not.toBeInTheDocument();
  expect(within(outputDialog).getByText('ASTRA path')).toBeInTheDocument();
  expect(within(outputDialog).getByText('outputs.result_figure')).toBeInTheDocument();
  expect(within(outputDialog).queryByRole('button', { name: 'Back to previous details' })).not.toBeInTheDocument();
  fireEvent.click(within(outputDialog).getByRole('button', {
    name: 'View indirect decision dependency: Calibration choice',
  }));

  const dependencyDialog = screen.getByRole('dialog', { name: 'Calibration choice' });
  expect(within(dependencyDialog).getByRole('button', { name: 'Back to previous details' })).toBeInTheDocument();
  fireEvent.click(within(dependencyDialog).getByRole('button', { name: 'Back to previous details' }));

  const outputAfterDependency = screen.getByRole('dialog', { name: 'Result figure' });
  expect(within(outputAfterDependency).queryByText('Calibration choice')).not.toBeInTheDocument();
  fireEvent.click(within(outputAfterDependency).getByRole('button', { name: 'View output: Result table' }));

  const upstreamOutputDialog = screen.getByRole('dialog', { name: 'Result table' });
  expect(within(upstreamOutputDialog).getByRole('button', { name: 'Back to previous details' })).toBeInTheDocument();
  fireEvent.click(within(upstreamOutputDialog).getByRole('button', { name: 'Back to previous details' }));

  const returnedOutputDialog = screen.getByRole('dialog', { name: 'Result figure' });
  fireEvent.click(within(returnedOutputDialog).getByRole('button', { name: 'View input: Source catalog' }));

  const upstreamInputDialog = screen.getByRole('dialog', { name: 'Source catalog' });
  expect(within(upstreamInputDialog).getByRole('button', { name: 'Back to previous details' })).toBeInTheDocument();
  fireEvent.click(within(upstreamInputDialog).getByRole('button', { name: 'Close input details' }));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('renders at most a 30 by 30 table preview and reports the full dimensions', () => {
  const tableSnapshot = structuredClone(snapshot);
  const table = tableSnapshot.scopes[0].records.find(
    (record) => record.path === 'outputs.result_table',
  )!;
  table.table_data = {
    headers: Array.from({ length: 30 }, (_, index) => `column_${index + 1}`),
    rows: Array.from(
      { length: 30 },
      (_, rowIndex) => Array.from(
        { length: 30 },
        (_, columnIndex) => `${rowIndex + 1}:${columnIndex + 1}`,
      ),
    ),
  };
  table.table_rows_total = 31;
  table.table_columns_total = 32;

  render(<InventoryOutline snapshot={tableSnapshot} />);
  fireEvent.click(screen.getByRole('button', { name: /Result table/i }));

  const dialog = screen.getByRole('dialog', { name: 'Result table' });
  expect(within(dialog).getAllByRole('columnheader')).toHaveLength(30);
  expect(within(dialog).getAllByRole('row')).toHaveLength(31);
  expect(
    within(dialog).getByText('Showing 30 of 31 rows and 30 of 32 columns.'),
  ).toBeInTheDocument();
});

test('lists full finding claims and opens their evidence through the shared detail stack', () => {
  render(<InventoryOutline snapshot={snapshot} paperMetadata={paperMetadata} />);

  const findingButton = screen.getByRole('button', {
    name: /Consistent result: The recovered measurement is consistent with the reference analysis\. 1 artifact/i,
  });
  expect(findingButton).toBeInTheDocument();
  expect(within(findingButton).getByText('Consistent result')).toBeInTheDocument();
  expect(within(findingButton).getByText('The recovered measurement is consistent with the reference analysis.')).toBeInTheDocument();

  fireEvent.click(findingButton);
  const findingDialog = screen.getByRole('dialog', { name: 'Consistent result' });
  expect(within(findingDialog).getByText('The recovered measurement is consistent with the reference analysis.')).toBeInTheDocument();
  expect(within(findingDialog).getByText('The comparison remains within the declared uncertainty across the fitted range.')).toBeInTheDocument();
  expect(within(findingDialog).getByText('Baseline universe, full fitted range.')).toBeInTheDocument();
  expect(within(findingDialog).getByText('The recovered curve remains inside the reference uncertainty band.')).toBeInTheDocument();
  expect(within(findingDialog).getByText('findings.result_is_consistent')).toBeInTheDocument();

  fireEvent.click(within(findingDialog).getByRole('button', { name: 'View evidence output: Result figure' }));
  const outputDialog = screen.getByRole('dialog', { name: 'Result figure' });
  expect(within(outputDialog).getByRole('button', { name: 'Back to previous details' })).toBeInTheDocument();
  fireEvent.click(within(outputDialog).getByRole('button', { name: 'Back to previous details' }));

  const returnedFindingDialog = screen.getByRole('dialog', { name: 'Consistent result' });
  fireEvent.click(within(returnedFindingDialog).getByRole('button', { name: 'Close finding details' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('orders outputs, decisions, and inputs and uses shared registry rows and details', () => {
  render(<InventoryOutline snapshot={snapshot} paperMetadata={paperMetadata} />);

  const sectionHeadings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
  expect(sectionHeadings).toEqual([
    '1. Outputs',
    '2. Decisions',
    '3. Inputs',
    '4. Findings',
    '5. Papers',
  ]);
  expect(screen.queryByRole('heading', { name: 'Prior insights' })).not.toBeInTheDocument();
  expect(screen.queryByText('Affects')).not.toBeInTheDocument();
  expect(screen.queryByText('fit')).not.toBeInTheDocument();
  expect(screen.queryByText('The source observations.')).not.toBeInTheDocument();
  expect(screen.getByText('Source')).toBeInTheDocument();
  expect(screen.getByText('data/catalog.fits')).toHaveAttribute('title', 'data/catalog.fits');
  expect(screen.queryByText('ASTRA path')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Decision tag')).toHaveValue('all');
  expect(screen.getByRole('option', { name: 'All tags (2)' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Method (1)' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Priors (1)' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Decision tag'), { target: { value: 'method' } });
  expect(screen.getByRole('button', { name: /Fit choice, selected option Baseline fit/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Calibration choice/i })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Decision tag'), { target: { value: 'all' } });

  fireEvent.click(screen.getByRole('button', { name: /Fit choice, selected option Baseline fit/i }));
  const decisionDialog = screen.getByRole('dialog', { name: 'Fit choice' });
  expect(decisionDialog).toBeInTheDocument();
  expect(within(decisionDialog).queryByText('Affects')).not.toBeInTheDocument();
  expect(within(decisionDialog).getByText('Insights')).toBeInTheDocument();
  expect(within(decisionDialog).queryByText('Baseline calibration evidence')).not.toBeInTheDocument();
  expect(within(decisionDialog).getByText('Baseline fit')).toBeInTheDocument();
  expect(within(decisionDialog).getByText('Alternate fit')).toBeInTheDocument();
  expect(within(decisionDialog).getByText('The baseline fit matches the declared reference analysis.')).toBeInTheDocument();
  expect(within(decisionDialog).getByText('This complete unlabeled insight explains why the selected decision remains appropriate for the analysis.')).toBeInTheDocument();
  fireEvent.click(within(decisionDialog).getByRole('button', { name: 'Open insight details: unlabeled_evidence' }));

  const unlabeledInsightDialog = screen.getByRole('dialog', { name: 'unlabeled_evidence' });
  expect(within(unlabeledInsightDialog).getByRole('heading', { name: 'unlabeled_evidence' })).toBeInTheDocument();
  expect(within(unlabeledInsightDialog).getByText('This complete unlabeled insight explains why the selected decision remains appropriate for the analysis.')).toBeInTheDocument();
  expect(within(unlabeledInsightDialog).queryByText('unlabeled_evidence', { selector: 'code' })).not.toBeInTheDocument();
  fireEvent.click(within(unlabeledInsightDialog).getByRole('button', { name: 'Back to previous details' }));

  const returnedDecisionAfterInsight = screen.getByRole('dialog', { name: 'Fit choice' });
  fireEvent.click(within(returnedDecisionAfterInsight).getByRole('button', { name: 'Open insight details: Baseline calibration evidence' }));

  const insightDialog = screen.getByRole('dialog', { name: 'Baseline calibration evidence' });
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(within(insightDialog).getByText('The baseline calibration is supported by the reference analysis.')).toBeInTheDocument();
  expect(within(insightDialog).getByText('Reconstruction reduces the damping of the oscillations.')).toBeInTheDocument();
  expect(within(insightDialog).getByText('Source paper')).toBeInTheDocument();
  expect(within(insightDialog).getByText('prior_insights.baseline_evidence')).toBeInTheDocument();
  expect(within(insightDialog).getByText('Fit choice')).toBeInTheDocument();
  fireEvent.click(within(insightDialog).getByRole('button', { name: 'View decision: Fit choice' }));

  const returnedDecisionDialog = screen.getByRole('dialog', { name: 'Fit choice' });
  expect(within(returnedDecisionDialog).getByRole('button', { name: 'Back to previous details' })).toBeInTheDocument();
  fireEvent.click(within(returnedDecisionDialog).getByRole('button', { name: 'Open insight details: Baseline calibration evidence' }));
  fireEvent.click(screen.getByRole('button', { name: 'View quote in paper' }));

  const quotedPaperDialog = screen.getByRole('dialog', { name: 'Reconstructing Baryon Oscillations: A Lagrangian Theory Perspective' });
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(within(quotedPaperDialog).getByLabelText('PDF viewer for Reconstructing Baryon Oscillations: A Lagrangian Theory Perspective')).toBeInTheDocument();
  fireEvent.click(within(quotedPaperDialog).getByRole('button', { name: 'Back to previous details' }));

  const returnedInsightDialog = screen.getByRole('dialog', { name: 'Baseline calibration evidence' });
  fireEvent.click(within(returnedInsightDialog).getByRole('button', { name: 'View quote in paper' }));
  fireEvent.click(screen.getByRole('button', { name: 'Close paper details' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Source catalog' }));
  const inputDialog = screen.getByRole('dialog', { name: 'Source catalog' });
  expect(inputDialog).toBeInTheDocument();
  expect(within(inputDialog).queryByText('Used by')).not.toBeInTheDocument();
  expect(within(inputDialog).getByText('data/catalog.fits')).toBeInTheDocument();
  expect(within(inputDialog).getByText('inputs.catalog')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Close input details' }));
  fireEvent.click(screen.getByRole('button', { name: /10.48550\/arXiv.0812.2905, 1 insights, 1 decisions/i }));
  const paperDialog = screen.getByRole('dialog', { name: 'Reconstructing Baryon Oscillations: A Lagrangian Theory Perspective' });
  expect(within(paperDialog).getByLabelText('PDF viewer for Reconstructing Baryon Oscillations: A Lagrangian Theory Perspective')).toBeInTheDocument();
  expect(within(paperDialog).getByText('Insights from this paper')).toBeInTheDocument();
  expect(within(paperDialog).getByText('Baseline calibration evidence')).toBeInTheDocument();
  expect(within(paperDialog).getByRole('button', { name: 'Open insight details: Baseline calibration evidence' })).toBeInTheDocument();
  expect(within(paperDialog).getByText('Reconstruction reduces the damping of the oscillations.')).toBeInTheDocument();
  expect(within(paperDialog).getByText(
    'A second excerpt from the same supporting paper.',
  )).toBeInTheDocument();
  expect(within(paperDialog).getAllByRole('button', {
    name: 'Locate quote in PDF',
  })).toHaveLength(2);
  expect(within(paperDialog).getByText('Fit choice')).toBeInTheDocument();
  fireEvent.click(within(paperDialog).getByRole('button', { name: 'View decision: Fit choice' }));

  const informedDecisionDialog = screen.getByRole('dialog', { name: 'Fit choice' });
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(within(informedDecisionDialog).getByText('The baseline fit matches the declared reference analysis.')).toBeInTheDocument();
  fireEvent.click(within(informedDecisionDialog).getByRole('button', { name: 'Close decision details' }));
});

test('renders a selected sub-analysis as its own inventory scope', () => {
  render(
    <InventoryOutline snapshot={snapshot} scopeId="child" paperMetadata={paperMetadata} />,
  );

  expect(screen.getByRole('button', { name: /child_result/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Result figure/i })).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', {
      name: /10.48550\/arXiv.1807.06209, 1 insights, 0 decisions/i,
    }),
  ).toBeInTheDocument();
});

test('does not borrow outputs from another scope when the selected scope is empty', () => {
  const emptyChildSnapshot = structuredClone(snapshot);
  emptyChildSnapshot.scopes[1].records = emptyChildSnapshot.scopes[1].records.filter(
    (record) => record.kind !== 'output',
  );

  render(<InventoryOutline snapshot={emptyChildSnapshot} scopeId="child" />);

  expect(screen.getByText('No outputs are declared in this analysis.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Result figure/i })).not.toBeInTheDocument();
});

test('renders project structure as reusable outline navigation', () => {
  const onSelectScope = vi.fn();
  render(
    <OverviewInventory
      snapshot={snapshot}
      scopeId="child"
      onSelectScope={onSelectScope}
    />,
  );

  expect(screen.getByText('Project hierarchy')).toHaveClass(
    'myst-supporting-documents',
    'text-sm',
    'leading-6',
    'uppercase',
  );
  const child = screen.getByRole('button', { name: /Child analysis/i });
  expect(child).toHaveAttribute(
    'aria-current',
    'page',
  );
  fireEvent.click(screen.getByRole('button', { name: /^Analysis$/i }));
  expect(onSelectScope).toHaveBeenCalledWith('root');
});
