# astra-theme — architecture

How the built pieces connect at runtime. The companion to
[`CONTRACT.md`](./CONTRACT.md) (the interface) — the only coupling to the
[`@astra-spec/mystra`](https://github.com/LightconeResearch/MySTRA) plugin;
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
2. **Store access** (`app/astra/store/`). `app/components/ArticlePage.tsx` wraps the
   page render in `<AstraStoreProvider mdast={tree}>`; the provider walks that mdast
   (and falls back to `useReferences()?.article`, which book-theme's `ArticleProvider`
   sets to the page mdast), finds the single `[identifier=astra-store]` carrier,
   reads `node.data.astra`, and exposes that `ResolvedStore` via React context.
   `useAstraStore()` returns it;
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

Selectors use `unist-util-select` **substring** attribute matching —
`type[class*="astra-…"]` — because `.class` is rejected by unist-util-select and
`[class~="…"]` fails on the multi-class `class` string (see DEVELOPING.md → Gotchas).

| Element | Selector (in `renderers.ts`) | Component | Store table | File |
|---|---|---|---|---|
| inline `{astra:*}` (non-value) | `span[class*="astra-ref"]` | `AstraInlineRef` | by `data.astra.kind` → decisions / outputs / findings / prior_insights / subanalyses | `app/astra/renderers/AstraInlineRef.tsx` |
| inline `{astra:value}` | `span[class*="astra-ref--value"]` *(listed last → wins)* | `AstraValue` | `outputs` (via `id`, renders own number) | `app/astra/renderers/AstraValue.tsx` |
| `astra:decision` | `heading[class*="astra-decision"]` | `AstraDecision` | `decisions` | `app/astra/renderers/AstraDecision.tsx` |
| `astra:output` (figure/table/metric) | `container[class*="astra-output"]` + `paragraph[class*="astra-output"]` | `AstraOutput` | `outputs` | `app/astra/renderers/AstraOutput.tsx` |
| `astra:finding` | `heading[class*="astra-finding"]` | `AstraFinding` | `findings` | `app/astra/renderers/AstraFinding.tsx` |
| `astra:prior-insight` | `admonition[class*="astra-prior-insight"]` | `AstraPriorInsight` | `prior_insights` | `app/astra/renderers/AstraPriorInsight.tsx` |
| `astra:inputs` / `astra:outputs` | `table[class*="astra-inputs"]` / `table[class*="astra-outputs"]` | `AstraDataSources` | `inputs` / `outputs` | `app/astra/renderers/AstraDataSources.tsx` |
| `astra:subanalysis` | `card[class*="astra-subanalysis"]` | `AstraSubanalysis` | `subanalyses` | `app/astra/renderers/AstraSubanalysis.tsx` |

**Carrier types** are taken from the real build: `astra:decision` / `astra:finding`
land on `heading` carriers (hence the `heading[...]` selectors above);
`astra:output` on a `container` (figure/table) or `paragraph` (metric);
`astra:subanalysis` on a `card`; the registries on a `table`. The two **naming subtleties**
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
├── template.yml                       MyST template manifest (jtex:v1, options, build hooks, files)
├── server.js                          Express production server (node ./server.js)
├── package.json · package-lock.json   theme deps (@myst-theme/*, floating-ui, react 19) + React overrides
├── remix.config.{prod,dev}.js · tailwind.config.js · tsconfig.json   (forked book-theme config)
├── app/
│   ├── root.tsx                       book-theme root + ASTRA: merge ASTRA_RENDERERS, link astra.css
│   ├── entry.{client,server}.tsx · types.ts · routes/** · utils/**   (forked book-theme shell)
│   ├── components/ArticlePage.tsx     book-theme page + wraps the render in <AstraStoreProvider>
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
│   ├── app.css · grid-system.css      forked book-theme Tailwind sources
├── packages/
│   └── store-types/                   @astra-spec/store-types (the type-checked contract mirror)
│       ├── src/index.ts               ResolvedStore + Serialized* + AstraKind + KIND_TO_TABLE + InlineAstra
│       ├── package.json · tsconfig.json · README.md
├── tests/                             vitest suite (store helpers, selectors, renderer rich+fallback, contract fixture)
│   ├── fixtures/cosmic-shear.content.json   contract-guard page JSON (store carrier + decorated + orphan nodes)
│   └── *.test.ts[x] · setup.ts
├── ARCHITECTURE.md · STATUS.md · CONTRACT.md · README.md · DEVELOPING.md · NOTICE
```

The **forked book-theme shell** also lives in the repo (MIT, see [`NOTICE`](./NOTICE)):
`app/entry.client.tsx`, `app/entry.server.tsx`, `app/types.ts`, `app/routes/**`,
`app/components/**` (`ArticlePage.tsx` modified to wrap `AstraStoreProvider`),
`app/utils/**`, `styles/app.css`, `styles/grid-system.css`, `server.js`,
`remix.config.{prod,dev}.js`, `tailwind.config.js`, `tsconfig.json`. The build
output (`build/`, `public/build/`, `public/*.thebe*`, `app/styles/app.css`,
`remix.config.js`) is generated by `npm run build` and git-ignored. See
[`DEVELOPING.md`](./DEVELOPING.md).
