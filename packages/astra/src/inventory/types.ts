import type {
  SerializedDecision,
  SerializedFinding,
  SerializedInput,
  SerializedInsight,
  SerializedOutput,
} from '@astra-spec/store-types';

export type InventoryKind =
  | 'analysis'
  | 'input'
  | 'decision'
  | 'output'
  | 'finding'
  | 'prior_insight';

export interface InventoryRecordReference {
  kind: Exclude<InventoryKind, 'analysis'>;
  id: string;
  path?: string;
}

export interface InventoryDiagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
}

/**
 * UI-wide convenience view of MySTRA's common record vocabulary. Each nested
 * field is sourced from the corresponding page-store type; `kind` narrows it
 * to the concrete aliases below when a component needs stricter typing.
 */
export interface InventoryRecord {
  id: string;
  path: string;
  kind: Exclude<InventoryKind, 'analysis'>;
  label?: string;
  description?: string;
  type?: string;
  tags?: SerializedDecision['tags'];
  source?: SerializedInput['source'];
  ref?: SerializedInput['ref'];
  from?: string;
  when?: SerializedDecision['when'];
  active?: SerializedDecision['active'];
  selected?: SerializedDecision['selected'];
  options?: SerializedDecision['options'];
  option_insights?: SerializedDecision['option_insights'];
  rationale?: SerializedDecision['rationale'];
  claim?: SerializedFinding['claim'];
  notes?: SerializedFinding['notes'];
  scope?: SerializedFinding['scope'];
  doi?: SerializedInsight['doi'];
  quote?: SerializedInsight['quote'];
  /** Compatibility projection of the selected evidence location. */
  page?: SerializedInsight['page'];
  resolved_path?: SerializedOutput['resolved_path'];
  recipe?: SerializedOutput['recipe'];
  inputs?: SerializedOutput['inputs'];
  decisions?: SerializedOutput['decisions'];
  evidence?: SerializedFinding['evidence'];
  inputs_root?: SerializedOutput['inputs_root'];
  decisions_transitive?: SerializedOutput['decisions_transitive'];
  table_data?: SerializedOutput['table_data'];
  table_preview?: SerializedOutput['table_preview'];
  table_rows_total?: number;
  table_columns_total?: number;
  table_preview_omitted?: 'project_size_budget';
  metric?: SerializedOutput['metric'];
  resultPreview?: string;
}

export type InventoryOutputRecord =
  InventoryRecord & SerializedOutput & {
    resultPreview?: string;
    table_rows_total?: number;
    table_columns_total?: number;
    table_preview_omitted?: 'project_size_budget';
  };
export type InventoryInputRecord = InventoryRecord & SerializedInput;
export type InventoryDecisionRecord = InventoryRecord & SerializedDecision;
export type InventoryFindingRecord = InventoryRecord & SerializedFinding;
export type InventoryInsightRecord = InventoryRecord & SerializedInsight;

export interface InventoryScope {
  id: string;
  path: string;
  name: string;
  parent?: string;
  children: string[];
  records: InventoryRecord[];
}

/** UI-facing snapshot; MySTRA's project payload is adapted at the theme boundary. */
export interface InventorySnapshot {
  version: number;
  fixture?: {
    label: string;
    source: string;
    frozen: string;
    disclaimer: string;
  };
  analysis: {
    id: string;
    name: string;
    description?: string;
  };
  scopes: InventoryScope[];
  diagnostics?: InventoryDiagnostic[];
}
