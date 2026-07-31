/**
 * @astra-spec/store-types
 *
 * The type-checked mirror of the MySTRA plugin's resolved ASTRA data store.
 * These interfaces MUST stay in lockstep with
 *   ../MySTRA/src/transform/resolved-store.ts
 * The plugin bakes a `ResolvedStore` (per page scope) onto a hidden carrier
 * node's `data.astra`; the theme reads it and joins `node id -> store entry`
 * to render rich cards without re-implementing any ASTRA semantics.
 *
 * Mirror current MySTRA fields exactly. Deprecated fields are retained only
 * where the theme intentionally accepts an older serialized page contract.
 */
export interface SerializedRecipe {
    command?: string;
    container?: string;
}
/** Inlined metric value (scalar / 2-tuple / object), parsed at build time. */
export interface SerializedMetric {
    value?: number | string;
    uncertainty?: number | string;
    error?: number | string;
    unit?: string;
    units?: string;
    label?: string;
}
/** Parsed rows for table outputs (same shape as the plugin's TableData). */
export interface TableData {
    headers: string[];
    rows: (string | number)[][];
}
/** Size-bounded transport preview for a complete table artifact. */
export interface SerializedTablePreview extends TableData {
    total_rows: number;
    total_columns: number;
    serialized_bytes: number;
    truncated: boolean;
    cells_truncated?: boolean;
}
/** One decision on an output's transitive provenance chain. */
export interface SerializedProvenanceDecision {
    id: string;
    label?: string;
    /** Selected option label (or id) under the active universe. */
    selection?: string;
    /** Root-relative scope the decision lives in, when not the page's own. */
    via?: string;
}
/** One analysis-level source input at the root of a provenance chain. */
export interface SerializedRootInput {
    id: string;
    label?: string;
}
export interface SerializedOutput {
    id: string;
    path: string;
    kind: 'output';
    label?: string;
    type?: string;
    description?: string;
    /** Project-relative URL of the result artifact (MyST copies it), if found. */
    resolved_path?: string;
    recipe?: SerializedRecipe;
    /** Upstream input ids this output depends on (resolved through `from:`). */
    inputs?: string[];
    /** Decision ids that parameterise this artefact. */
    decisions?: string[];
    /** Alias pointer for re-exported outputs (`from: child.out_id`). */
    from?: string;
    /** @deprecated Compatibility with pre-unified MySTRA payloads. */
    table_data?: TableData;
    /** Size-bounded preview; `resolved_path` identifies the complete artifact. */
    table_preview?: SerializedTablePreview;
    /** Inlined value for metric outputs whose result file parses as JSON. */
    metric?: SerializedMetric;
    /** Analysis-level source inputs at the roots of the provenance chain. */
    inputs_root?: SerializedRootInput[];
    /** Every decision affecting this output, direct or via another scope. */
    decisions_transitive?: SerializedProvenanceDecision[];
}
export interface SerializedInput {
    id: string;
    path: string;
    kind: 'input';
    label?: string;
    type?: string;
    description?: string;
    source?: string;
    from?: string;
    ref?: string;
}
export interface SerializedDecision {
    id: string;
    path: string;
    kind: 'decision';
    label?: string;
    rationale?: string;
    tags?: string[];
    from?: string;
    when?: string[];
    active?: boolean;
    /** The option id selected under the active universe (or the default). */
    selected?: string;
    /** All option ids → their labels. */
    options: Record<string, string | undefined>;
    /**
     * Prior-insight ids cited by each option (`options.<id>.insights` in
     * astra.yaml) — the evidence backing the choice. Only present when at least
     * one option cites an insight; the theme joins the `prior_insights` table.
     */
    option_insights?: Record<string, string[]>;
}
/** One serialized evidence entry (artifact-, DOI-, or quote-based). */
export interface SerializedEvidence {
    /** Output id of the artifact backing this evidence (joins `outputs`). */
    artifact?: string;
    doi?: string;
    /** The exact-quote selector text, when present. */
    quote?: string;
    page?: number;
}
export interface SerializedFinding {
    id: string;
    path: string;
    kind: 'finding';
    label?: string;
    claim?: string;
    notes?: string;
    scope?: string;
    /** The finding's evidence list (artifact ids join the `outputs` table). */
    evidence?: SerializedEvidence[];
}
export interface SerializedInsight {
    id: string;
    path: string;
    kind: 'prior_insight';
    label?: string;
    scope?: string;
    claim?: string;
    notes?: string;
    evidence?: SerializedEvidence[];
    /** First evidence DOI, when present (the theme can resolve the citation). */
    doi?: string;
    /** First exact-quote evidence, when present. */
    quote?: string;
    /** Page of the first evidence item carrying a source location. */
    page?: number;
}
export interface SerializedSubAnalysis {
    id: string;
    path: string;
    kind: 'analysis';
    name?: string;
    summary?: string;
    /** Page URL for the sub-analysis (e.g. `/reconstruction`). */
    url: string;
    decisions: number;
    outputs: number;
}
/**
 * The resolved model for one analysis scope, keyed by id. A theme recognizes a
 * placed node by its `identifier` (`output-<id>`, `decision-<id>`, …) + its
 * `astra-*` class and looks the data up here.
 */
export interface ResolvedStore {
    analysis: {
        id?: string;
        name?: string;
        slug: string;
    };
    outputs: Record<string, SerializedOutput>;
    inputs: Record<string, SerializedInput>;
    decisions: Record<string, SerializedDecision>;
    findings: Record<string, SerializedFinding>;
    prior_insights: Record<string, SerializedInsight>;
    subanalyses: Record<string, SerializedSubAnalysis>;
}
/** The one record vocabulary shared by page stores and project inventories. */
export type ResolvedRecord = SerializedOutput | SerializedInput | SerializedDecision | SerializedFinding | SerializedInsight | SerializedSubAnalysis;
/**
 * The kinds an inline `{astra}` / `{astra:*}` role can carry on
 * `node.data.astra` (the unified-path grammar's inline vocabulary).
 * `option`, `evidence` and `universe` have no store table of their own —
 * refs of those kinds degrade to the plain labelled token.
 */
export type AstraKind = 'decision' | 'output' | 'finding' | 'prior_insight' | 'analysis' | 'input' | 'option' | 'evidence' | 'universe' | 'value';
/** Keys of the `ResolvedStore` tables a join can target. */
export type StoreTable = 'decisions' | 'outputs' | 'findings' | 'prior_insights' | 'subanalyses' | 'inputs';
/**
 * Maps an inline `AstraKind` to its `ResolvedStore` table key.
 * `value` joins the `outputs` table (a value is a projection of an output).
 * Kinds without a store table (`option`, `evidence`, `universe`) are absent:
 * lookups return `undefined` and the caller degrades to the bare token.
 */
export declare const KIND_TO_TABLE: Partial<Record<AstraKind, StoreTable>>;
/**
 * The payload carried on an inline reference node's `data.astra`.
 * `{astra:value}` additionally carries `col`, `filter`, `type`, `product`.
 */
export interface InlineAstra {
    kind: AstraKind;
    id: string;
    path?: string;
    col?: string;
    filter?: string;
    type?: string;
    product?: string;
}
