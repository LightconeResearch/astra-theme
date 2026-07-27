import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { DecisionDialog, DecisionsInventory } from './DecisionsInventory';
import { FindingDialog, FindingsInventory } from './FindingsInventory';
import { InputDialog, InputsInventory } from './InputsInventory';
import { InsightDetailDialog } from './InsightDetailDialog';
import { OutputDialog, OutputsInventory } from './OutputsInventory';
import {
  PaperDialog,
  PapersInventory,
  paperRecords,
  type InventoryPaper,
  type InventoryPaperMetadataMap,
} from './PapersInventory';
import {
  createInventoryModel,
  getInventoryScope,
  inventoryScopeForRecord,
} from './model';
import { normalizeDoi } from './citationMetadata';
import type { InventoryRecord, InventoryScope, InventorySnapshot } from './types';

type InventoryModalEntry =
  | { kind: 'output'; record: InventoryRecord; scopeId: string }
  | { kind: 'decision'; record: InventoryRecord; scopeId: string }
  | { kind: 'input'; record: InventoryRecord; scopeId: string }
  | { kind: 'finding'; record: InventoryRecord; scopeId: string }
  | { kind: 'insight'; record: InventoryRecord; scopeId: string }
  | {
      kind: 'paper';
      paper: InventoryPaper;
      scopeId: string;
      focusInsight?: InventoryRecord;
    };

export interface InventoryOutlineProps {
  snapshot?: InventorySnapshot;
  scopeId?: string;
  paperMetadata?: InventoryPaperMetadataMap;
  decisionTagLabels?: Readonly<Record<string, string>>;
}

export function InventoryExplorer({
  snapshot,
  scopeId = 'root',
  paperMetadata = {},
  decisionTagLabels = {},
}: InventoryOutlineProps) {
  const [modalStack, setModalStack] = useState<InventoryModalEntry[]>([]);
  const model = useMemo(() => snapshot ? createInventoryModel(snapshot) : undefined, [snapshot]);

  useEffect(() => setModalStack([]), [scopeId]);

  const startModal = (entry: InventoryModalEntry) => setModalStack([entry]);
  const pushModal = (entry: InventoryModalEntry) => setModalStack((stack) => [...stack, entry]);
  const goBack = () => setModalStack((stack) => stack.slice(0, -1));
  const closeAll = () => setModalStack([]);
  const activeModal = modalStack[modalStack.length - 1];
  const activeScope = model && activeModal
    ? getInventoryScope(model, activeModal.scopeId)
    : undefined;
  const backAction = modalStack.length > 1 ? goBack : undefined;

  let modal: ReactNode = null;
  if (model && activeModal && activeScope) {
    if (activeModal.kind === 'output') {
      modal = (
        <OutputDialog
          record={activeModal.record}
          scope={activeScope}
          model={model}
          onOpenDependency={(record, scope) => {
            if (
              record.kind === 'output'
              || record.kind === 'input'
              || record.kind === 'decision'
            ) {
              pushModal({ kind: record.kind, record, scopeId: scope.id });
            }
          }}
          onBack={backAction}
          onClose={closeAll}
        />
      );
    } else if (activeModal.kind === 'input') {
      modal = (
        <InputDialog
          record={activeModal.record}
          scope={activeScope}
          onBack={backAction}
          onClose={closeAll}
        />
      );
    } else if (activeModal.kind === 'decision') {
      modal = (
        <DecisionDialog
          record={activeModal.record}
          scope={activeScope}
          model={model}
          onOpenInsight={(insight) => pushModal({
            kind: 'insight',
            record: insight,
            scopeId: inventoryScopeForRecord(model, insight, activeScope)!.id,
          })}
          onBack={backAction}
          onClose={closeAll}
        />
      );
    } else if (activeModal.kind === 'finding') {
      modal = (
        <FindingDialog
          record={activeModal.record}
          scope={activeScope}
          model={model}
          onOpenEvidence={(output, scope) => pushModal({
            kind: 'output',
            record: output,
            scopeId: scope.id,
          })}
          onBack={backAction}
          onClose={closeAll}
        />
      );
    } else if (activeModal.kind === 'insight') {
      const insightDoi = activeModal.record.doi;
      const sourcePaper = insightDoi
        ? paperRecords(model, activeScope, paperMetadata)
          .find((paper) => normalizeDoi(paper.doi) === normalizeDoi(insightDoi))
        : undefined;
      modal = (
        <InsightDetailDialog
          insight={activeModal.record}
          model={model}
          scope={activeScope}
          onOpenSource={sourcePaper ? () => pushModal({
            kind: 'paper',
            paper: sourcePaper,
            scopeId: activeScope.id,
            focusInsight: activeModal.record,
          }) : undefined}
          onOpenDecision={(decision) => pushModal({
            kind: 'decision',
            record: decision,
            scopeId: inventoryScopeForRecord(model, decision, activeScope)!.id,
          })}
          onBack={backAction}
          onClose={closeAll}
        />
      );
    } else {
      modal = (
        <PaperDialog
          paper={activeModal.paper}
          scope={activeScope}
          initialFocusInsight={activeModal.focusInsight}
          onOpenInsight={(insight) => pushModal({
            kind: 'insight',
            record: insight,
            scopeId: inventoryScopeForRecord(model, insight, activeScope)!.id,
          })}
          onOpenDecision={(decision) => pushModal({
            kind: 'decision',
            record: decision,
            scopeId: inventoryScopeForRecord(model, decision, activeScope)!.id,
          })}
          onBack={backAction}
          onClose={closeAll}
        />
      );
    }
  }

  const sections = [
    {
      id: 'outputs',
      label: 'Outputs',
      content: model ? (
        <OutputsInventory
          model={model}
          scopeId={scopeId}
          onOpenOutput={(record, scope) => startModal({
            kind: 'output',
            record,
            scopeId: scope.id,
          })}
        />
      ) : null,
    },
    {
      id: 'decisions',
      label: 'Decisions',
      content: model ? (
        <DecisionsInventory
          model={model}
          scopeId={scopeId}
          tagLabels={decisionTagLabels}
          onOpenDecision={(record, scope) => startModal({
            kind: 'decision',
            record,
            scopeId: scope.id,
          })}
        />
      ) : null,
    },
    {
      id: 'inputs',
      label: 'Inputs',
      content: model ? (
        <InputsInventory
          model={model}
          scopeId={scopeId}
          onOpenInput={(record, scope) => startModal({
            kind: 'input',
            record,
            scopeId: scope.id,
          })}
        />
      ) : null,
    },
    {
      id: 'findings',
      label: 'Findings',
      content: model ? (
        <FindingsInventory
          model={model}
          scopeId={scopeId}
          onOpenFinding={(record, scope) => startModal({
            kind: 'finding',
            record,
            scopeId: scope.id,
          })}
        />
      ) : null,
    },
    {
      id: 'papers',
      label: 'Papers',
      content: model ? (
        <PapersInventory
          model={model}
          scopeId={scopeId}
          paperMetadata={paperMetadata}
          onOpenPaper={(paper, scope) => startModal({
            kind: 'paper',
            paper,
            scopeId: scope.id,
          })}
        />
      ) : null,
    },
  ];

  return (
    <div className="inventory-outline">
      <div className="inventory-outline__sections">
        {sections.map((item, index) => (
          <section
            key={item.id}
            className={`inventory-outline__section inventory-outline__section--${item.id}`}
          >
            <h2 id={item.id} tabIndex={-1}>
              <span className="heading-text">{index + 1}. {item.label}</span>
            </h2>
            {item.content}
            {!model ? (
              <div className="inventory-outline__empty-slot" aria-hidden="true" />
            ) : null}
          </section>
        ))}
      </div>
      {modal}
    </div>
  );
}

/** Backwards-compatible name for the inventory's original public entry point. */
export const InventoryOutline = InventoryExplorer;
