# astra-theme

Rich [MyST](https://mystmd.org/) web themes for
[ASTRA](https://astra-spec.org/) publications.

This repository provides two site templates built on the corresponding
[`myst-theme`](https://github.com/jupyter-book/myst-theme) 1.3.1 themes:

- `themes/article` for a single scrolling publication;
- `themes/book` for a multi-page publication with navigation and search.

Both use the same small ASTRA integration from `packages/astra`. Content that
does not use ASTRA continues through the stock MyST renderers unchanged.

## Runtime architecture

The [`MySTRA`](https://github.com/LightconeResearch/MySTRA) plugin resolves an
ASTRA project at build time and emits readable, neutral MyST nodes. It also
embeds a versioned `astra-publication-bundle.v1` carrier and static resource
links for richer themes.

At render time, the shared overlay:

1. validates and indexes the embedded bundle with
   [`@astra-spec/sdk`](https://www.npmjs.com/package/@astra-spec/sdk);
2. rejoins only resource URLs whose output path and cache token match the SDK
   binding;
3. enriches ASTRA nodes with the published
   [`@astra-spec/ui`](https://www.npmjs.com/package/@astra-spec/ui) previews and
   popovers; and
4. applies the scoped
   [`@lightcone-research/brand`](https://www.npmjs.com/package/@lightcone-research/brand)
   tokens through its ASTRA adapter.

Invalid, unsupported, or incomplete transport data fails locally: the neutral
MyST content remains visible. The browser never reads `astra.yaml`, resolves a
project, guesses an artifact path, or maintains a second ASTRA data model.

The article and book app shells deliberately stay close to upstream. Each has
only two ASTRA-aware source seams: renderer/style registration in `app/root.tsx`
and an `AstraPublicationProvider` around the rendered article surface.

## Local development

Node.js 20 or newer is required.

```bash
npm ci
npm test
npm run typecheck
npm run build
```

To exercise a built checkout from a MyST project:

```yaml
project:
  plugins:
    - /path/to/MySTRA/dist/mystra.mjs
site:
  template: /path/to/astra-theme/themes/article
  # or /path/to/astra-theme/themes/book
```

Then run `myst start` or `myst build --html` in that project. The
`desi-myst-proto` sibling repository is the end-to-end publication fixture used
during development.

Published builds can be selected directly:

```yaml
site:
  template: https://github.com/EiffL/astra-article-theme
  # or https://github.com/EiffL/astra-book-theme
```

## License

The ASTRA overlay and repository configuration are available under the BSD
3-Clause License. The vendored MyST article and book app shells remain under
the upstream MIT License; see [NOTICE](./NOTICE).
