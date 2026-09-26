# astra-theme

Rich [MyST](https://mystmd.org/) web themes for
[ASTRA](https://astra-spec.org/) publications, in two flavors built on
[`myst-theme`](https://github.com/jupyter-book/myst-theme) 1.3.1:

- **article** (`themes/article`): a single scrolling publication;
- **book** (`themes/book`): multi-page, with navigation and search.

Both share one ASTRA overlay (`packages/astra`). Content that does not use
ASTRA renders exactly as in the stock MyST themes.

## Usage

Pair the theme with the [MySTRA](https://github.com/LightconeResearch/MySTRA)
plugin in `myst.yml`:

```yaml
site:
  template: https://github.com/LightconeResearch/astra-article-theme.git
  # or https://github.com/LightconeResearch/astra-book-theme.git
```

Keep the `.git` suffix: MyST reads any other non-zip URL as a template-index
link. To pin a release, use its archive, e.g.
`https://github.com/LightconeResearch/astra-article-theme/archive/refs/tags/v0.0.15.zip`.

## What it adds

MySTRA resolves the ASTRA project at build time and embeds a versioned
publication bundle in the MyST output. The theme validates that bundle with
[`@astra-spec/sdk`](https://www.npmjs.com/package/@astra-spec/sdk) and adds:

- inline references, hover previews and record dialogs from
  [`@astra-spec/ui`](https://www.npmjs.com/package/@astra-spec/ui);
- an **ASTRA Inventory** view of the page's analysis, also reachable at
  `#astra-inventory`;
- in-place reading of cited arXiv papers (DOIs `10.48550/arXiv.<id>`) with
  pdf.js, falling back to the DOI link;
- Lightcone styling from
  [`@lightcone-research/brand`](https://www.npmjs.com/package/@lightcone-research/brand).

If the bundle is missing or invalid, the plain MyST content still renders.
`@astra-spec/ui` and the brand package are pinned to exact versions because the
JupyterLab and VS Code hosts share the same rendering contract.

## Development

Requires Node.js 20+.

```bash
npm ci
npm test
npm run typecheck
npm run build        # or build:article / build:book
```

To try a local build, point a MyST project at the checkout
([`desi-myst-proto`](https://github.com/LightconeResearch/desi-myst-proto) is
the reference fixture), then run `myst start`:

```yaml
project:
  plugins:
    - /path/to/MySTRA/dist/mystra.mjs
site:
  template: /path/to/astra-theme/themes/article
```

**Releasing:** push a `vX.Y.Z` tag. CI builds both themes, publishes them to
the deploy repos above, attaches zips to a GitHub Release and bumps the version
on `main` (see `.github/workflows/publish-theme.yml`).

## Embedding in MySTRA Viewer

The production servers support the optional `mystra-viewer.v1` contract for
serving a live site under a proxied path. Start `myst start` with all three
variables set (public paths, no trailing slash):

```text
MYSTRA_BASE_URL=/user/alice/jupyterlab_lightcone/mystra/SESSION/site
MYSTRA_CONTENT_URL=/user/alice/jupyterlab_lightcone/mystra/SESSION/content
MYSTRA_RELOAD_URL=/user/alice/jupyterlab_lightcone/mystra/SESSION/socket
```

The host must:

- forward site requests with their full public path, and content requests with
  the content prefix removed;
- forward the reload WebSocket to the content server's `/socket`;
- relay `X-Remix-*` response headers (they carry redirects and errors during
  client navigation);
- handle authentication and iframe policy, with the Node servers on loopback.

`GET $MYSTRA_BASE_URL/mystra-capabilities` answers
`{"protocol":"mystra-viewer.v1","baseUrl":"..."}` for readiness checks.
Without these variables, `myst start` and static export behave normally.

## License

BSD 3-Clause for the ASTRA overlay and repository configuration; the vendored
MyST app shells remain MIT. See [NOTICE](./NOTICE).
