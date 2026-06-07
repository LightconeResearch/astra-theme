---
name: design-mirror
description: Operate the Lightcone design-mirror workflow between this theme's code and its Figma mirror file. Use when asked to review design proposals, re-sync the Figma mirror after token/component changes, or inspect the mirror. Triggers - "review proposals", "review the proposals page", "sync the mirror", "re-sync Figma", "design mirror".
---

# Design Mirror — code↔Figma workflow

## Principles (the contract)

1. **The code is the source of truth.** `styles/astra.css` tokens + the renderers in
   `app/astra/` define the design. The Figma file is a generated *mirror* for
   discussion — never the authority.
2. **Proposals flow one way:** Figma Proposals page → discussion → code change →
   validation on the rendered prototype → commit → mirror re-sync.
3. **Never edit the Foundations/Components pages by hand-design** — they must always
   show what is shipped. Only the Proposals page is free-draw.
4. A design change is **accepted when merged and validated in the renderer**, not
   when it looks right in Figma (MyST/book-theme realities only show up live).

## The mirror file

- **File:** "Lightcone Theme — Living Design Mirror" —
  https://www.figma.com/design/IZAvTKd8cXW7jv3faVi8B4 (fileKey `IZAvTKd8cXW7jv3faVi8B4`)
- **Pages:** Cover `0:1` · Foundations — Color `7:2` · Foundations — Type `7:3` ·
  Components — Blocks `13:2` · Proposals `7:5`
- Full variable/style/component ledger: [references/figma-ledger.md](references/figma-ledger.md)
- Load the `figma-use` skill before any `use_figma` call. Node IDs in the ledger are
  hints — **discover by name first** (the file is hand-edited occasionally and IDs drift).

## Workflow A — "review proposals"

1. **Scan the Proposals page** (`7:5`): list children; anything beyond the
   "How to propose" frame is a proposal (usually an INSTANCE of a mirror component).
2. **Read the intent.** Three channels, in order of reliability:
   - **Dev Mode annotations** — readable: walk the node tree and collect
     `node.annotations` (see ledger for a snippet). This is the standard channel.
   - **Visual deltas** — deep-diff the instance against `getMainComponentAsync()`
     (fills/strokes/text/fonts/spacing, walk both trees in parallel).
   - **Comment pins are NOT readable** (Plugin API never exposes comments; REST-only).
     If a proposal has no annotation and no delta, ask the user what they intended.
3. **Map the change to code.** Token-level → `styles/astra.css` (`--astra-*`).
   Structural → the renderer in `app/astra/renderers/` (each mirror component's
   description names its source file).
4. **Implement, test, validate live:** `npm test`, `npm run build`, then run a
   prototype and verify the change in the real renderer (see "Validation" below).
5. **Commit** with a message noting it came via the Proposals page.
6. **Re-sync the mirror** (Workflow B) so Foundations/Components show the shipped
   state. The proposal instance usually inherits automatically (no overrides).
7. **Report**: implemented commit + screenshot; leave the user's annotation in place
   for them to resolve (it's the proposed→shipped record).

## Workflow B — "sync the mirror" (after code changes)

- **Token value changed** → update the matching Figma variable's mode value(s)
  (ledger maps every `--astra-*` var to a variable ID). Light values that equal a
  brand-book color should stay ALIASED to the Brand Palette primitive.
- **Token added/removed** → add/remove the variable (set scopes + WEB code syntax
  `var(--astra-…)`), and update the swatch boards on Foundations — Color (both the
  Light and Dark frames; the Dark board has explicit mode `Dark` set).
- **Component markup/typography changed** → edit the matching variant on
  Components — Blocks in place (keep node IDs stable so descriptions/links survive).
- **New block/preview kind** → build it bound to the variables, add a code-pointer
  `description` + GitHub `documentationLinks`, and slot it into the right variant set
  (Block Card / Preview Card / Decision Panel).

## Validation on the rendered prototype

```bash
cd prototype/iii-bao-galaxy-quasars && myst start   # richest content (insights, outputs)
# or: cd ../myst_proto && myst start
```
Run in background; grep the output file for `http://localhost:<port>`. Then drive it
with Playwright MCP. Hover preview cards need synthetic pointer events:

```js
ref.scrollIntoView({block:'center'});
for (const t of ['pointerover','pointerenter','mouseover','mouseenter','mousemove'])
  ref.dispatchEvent(new MouseEvent(t, {bubbles:true}));
await new Promise(r => setTimeout(r, 900));   // then query .astra-card
```

Check light AND dark (`document.documentElement.classList.add('dark')`). Kill the
servers (`pkill -f "myst start"; pkill -f "node ./server.js"` — exit 144 is normal)
and delete screenshot artifacts when done.

## Gotchas (learned the hard way)

- **Figma comments are invisible** to the Plugin API/MCP — annotations or in-frame
  text notes are the machine-readable channels.
- **Paints returned by `setBoundVariableForPaint` are frozen** — `p.opacity = x`
  fails silently. Spread instead: `node.strokes = [{ ...paint, opacity: 0.55 }]`.
- **CSS `color-mix()` tints have no Figma equivalent** — chip/toggle/selected-option
  backgrounds are baked light-mode hexes in the mirror (wrong in Dark mode; known
  limitation, don't "fix" by inventing tokens that don't exist in code).
- **Per-side border colors don't exist in Figma** — block cards fake
  `border-left: 3px var(--astra-kind)` with an absolute-positioned `left-edge` rect
  (STRETCH constraint; re-`resize` it after content height changes).
- **Code Connect is unavailable** (needs Figma Org plan; team is on Pro) — code
  pointers live in component `description` + `documentationLinks` instead.
- Alegreya in Figma has **no SemiBold** (use Medium); CSS weight 600 ≈ Medium.
- Text style IDs end with a trailing comma — pass them verbatim.
