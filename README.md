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
   popovers;
4. reads cited arXiv papers in place: an evidence DOI of the form
   `10.48550/arXiv.<id>` names a PDF that `arxiv.org` serves with a permissive
   CORS policy, so the record dialog streams it through pdf.js and locates the
   quoted passage, naming the paper by the citation MyST resolved for its DOI.
   Any other DOI, or a PDF that fails to load, falls back to the DOI link. The
   pdf.js runtime is copied into each theme's `public/pdfjs/` at build time and
   imported by URL, never bundled; and
5. applies the scoped
   [`@lightcone-research/brand`](https://www.npmjs.com/package/@lightcone-research/brand)
   tokens through its ASTRA adapter.

Invalid, unsupported, or incomplete transport data fails locally: the neutral
MyST content remains visible. The browser never reads `astra.yaml`, resolves a
project, guesses an artifact path, or maintains a second ASTRA data model.

The article and book app shells deliberately stay close to upstream. Each
registers the shared renderers and styles in `app/root.tsx`, wraps its article
surface in `AstraPublicationProvider`, and places an inventory entry in its
existing controls.

Pages containing an ASTRA publication include an inventory entry. The article
lists **✨ ASTRA Inventory** below other **Supporting Documents**; the book uses
a gold sparkle icon beside its download control. Both open the current page's
analysis, including the matching sub-analysis on supporting pages, with figure
previews, record details, and cited papers. The close icon returns to the reading
page without remounting its content. Links ending in `#astra-inventory`
(or a section such as `#astra-inventory-decisions`) open the same view directly;
browser Back and Forward also switch between reading and inventory. Pages
without a publication keep their usual navigation.

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

Shared ASTRA rendering follows the article inline/popover reference through
`@astra-spec/ui` and `@lightcone-research/brand`. The theme owns MyST rendering,
article layout and artifact/citation adapters; shared typography, colours, glyphs
and preview geometry live upstream. Inventory and record dialogs mount outside
article prose, with an explicit branded `astra-isolate` boundary. Fonts, including
italics and monospace, are bundled by the brand package.

This rendering migration is coordinated with [Astra UI #20](https://github.com/LightconeResearch/astra-ui/pull/20)
and [brand #3](https://github.com/LightconeResearch/brand/pull/3). The review branch
pins immutable preview dependencies; installing the private brand commit requires
repository access. Publish UI and brand, then replace both preview pins with the
released package versions and regenerate the lockfile before merging this branch.
