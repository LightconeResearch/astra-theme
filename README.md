# astra-theme

**Rich, paper-only [MyST](https://mystmd.org/) web themes for [ASTRA](https://github.com/LightconeResearch/ASTRA) analyses.**

`astra-theme` is the presentation half of a pair. You author an ASTRA report with
the [`@astra-spec/mystra`](https://github.com/LightconeResearch/MySTRA) plugin —
Markdown that imports and cites ASTRA components by reference — and that document
renders cleanly on any stock MyST theme. Switch to one of the astra themes and
the same document gains the **rich** experience: glyph-tagged inline references
with hover preview cards, decision/finding/output treatments, live-value
provenance, and publication result surfaces.

This repo produces **two site templates**, mirroring the upstream
[myst-theme](https://github.com/jupyter-book/myst-theme) pair:

- **`themes/book`** — extends `@myst-theme/book`: multi-page sites with a table
  of contents, top navigation, and search.
- **`themes/article`** — extends `@myst-theme/article`: a single scrolling
  article with supporting notebooks.

Both layer the same ASTRA overlay, [`packages/astra`](./packages/astra).

## Scope

This repository owns publication rendering: article/book layout, prose
typography, citations, inline ASTRA references, and author-placed result
surfaces. It deliberately does **not** own a project inventory, graph explorer,
whole-project payload, JupyterLab integration, or IDE integration. Those
interactive project surfaces belong to `astra-viewer` and its host adapters.

Where a paper and an interactive viewer need the same visual language, the
theme consumes only the host-neutral brand-token export. It never imports the
inventory application, host-aware Jupyter/VS Code mapping, or Jupyter-specific
code. Narrow shared record/result components can be adopted separately once
they have a versioned, publication-safe entry point.

The release-time dependency boundary is deliberately explicit:

```json
{
  "@lightcone-research/astra-viewer-tokens": "^0.1.0"
}
```

Once the token package is published, the themes will load exactly
`@lightcone-research/astra-viewer-tokens/brand.css`, opt the publication wrapper
into `.astra-brand`, and synchronize `data-astra-color-scheme` with MyST's theme
switcher. They do not load the portable host mapping (`theme.css`) or any
inventory/application entry point. This checkout retains the same canonical
variables locally until then, so it remains buildable from a clean install. The
release change is a normal semver dependency and one CSS import—not a `file:`
path, git submodule, or sibling-checkout requirement.

```yaml
site:
  template: astra-book-theme    # one line; nothing else changes
  # or the single-article flavor:
  # template: astra-article-theme
```

## How it fits with the plugin

MyST is two-stage — the **engine** turns source into AST at build time, the
**theme** renders that AST in the browser — and the theme never reads
`astra.yaml`. So the work splits cleanly:

- **`@astra-spec/mystra` (the plugin)** reads `astra.yaml` at build time and
  emits neutral, stock MyST AST decorated with `astra-*` classes, stable
  identifiers, and a fully **resolved data store**. It bakes no presentation.
- **`astra-theme` (this repo)** recognizes those markers, joins them to the
  store, and renders every visual and interactive treatment. It re-implements no
  ASTRA logic and reads only the build output. All of that lives once in
  `packages/astra`; each theme touches it in exactly three places (renderer
  merge + stylesheet in `root.tsx`, the store provider around the article body,
  and the shared template-options hook).

The interface between them — classes, identifiers, and the store shape — is the
only coupling, and it's specified and versioned.

## Quickstart

Each theme is a MyST **site template** (a Remix app). Build once, then point
any ASTRA project at the flavor you want:

```bash
git clone https://github.com/LightconeResearch/astra-theme && cd astra-theme
npm install
npm run build          # both themes → themes/*/build + themes/*/public
# or npm run build:book / npm run build:article
```

In your ASTRA project's `myst.yml`:

```yaml
site:
  template: https://github.com/EiffL/astra-book-theme    # the published builds
  # template: https://github.com/EiffL/astra-article-theme
  # template: /path/to/astra-theme/themes/book           # or a built local checkout
  # template: /path/to/astra-theme/themes/article
```

then `myst start`. A complete worked example lives in
[`examples/desi-dr1/`](./examples/desi-dr1) (the DESI DR1 BAO reproduction) — see
its README to run it locally.

## Status

✅ **Phases 0–2 complete and running.** The themes are standalone forks of the
[`@myst-theme`](https://github.com/jupyter-book/myst-theme) book and article
themes (classic Remix, React 19) built on the published `@myst-theme/*`
packages, with the ASTRA layer compiled in: the `@astra-spec/store-types`
contract mirror, the Vellum design system, the `AstraStoreProvider`, and **all
eight** renderers wired via `mergeRenderers`. `npm run build` produces the theme server; `myst start` renders
the DESI DR1 example end-to-end — inline hover preview cards, the interactive
decision panel (narrative⇄options), output figures with provenance drawers,
finding/insight cards, registry tables, and live value tokens. Phase 3
(author-placed `astra:dag`/`astra:gallery` patterns) needs plugin-side directive
hooks first and is not started.

- **[STATUS.md](./STATUS.md)** — what's implemented per phase and the remaining items.
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — how the pieces connect at runtime,
  the directory tree, and the per-element selector → component → store table map.
- **[DEVELOPING.md](./DEVELOPING.md)** — the build, dev, and distribution loop.
- **[CONTRACT.md](./CONTRACT.md)** — the exact plugin↔theme interface: every
  emitted class, identifier, inline token, and the resolved-store shape.

## License

BSD 3-Clause (this repo's ASTRA code: `packages/astra/`,
`packages/store-types`, configuration, and docs).

astra-theme is built on the MyST theme stack: it depends on the published
`@myst-theme/*` packages and **vendors the MIT-licensed app shells** of the
[`@myst-theme`](https://github.com/jupyter-book/myst-theme) book and article
themes (each theme's Remix `app/`, `styles/`, and Remix/Tailwind config, plus
`server.js`). Those files retain their MIT license — see [`NOTICE`](./NOTICE).
