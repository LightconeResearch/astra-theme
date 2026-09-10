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

## Embedding in MySTRA Viewer

The article and book production servers support the optional
`mystra-viewer.v1` transport contract. A host starts the normal `myst start`
command with these environment variables:

```text
MYSTRA_BASE_URL=/user/alice/jupyterlab_lightcone/mystra/SESSION/site
MYSTRA_CONTENT_URL=/user/alice/jupyterlab_lightcone/mystra/SESSION/content
MYSTRA_RELOAD_URL=/user/alice/jupyterlab_lightcone/mystra/SESSION/socket
```

These are public URL paths, without trailing slashes. They deliberately use
separate names because current MyST CLI startup replaces `BASE_URL`. Server-side
content requests keep using the internal `CONTENT_CDN`/`CONTENT_CDN_PORT`.

Forward site requests **with their full public path**, content requests with
the public content prefix removed, and the public WebSocket URL to the content
server's `/socket`. `GET MYSTRA_BASE_URL/mystra-capabilities` returns
`{"protocol":"mystra-viewer.v1","baseUrl":"..."}` for host readiness checks.
The host supplies authentication, resource authorization and an appropriate
iframe policy; the Node servers should listen on loopback.

The production server mounts the same literal prefix in the server and browser
Remix route manifests. A standard browser import map redirects compiled module
imports to that prefix; application JavaScript is served unchanged. Compiled CSS
font and image URLs receive the same prefix when served. Theme CSS,
content resources, ASTRA navigation and reload connections use the public URLs.
Embedded appearance preferences use local storage, avoiding the stock theme's
root-only cookie API. The existing `@myst-theme/site` patch exposes that small
Document option; no framework upgrade is required.

Without these variables, standalone `myst start` and static export retain their
normal startup behavior. This feature targets live embedding, not a general
repair of upstream static-export routing. Browser support for import maps is
required (current Chromium, Firefox and Safari).

Shared ASTRA rendering follows the article inline/popover reference through
`@astra-spec/ui` and `@lightcone-research/brand`. The theme owns MyST rendering,
article layout and artifact/citation adapters; shared typography, colours, glyphs
and preview geometry live upstream. Inventory and record dialogs mount outside
article prose, with an explicit branded `astra-isolate` boundary. Serif fonts, including
Newsreader italic, are bundled by the brand package; identifiers use its existing
monospace stack.

`@astra-spec/ui` and `@lightcone-research/brand` are installed from npm at exact
versions rather than caret ranges: the rendering contract is shared with the
JupyterLab and VS Code hosts, so the three move together on a deliberate bump.
See `packages/astra/package.json` for the versions in force.
