# Contract tests

The cross-repo guard from [`IMPLEMENTATION-PLAN.md`](../IMPLEMENTATION-PLAN.md) §8.
These tests assert the plugin↔theme interface ([`CONTRACT.md`](../CONTRACT.md)) holds
from the **theme's** side: given a page `content/<slug>.json`, the theme can find the
store, recognize every decorated node, join it to the store by id, and degrade
gracefully when an entry is missing.

The fixture is [`fixtures/cosmic-shear.content.json`](./fixtures/cosmic-shear.content.json)
— a minimal MyST page JSON (same shape as a real `_build/site/content/<slug>.json`)
carrying the `astra-store` carrier plus a handful of decorated nodes, including two
**intentional orphans** (a `span.astra-ref--analysis` and a `container.astra-output`
whose ids are NOT in the store) so the fallback path is exercised.

No runner is wired yet (see [`STATUS.md`](../STATUS.md) — the Remix shell is not
vendored). These are the assertions to implement once a test runner (vitest +
jsdom + `@testing-library/react`) is in place. They split into three groups:
pure AST/contract checks (no React, runnable today against the JSON), store-join
checks (exercise `app/astra/store/useAstraStore.ts` helpers), and renderer
checks (mount each `Astra*` component).

## A. Carrier & store shape (pure JSON — runnable now)

1. **Carrier present.** Exactly one node in `mdast` has `identifier === "astra-store"`;
   it has `type === "div"`, `class` contains `astra-store`, and `style.display === "none"`.
2. **Store is a `ResolvedStore`.** `carrier.data.astra` has all seven keys
   (`analysis`, `outputs`, `inputs`, `decisions`, `findings`, `prior_insights`,
   `subanalyses`); each table is an object keyed by id; `analysis.slug` is a string.
3. **Entries are resolved, not raw.** Spot-check field presence against
   `@astra-spec/store-types`: `decisions.cov_source.selected` is an **option id**
   present in `decisions.cov_source.options`; `outputs.sigma8_metric.metric.value`
   is a number; `subanalyses.calibration.url` starts with `/`.

## B. Decorated-node markers (pure JSON — runnable now)

Walk the mdast and assert the exact strings from the contract (select on these,
do not fuzzy-match):

4. **Inline tokens** are `span` nodes whose `class` matches `astra-ref` and
   `astra-ref--<kind>`, with `data.astra.kind` ∈
   `decision | output | finding | prior_insight | analysis | value` and a string
   `data.astra.id`. The value token additionally carries `astra-ref--<subtype>`
   (here `astra-ref--metric`) and `data.astra.{col,filter,type}`.
5. **Naming subtleties hold.** Any prior-insight inline ref uses class
   `astra-ref--prior_insight` (underscore); a sub-analysis ref uses
   `astra-ref--analysis`. Block carriers (when present) follow the same split:
   class `astra-prior-insight` ↔ identifier `prior_insight-<id>`; class
   `astra-subanalysis` ↔ identifier `analysis-<id>`.
6. **Block carriers** carry an `astra-<kind>` class and an `<prefix>-<id>`
   identifier whose prefix maps to a store table via `PREFIX_TO_TABLE`
   (`output-shear_plot` → `outputs`, `decision-cov_source` → `decisions`,
   `input-shear_catalog` on the table row → `inputs`).

## C. The join (exercise `useAstraStore.ts` helpers — no React tree needed)

These call the pure helpers directly with the store from the fixture:

7. **`parseCarrierId`** splits each fixture identifier correctly, respecting the
   subtleties: `parseCarrierId("output-shear_plot") → {prefix:"output", id:"shear_plot"}`,
   `parseCarrierId("decision-cov_source") → {prefix:"decision", id:"cov_source"}`,
   and (regression for the underscore/hyphen cases)
   `parseCarrierId("prior_insight-kids_s8_low").prefix === "prior_insight"`,
   `parseCarrierId("analysis-calibration").prefix === "analysis"` → table `subanalyses`.
   Ids containing hyphens survive intact.
8. **Inline join.** For each inline ref, `KIND_TO_TABLE[kind]` then
   `store[table][id]` returns the expected entry; `value`'s kind resolves through
   the `outputs` table to `sigma8_metric`.
9. **Block join.** `useEntryByIdentifier("output-shear_plot")` (via the same
   prefix→table logic) returns `outputs.shear_plot`.

## D. Graceful fallback (the load-bearing invariant)

10. **Missing entry → `undefined`, never throw.** The fixture's orphans
    (`data.astra.id === "MISSING_FROM_STORE"` inline; `identifier ===
    "output-NOT_IN_STORE"` block) resolve to `undefined` from
    `useAstraEntry` / `useEntryByIdentifier`. Also assert `undefined` for an
    absent store (drop the carrier) and an unknown prefix.
11. **Renderer fallback.** Mounting each `Astra*` component on its orphan node
    renders the node's **own children** (the orphan output renders its stock
    `image`; the orphan analysis ref renders its plain label span) and does **not**
    throw. This is the strict-additivity invariant from CONTRACT.md §5.
12. **`base` passthrough.** A plain `span` / vanilla `container[figure]` with no
    `astra-*` class is NOT matched by any ASTRA selector and falls through to the
    stock `base` renderer (per the `selectRenderer` reverse-match in
    IMPLEMENTATION-PLAN.md §3). Add a non-ASTRA node to the fixture or a sibling
    fixture to assert this.

## E. Selector routing (renderers.ts)

13. For each decorated node, `selectRenderer(RENDERERS, node)` returns the
    expected `Astra*` component (e.g. a `span` carrying both `astra-ref` and
    `astra-ref--value` routes to `AstraValue`, not `AstraInlineRef`, because
    `span.astra-ref--value` is listed last and last-match-wins).

## Known carrier-type discrepancy (verify before asserting on type)

The current MySTRA build (`/home/francois/repo/MySTRA/prototype/_build/site/content/index.json`,
verified) emits the **decision** and **finding** carriers as `heading` nodes, and
the registry tables / sub-analysis as `table` / `card` — whereas CONTRACT.md §1
lists decision as `details + tabSet` and finding as a `card`. The theme selects on
**class first** (`.astra-decision`, `.astra-finding`), so the renderers are
type-tolerant, but `app/astra/renderers.ts` keys them under specific node types
(`details.astra-decision`, `card.astra-finding`). Tests in group **E** should pin
the *real* emitted carrier type; if it is `heading`, the registration must be moved
to `heading.astra-decision` / `heading.astra-finding` (or the entries duplicated).
This fixture uses the **contract-stated** types (`details`, `container`, `table`)
so the contract and the build can be reconciled; add a second fixture mirrored from
the live build to guard the as-shipped types. See STATUS.md “Open discrepancies”.
