# astra-theme

MyST site themes for publications backed by
[ASTRA](https://github.com/LightconeResearch/ASTRA) analyses.

The repository ships two templates that stay intentionally close to their
[`jupyter-book/myst-theme`](https://github.com/jupyter-book/myst-theme)
counterparts:

- `themes/book` adds ASTRA records to the upstream multi-page book theme.
- `themes/article` adds the same integration to the upstream article theme.
- `packages/astra` is the shared, self-contained integration layer.

## Architecture

The build and presentation boundaries are deliberately narrow:

1. [`@astra-spec/mystra`](https://github.com/LightconeResearch/MySTRA) resolves
   the project with `@astra-spec/sdk` and embeds a versioned, serializable
   publication bundle in the page AST.
2. `packages/astra` reads that carrier, derives the SDK index, and rejoins
   MyST-rewritten static artifact URLs.
3. Canonical inline references open `@astra-spec/ui` record dialogs. The
   Lightcone brand package supplies the UI tokens and fonts.
4. ASTRA block carriers retain their readable MyST children and use upstream
   renderers. This avoids duplicating MyST component markup in this repository.

The only changes required in each upstream app shell are the existing renderer
merge and stylesheet import in `app/root.tsx`, plus one
`AstraPublicationProvider` around the rendered article parts. ASTRA-specific
logic belongs in `packages/astra`, not in copied upstream files.

The MySTRA carrier contract consumed here is:

- `div.astra-publication-bundle` with
  `data.astraPublication = { schemaVersion, activeAnalysisPath, bundle }`, where
  `bundle` is an SDK `ResolvedAnalysisBundle`;
- `div.astra-publication-resources` containing static link nodes whose
  `data.astraArtifact` identifies an output path and cache token; and
- inline `astra-ref` nodes carrying `data.astra.canonicalPath` for record
  dialogs, or `data.astra.analysisPath` and `data.astra.href` for mapped
  analysis-page links.

Unsupported or malformed carrier data falls back to the neutral MyST rendering.

## Development

Node.js 20 or newer is required.

```bash
npm install
npm test
npm run typecheck
npm run build
```

Build one template while iterating with `npm run build:book` or
`npm run build:article`. Generated output lives below `themes/*/build` and
`themes/*/public`.

To use a built local checkout:

```yaml
site:
  template: /path/to/astra-theme/themes/book
```

Published builds are available from the
[`astra-book-theme`](https://github.com/EiffL/astra-book-theme) and
[`astra-article-theme`](https://github.com/EiffL/astra-article-theme)
repositories.

## Upstream maintenance

When updating MyST, compare `themes/book` and `themes/article` with the matching
upstream version first. Keep upstream fixes verbatim wherever possible and
reapply the small ASTRA seams afterwards. Avoid local forks of
`@myst-theme/site` components; add shared behavior to `packages/astra` instead.

## License

The ASTRA integration is BSD 3-Clause. The copied MyST app shells remain under
their upstream MIT license; see [NOTICE](./NOTICE).
