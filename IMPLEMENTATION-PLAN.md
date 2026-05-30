# astra-theme — implementation plan

> Status: **planning**. The rich MyST web theme for [ASTRA](https://github.com/LightconeResearch/ASTRA)
> analyses — the presentation half of the pair whose data half is the
> [`@astra-spec/mystra`](https://github.com/LightconeResearch/MySTRA) plugin.
> The plugin↔theme interface is specified in [`CONTRACT.md`](./CONTRACT.md).

## 1. What this is

`astra-theme` is a **MyST web theme** (a React/Remix site, like MyST's stock
`book-theme`). It takes an ordinary ASTRA report — Markdown that imports/cites
ASTRA components via the MySTRA plugin — and renders the **rich** experience:
glyph-tagged inline references with hover preview cards, decision/finding/output
treatments, value-token provenance, and author-placed "powerful patterns" (e.g.
a product-dependency graph). A reader switches it on by changing **one line**:

```yaml
site:
  template: astra-theme    # instead of book-theme
```

Nothing else about the project changes. The same document that renders cleanly
on `book-theme` renders *richly* here.

## 2. The separation of concerns

This is the heart of the design, and the reason it's two packages instead of
one. MyST is **two-stage**: the engine parses source → AST at build time; the
theme renders the AST in the browser. The theme **cannot read `astra.yaml`** — it
only ever sees the build output. That single fact forces a clean split:

| Stage | Package | Runs | Owns | Reads |
|---|---|---|---|---|
| **Project** (data → AST) | `@astra-spec/mystra` plugin | in the engine, at build | turning `astra.yaml` into neutral MyST AST + markers + the resolved store | `astra.yaml`, `universes/`, `results/` |
| **Presentation** (AST → pixels) | `astra-theme` (this repo) | in the browser/SSR, at render | every visual/interactive treatment | the build output only — classes, identifiers, the store |

The two single sources of truth this preserves:

- **Data** lives once in `astra.yaml`; the plugin projects a *resolved* copy into
  the build (the store). The theme reads the resolved copy — it never re-derives
  ASTRA semantics (selected options, `from:` chains, table parsing are all done).
- **Presentation** lives once in the theme. The plugin bakes **no** glyphs,
  colours, inline styles, or widgets. If it looks like anything, that's us.

### The rules that keep the boundary clean

1. **Plugin emits neutral, stock AST.** Stock node types (`span`, `container`,
   `details`, `table`, `admonition`, card) so book-theme renders everything; plus
   `astra-*` classes, `<kind>-<id>` identifiers, and one resolved-store carrier.
   Nothing presentational.
2. **Theme adds all presentation**, keyed on those markers, joined to the store
   by id. It re-implements no ASTRA logic.
3. **The theme never injects content the author didn't place.** It may
   *re-render* a placed element richly, and may *fill* an author-placed **empty**
   pattern directive (`:::{astra:dag}`) from the store — but placement is always
   the author's job, expressed through the plugin's directive/role vocabulary.
4. **Graceful degradation is mandatory.** Every treatment must fall back to the
   baseline node if the store entry is missing. The theme is strictly additive;
   removing it yields book-theme, not a broken page.
5. **The contract is the only coupling** ([`CONTRACT.md`](./CONTRACT.md)) and it
   is versioned. We extend the *vocabulary* (new directive → new renderer) rather
   than smuggle theme behavior into the plugin.

### Why this split is worth it

- Either side is swappable: the plugin already works on stock book-theme (clean
  baseline); the theme renders anything the plugin projects, for any ASTRA
  project, with no per-project code.
- The theme is pure front-end: no data access, no Node, no `astra.yaml` parsing,
  no result-file IO. All of that already happened at build.
- It mirrors how MyST itself works (citations: a `cite` node carries a key; the
  theme joins it to `references`). We're using the same machinery for ASTRA.

## 3. How MyST themes work (the mechanism we build on)

A MyST web theme is a **web server** (Remix app) that the engine launches during
`myst start`. It reads `_build/site/config.json`, fetches page JSON from
`/content/{slug}.json`, and renders the page's mdast with
[`myst-to-react`](https://github.com/jupyter-book/myst-theme). Packaging is a
`template.yml` (`myst: v1`, `kind: site`, `build.install`/`build.start`) plus the
compiled app.

**The enabling fact** (verified in `myst-to-react`'s `selectRenderer`): renderers
are keyed by node **type**, but within a type MyST matches **`unist-util-select`
CSS selectors**, with a `base` fallback:

```ts
// myst-to-react/src/MyST.tsx
export function selectRenderer(renderers, node) {
  const componentRenderers = renderers[node.type] ?? renderers['DefaultComponent'];
  const SpecificComponent = Object.entries(componentRenderers ?? {})
    .reverse()
    .find(([selector]) => selector !== 'base' && matches(selector, node))?.[1];
  return SpecificComponent ?? componentRenderers?.base ?? DefaultComponent;
}
```

So we override stock node types but **branch on the `astra-*` class selector**,
falling back to `base` (the stock book-theme renderer) for every non-ASTRA node:

```tsx
const ASTRA_RENDERERS = {
  span: {
    'span.astra-ref': AstraInlineRef,   // our hover-card token
    'span.astra-ref--value': AstraValue, // provenance tooltip
    base: DEFAULT_RENDERERS.span.base,   // plain spans unchanged
  },
  container: {
    'container.astra-output': AstraOutput,
    base: DEFAULT_RENDERERS.container.base,
  },
  details: { 'details.astra-decision': AstraDecision, base: /*…*/ },
  admonition: { 'admonition.astra-prior-insight': AstraPriorInsight, base: /*…*/ },
  // table.astra-inputs / table.astra-outputs, card.astra-subanalysis, …
};
// merged over DEFAULT_RENDERERS via mergeRenderers([...], true)
```

This is exactly the `mergeRenderers` + `unist-util-select` pattern the refactor
anticipated, and it's why the plugin emits *stock types + classes* rather than
custom node types: we get rich rendering **and** automatic book-theme fallback
from the same mechanism.

**Store access.** The page mdast (including our `div.astra-store` carrier) is
available to renderers through `@myst-theme/providers`. A small provider selects
`[identifier=astra-store]`, reads `node.data.astra`, and exposes it via React
context (`useAstraStore()`); every ASTRA renderer consumes it to join id → entry.

## 4. Architecture of this repo

```
astra-theme/
├── template.yml                 myst:v1, kind:site, build hooks  (makes it a MyST template)
├── app/                         the Remix theme app (forked/extended from @myst-theme/book)
│   ├── …                        layout, routes, providers — reused from the base book theme
│   └── astra/                   OUR additions, the only ASTRA-aware code:
│       ├── renderers/           one component per contract element
│       │   ├── AstraInlineRef.tsx      span.astra-ref → label + hover preview card
│       │   ├── AstraValue.tsx          span.astra-ref--value → number + provenance tooltip
│       │   ├── AstraDecision.tsx       details.astra-decision → rich decision panel
│       │   ├── AstraOutput.tsx         container.astra-output → figure/table + provenance
│       │   ├── AstraFinding.tsx        .astra-finding → finding card
│       │   ├── AstraPriorInsight.tsx   admonition.astra-prior-insight
│       │   ├── AstraDataSources.tsx    table.astra-inputs / .astra-outputs
│       │   └── AstraSubanalysis.tsx    card.astra-subanalysis → nav card
│       ├── patterns/            author-placed, store-filled (phase 3): Dag, Gallery
│       ├── store/               AstraStoreProvider + useAstraStore() + the id-join helpers
│       ├── card/                shared PreviewCard / popover primitives (floating-ui)
│       └── renderers.ts         ASTRA_RENDERERS map, merged over DEFAULT_RENDERERS
├── styles/                      ASTRA stylesheet (glyphs, colours, card chrome) — phase 1 deliverable
└── CONTRACT.md / IMPLEMENTATION-PLAN.md / README.md
```

We **extend the base book theme** (depend on its `@myst-theme/*` packages and
Remix app shell) rather than rewrite it: layout, navigation, search, providers,
and styling foundations come for free. The only ASTRA-specific code is the
`app/astra/` subtree.

Shared types: rather than hand-mirror the store shape, publish the plugin's
`Serialized*`/`ResolvedStore` interfaces (from MySTRA's `resolved-store.ts`) as a
tiny `@astra-spec/store-types` package and import it in both — the contract stays
type-checked on both ends.

## 5. Phasing

Deliver value early; each phase is shippable.

### Phase 0 — scaffold + freeze the contract
- Stand up the theme repo from the MyST book theme; `template.yml` (`kind: site`).
- Get `myst start` on the MySTRA prototype rendering through **this** theme with
  zero ASTRA styling — proves the theme runs and consumes content.
- Land [`CONTRACT.md`](./CONTRACT.md); publish `@astra-spec/store-types`; pin the
  compatible MySTRA plugin version.
- **Exit:** the prototype renders on `template: astra-theme`, visually ≈ book.

### Phase 1 — "light" (CSS-only)
Block content already renders; styling needs no JS. Ship a stylesheet targeting
the `astra-*` classes:
- Per-kind inline glyphs (`.astra-ref--decision::before { content: … }`),
  colours, and treatment for finding/insight cards and data-source tables.
- Reveal nothing that requires the store (no popovers yet).
- **Exit:** a recognizably "ASTRA" theme that's pure CSS over the baseline — the
  cheapest visible win, and a real release.

### Phase 2 — "rich" (React renderers + the store)
Where the store earns its keep:
- `AstraStoreProvider` + `useAstraStore()`.
- Inline **hover preview cards** built from the store (decision rationale +
  selected option; finding claim/notes; insight claim + DOI/quote; output
  thumbnail + provenance) via a floating-ui popover — *not* from hidden AST.
- Rich block renderers: decision panel (options, selected highlighted,
  rationale), output (figure/table + collapsible provenance: inputs, decisions,
  recipe), value-token provenance tooltip (col, row filter, source product).
- **Exit:** the inline-card / glyph experience from the Vellum mocks (the design
  north-star), driven entirely by the store.

### Phase 3 — "patterns" (author-placed, store-filled)
- Implement `:::{astra:dag}` (product-dependency graph from each output's
  `inputs`/`decisions`) and `:::{astra:gallery}`. These are **empty** directives
  the author places; the plugin emits the hook, the theme fills it from the
  store. Requires coordinating the new directives on the **plugin** side first
  (extend the contract, then the renderer).
- **Exit:** at least one "powerful pattern" shipping end-to-end.

## 6. Per-element target treatments (driven by the Vellum mocks)

| Element | Baseline (book) | Rich (this theme) |
|---|---|---|
| `astra:decision` | dropdown + tabbed options | panel: options with the selected one highlighted, rationale, supporting-insight refs |
| `astra:output` | figure/table + collapsed provenance | figure/table + provenance drawer (upstream inputs, decisions, recipe); metric → styled stat |
| `astra:finding` | claim heading + notes + scope | finding card with scope chip + evidence affordance |
| `astra:prior-insight` | admonition | insight card with DOI/quote citation chrome |
| `astra:inputs` / `outputs` | plain table | registry table with type glyphs + cross-links |
| `astra:subanalysis` | link/card | nav card with decision/output counts + summary |
| `{astra:*}` inline | plain label | glyph + label + hover preview card (from store) |
| `{astra:value}` | the number (± std) | number + provenance tooltip (product, column, row) |

## 7. Build, dev loop, distribution

- **Dev loop.** Point an ASTRA project's `site.template` at this repo's local path
  and run `myst start`; the engine builds content and launches the theme. For
  fast HMR on the theme itself, run the theme's own dev server against a running
  content server (the engine passes `CONTENT_CDN_PORT`/`PORT`/`MODE` to the
  theme's `build.start`). *Verify the exact local-template + headless flags
  against the installed `mystmd` (1.8.x) during Phase 0.*
- **Distribution.** Build the bundle (`template.yml` + compiled app + listed
  static assets), publish to a stable zip/git URL, and optionally register in the
  [`myst-templates`](https://github.com/myst-templates/templates) index with
  `kind: site`. Users then reference `template: astra-theme` (registered),
  `@astra-spec/astra-theme`, or a git URL.
- **Versioning.** Tag releases against a supported MySTRA plugin range; the
  contract is the compatibility surface.

## 8. Testing & verification

- **Contract tests** (cross-repo): a fixture page's `content/<slug>.json`
  contains the `astra-store` carrier and the expected classes/identifiers. This
  guards the interface from *both* sides — co-locate or mirror with the plugin's
  emission tests.
- **Renderer unit tests**: render each component against a known store + node;
  assert the rich output and the **fallback** path when the entry is absent.
- **Degradation test**: non-ASTRA nodes of an overridden type (a plain `span`, a
  vanilla `container[figure]`) still hit the `base` renderer unchanged.
- **Visual**: build the prototype on book-theme vs astra-theme — same document,
  strictly richer; numbers live; no `astra.yaml` read at render.

## 9. Open questions

- **`store.version`** — add a version field to `ResolvedStore` so the theme can
  detect a plugin mismatch at render time (recommended; needs a plugin change).
- **Extend vs fork the book theme** — depend on `@myst-theme/*` packages with an
  overlay, or fork the Remix app? Depend-and-overlay is preferred; confirm the
  base theme exposes a renderer-merge hook we can use without forking routes.
- **Local-template + headless dev flow** — confirm exact `myst start` / theme
  dev-server wiring on `mystmd` 1.8.x (Phase 0).
- **`astra:dag` / `astra:gallery` directive design** — the plugin-side hooks and
  the store fields a graph needs (already largely present: `outputs[].inputs` +
  `decisions`). Design before Phase 3.
- **Popover library** — floating-ui vs the base theme's existing tooltip
  primitives; reuse if adequate.
- **Package name** — `astra-theme` (registered template name) vs
  `@astra-spec/astra-theme` (npm). Decide before first publish.
