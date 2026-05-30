# astra-theme

**A rich [MyST](https://mystmd.org/) web theme for [ASTRA](https://github.com/LightconeResearch/ASTRA) analyses.**

`astra-theme` is the presentation half of a pair. You author an ASTRA report with
the [`@astra-spec/mystra`](https://github.com/LightconeResearch/MySTRA) plugin —
Markdown that imports and cites ASTRA components by reference — and that document
renders cleanly on any stock MyST theme. Switch the theme to `astra-theme` and
the same document gains the **rich** experience: glyph-tagged inline references
with hover preview cards, decision/finding/output treatments, live-value
provenance, and author-placed dependency graphs.

```yaml
site:
  template: astra-theme    # one line; nothing else changes
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
  ASTRA logic and reads only the build output.

The interface between them — classes, identifiers, and the store shape — is the
only coupling, and it's specified and versioned.

## Status

🚧 **Planning.** No theme code yet. Start here:

- **[IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)** — architecture, the
  separation of concerns, the MyST renderer mechanism we build on, phasing
  (light CSS → rich React renderers → patterns), and the dev/distribution loop.
- **[CONTRACT.md](./CONTRACT.md)** — the exact plugin↔theme interface: every
  emitted class, identifier, inline token, and the resolved-store shape.

## License

BSD 3-Clause
