# astra-theme — status

Snapshot of what is built and running. See [`ARCHITECTURE.md`](./ARCHITECTURE.md)
for how the pieces connect and [`DEVELOPING.md`](./DEVELOPING.md) for the
build/run/publish loop.

## TL;DR

✅ **Phases 0–2 are complete and running as a real theme server.** astra-theme is
a standalone **fork of `@myst-theme/book`** (classic Remix, React 19) built on the
published `@myst-theme/*` packages, with the ASTRA layer compiled in. `npm run
build` produces the theme server (`build/` + `public/`); `myst start` on
`examples/desi-dr1` renders the DESI DR1 BAO analysis end-to-end via
`site.template: ../..`, verified in a browser (3 pages, clean console):

- inline hover **preview cards** on `{astra:*}` tokens (floating-ui), joined live
  to the per-page store (74 on the index page);
- the interactive **decision panel** (narrative ⇄ options toggle, selected/excluded
  options) rendered from the store;
- **output** figures with a provenance drawer (inputs → recipe → artifact) and
  real result PNGs;
- **finding** and **prior-insight** cards, **registry tables**, sub-analysis nav
  cards, and live **value** tokens;
- the Vellum look (parchment, EB Garamond / Inter / JetBrains Mono, per-kind glyphs)
  over book-theme's chrome, with a dark-mode token set.

Phase 3 (author-placed `astra:dag` / `astra:gallery` patterns) is **not started** —
it needs plugin-side directive hooks first.

## By phase

### Phase 0 — scaffold + freeze the contract — **DONE**
- ✅ Standalone Remix theme app forked from `@myst-theme/book@1.3.x`; `template.yml`
  (`jtex: v1`, options, `build.install`/`build.start`, `files:`); `server.js`
  (Express production server); `package.json` (published `@myst-theme/*` deps,
  React 19 `overrides`, `.npmrc` legacy-peer-deps, `patch-package`).
- ✅ `@astra-spec/store-types` workspace package mirrors the plugin's
  `resolved-store.ts` (`Serialized*`, `ResolvedStore`, `AstraKind`, `KIND_TO_TABLE`,
  `TableData`, `InlineAstra`).
- ✅ **Exit criterion met:** `examples/desi-dr1` renders through the theme via
  `myst start`.

### Phase 1 — "light" (CSS) — **DONE**
- ✅ `styles/astra.css` — the Vellum design system (tokens, page theme over
  book-theme's DOM, per-kind inline glyphs/colours, card chrome + diagrams,
  decision panel, output/metric, finding + scope chip, prior-insight citation
  chrome, registry tables, sub-analysis card, popover, dark mode). Imported by
  `app/root.tsx`; fonts linked there.

### Phase 2 — "rich" (React renderers + store) — **DONE**
- ✅ `AstraStoreProvider` + hooks (`useAstraStore`/`useAstraEntry`/
  `useEntryByIdentifier`/`parseCarrierId`), wired in `app/components/ArticlePage.tsx`
  around the page render (reads the carrier from the page mdast).
- ✅ Card primitives: `PreviewCard` (floating-ui hover/focus popover), `CardChrome`,
  `diagrams` (DataFlow/ProvenanceGraph/PosteriorSketch), `glyphs`.
- ✅ All eight renderers matched via `mergeRenderers([..., ASTRA_RENDERERS])` with
  `type[class*="astra-…"]` substring selectors + `base` fallbacks, each joining the
  store and degrading to `<MyST ast={node.children}/>` on a miss.
- ✅ Type-checks and builds; runs under SSR + client hydration (interactive toggle
  and hover cards confirmed live).

### Phase 3 — "patterns" — **NOT STARTED**
- ⬜ `app/astra/patterns/` (`:::{astra:dag}`, `:::{astra:gallery}`) — needs the
  plugin to emit the directive hooks first, then a renderer + the
  store fields a graph needs (`outputs[].inputs`/`decisions` are already present).

## Known limitations / follow-ups

- **Cross-scope inline refs degrade.** An index-page token referencing a decision
  that lives in a sub-analysis scope (e.g. `convention`, `imaging_weights`) isn't
  in the index store, so it renders as the plain labelled token (correct graceful
  fallback) — no card. Resolving cross-scope cards would need the plugin to widen
  the store or emit cross-scope entries.
- **`store.version`** not yet added to `ResolvedStore` — no render-time
  plugin-mismatch detection.
- **Registry `astra-theme` name.** Locally the example uses a path
  (`template: ../..`); the bare `template: astra-theme` one-liner works once the
  theme is published to the MyST template registry (see DEVELOPING.md → Distribution).
- **MySTRA plugin validations.** The example surfaces `INVALID_FROM` /
  `NARRATIVE_UNMENTIONED` warnings and a duplicate `astra-store` project identifier
  — these are plugin-side (MySTRA) concerns, not theme errors; the build succeeds.
- **CONTRACT.md §1 carrier types.** Verified against the real build: the
  `astra:decision` / `astra:finding` carriers are `heading` nodes (the renderers key
  on `heading[class*="astra-decision"]` / `…finding`). The contract table's
  "underlying stock node" column is about the component body, not the carrier — to
  be reconciled in the contract text.
