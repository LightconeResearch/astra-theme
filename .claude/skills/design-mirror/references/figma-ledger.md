# Figma mirror ledger

File: `IZAvTKd8cXW7jv3faVi8B4` — "Lightcone Theme — Living Design Mirror".
IDs recorded 2026-06-07; treat as hints and re-discover by name if a lookup misses.

## Pages

| Page | ID |
|---|---|
| Cover | `0:1` |
| Foundations — Color | `7:2` (Light board `9:2`, Dark board `10:2`) |
| Foundations — Type | `7:3` |
| Components — Blocks | `13:2` |
| Proposals | `7:5` ("How to propose" note `12:2`) |

## Variable collections

### Brand Palette (`VariableCollectionId:3:2`, mode Value=`3:0`) — hidden primitives

| Variable | Hex | ID |
|---|---|---|
| gold/antique | #A67C3C | `VariableID:3:3` |
| blue/ink | #4E5A70 | `VariableID:3:4` |
| charcoal | #221F20 | `VariableID:3:5` |
| blue/slate | #3F7280 | `VariableID:3:6` |
| green/vert-de-gris | #3B7A73 | `VariableID:3:7` |
| red/wax | #A45A43 | `VariableID:3:8` |
| brown/mushroom-cap | #8B7D70 | `VariableID:3:9` |
| parchment/darker | #F1EFE9 | `VariableID:3:10` |
| parchment/base | #F8F7F3 | `VariableID:3:11` |
| white | #FFFFFF | `VariableID:3:12` |

### ASTRA Tokens (`VariableCollectionId:3:13`, modes Light=`3:1` Dark=`3:2`)

Light values alias Brand Palette primitives where exact; Dark values are raw lifted
hues (see `styles/astra.css` §13). Every variable carries WEB code syntax `var(--astra-…)`.

| Variable | CSS var | ID |
|---|---|---|
| surface/paper | --astra-paper | `VariableID:4:2` |
| surface/raised | --astra-surface | `VariableID:4:3` |
| surface/inset | --astra-surface-2 | `VariableID:4:4` |
| ink/primary | --astra-ink | `VariableID:4:5` |
| ink/soft | --astra-ink-soft | `VariableID:4:6` |
| ink/muted | --astra-muted | `VariableID:4:7` |
| ink/faint | --astra-faint | `VariableID:4:8` |
| rule/default | --astra-rule | `VariableID:4:9` |
| rule/strong | --astra-rule-strong | `VariableID:4:10` |
| accent/default | --astra-accent | `VariableID:5:2` |
| accent/soft | --astra-accent-soft | `VariableID:5:3` |
| kicker | --astra-kicker | `VariableID:5:4` |
| kind/decision | --astra-c-decision | `VariableID:5:5` |
| kind/finding | --astra-c-finding | `VariableID:5:6` |
| kind/insight | --astra-c-insight | `VariableID:5:7` |
| kind/analysis | --astra-c-analysis | `VariableID:5:8` |
| kind/output | --astra-c-output | `VariableID:5:9` |
| kind/value | --astra-c-value | `VariableID:5:10` |

### ASTRA Layout (`VariableCollectionId:5:11`, mode Value)

| Variable | CSS var | Value | ID |
|---|---|---|---|
| radius/card | --astra-radius | 3 | `VariableID:5:12` |
| width/card | --astra-card-w | 440 | `VariableID:5:13` |
| width/measure | --astra-measure | 640 | `VariableID:5:14` |

## Text styles (IDs include the trailing comma)

| Style | Font | ID |
|---|---|---|
| Heading/Display (Quattrocento) | Quattrocento Regular 44 | `S:5988f3b8bfd20f10f7e5448422fcef48e6a50ca9,` |
| Heading/H2 (Quattrocento) | Quattrocento Regular 28 | `S:56292b06c6441fc94f81ac4f118045eba57c95ec,` |
| Heading/H3 (Quattrocento) | Quattrocento Regular 22 | `S:24fc98fbabc638eb43e88660fca15bd503e2484a,` |
| Subheading/Card Title (Alegreya) | Alegreya Medium 20 | `S:5bd025bdccb1c8319b9c7d513a6f2ca0194a9f78,` |
| Subheading/Claim (Alegreya) | Alegreya Medium 19 | `S:6ef86cd2afb08983a2b045ff870c7515c4b2d043,` |
| Body/Doc (Newsreader) | Newsreader Regular 18 | `S:a407cd790f6a117aa17538b39ff7c3e8f887b839,` |
| Body/Article (Newsreader) | Newsreader Regular 17 | `S:3988341c9f473a7737c48a3ef1b95bfcdb6445d7,` |
| Body/Abstract (Newsreader) | Newsreader Italic 17 | `S:4eb0a91fe9da75d9156e0fc95092a604b9453264,` |
| Body/Card (Newsreader) | Newsreader Regular 15 | `S:2d3f76041c002e76373b395cb8bc121ba9488f96,` |
| Label/Kicker (Alegreya) | Alegreya Medium 11 caps | `S:281d551cd668366411dc2a1ceb04d3faa56c06c6,` |
| Label/Kind (Alegreya) | Alegreya Medium 11 caps | `S:381caac8342b2b42bae06c106619203c349d2430,` |
| Label/Meta (Alegreya) | Alegreya Regular 12 | `S:e1438e6d4b4d1e73d3a67765bab8c5705626235d,` |
| Mono/ID (JetBrains Mono) | JetBrains Mono Regular 12 | `S:beffabf4acfd1314b36c8921b93478163b99ef48,` |

## Components (page `13:2`) ↔ code

| Figma component | Code | CSS |
|---|---|---|
| Block Card (set: Kind=Finding / Prior Insight / Sub-analysis) | `AstraFinding.tsx` / `AstraPriorInsight.tsx` / `AstraSubanalysis.tsx` | `.astra-finding*` / `.astra-prior-insight*` / `.astra-subanalysis*` |
| Decision Panel (set: View=Narrative / Options / Evidence) | `AstraDecision.tsx` | `.astra-decision*`, `.astra-options*`, `.astra-evidence*` |
| Preview Card (set: Kind=Decision / Finding / Prior Insight / Sub-analysis / Output / Value) | `card/PreviewCard.tsx` + bodies in `AstraInlineRef.tsx`, `AstraValue.tsx` | `.astra-card*` |
| Inline Ref (set: 6 kinds) | `AstraInlineRef.tsx` | `.astra-ref*` |
| Output Block / Figure · / Metric | `AstraOutput.tsx` | `.astra-output*`, `.astra-metric*` |
| Registry Table | `AstraDataSources.tsx` | `.astra-inputs`, `.astra-outputs` |
| Diagram / DataFlow · / ProvenanceGraph | `card/diagrams.tsx` | `.astra-flow*`, `.astra-prov*` |

Preview-card borders: kind variable at **55% opacity** (`{...paint, opacity: 0.55}`).
Block cards: 1px `rule/default` stroke + absolute `left-edge` rect (3px, kind color).

## Useful snippets

Read annotations anywhere on a page:

```js
const found = [];
function walk(n, path) {
  try { if (n.annotations?.length) found.push({ path, nodeId: n.id,
    notes: n.annotations.map(a => a.labelMarkdown ?? a.label) }); } catch (e) {}
  (n.children ?? []).forEach(ch => walk(ch, `${path}/${ch.name}`));
}
for (const top of page.children) walk(top, top.name);
return found;
```

Bind a fill/stroke to a token:

```js
const v = await figma.variables.getVariableByIdAsync('VariableID:5:6');
const paint = figma.variables.setBoundVariableForPaint(
  { type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', v);
node.fills = [paint];                       // full opacity
node.strokes = [{ ...paint, opacity: 0.55 }]; // translucent (spread — paint is frozen)
```
