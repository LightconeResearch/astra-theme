# ASTRA styles — the Vellum design system

`astra.css` is the entire presentation layer for the `@astra-spec/mystra` plugin.
The plugin emits **neutral** MyST AST decorated only with `astra-*` classes,
`<kind>-<id>` identifiers, and one hidden store carrier. **All** appearance —
colour, glyph, layout, the card chrome and diagrams — lives in this file and the
renderers that emit these classes. Nothing here re-implements ASTRA semantics.

Vellum is editorial and narrative-first: warm parchment, serif prose at a fixed
measure, hairline rules instead of heavy borders, one restrained teal accent for
"this work", and a desaturated per-kind accent for each object kind. Every shape
is system-drawn (border / radius / pseudo-element) — no images.

## Tokens (`:root`, all prefixed `--astra-`)

| Token | Value | Role |
|---|---|---|
| `--astra-paper` | `#FBF8F1` | page background (parchment) |
| `--astra-surface` | `#FFFFFF` | card / panel surface |
| `--astra-surface-2` | `#FCFAF5` | inset / recessed surface |
| `--astra-ink` | `#211C16` | primary text |
| `--astra-ink-soft` | `#4C463D` | secondary text |
| `--astra-muted` | `#8C8576` | labels, meta, captions |
| `--astra-faint` | `#B7AF9F` | dividers in text, hollow dots |
| `--astra-rule` | `#E7E0D2` | hairline rules / borders |
| `--astra-rule-strong` | `#D8CFBD` | stronger rules / table heads |
| `--astra-accent` | `#1F726B` | teal "this work" accent |
| `--astra-accent-soft` | `#E2EFED` | accent wash / hover hotspot |
| `--astra-c-decision` | `#9A7B2E` | decision kind accent (gold) |
| `--astra-c-finding` | `#2E7D5B` | finding kind accent (green) |
| `--astra-c-insight` | `#3A6EA5` | prior-insight accent (blue) |
| `--astra-c-analysis` | `#1F726B` | sub-analysis accent (teal) |
| `--astra-c-output` | `#6B5B95` | output accent (violet) |
| `--astra-c-value` | `#1F726B` | value token accent (teal) |
| `--astra-measure` | `42rem` | prose column width |
| `--astra-serif` | EB Garamond … | prose + titles |
| `--astra-sans` | Inter … | labels, meta, UI |
| `--astra-mono` | JetBrains Mono … | ids, recipes, flow nodes |
| `--astra-card-w` | `25rem` | preview/placed card width |
| `--astra-radius` | `10px` | card/panel radius |
| `--astra-shadow` | soft warm | card elevation |
| `--astra-kind` | `var(--astra-accent)` | the in-scope kind accent; set by `--<kind>` modifiers and consumed by glyphs/diagrams |

Two private helper vars are set per kind and consumed by `::before` pseudo-elements:
`--astra-glyph` (the kind glyph codepoint) and `--astra-kind` (the kind colour).

### Kind glyphs

| Kind | Glyph | Accent |
|---|---|---|
| decision | `◇` U+25C7 | gold |
| prior_insight | `◈` U+25C8 | blue |
| finding | `●` U+25CF | green |
| analysis / subanalysis | `◐` U+25D0 | teal |
| output | `◆` U+25C6 | violet |
| value | _(none)_ | teal |

A **dark-mode** block (`prefers-color-scheme: dark`) re-maps the tokens only:
paper → warm near-black, ink → warm off-white, accents brightened. No structural
rules are duplicated.

## Class catalog

Renderers and the preview card MUST emit these; this file styles them.

| Class | Group | Purpose |
|---|---|---|
| `.astra-doc` | page | prose wrapper: parchment bg, serif, measure |
| `.astra-rail` / `.astra-rail__mark` | page | fixed 56px left rail + vertical serif wordmark |
| `.astra-breadcrumb` | page | uppercase sans crumb trail (`/` separators) |
| `.astra-doc-title` | page | document title (serif display) |
| `.astra-doc-meta` | page | author/date meta row |
| `.astra-section-label` | page/card | uppercase sans kicker |
| `.astra-rule` | page | hairline `<hr>` |
| `.astra-ref` | inline | reference token: dotted underline, glyph `::before`, hover hotspot |
| `.astra-ref--decision/--finding/--prior_insight/--analysis/--output` | inline | per-kind glyph + colour |
| `.astra-ref--value` | inline | computed number; tabular-nums, dotted underline, no glyph |
| `.astra-card` | card | floating/placed card shell (width, rule, radius, shadow) |
| `.astra-card__kind` | card | glyph + KIND label, coloured per kind |
| `.astra-card__title` | card | serif ~20px title |
| `.astra-card__desc` | card | description body |
| `.astra-card__section` | card | section label inside a card |
| `.astra-card__meta` | card | muted footer (mono id, provenance) |
| `.astra-card--<kind>` | card | sets `--astra-kind`/`--astra-glyph` |
| `.astra-flow` / `__node` / `__node--accent` / `__arrow` | diagram | data flow: mono boxes joined by `▸` |
| `.astra-prov` / `__node` / `__node--artifact` / `__label` | diagram | provenance graph: dotted nodes + connectors |
| `.astra-posterior` / `__field` / `__ring--1..3` / `__point` / `__axis--x/--y` / `__legend` | diagram | decision posterior contour sketch (nested ellipses, selected option emphasised) |
| `.astra-decision` | block | decision panel (accent left-rule, `details`) |
| `.astra-decision__toggle` | block | segmented narrative \| options switch |
| `.astra-decision__title` / `__rationale` | block | decision title + rationale |
| `.astra-options` / `.astra-option` | block | options list |
| `.astra-option--selected` | block | chosen option: filled dot, accent wash |
| `.astra-option--excluded` | block | excluded option: muted, struck label |
| `.astra-option__label/__note/__reason/__backed` | block | option label, note, excluded reason, backing insight |
| `.astra-output` | block | output wrapper |
| `.astra-output__caption` / `__num` | block | output caption + number |
| `.astra-output__provenance` | block | `details` drawer: inputs → recipe → artifact |
| `.astra-output__recipe` | block | mono recipe box |
| `.astra-metric` / `__value` / `__unit` / `__uncertainty` / `__label` | block | big metric stat (± uncertainty) |
| `.astra-finding` | block | finding card (accent left-rule) |
| `.astra-finding__kind` / `__claim` / `__notes` | block | finding kind label, claim, notes |
| `.astra-scope-chip` | block | universe-scope pill |
| `.astra-prior-insight` | block | prior-insight card (seealso admonition) |
| `.astra-prior-insight__kind` | block | insight kind label |
| `.astra-insight__claim` | block | insight claim |
| `.astra-cite` | block | DOI / citation chrome |
| `.astra-quote` | block | exact quote (serif italic, ruled) |
| `.astra-inputs` / `.astra-outputs` | table | editorial registry tables |
| `.astra-id` | table/card | mono identifier |
| `.astra-type-glyph` / `--figure/--table/--metric/--input` | table | per-type glyph |
| `.astra-subanalysis` | block | sub-analysis nav card |
| `.astra-subanalysis__kind/__name/__summary/__counts` | block | nav card parts (`N decisions · N outputs`) |
| `.astra-preview` / `__arrow` | popover | floating-ui preview wrapper + arrow |

## Notes for other agents

- The kind accent is plumbed through a single cascading variable, `--astra-kind`,
  plus `--astra-glyph`. Setting a `.astra-card--decision` (or `.astra-decision`,
  `.astra-finding`, …) modifier recolours the kind label, glyph, and every
  diagram inside it automatically. New kind-scoped components should set those two
  vars rather than hard-coding a colour.
- Hover/open state on inline refs is keyed on `:hover` and `[data-open="true"]`;
  the preview card may also set `[hidden]` on `.astra-preview`.
- Decision toggle active state is read from `[aria-selected="true"]` or
  `.is-active` — emit either.
- `color-mix()` is used for tints; if a target browser lacks it the affected
  fills fall back to transparent (still legible).
