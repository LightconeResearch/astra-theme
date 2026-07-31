import { useMemo, type ReactNode } from 'react';
import type {
  ResolvedRecord,
  ResolvedStore,
  StoreTable,
} from '@astra-spec/store-types';
import { PreviewCard } from '../card/PreviewCard';
import { AstraRecordPreview } from '../renderers/AstraInlineRef';
import { AstraStoreProvider } from '../store/AstraStoreProvider';
import { decisionEvidenceIds } from '../store/decisionEvidence';
import { inventoryRecordTitle, resolveInventoryRecordReference } from './model';
import type { InventoryModel } from './model';
import type { InventoryRecord } from './types';

const TABLE_BY_KIND: Record<InventoryRecord['kind'], StoreTable> = {
  input: 'inputs',
  decision: 'decisions',
  output: 'outputs',
  finding: 'findings',
  prior_insight: 'prior_insights',
};

function emptyStore(model?: InventoryModel): ResolvedStore {
  return {
    analysis: {
      id: model?.snapshot.analysis.id,
      name: model?.snapshot.analysis.name,
      slug: model?.snapshot.analysis.id ?? 'astra',
    },
    inputs: {},
    outputs: {},
    decisions: {},
    findings: {},
    prior_insights: {},
    subanalyses: {},
  };
}
function addRecord(
  store: ResolvedStore,
  record: InventoryRecord,
  key: string,
): void {
  const table = TABLE_BY_KIND[record.kind];
  (store[table] as Record<string, ResolvedRecord>)[key] =
    record as ResolvedRecord;
}

/**
 * Adapt the project inventory indexes into the consolidated store expected by
 * the existing preview-card bodies. Canonical paths are always indexed; leaf
 * ids are added when unambiguous, and relationship spellings used by the
 * focused record are resolved relative to that record's scope.
 */
export function consolidatedStoreFromInventoryModel(
  model: InventoryModel,
  focusedRecord?: InventoryRecord,
): ResolvedStore {
  const store = emptyStore(model);

  for (const scope of model.snapshot.scopes) {
    for (const record of scope.records) {
      addRecord(store, record, record.path);
      if ((model.recordsById.get(record.id)?.length ?? 0) === 1) {
        addRecord(store, record, record.id);
      }
    }
  }

  if (!focusedRecord) return store;
  const scope = model.recordByPath.get(focusedRecord.path)?.scope;
  if (!scope) return store;

  if (focusedRecord.kind === 'decision') {
    for (const reference of decisionEvidenceIds(focusedRecord)) {
      const resolved = resolveInventoryRecordReference(
        model,
        scope,
        reference,
        'prior_insight',
      );
      if (resolved) addRecord(store, resolved.record, reference);
    }
  } else if (focusedRecord.kind === 'finding') {
    for (const evidence of focusedRecord.evidence ?? []) {
      if (!evidence.artifact) continue;
      const resolved = resolveInventoryRecordReference(
        model,
        scope,
        evidence.artifact,
        'output',
      );
      if (resolved) addRecord(store, resolved.record, evidence.artifact);
    }
  }

  return store;
}

export interface AstraRecordReferenceProps {
  /** Resolved ASTRA inventory record; the component never parses astra.yaml. */
  record: InventoryRecord;
  /** Visible prose label. Defaults to the record's authored label or id. */
  label?: ReactNode;
  /** Opens the host's full detail surface on click, Enter, or Space. */
  onActivate?: () => void;
  /** Project indexes used to resolve nested evidence shown in hover cards. */
  model?: InventoryModel;
  /** A host-supplied page/consolidated store. Takes precedence over `model`. */
  store?: ResolvedStore;
  className?: string;
}

/**
 * Host-neutral ASTRA reference used in prose outside MyST.
 *
 * It deliberately accepts resolved data rather than a MyST node while reusing
 * the exact token styling, Floating UI preview, and kind-specific card bodies
 * used by MySTRA publications.
 */
export function AstraRecordReference({
  record,
  label,
  onActivate,
  model,
  store,
  className,
}: AstraRecordReferenceProps) {
  const previewStore = useMemo(
    () => store ?? (
      model
        ? consolidatedStoreFromInventoryModel(model, record)
        : (() => {
          const minimal = emptyStore();
          addRecord(minimal, record, record.path);
          addRecord(minimal, record, record.id);
          return minimal;
        })()
    ),
    [model, record, store],
  );
  const subtype = record.kind === 'output' && record.type
    ? ` astra-ref--${record.type}`
    : '';
  const tokenClassName = [
    'astra-ref',
    `astra-ref--${record.kind}`,
    subtype.trim(),
    className,
  ].filter(Boolean).join(' ');

  return (
    <PreviewCard
      kind={record.kind}
      onActivate={onActivate}
      trigger={
        <span className={tokenClassName}>
          {label ?? inventoryRecordTitle(record)}
        </span>
      }
    >
      <AstraStoreProvider store={previewStore}>
        <AstraRecordPreview record={record as ResolvedRecord} />
      </AstraStoreProvider>
    </PreviewCard>
  );
}
