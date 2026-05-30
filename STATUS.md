# astra-theme — status

Honest snapshot of what is built vs the [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md)
phases, what is stubbed/vendored, and the concrete steps to get `myst start`
rendering on this theme. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how the
pieces connect.

## TL;DR

Phases **0–2 are written** as source: the `@astra-spec/store-types` contract
mirror, the full Vellum CSS design system, the scaffold (template + overlay root +
store provider/hooks), the shared card primitives, and **all eight** contract
renderers. What is **not** done: `npm install` has never run (no `node_modules`,
so nothing has been type-checked or executed), the `@myst-theme/book` Remix app
shell is not yet vendored, and there is no test runner. So today this is a
**no-build design preview** of complete, unverified code — not yet a running site.

## By phase

### Phase 0 — scaffold + freeze the contract — **DONE (source); UNVERIFIED (runtime)**
- ✅ `template.yml` (`myst: v1`, `kind: site`, `build.install`/`build.start`, options, `files:`).
- ✅ `package.json` (deps on `@myst-theme/*`, `@floating-ui/react`, React, Remix; workspace for `packages/*`).
- ✅ `@astra-spec/store-types` — every `Serialized*` / `ResolvedStore` mirrored from the plugin's `resolved-store.ts`, plus `AstraKind`, `StoreTable`, `KIND_TO_TABLE`, `InlineAstra`, `TableData`.
- ✅ `app/root.tsx` overlay (merge `ASTRA_RENDERERS`, wrap `AstraStoreProvider`, import `astra.css`).
- ✅ `app/astra/store/` — `AstraStoreProvider` + `useAstraStore` / `useAstraEntry` / `useEntryByIdentifier` / `parseCarrierId` / `PREFIX_TO_TABLE`.
- ❌ **Exit criterion NOT met**: the prototype has not been rendered through this theme (requires the vendored shell + install — see Next steps).
- ⬜ `CONTRACT.md` landed; plugin version range **not pinned** (open item; also `store.version` not added — plan §9).

### Phase 1 — "light" (CSS-only) — **DONE (source)**
- ✅ `styles/astra.css` — full design system: `:root` tokens, web-font import, page chrome, per-kind inline glyphs + colours, card chrome, the three CSS-only card diagrams, decision panel, output/metric, finding + scope chip, prior-insight citation chrome, registry tables, sub-analysis card, preview popover, and a `prefers-color-scheme: dark` token override.
- ✅ `styles/README.md` — token / glyph / class-catalog reference.
- ⚠️ Unverified in a browser (no build). Class names cross-checked by hand against the renderers; not visually regression-tested.

### Phase 2 — "rich" (React renderers + store) — **DONE (source); UNVERIFIED**
- ✅ Card primitives: `PreviewCard` (floating-ui hover/focus popover), `CardChrome` (`KindLabel`/`Title`/`Desc`/`SectionLabel`/`MetaFooter`), `diagrams` (`DataFlow`/`ProvenanceGraph`/`PosteriorSketch`), `glyphs`.
- ✅ All eight renderers written, each with a store join and a `<MyST/>` fallback (see the table in ARCHITECTURE.md): `AstraInlineRef`, `AstraValue`, `AstraDecision`, `AstraOutput`, `AstraFinding`, `AstraPriorInsight`, `AstraDataSources`, `AstraSubanalysis`.
- ✅ `renderers.ts` registers every component by selector with `base` fallbacks.
- ❌ Not type-checked (`tsc` needs `node_modules`); not executed; not unit-tested.

### Phase 3 — "patterns" (author-placed, store-filled) — **NOT STARTED**
- ⬜ `app/astra/patterns/` (`:::{astra:dag}`, `:::{astra:gallery}`) — out of scope so far; needs plugin-side directive hooks first (plan §5, §9).

## Stubbed / vendored / missing

- **The Remix app shell is vendored, not present.** `app/entry.client.tsx`,
  `app/entry.server.tsx`, `app/routes/**`, `vite.config.ts`, `server.js`,
  `tsconfig.json`, `tailwind`/`postcss` config — all come from `@myst-theme/book`
  at build time. `app/root.tsx` is the single file we overlay. See
  [`DEVELOPING.md`](./DEVELOPING.md) "How the app shell is vendored".
- **`node_modules` absent.** Nothing has been installed, so no source has been
  type-checked, bundled, or run. Every "DONE (source)" above means *written and
  hand-reviewed against the canonical APIs*, not *verified*.
- **No test runner.** [`tests/contract.md`](./tests/contract.md) describes the
  assertions and [`tests/fixtures/cosmic-shear.content.json`](./tests/fixtures/cosmic-shear.content.json)
  is the fixture, but no vitest/jsdom harness is wired.
- **`package-lock.json`** listed in `template.yml` `files:` does not exist yet
  (produced by the first `npm install`).

## Open discrepancies (reconcile before shipping)

- **Carrier types: contract vs live build.** The current MySTRA prototype build
  (`../MySTRA/prototype/_build/site/content/index.json`, verified) emits the
  **decision** and **finding** carriers as `heading` nodes — not the `details`
  (decision) and `card` (finding) types CONTRACT.md §1 lists. `renderers.ts`
  currently keys those under `details.astra-decision` and `card.astra-finding`, so
  on the as-shipped build **they would not match** and would fall through to
  `base` (degrading to the stock heading — safe, but not rich). Fix: either update
  the contract + plugin to emit `details`/`card`, or move the two registrations to
  `heading.astra-decision` / `heading.astra-finding`. The renderer bodies are
  type-agnostic (they select on class), so only `renderers.ts` keys change. The
  registry tables emit as `table` and the sub-analysis as `card`, both matching.
  Verified-matching as-shipped: inline `span.astra-ref*`, `container.astra-output`,
  `table.astra-inputs`/`-outputs`, `card.astra-subanalysis`,
  `admonition.astra-prior-insight`.
- **Inputs/outputs carrier nesting.** In the live build the registry `table` may be
  wrapped in a `container[kind=table]`; the `astra-inputs`/`astra-outputs` class
  and the `input-<id>`/`output-<id>` row identifiers are the stable join surface
  (`AstraDataSources` reads rows from the store by id, not from the stock rows).
- **`store.version`** missing (plan §9) — no render-time mismatch detection yet.

## Next steps — to get `myst start` rendering on this theme

1. **Install.** `npm install` at the repo root (resolves the `packages/*`
   workspace + all deps; produces `package-lock.json`). Then `npm run typecheck`
   and fix whatever the first real `tsc` pass surfaces — especially the one or two
   files the agents flagged as unverifiable without `node_modules` (the
   `@myst-theme/site` import surface in `app/root.tsx` and the `usePageMystAst`
   hook name in `AstraStoreProvider.tsx`).
2. **Vendor the book shell.** Add the `prebuild` that materializes
   `@myst-theme/book`'s `app/` (entry files, routes, configs, `server.js`,
   `tsconfig.json`) into place, then overlays our `app/root.tsx` and `app/astra/`
   on top. Confirm `Document`, `getThemeSession`, `getMetaTagsForSite`, and the
   `renderers` export from `@myst-theme/site` match what `root.tsx` imports;
   reconcile that one file if the installed API differs (it is the documented
   single point of friction).
3. **Wire Vite/Remix.** Ensure `vite.config.ts` + `tsconfig.json` resolve the
   `@astra-spec/store-types` workspace path and include `app/astra/**`. `npm run
   build` must produce `build/` (server + client bundles).
4. **Reconcile the carrier-type discrepancy** (above) against the real build, then
   run the prototype: point `../MySTRA/prototype`'s `site.template` at this repo
   and `myst start` (see DEVELOPING.md). Phase 0 exit = it renders ≈ book-theme.
5. **Wire tests.** Add vitest + jsdom + `@testing-library/react`; implement
   `tests/contract.md` groups A–E against the fixture (groups A–B run without React
   and can land first as a cheap CI guard).
6. **Then:** flip on the CSS (Phase 1 visible), confirm the rich renderers/popovers
   (Phase 2), and only then start Phase 3 patterns (needs plugin directive hooks).
