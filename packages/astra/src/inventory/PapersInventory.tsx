import { useRef, useState } from 'react';
import { decisionEvidenceIds } from '../store/decisionEvidence';
import { InventoryProse } from './InventoryProse';
import { InsightDetailTrigger } from './InsightDetailDialog';
import {
  InventoryCountHeading,
  InventoryDetailDialog,
  InventoryEmptyState,
  InventoryRecordIdentity,
  InventoryRecordList,
} from './InventoryPrimitives';
import { InventoryRelationList } from './InventoryRelations';
import { PaperPdfViewer, type PaperQuoteFocusRequest } from './PaperPdfViewer';
import {
  getInventoryScope,
  inventoryRecordTitle,
  inventoryRecordsOfKind,
  inventoryScopesForView,
  type InventoryModel,
} from './model';
import type { InventoryRecord, InventoryScope } from './types';

interface PapersInventoryProps {
  model: InventoryModel;
  scopeId: string;
  paperMetadata?: InventoryPaperMetadataMap;
  onOpenPaper: (paper: InventoryPaper, scope: InventoryScope) => void;
}

export interface InventoryPaper {
  doi: string;
  title: string;
  authors?: string;
  pdfUrl?: string;
  insights: InventoryRecord[];
  decisions: InventoryRecord[];
}

export interface InventoryPaperMetadata {
  title: string;
  authors?: string;
  pdfUrl?: string;
}

export type InventoryPaperMetadataMap = Readonly<Record<string, InventoryPaperMetadata>>;

function paperFromDoi(doi: string, paperMetadata: InventoryPaperMetadataMap): InventoryPaper {
  const metadata = paperMetadata[doi];
  return {
    doi,
    title: metadata?.title ?? doi,
    authors: metadata?.authors,
    pdfUrl: metadata?.pdfUrl,
    insights: [],
    decisions: [],
  };
}

export function paperRecords(
  model: InventoryModel,
  scope: InventoryScope,
  paperMetadata: InventoryPaperMetadataMap = {},
): InventoryPaper[] {
  const scopes = inventoryScopesForView(model, scope);
  const insights = new Map<string, InventoryRecord>();
  const decisions = new Map<string, InventoryRecord>();

  for (const candidate of scopes) {
    for (const record of inventoryRecordsOfKind(candidate, 'prior_insight')) {
      if (!insights.has(record.id)) {
        insights.set(record.id, record);
      }
    }
    for (const record of inventoryRecordsOfKind(candidate, 'decision')) {
      decisions.set(record.path, record);
    }
  }

  const includedInsightIds = scope.parent
    ? new Set([...decisions.values()].flatMap(decisionEvidenceIds))
    : new Set(insights.keys());
  const papers = new Map<string, InventoryPaper>();

  for (const id of includedInsightIds) {
    const insight = insights.get(id);
    if (!insight?.doi) continue;
    const paper = papers.get(insight.doi) ?? paperFromDoi(insight.doi, paperMetadata);
    paper.insights.push(insight);
    papers.set(insight.doi, paper);
  }

  for (const decision of decisions.values()) {
    const dois = new Set(
      decisionEvidenceIds(decision)
        .map((id) => insights.get(id)?.doi)
        .filter((doi): doi is string => Boolean(doi)),
    );
    for (const doi of dois) {
      const paper = papers.get(doi);
      if (paper) paper.decisions.push(decision);
    }
  }

  return [...papers.values()].sort((left, right) => left.doi.localeCompare(right.doi));
}

export function PaperDialog({
  paper,
  scope,
  initialFocusInsight,
  onOpenInsight,
  onOpenDecision,
  onBack,
  onClose,
}: {
  paper: InventoryPaper;
  scope: InventoryScope;
  initialFocusInsight?: InventoryRecord;
  onOpenInsight: (insight: InventoryRecord) => void;
  onOpenDecision: (decision: InventoryRecord) => void;
  onBack?: () => void;
  onClose: () => void;
}) {
  const [focusRequest, setFocusRequest] = useState<PaperQuoteFocusRequest | undefined>(() => (
    initialFocusInsight?.quote ? {
      key: `${initialFocusInsight.id}-source`,
      insightId: initialFocusInsight.id,
      quote: initialFocusInsight.quote,
    } : undefined
  ));
  const focusSequence = useRef(0);

  const focusInsight = (insight: InventoryRecord) => {
    if (!insight.quote) return;
    focusSequence.current += 1;
    setFocusRequest({
      key: `${insight.id}-${focusSequence.current}`,
      insightId: insight.id,
      quote: insight.quote,
    });
  };

  return (
    <InventoryDetailDialog
      className="inventory-detail-dialog--paper"
      eyebrow={`Paper · ${scope.name}`}
      title={paper.title}
      onBack={onBack}
      closeLabel="Close paper details"
      onClose={onClose}
    >
      <div className="inventory-paper-dialog__layout">
        {paper.pdfUrl ? (
          <PaperPdfViewer pdfUrl={paper.pdfUrl} title={paper.title} focusRequest={focusRequest} />
        ) : <p className="inventory-paper-dialog__unavailable">No PDF source is available for this paper.</p>}
        <aside className="inventory-paper-dialog__rail" aria-label="Paper insights and decisions">
          <section className="inventory-insight-list">
            <InventoryCountHeading title="Insights from this paper" count={paper.insights.length} />
            <ul className="astra-evidence">
              {paper.insights.map((insight) => (
                <li key={insight.path} className="astra-evidence__item">
                  <InsightDetailTrigger insight={insight} onOpen={() => onOpenInsight(insight)} />
                  {insight.label && insight.claim ? (
                    <div className="astra-evidence__note">
                      <InventoryProse text={insight.claim} />
                    </div>
                  ) : null}
                  {insight.quote ? (
                    <>
                      <blockquote className="inventory-paper-insight__quote">{insight.quote}</blockquote>
                      <button
                        type="button"
                        className="inventory-paper-insight__locate"
                        onClick={() => focusInsight(insight)}
                      >
                        Locate quote in PDF
                      </button>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
          <section className="inventory-paper-doi">
            <h4>DOI</h4>
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer">
              {paper.doi} ↗
            </a>
          </section>
          <InventoryRelationList
            title="Informs"
            items={paper.decisions.map((decision) => ({
              key: decision.path,
              label: inventoryRecordTitle(decision),
              identifier: decision.path,
              accessibleLabel: `View decision: ${inventoryRecordTitle(decision)}`,
              onOpen: () => onOpenDecision(decision),
            }))}
            empty="No decisions in this scope cite insights from this paper."
          />
        </aside>
      </div>
    </InventoryDetailDialog>
  );
}

export function PapersInventory({
  model,
  scopeId,
  paperMetadata = {},
  onOpenPaper,
}: PapersInventoryProps) {
  const scope = getInventoryScope(model, scopeId);
  const papers = scope ? paperRecords(model, scope, paperMetadata) : [];

  if (!scope || !papers.length) {
    return (
      <InventoryEmptyState>No supporting papers are linked to this analysis.</InventoryEmptyState>
    );
  }

  return (
    <div className="inventory-records inventory-records--papers">
      <InventoryRecordList
        ariaLabel="Papers"
        columnTemplate="minmax(16rem, 1.7fr) 7rem 7rem 1.5rem"
        columns={[
          { label: 'Paper', className: 'inventory-record-list__primary' },
          { label: 'Insights', className: 'inventory-record-list__count' },
          { label: 'Decisions', className: 'inventory-record-list__count' },
          { className: 'inventory-record-list__arrow' },
        ]}
        rows={papers.map((paper) => ({
          key: paper.doi,
          accessibleLabel: `${paper.title}, ${paper.doi}, ${paper.insights.length} insights, ${paper.decisions.length} decisions`,
          onOpen: () => onOpenPaper(paper, scope),
          cells: [
            <InventoryRecordIdentity
              kind="paper"
              title={paper.title}
              subtitle={[paper.authors, paper.doi].filter(Boolean).join(' · ')}
            />,
            <span>{paper.insights.length} {paper.insights.length === 1 ? 'insight' : 'insights'}</span>,
            <span>{paper.decisions.length} {paper.decisions.length === 1 ? 'decision' : 'decisions'}</span>,
            <span aria-hidden="true">→</span>,
          ],
        }))}
      />
    </div>
  );
}
