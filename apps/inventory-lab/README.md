# ASTRA inventory lab

This app is the isolated product/design preview for the ASTRA inventory viewer.
It runs entirely from the checked-in frozen DESI fixture under `public/fixtures/`
and does not require MySTRA, a MyST content server, or the DESI repository at
runtime.

From the `astra-theme` repository:

```bash
npm run dev:inventory
npm run build:inventory
```

The app owns preview-only material:

- frozen fixture JSON and local artifact previews;
- DESI frontmatter and paper metadata;
- labels or mappings introduced only to make the fixture readable; and
- the visible frozen-preview notice.

Reusable layout, inventory interactions, and styling live in
`packages/astra/`. `InventorySnapshot` is the preview's UI-facing view model; it
is not a proposed MySTRA serialization contract.

## Refreshing the fixture

Refresh only when deliberately updating the design fixture, after generating
the DESI MyST build artifacts in the sibling checkout:

```bash
npm run snapshot:desi -w apps/inventory-lab
```

The refresh script is an offline fixture-authoring aid. It may use shortcuts
that are unsuitable for production and must not become a browser runtime path
or a theme-side ASTRA parser. Review the resulting JSON for local filesystem
paths and other sensitive material before publishing a preview.

Product requirements and the proposed eventual ASTRA/MySTRA integration live in
the canonical Linear project, **ASTRA Analysis Dashboard**. The workspace
`ASTRA_UI_BRIEF.md` is only its local implementation and handoff companion.
