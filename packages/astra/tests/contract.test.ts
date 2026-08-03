/**
 * Contract guard against the page-JSON fixture
 * tests/fixtures/cosmic-shear.content.json. Asserts the plugin↔theme interface
 * from the theme's side: find the store, recognise decorated nodes, join them by
 * id, and degrade gracefully on misses.
 *
 * CARRIER-TYPE NOTE: the fixture uses the CONTRACT-stated carrier types
 * (`details` for decision, `container.astra-inputs` for the input registry) per
 * contract.md's "Known carrier-type discrepancy". packages/astra/src/renderers.ts keys
 * decision/finding on `heading` and the input registry on `table`. These tests
 * assert the CURRENT renderer behaviour (heading-keyed decision routes to
 * AstraDecision; the fixture's `details` carrier does NOT) and document the gap.
 */
import { describe, it, expect } from 'vitest';
import type { GenericNode } from 'myst-common';
import { DEFAULT_RENDERERS, selectRenderer } from 'myst-to-react';
import { mergeRenderers } from '@myst-theme/providers';
import fixture from './fixtures/cosmic-shear.content.json';
import { findAstraStore } from '../src/store/AstraStoreProvider';
import { parseCarrierId, PREFIX_TO_TABLE } from '../src/store/useAstraStore';
import { KIND_TO_TABLE } from '@astra-spec/store-types';
import { ASTRA_RENDERERS } from '../src/renderers';
import { AstraInlineRef } from '../src/renderers/AstraInlineRef';
import { AstraValue } from '../src/renderers/AstraValue';
import { AstraDecision } from '../src/renderers/AstraDecision';

const mdast = fixture.mdast as unknown as GenericNode;

function walk(node: GenericNode, cb: (n: GenericNode) => void) {
  cb(node);
  for (const child of node.children ?? []) walk(child as GenericNode, cb);
}

function collect(pred: (n: GenericNode) => boolean): GenericNode[] {
  const out: GenericNode[] = [];
  walk(mdast, (n) => {
    if (pred(n)) out.push(n);
  });
  return out;
}

/** The merged renderer map as the app wires it (root.tsx merges ASTRA last)
 *  so routing is asserted through myst-to-react's REAL selectRenderer. */
const RENDERERS = mergeRenderers([DEFAULT_RENDERERS, ASTRA_RENDERERS], true);
const route = (node: GenericNode) => selectRenderer(RENDERERS, node);

/* ── A. Carrier & store shape ──────────────────────────────────────────────── */
describe('A. carrier & store shape', () => {
  it('has exactly one astra-store carrier (a hidden div)', () => {
    const carriers = collect((n) => String(n.class).split(/\s+/).includes('astra-store'));
    expect(carriers).toHaveLength(1);
    const carrier = carriers[0];
    expect(carrier.type).toBe('div');
    expect(String(carrier.class)).toContain('astra-store');
  });

  it('exposes a ResolvedStore with all seven tables via findAstraStore', () => {
    const store = findAstraStore(mdast);
    expect(store).toBeDefined();
    expect(Object.keys(store!).sort()).toEqual(
      [
        'analysis',
        'decisions',
        'findings',
        'inputs',
        'outputs',
        'prior_insights',
        'subanalyses',
      ].sort(),
    );
    expect(typeof store!.analysis.slug).toBe('string');
  });

  it('holds resolved (not raw) entries', () => {
    const store = findAstraStore(mdast)!;
    // decision.selected is an option id that exists in options
    const dec = store.decisions.cov_source;
    expect(Object.keys(dec.options)).toContain(dec.selected!);
    // metric value is a number
    expect(typeof store.outputs.sigma8_metric.metric!.value).toBe('number');
    // sub-analysis url is page-absolute
    expect(store.subanalyses.calibration.url.startsWith('/')).toBe(true);
  });
});

/* ── B. Decorated-node markers ─────────────────────────────────────────────── */
describe('B. decorated-node markers', () => {
  const inlineRefs = collect(
    (n) =>
      n.type === 'span' &&
      typeof n.class === 'string' &&
      n.class.includes('astra-ref'),
  );

  it('inline tokens carry astra-ref + astra-ref--<kind> and a data.astra payload', () => {
    expect(inlineRefs.length).toBeGreaterThan(0);
    // The unified-path grammar's full inline vocabulary (v0.0.5 contract).
    const kinds = new Set([
      'decision',
      'output',
      'finding',
      'prior_insight',
      'analysis',
      'input',
      'option',
      'evidence',
      'universe',
      'value',
    ]);
    for (const ref of inlineRefs) {
      const astra = (ref.data as { astra?: { kind?: string; id?: string } })
        ?.astra;
      expect(astra).toBeDefined();
      expect(kinds.has(astra!.kind!)).toBe(true);
      expect(typeof astra!.id).toBe('string');
      expect(String(ref.class)).toContain(`astra-ref--${astra!.kind}`);
    }
  });

  it('the value token carries a subtype class + col/type', () => {
    const value = inlineRefs.find(
      (r) =>
        (r.data as { astra?: { kind?: string } }).astra?.kind === 'value',
    )!;
    expect(String(value.class)).toContain('astra-ref--metric');
    const a = (value.data as { astra: { col?: string; type?: string } }).astra;
    expect(a.col).toBe('value');
    expect(a.type).toBe('metric');
  });

  it('block carriers use <prefix>-<id> identifiers that map to a store table', () => {
    const blocks = collect(
      (n) => typeof n.identifier === 'string' && n.identifier.includes('-'),
    );
    const out = blocks.find((b) => b.identifier === 'output-shear_plot')!;
    expect(out).toBeDefined();
    expect(PREFIX_TO_TABLE[parseCarrierId(out.identifier)!.prefix]).toBe(
      'outputs',
    );
    const inputRow = blocks.find((b) => b.identifier === 'input-shear_catalog')!;
    expect(PREFIX_TO_TABLE[parseCarrierId(inputRow.identifier)!.prefix]).toBe(
      'inputs',
    );
  });
});

/* ── C. The join ───────────────────────────────────────────────────────────── */
describe('C. the join', () => {
  const store = findAstraStore(mdast)!;

  it('parseCarrierId splits each fixture identifier', () => {
    expect(parseCarrierId('output-shear_plot')).toEqual({
      prefix: 'output',
      id: 'shear_plot',
    });
    expect(parseCarrierId('decision-cov_source')).toEqual({
      prefix: 'decision',
      id: 'cov_source',
    });
  });

  it('inline join: KIND_TO_TABLE then store[table][id] resolves each ref', () => {
    expect(store[KIND_TO_TABLE.decision!].cov_source).toBeDefined();
    expect(store[KIND_TO_TABLE.finding!].s8_consistent).toBeDefined();
    // value resolves through the outputs table to the metric product
    expect(store[KIND_TO_TABLE.value!].sigma8_metric).toBeDefined();
  });

  it('block join: prefix→table resolves output-shear_plot to outputs.shear_plot', () => {
    const { prefix, id } = parseCarrierId('output-shear_plot')!;
    expect((store[PREFIX_TO_TABLE[prefix]] as Record<string, unknown>)[id]).toBe(
      store.outputs.shear_plot,
    );
  });
});

/* ── D. Graceful fallback ──────────────────────────────────────────────────── */
describe('D. graceful fallback', () => {
  const store = findAstraStore(mdast)!;

  it('the intentional orphans resolve to undefined (never throw)', () => {
    // inline orphan: analysis ref whose id is not in subanalyses
    expect(store.subanalyses['MISSING_FROM_STORE']).toBeUndefined();
    // block orphan: output-NOT_IN_STORE
    const { prefix, id } = parseCarrierId('output-NOT_IN_STORE')!;
    expect(
      (store[PREFIX_TO_TABLE[prefix]] as Record<string, unknown>)[id],
    ).toBeUndefined();
  });

  it('an absent store yields undefined', () => {
    const noCarrier = JSON.parse(JSON.stringify(mdast)) as GenericNode;
    walk(noCarrier, (n) => {
      n.children = (n.children ?? []).filter(
        (c) => !String((c as GenericNode).class).split(/\s+/).includes('astra-store'),
      );
    });
    expect(findAstraStore(noCarrier)).toBeUndefined();
  });

  it('an unknown prefix yields no table', () => {
    expect(PREFIX_TO_TABLE['bogus']).toBeUndefined();
  });
});

/* ── E. Selector routing (with the documented carrier-type discrepancy) ─────── */
describe('E. selector routing', () => {
  it('a value span routes to AstraValue (not AstraInlineRef) via last-match-wins', () => {
    const valueSpan: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--value astra-ref--metric',
    };
    expect(route(valueSpan)).toBe(AstraValue);
  });

  it('a non-value ref span routes to AstraInlineRef', () => {
    const refSpan: GenericNode = {
      type: 'span',
      class: 'astra-ref astra-ref--decision',
    };
    expect(route(refSpan)).toBe(AstraInlineRef);
  });

  it('a heading decision carrier routes to AstraDecision (current renderer key)', () => {
    const heading: GenericNode = { type: 'heading', class: 'astra-decision' };
    expect(route(heading)).toBe(AstraDecision);
  });

  it('DISCREPANCY: the fixture decision carrier is a `details`, which the renderer map does NOT route to AstraDecision', () => {
    // Documented in contract.md "Known carrier-type discrepancy": renderers.ts
    // keys decision on `heading`, but this fixture (and CONTRACT.md §1) emit a
    // `details` carrier. There is no `details` bucket, so it falls through.
    const detailsCarrier = collect(
      (n) => n.type === 'details' && String(n.class).includes('astra-decision'),
    )[0];
    expect(detailsCarrier).toBeDefined();
    expect(ASTRA_RENDERERS.details).toBeUndefined();
    // No ASTRA `details` bucket → falls through to the stock details renderer.
    expect(route(detailsCarrier)).not.toBe(AstraDecision);
    expect(route(detailsCarrier)).toBe(RENDERERS.details.base);
  });

  it('DISCREPANCY: the fixture input registry is a `container.astra-inputs`, which the `table`-keyed renderer does not match', () => {
    const inputsCarrier = collect(
      (n) =>
        n.type === 'container' && String(n.class).includes('astra-inputs'),
    )[0];
    expect(inputsCarrier).toBeDefined();
    // The container bucket only keys astra-output, not astra-inputs → base.
    expect(route(inputsCarrier)).toBe(RENDERERS.container.base);
  });
});
