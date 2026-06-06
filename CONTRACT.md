# The plugin ↔ theme contract

> The **only** coupling between [`@astra-spec/mystra`](https://github.com/LightconeResearch/MySTRA)
> (the plugin) and `astra-theme` (this repo). Keep it small, explicit, and
> versioned. The plugin owns this; the theme depends on it.

The plugin is a build-time **projector**: it reads `astra.yaml` and emits stock
MyST AST decorated with three things the theme keys on — **semantic classes**,
**stable identifiers**, and a **resolved data store**. The theme reads *only*
these. It never reads `astra.yaml`, and it never re-implements ASTRA semantics
(the store is already fully resolved).

Everything below is what the plugin emits today, verified against the source.
Treat it as the interface to pin a theme version against.

## 1. Block elements (placed by `:::{astra:*}` directives)

Each placed component renders as a **stock MyST node** (so book-theme shows it
unaided), carrying an `astra-<kind>` **class** on the carrier node and a stable
`<prefix>-<id>` **identifier**. The theme recognizes the element by class and
joins it to the store by `identifier` → kind table → `id`.

| Directive | Class (on carrier) | Identifier | Underlying stock node | Store table |
|---|---|---|---|---|
| `astra:decision` | `astra-decision` | `decision-<id>` | `details` + `tabSet` | `decisions` |
| `astra:output` (figure) | `astra-output astra-output--figure` | `output-<id>` | `container[figure]` | `outputs` |
| `astra:output` (table) | `astra-output astra-output--table` | `output-<id>` | `container[table]` | `outputs` |
| `astra:output` (metric) | `astra-output astra-output--metric` | `output-<id>` | inline/figure | `outputs` |
| `astra:finding` | `astra-finding` | `finding-<id>` | heading + blocks (card) | `findings` |
| `astra:prior-insight` | `astra-prior-insight` | `prior_insight-<id>` | `admonition` | `prior_insights` |
| `astra:inputs` | `astra-inputs` | rows: `input-<id>` | `table` | `inputs` |
| `astra:outputs` | `astra-outputs` | rows: `output-<id>` | `table` | `outputs` |
| `astra:subanalysis` | `astra-subanalysis` | `analysis-<id>` | card | `subanalyses` |

**Two naming subtleties the theme MUST respect** (the class and identifier do
*not* always share a stem — select on the exact strings below):

- prior-insight: class `astra-prior-insight` **but** identifier `prior_insight-<id>` (underscore).
- subanalysis: class `astra-subanalysis` **but** identifier `analysis-<id>`.

The `--<subtype>` modifier on outputs is the ASTRA output `type`
(`figure`/`table`/`metric`/…), so a theme can give each output kind its own
treatment.

The `astra-<kind>` class sits on the **carrier** node — the one bearing the
`<prefix>-<id>` identifier, else the first node of the rendered component. The
theme should select on `class` first (`.astra-output`) and use the identifier
for the store join, not as the primary selector.

**Carrier node types (verified against the build).** The "Underlying stock node"
column above describes the component *body*; the `astra-<kind>` class + identifier
land on the carrier, whose actual node `type` is what a theme keys on:

| Directive | Carrier node `type` |
|---|---|
| `astra:decision` | `heading` |
| `astra:finding` | `heading` |
| `astra:output` | `container` (figure/table); `paragraph` for inline metric |
| `astra:prior-insight` | `admonition` |
| `astra:inputs` / `astra:outputs` | `table` |
| `astra:subanalysis` | `card` |

A theme matches e.g. `heading[class*="astra-decision"]`, `container[class*="astra-output"]`.
(Use a substring `[class*=…]` attribute selector: `unist-util-select` rejects `.class`
and its `[class~=…]` does not split the multi-class `class` string.)

## 2. Inline tokens (`{astra:*}` roles)

Each inline reference is a neutral **`span`**:

```
span.astra-ref.astra-ref--<kind>[.astra-ref--<subtype>]
  children: [ text(label) ]
  data.astra: { kind, id, path }
```

- `kind` ∈ `decision | output | finding | prior_insight | analysis | value`
  (note `prior_insight` for `{astra:prior-insight}`, `analysis` for `{astra:analysis}`).
- The text is the resolved label; on book-theme the span degrades to that plain
  text (no card).
- `data.astra` is the **join key**: `kind` → store table, `id` → entry. This is
  the same key→table join MyST uses for citations.

**`{astra:value}`** is self-describing — the computed number is the text, and
`data.astra` carries provenance instead of being a store element:

```
span.astra-ref.astra-ref--value[.astra-ref--<output-type>]
  children: [ text("19.88 ± 0.17") ]
  data.astra: { kind: 'value', id, path, col, filter, type, product }
```

`kind → store table` map: `decision→decisions`, `output→outputs`,
`finding→findings`, `prior_insight→prior_insights`, `analysis→subanalyses`.
`value` joins `outputs[id]` for the source product but renders from its own
fields.

## 3. The resolved store

One hidden carrier per page:

```
div.astra-store              (identifier: "astra-store", style: display:none)
  data.astra: ResolvedStore  ← the entire resolved model for the page's scope
```

It survives the engine's content-JSON serialization intact (`data.astra` is
present in `content/<slug>.json`). It is **per page scope** (the root analysis on
`index`, each sub-analysis on its own page). The theme reads it once and joins
placed/inline nodes to it by id.

Alongside it, when the page's store carries insight DOIs, the plugin emits a
second hidden carrier:

```
div.astra-cites              (style: display:none)
  paragraph > cite[label=<doi>] …   ← one cite node per unique insight DOI
```

MyST's own pipeline (`transformLinkedDOIs` → `transformCitations`) resolves
those cite nodes at build time, populating `references.cite.data` and the
author–year children. The theme's `AstraCite` joins a store `doi` back to the
resolved cite node (via `references.article`) so overlay cards render the SAME
citation treatment as main-text DOIs — and falls back to a plain doi.org link
when no citation resolves (offline build, unknown DOI).

`ResolvedStore` (from the plugin's `transform/resolved-store.ts`):

```ts
interface ResolvedStore {
  analysis: { id?: string; name?: string; slug: string };
  outputs:        Record<string, SerializedOutput>;
  inputs:         Record<string, SerializedInput>;
  decisions:      Record<string, SerializedDecision>;
  findings:       Record<string, SerializedFinding>;
  prior_insights: Record<string, SerializedInsight>;
  subanalyses:    Record<string, SerializedSubAnalysis>;
}
```

Each entry is **resolved**, not raw YAML — the theme never re-derives anything:

- `SerializedOutput` — `id, label, type, description`, `resolved_path` (a
  **project-relative, MyST-hashed** result URL), `recipe {command, container}`,
  `inputs[]` + `decisions[]` (provenance), `from` (alias), `table_data` (parsed
  rows for tables), `metric {value, uncertainty, …}` (inlined for metrics).
- `SerializedInput` — `id, label, type, description, source, from` (aliases
  resolved through ancestor scopes).
- `SerializedDecision` — `id, label, rationale, selected` (the option id chosen
  under the active universe), `options` (id → label).
- `SerializedFinding` — `id, label, claim, notes, scope`.
- `SerializedInsight` — `id, label, scope, claim, doi` (first evidence DOI),
  `quote` (first exact quote).
- `SerializedSubAnalysis` — `id, name, summary, url` (page URL), `decisions` +
  `outputs` (counts).

(Full field types live in the plugin's `resolved-store.ts`; the theme mirrors them
in `@astra-spec/store-types` rather than redefining by hand.)

## 4. Recognition & join (the theme's algorithm)

1. Read the page mdast (from the theme's references provider). Select
   `[identifier=astra-store]`, take `node.data.astra` → the `ResolvedStore`,
   expose it via React context.
2. **Block**: a renderer matched on `.astra-<kind>` reads the carrier's
   `identifier`, maps `<prefix>` → store table, looks up by `id`.
3. **Inline**: a renderer matched on `.astra-ref` reads `data.astra.{kind,id}`,
   maps `kind` → store table, looks up by `id`.
4. Render the rich treatment from the entry. If the entry is missing, fall back
   to the node's own children (the baseline) — never throw.

## 5. Invariants the theme relies on (and must not break)

- **Neutral AST**: the plugin bakes no glyphs, colours, or inline styles (beyond
  `display:none` on theme-only carriers). All appearance is the theme's.
- **Stock types degrade**: every block renders acceptably with no theme.
- **No injection**: the theme renders/fills only what the author placed. It may
  re-render a placed element richly and may fill author-placed *empty* pattern
  directives (`astra:dag`) from the store, but must never add elements the
  author did not place.
- **Resolved, keyed once**: data is conveyed once via the store, keyed by id —
  not duplicated on every node. Join by id; don't expect per-node data copies
  (inline tokens carry only the small join key).

## 6. Versioning

The plugin's emitted classes/identifiers + the `ResolvedStore` shape are this
interface. The theme should pin a compatible plugin version range. **Open
item:** add a `store.version` field to `ResolvedStore` so the theme can detect
mismatch at render time.
