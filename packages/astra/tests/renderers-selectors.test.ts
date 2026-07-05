/**
 * ASTRA_RENDERERS selector map (packages/astra/src/renderers.ts).
 *
 * MyST keys renderers by node TYPE, then within a type matches `unist-util-select`
 * CSS selectors in REVERSED order (last match wins), with a `base` fallback.
 * These tests assert:
 *   - each expected selector key is registered under the right type,
 *   - the `--value` span selector is registered LAST so value spans route to it,
 *   - ASTRA sets no `base` keys, and the merged map (defaults + ASTRA, as
 *     root.tsx wires it) still has a `base` fallback per bucket,
 *   - the selectors actually match (and don't over-match) representative nodes.
 */
import { describe, it, expect } from 'vitest';
import { matches } from 'unist-util-select';
import type { GenericNode } from 'myst-common';
import { DEFAULT_RENDERERS } from 'myst-to-react';
import { mergeRenderers } from '@myst-theme/providers';
import { ASTRA_RENDERERS } from '../src/renderers';
import { AstraInlineRef } from '../src/renderers/AstraInlineRef';
import { AstraValue } from '../src/renderers/AstraValue';
import { AstraDecision } from '../src/renderers/AstraDecision';
import { AstraFinding } from '../src/renderers/AstraFinding';
import { AstraOutput } from '../src/renderers/AstraOutput';
import { AstraPriorInsight } from '../src/renderers/AstraPriorInsight';
import { AstraDataSources } from '../src/renderers/AstraDataSources';
import { AstraSubanalysis } from '../src/renderers/AstraSubanalysis';

const REF = 'span[class*="astra-ref"]';
const VALUE = 'span[class*="astra-ref--value"]';

/** Selector-keyed view of a renderer bucket (the map is a structural union). */
type Bucket = Record<string, unknown>;
const buckets = ASTRA_RENDERERS as unknown as Record<string, Bucket>;

describe('ASTRA_RENDERERS registration', () => {
  it('registers each ASTRA component under the correct node type + selector', () => {
    expect(buckets.span[REF]).toBe(AstraInlineRef);
    expect(buckets.span[VALUE]).toBe(AstraValue);
    expect(buckets.heading['heading[class*="astra-decision"]']).toBe(
      AstraDecision,
    );
    expect(buckets.heading['heading[class*="astra-finding"]']).toBe(
      AstraFinding,
    );
    expect(buckets.container['container[class*="astra-output"]']).toBe(
      AstraOutput,
    );
    expect(buckets.paragraph['paragraph[class*="astra-output"]']).toBe(
      AstraOutput,
    );
    expect(
      buckets.admonition['admonition[class*="astra-prior-insight"]'],
    ).toBe(AstraPriorInsight);
    expect(buckets.table['table[class*="astra-inputs"]']).toBe(AstraDataSources);
    expect(buckets.table['table[class*="astra-outputs"]']).toBe(
      AstraDataSources,
    );
    expect(buckets.card['card[class*="astra-subanalysis"]']).toBe(
      AstraSubanalysis,
    );
  });

  it('lists the value-span selector LAST so it wins on reverse-order match', () => {
    // selectRenderer reverses the entries and takes the first match, so for a
    // span carrying BOTH classes the value renderer must come after the ref one.
    const keys = Object.keys(buckets.span).filter((k) => k !== 'base');
    expect(keys.indexOf(VALUE)).toBeGreaterThan(keys.indexOf(REF));
  });

  it('sets no base keys, and the merged map keeps a base fallback per bucket', () => {
    // ASTRA must not clobber the base accumulated by earlier maps in the merge
    // (e.g. Jupyter's container Figure); merging over the defaults must still
    // leave every ASTRA bucket with a base for non-ASTRA nodes.
    const merged = mergeRenderers([DEFAULT_RENDERERS, ASTRA_RENDERERS], true);
    for (const type of [
      'span',
      'container',
      'paragraph',
      'heading',
      'admonition',
      'table',
      'card',
    ]) {
      expect('base' in buckets[type]).toBe(false);
      expect(merged[type].base).toBeTypeOf('function');
    }
  });

  it('uses the [class*=...] substring form, not .class or [class~=]', () => {
    // unist-util-select rejects `.class`; `[class~=]` fails on multi-class
    // strings. Every selector key here must be the substring form.
    const allKeys = Object.values(buckets).flatMap((bucket) =>
      Object.keys(bucket).filter((k) => k !== 'base'),
    );
    expect(allKeys.length).toBeGreaterThan(0);
    for (const key of allKeys) {
      expect(key).toContain('[class*=');
      expect(key).not.toContain('[class~=');
    }
  });
});

describe('selector matching against representative nodes', () => {
  const refSpan: GenericNode = { type: 'span', class: 'astra-ref astra-ref--decision' };
  const valueSpan: GenericNode = {
    type: 'span',
    class: 'astra-ref astra-ref--value astra-ref--metric',
  };

  it('a non-value ref span matches the ref selector but NOT the value selector', () => {
    expect(matches(REF, refSpan)).toBe(true);
    expect(matches(VALUE, refSpan)).toBe(false);
  });

  it('a value span matches BOTH ref and value selectors', () => {
    expect(matches(REF, valueSpan)).toBe(true);
    expect(matches(VALUE, valueSpan)).toBe(true);
  });

  it('a decision heading matches the heading decision selector', () => {
    const heading: GenericNode = { type: 'heading', class: 'astra-decision' };
    expect(matches('heading[class*="astra-decision"]', heading)).toBe(true);
    expect(matches('heading[class*="astra-finding"]', heading)).toBe(false);
  });

  it('a plain span with no astra class is matched by NO astra selector', () => {
    const plain: GenericNode = { type: 'span', class: 'highlight' };
    expect(matches(REF, plain)).toBe(false);
    expect(matches(VALUE, plain)).toBe(false);
  });
});
