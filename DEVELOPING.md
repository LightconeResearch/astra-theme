# Developing astra-theme

The dev, build, and distribution loop for the theme. For *what* the theme does
and *why* the split exists, read [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md)
and the [`CONTRACT.md`](./CONTRACT.md).

## How the app shell is vendored

This repo is an **overlay** on the stock MyST book theme, not a fork. We depend
on the published `@myst-theme/*` packages and vendor the book theme's Remix app
shell (`entry.client.tsx`, `entry.server.tsx`, the `routes/`, `vite.config.ts`,
`server.js`, Tailwind/PostCSS config) at build time. The **only** ASTRA-aware
files we own live under [`app/`](./app):

- [`app/root.tsx`](./app/root.tsx) — overlays the book-theme root: merges
  `ASTRA_RENDERERS` over the default renderer stack, wraps the document in
  `<AstraStoreProvider>`, and imports `styles/astra.css`.
- [`app/astra/`](./app/astra) — the renderers map, the store provider/hooks, the
  card primitives, and one component per contract element.
- [`styles/astra.css`](./styles/astra.css) — the Vellum design system.

The vendoring step (a small `prebuild` that materializes the book theme's app
files we don't override, then drops our `app/` on top) is wired in CI/distribution
tooling; locally, `npm install` pulls `@myst-theme/book`, and our `app/root.tsx`
is the entry the Vite/Remix config compiles.

## The dev loop (against a real ASTRA project)

The end-to-end path — build content with the plugin, render it with this theme:

1. Point an ASTRA project's site template at this repo. In the project's
   `myst.yml`:

   ```yaml
   site:
     template: /absolute/path/to/astra-theme    # local path while developing
   ```

   (You can also use a git URL or a registered template name once published.)

2. Run the engine from the project directory:

   ```bash
   myst start
   ```

   The engine builds the project content (running the `@astra-spec/mystra`
   plugin → neutral AST + `astra-*` classes + the resolved-store carrier),
   serves the content JSON, runs this template's `build.install` (`npm ci`) and
   `build.start` (`npm run start`), and opens the rendered site.

The MySTRA prototype at `../MySTRA/prototype` is the canonical test project — its
`index.md` exercises the full vocabulary. Phase 0's exit criterion is: that
prototype renders on `template: astra-theme`, visually ≈ book-theme, with zero
ASTRA styling — proving the theme runs and consumes content.

## Fast theme HMR (against a running content server)

`myst start` re-launching the theme on every change is slow. For tight feedback
on the **theme** itself, run a content server once and point the theme's own
Vite/Remix dev server at it. The engine hands the theme three environment
variables on `build.start`; the same wiring works for the dev server:

| Variable | Meaning |
|---|---|
| `PORT` | port the theme server listens on |
| `CONTENT_CDN_PORT` | port of the running MyST content server (where `/content/<slug>.json` and `config.json` are served) |
| `MODE` | `static` or `app` — rendering mode the engine requests |

Typical fast loop:

```bash
# Terminal 1 — content only, from the ASTRA project dir; note the CDN port it prints.
myst start --headless

# Terminal 2 — the theme dev server with HMR, pointed at that content server.
CONTENT_CDN_PORT=3100 PORT=3000 MODE=app npm run dev
```

Now edits under `app/astra/**` and `styles/astra.css` hot-reload without
rebuilding content. Re-run the content server only when the source Markdown or
`astra.yaml` changes.

## Build & distribution

```bash
npm run build       # remix vite:build → build/ (server + client bundles)
npm run typecheck   # tsc --noEmit against the whole overlay + store-types
npm run start       # node ./server.js — serve a production build locally
```

A distributable template bundle is exactly the files listed in
[`template.yml`](./template.yml)'s `files:` block:

- `template.yml`, `server.js`, `package.json`, `package-lock.json`
- `build/**/*` (compiled app), `public/**/*` (static assets), `styles/**/*`

Publish that bundle to a stable git tag or zip URL (and optionally register it in
the [`myst-templates`](https://github.com/myst-templates/templates) index with
`kind: site`). Tag each release against a supported `@astra-spec/mystra` plugin
range — the [contract](./CONTRACT.md) is the compatibility surface.

## Shared types

`@astra-spec/store-types` (in [`packages/store-types`](./packages/store-types)) is
a workspace package mirroring the plugin's `ResolvedStore` shape. It is the typed
contract both the plugin and theme import; keep it in lock-step with the plugin's
`src/transform/resolved-store.ts`. `npm run typecheck` validates the overlay
against it.
