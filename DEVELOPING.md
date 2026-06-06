# Developing astra-theme

The build, dev, and distribution loop for the theme. For *what* the theme does
and *why* the plugin/theme split exists, read [`CONTRACT.md`](./CONTRACT.md); for
*how the pieces wire up* read [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## What this repo is

A standalone MyST **site template** — a [Remix](https://remix.run) application
(classic compiler, React 19) that is a **fork of `@myst-theme/book`**. It depends
on the published `@myst-theme/*` packages and carries book-theme's MIT app shell
(`app/root.tsx`, `app/entry.*`, `app/routes/`, `app/components/`, `app/utils/`,
`styles/app.css`, Remix/Tailwind config). The **only** ASTRA-specific code is:

- [`app/astra/`](./app/astra) — the renderers, store provider/hooks, card
  primitives, and the `ASTRA_RENDERERS` map.
- [`styles/astra.css`](./styles/astra.css) — the Vellum design system.
- [`packages/store-types`](./packages/store-types) — the `ResolvedStore` contract
  mirror (a workspace package).

The book-theme shell is integrated by **three small edits** (see ARCHITECTURE.md):
`app/root.tsx` adds `ASTRA_RENDERERS` to `mergeRenderers([...])` and links
`astra.css`; `app/components/ArticlePage.tsx` wraps the page render in
`<AstraStoreProvider>`.

## Prerequisites

- Node ≥ 18, npm. (Upstream book-theme uses `bun`; we use npm — see Gotchas.)
- For the example: the sibling [`MySTRA`](https://github.com/LightconeResearch/MySTRA)
  plugin built (`npm install && npm run build` there → `dist/index.js`).

## Build

```bash
npm install          # installs deps + applies patches (postinstall: patch-package)
npm run build        # prod:copy → build:thebe → build:css → remix build
```

`npm run build` produces the runnable theme server:

- `build/index.js` — the compiled Remix server bundle (CJS; `server.js` requires it).
- `public/build/` — fingerprinted client assets (incl. the bundled `astra.css`).
- `public/*.thebe-core.min.js` — Jupyter/thebe runtime assets (live compute).
- `app/styles/app.css` — Tailwind output (`styles/app.css` is the source).

`server.js` is a small Express server (`node ./server.js`) that serves `build/`
+ `public/` — this is what `myst start` runs via `build.start`.

Useful scripts: `npm run typecheck`, `npm test`, `npm run clean`.

## Run the example

```bash
cd examples/desi-dr1
myst start                 # template: ../.. points at this repo
```

See [`examples/desi-dr1/README.md`](./examples/desi-dr1/README.md). MyST runs the
template's `build.install` (`npm ci --ignore-scripts`) then `build.start`
(`node server.js`), passing `PORT` / `CONTENT_CDN_PORT` / `MODE` in the env, and
serves the theme against its content server.

## Fast theme iteration

Editing `app/astra/**` or `styles/astra.css` requires a rebuild (`npm run build`)
and a theme-server restart. (`npm run dev` runs the Remix dev server with CSS
watch for hot reload against a running content server — point a project's content
server at it via `CONTENT_CDN_PORT`.)

## Distribution

Publish like book-theme: the built bundle is `template.yml` + `server.js` +
`package.json` + `package-lock.json` + `build/**` + `public/**` (the `files:` glob
in `template.yml`). Ship it to a git URL / zip, or register `astra-theme` in the
[`myst-templates`](https://github.com/myst-templates) registry. Once registered,
users write `template: astra-theme` with no setup. Tag releases against a
compatible `@astra-spec/mystra` plugin range (the contract is the compatibility
surface — see CONTRACT.md §6).

## Gotchas (and why the config looks the way it does)

- **npm over bun.** Upstream uses bun; the scripts here are npm equivalents
  (`prod:copy`, `build:css`, `build:thebe`, `remix build`). `node server.js`
  (Express) is the production server, not the Vercel handler in the upstream
  source `server.js`.
- **Single React via `overrides`.** jupyterlab/thebe deps pull React 18; without
  the `overrides` block in `package.json` forcing React 19 everywhere, multiple
  React copies get bundled into the server build and SSR throws
  *"Cannot read properties of null (reading 'useState')"*. Mirrors upstream.
- **`legacy-peer-deps` (`.npmrc`).** The `@myst-theme/*` packages declare React
  16–18 peer ranges but ship/run on React 19; npm's strict resolver rejects that,
  so `.npmrc` sets `legacy-peer-deps=true` (bun is lenient). Applies to
  `npm install` here and `npm ci` under `myst start`.
- **`patch-package`.** `patches/@jupyter-widgets+controls+5.0.12.patch` comments
  out two non-CSS `@import`s in `widgets-base.css` that the Remix/esbuild CSS
  pipeline can't bundle (the same patch upstream applies). Run by the
  `postinstall` hook. (`build.install` uses `--ignore-scripts` since the shipped
  bundle is prebuilt and doesn't need patching at serve time.)
- **`npm run typecheck` and upstream dep source.** The `@myst-theme/*` packages
  ship TypeScript **source** and point `types` at `./src/*` (not built `.d.ts`), so
  `tsc` type-checks their source too. Under React 19 types this surfaces a few
  diagnostics inside `@myst-theme/site` (a `lodash.throttle` missing-types note and
  two `RefObject<T | null>` ref-type mismatches in `DocumentOutline.tsx`) that we
  can't fix without editing a dependency. **Our** code (`app/astra/**`, `packages/`,
  the forked shell) is typecheck-clean, and the esbuild-based `remix build`,
  the test suite, and the runtime are all unaffected.
- **Selector syntax.** `ASTRA_RENDERERS` keys use `type[class*="astra-…"]`
  **substring** attribute selectors — NOT `.class` (which `unist-util-select`
  rejects) and NOT `[class~="…"]` (which treats the multi-class `class` string as
  one token and fails to match `"astra-ref astra-ref--decision"`). See
  `app/astra/renderers.ts`.
