import * as React from 'react';
import {
  PapersInventory,
  createInventoryModel,
  getInventoryScope,
  paperRecords,
} from '@lightcone-research/astra-ui/components';

import { usePublicationPapers } from './AstraPublicationProvider';

/**
 * Cited papers rendered in place of the stock bibliography — the same list
 * surface the JupyterLab inventory shows, fed by MyST's own DOI-resolved
 * citation metadata. Renders nothing when the page carries no publication
 * bundle or the analysis links no papers, so hosts can mount it
 * unconditionally.
 */
export function AstraPapersSection({ className }: { className?: string }) {
  const papers = usePublicationPapers();
  const source = papers?.publication.bundle.model;
  const model = React.useMemo(
    () => (source ? createInventoryModel(source) : undefined),
    [source],
  );
  if (!papers || !model) return null;

  const scopeId = papers.publication.bundle.activeScopeId;
  const scope = getInventoryScope(model, scopeId) ?? source?.scopes[0];
  if (!scope) return null;
  if (!paperRecords(model, scope, papers.paperMetadata).length) return null;

  return (
    <section className={className ?? 'astra-papers-section col-body'}>
      <h2>Cited papers</h2>
      <div className="astra-ui astra-papers-section__list">
        <PapersInventory
          model={model}
          scopeId={scope.id}
          paperMetadata={papers.paperMetadata}
          onOpenPaper={(paper) => papers.openPaper(paper.doi)}
        />
      </div>
    </section>
  );
}
