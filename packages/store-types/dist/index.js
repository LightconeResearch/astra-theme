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
/**
 * Maps an inline `AstraKind` to its `ResolvedStore` table key.
 * `value` joins the `outputs` table (a value is a projection of an output).
 * Kinds without a store table (`option`, `evidence`, `universe`) are absent:
 * lookups return `undefined` and the caller degrades to the bare token.
 */
export const KIND_TO_TABLE = {
    decision: 'decisions',
    output: 'outputs',
    finding: 'findings',
    prior_insight: 'prior_insights',
    analysis: 'subanalyses',
    input: 'inputs',
    value: 'outputs',
};
