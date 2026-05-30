# astra-theme — architecture

How the built pieces connect at runtime. This is the *as-built* companion to
[`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) (the plan) and
[`CONTRACT.md`](./CONTRACT.md) (the interface). The contract is the only coupling
to the [`@astra-spec/mystra`](https://github.com/LightconeResearch/MySTRA) plugin;
everything here is on the **theme** side of that line.

## The runtime flow (one page)

```
            BUILD TIME (the plugin, in the MyST engine)
┌───────────────────────────────────────────────────────────────────────┐
│ astra.yaml + results/  ──►  @astra-spec/mystra  ──►  content/<slug>.json │
│                              (the projector)         neutral mdast:      │
│                                                       • astra-* classes  │
│                                                       • <prefix>-<id> ids │
│                                                       • 1 div.astra-store │
│                                                         (data.astra =     │
│                                                          ResolvedStore)    │
└───────────────────────────────────────────────────────────────────────┘
                                   │  (the theme reads ONLY this JSON)
                                   ▼
            RENDER TIME (this theme, SSR + browser)
┌───────────────────────────────────────────────────────────────────────┐
│ app/root.tsx                                                            │
│   RENDERERS = mergeRenderers([defaults, JUPYTER, LANDING, ANY,         │
│                               ASTRA_RENDERERS])      ← ours merged last  │
│   <Document renderers={RENDERERS}>                                      │
│     <AstraStoreProvider>          ← finds div.astra-store in page mdast  │
│       <Outlet/>  → the page route renders the page's mdast with <MyST/> │
│     </AstraStoreProvider>                                               │
│   </Document>                                                          │
│                                                                        │
│   For each node, MyST's selectRenderer(RENDERERS, node):               │
│     renderers[node.type] → reverse-scan selectors, last CSS match wins, │
│     else `base` (the stock book-theme renderer) → DefaultComponent.     │
│                                                                        │
│   A matched Astra* renderer:                                           │
│     1. reads the join key  (block: node.identifier; inline: data.astra) │
│     2. useAstraStore() / useEntryByIdentifier() / useAstraEntry()       │
│        → the ResolvedStore entry by id, or `undefined`                  │
│     3. entry present → rich treatment (card / panel / drawer / glyph)   │
│        entry missing → <MyST ast={node.children}/>  (stock fallback)    │
└───────────────────────────────────────────────────────────────────────┘
```

The three things that make this work, each owned by one layer:

1. **Selector routing** (`app/astra/renderers.ts`). MyST keys renderers by node
   `type`; within a type it matches `unist-util-select` CSS selectors (reversed,
   last match wins) with a `base` fallback. We register stock types but branch on
   the `astra-*` class, and set `base` to the stock renderer so every non-ASTRA
   node of an overridden type renders unchanged. The map is merged **last** over
   the book-theme stack in `app/root.tsx` via `mergeRenderers([...])`.
2. **Store access** (`app/astra/store/`). `AstraStoreProvider` walks the active
   page mdast (`usePageMystAst()` from `@myst-theme/providers`), finds the single
   `[identifier=astra-store]` carrier, reads `node.data.astra`, and exposes that
   `ResolvedStore` via React context. `useAstraStore()` returns it;
   `useAstraEntry(kind, id)` and `useEntryByIdentifier(identifier)` do the
   id → table → entry join. All return `undefined` on a miss.
3. **Graceful degradation** (every `Astra*` renderer). The store is *additive*.
   Any renderer whose entry is absent — or whose page has no store at all —
   renders `<MyST ast={node.children}/>`, i.e. the stock book-theme baseline.
   Nothing throws. Remove the theme and you get book-theme, not a broken page.

## Per-element map (selector → component → store table → file)

The contract elements ([`CONTRACT.md`](./CONTRACT.md) §1–2) and the renderer that
serves each. "Selector" is the key under its node type in `renderers.ts`; "Store
table" is what the join resolves against.

| Element | Selector (in `renderers.ts`) | Component | Store table | File |
|---|---|---|---|---|
| inline `{astra:*}` (non-value) | `span.astra-ref` | `AstraInlineRef` | by `data.astra.kind` → decisions / outputs / findings / prior_insights / subanalyses | `app/astra/renderers/AstraInlineRef.tsx` |
| inline `{astra:value}` | `span.astra-ref--value` *(listed last → wins)* | `AstraValue` | `outputs` (via `id`, renders own number) | `app/astra/renderers/AstraValue.tsx` |
| `astra:decision` | `details.astra-decision` ⚠ | `AstraDecision` | `decisions` | `app/astra/renderers/AstraDecision.tsx` |
| `astra:output` (figure/table/metric) | `container.astra-output` | `AstraOutput` | `outputs` | `app/astra/renderers/AstraOutput.tsx` |
| `astra:finding` | `card.astra-finding` ⚠ | `AstraFinding` | `findings` | `app/astra/renderers/AstraFinding.tsx` |
| `astra:prior-insight` | `admonition.astra-prior-insight` | `AstraPriorInsight` | `prior_insights` | `app/astra/renderers/AstraPriorInsight.tsx` |
| `astra:inputs` / `astra:outputs` | `table.astra-inputs` / `table.astra-outputs` | `AstraDataSources` | `inputs` / `outputs` | `app/astra/renderers/AstraDataSources.tsx` |
| `astra:subanalysis` | `card.astra-subanalysis` | `AstraSubanalysis` | `subanalyses` | `app/astra/renderers/AstraSubanalysis.tsx` |

⚠ **Carrier-type caveat.** The current MySTRA build emits the **decision** and
**finding** carriers as `heading` nodes (verified against the prototype build),
not the `details`/`card` types CONTRACT.md §1 lists. Every renderer selects on
*class* and is type-agnostic in its body, but the `renderers.ts` keys above are
type-specific. If the live build keeps emitting `heading`, move those two
registrations to `heading.astra-decision` / `heading.astra-finding` (or add them
alongside). See [`STATUS.md`](./STATUS.md) "Open discrepancies" and
[`tests/contract.md`](./tests/contract.md) group E. The two **naming subtleties**
(class `astra-prior-insight` ↔ id `prior_insight-<id>`; class `astra-subanalysis`
↔ id `analysis-<id>`) are handled centrally by `parseCarrierId` /
`PREFIX_TO_TABLE` in `useAstraStore.ts`, so renderers never special-case them.

## The store join, in one place

```
inline  node.data.astra = { kind, id, … }
          └─ useAstraEntry(kind, id)
               └─ KIND_TO_TABLE[kind] → store[table][id]   (@astra-spec/store-types)

block   node.identifier = "<prefix>-<id>"
          └─ useEntryByIdentifier(identifier)
               └─ parseCarrierId → { prefix, id }
                  └─ PREFIX_TO_TABLE[prefix] → store[table][id]
```

`KIND_TO_TABLE` (inline) lives in `@astra-spec/store-types`; `PREFIX_TO_TABLE` and
`parseCarrierId` (block carriers) live in `app/astra/store/useAstraStore.ts`. The
prefix set adds `input → inputs` (inputs are placed but never inline-referenced)
and resolves `prior_insight`/`analysis` correctly via longest-known-prefix match.

## Directory tree (what was built)

```
astra-theme/
├── template.yml                       MyST template manifest (myst:v1, kind:site, build hooks)
├── package.json                       theme deps (@myst-theme/*, floating-ui, react)
├── app/
│   ├── root.tsx                       OVERLAY: merge ASTRA_RENDERERS, wrap AstraStoreProvider, import astra.css
│   └── astra/                         the ONLY ASTRA-aware code
│       ├── index.ts                   barrel re-exports (ASTRA_RENDERERS, AstraStoreProvider, …)
│       ├── renderers.ts               ASTRA_RENDERERS map (selector → component, base fallbacks)
│       ├── glyphs.ts                  GLYPHS + KIND_LABELS + lookups (per-kind ◇◈●◐◆)
│       ├── store/
│       │   ├── AstraStoreProvider.tsx finds div.astra-store → ResolvedStore → context
│       │   └── useAstraStore.ts       useAstraStore / useAstraEntry / useEntryByIdentifier / parseCarrierId / PREFIX_TO_TABLE
│       ├── card/                      shared preview-card primitives (floating-ui)
│       │   ├── PreviewCard.tsx        hover/focus popover wrapper
│       │   ├── CardChrome.tsx         KindLabel / Title / Desc / SectionLabel / MetaFooter
│       │   ├── diagrams.tsx           DataFlow / ProvenanceGraph / PosteriorSketch (CSS-only)
│       │   └── index.ts               card barrel
│       └── renderers/                 one component per contract element
│           ├── AstraInlineRef.tsx     span.astra-ref → label + hover preview card
│           ├── AstraValue.tsx         span.astra-ref--value → number + provenance tooltip
│           ├── AstraDecision.tsx      .astra-decision → decision panel (narrative|options)
│           ├── AstraOutput.tsx        container.astra-output → figure/table/metric + provenance drawer
│           ├── AstraFinding.tsx       .astra-finding → finding card + scope chip
│           ├── AstraPriorInsight.tsx  .astra-prior-insight → insight card + DOI/quote chrome
│           ├── AstraDataSources.tsx   table.astra-inputs / .astra-outputs → registry tables
│           └── AstraSubanalysis.tsx   .astra-subanalysis → nav card + counts
├── styles/
│   ├── astra.css                      the Vellum design system (tokens, glyphs, cards, diagrams, dark mode)
│   └── README.md                      token / glyph / class-catalog reference
├── packages/
│   └── store-types/                   @astra-spec/store-types (the type-checked contract mirror)
│       ├── src/index.ts               ResolvedStore + Serialized* + AstraKind + KIND_TO_TABLE + InlineAstra
│       ├── package.json · tsconfig.json · README.md
├── tests/
│   ├── fixtures/cosmic-shear.content.json   contract-guard page JSON (store carrier + decorated + orphan nodes)
│   └── contract.md                    the assertions to run against the fixture
├── ARCHITECTURE.md                    (this file)
├── STATUS.md                          implemented vs planned; next steps to `myst start`
├── CONTRACT.md · IMPLEMENTATION-PLAN.md · README.md · DEVELOPING.md
```

Files **not** in this repo yet (vendored from `@myst-theme/book` at build):
`app/entry.client.tsx`, `app/entry.server.tsx`, the route modules (`app/routes/…`),
`vite.config.ts`, `server.js`, and `tsconfig.json`. `app/root.tsx` is the single
file we overlay over the vendored shell. See [`STATUS.md`](./STATUS.md) and
[`DEVELOPING.md`](./DEVELOPING.md).
