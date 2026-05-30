# @astra-spec/store-types

Shared TypeScript definitions for the resolved ASTRA data store. This package is a
type-checked mirror of the MySTRA plugin's `src/transform/resolved-store.ts`: the
plugin bakes a per-page-scope `ResolvedStore` (decorated stock MyST AST plus one hidden
carrier node whose `data.astra` holds the fully resolved store), and the `astra-theme`
reads that store and joins `node id -> store entry` to render rich cards. Both repos
import these interfaces (`ResolvedStore`, the `Serialized*` shapes, `TableData`, the
`AstraKind` union, the `KIND_TO_TABLE` map, and `InlineAstra`) so the plugin↔theme
contract has exactly one definition. Mirror fields here EXACTLY when the plugin's
resolved-store shape changes; add no presentation-only fields.
