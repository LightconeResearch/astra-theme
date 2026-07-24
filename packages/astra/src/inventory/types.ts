export type InventoryKind =
  | 'analysis'
  | 'input'
  | 'decision'
  | 'output'
  | 'finding'
  | 'prior_insight';

export interface InventoryDiagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
}

export interface InventoryRecord {
  id: string;
  path: string;
  kind: InventoryKind;
  label?: string;
  description?: string;
  type?: string;
  tags?: string[];
  source?: string;
  from?: string;
  selected?: string;
  options?: Record<string, string | undefined>;
  option_insights?: Record<string, string[]>;
  rationale?: string;
  claim?: string;
  notes?: string;
  scope?: string;
  doi?: string;
  quote?: string;
  page?: number;
  resolved_path?: string;
  recipe?: { command?: string; container?: string };
  inputs?: string[];
  decisions?: string[];
  evidence?: Array<{ artifact?: string; doi?: string; quote?: string }>;
  inputs_root?: Array<{ id: string; label?: string }>;
  decisions_transitive?: Array<{
    id: string;
    label?: string;
    selection?: string;
    via?: string;
  }>;
  table_data?: {
    headers: string[];
    rows: Array<Array<string | number>>;
  };
  metric?: {
    value?: string | number;
    uncertainty?: string | number;
    error?: string | number;
    unit?: string;
    units?: string;
    label?: string;
  };
  resultPreview?: string;
}

export interface InventoryScope {
  id: string;
  path: string;
  name: string;
  parent?: string;
  children: string[];
  records: InventoryRecord[];
}

/**
 * UI-facing snapshot used by the isolated inventory preview.
 *
 * This is deliberately not the proposed MySTRA production contract. The
 * eventual project-inventory payload will be designed separately and adapted
 * into this view model after its ownership and inheritance semantics are
 * agreed.
 */
export interface InventorySnapshot {
  version: number;
  fixture: {
    label: string;
    source: string;
    frozen: string;
    disclaimer: string;
  };
  analysis: {
    id: string;
    name: string;
    description: string;
  };
  scopes: InventoryScope[];
  diagnostics: InventoryDiagnostic[];
}
