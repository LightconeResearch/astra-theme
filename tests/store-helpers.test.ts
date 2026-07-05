/**
 * Pure store-join helpers from app/astra/store/useAstraStore.ts.
 * These are the theme's id→table join primitives; no React tree needed.
 */
import { describe, it, expect } from 'vitest';
import {
  parseCarrierId,
  PREFIX_TO_TABLE,
} from '~/astra/store/useAstraStore';
import { KIND_TO_TABLE } from '@astra-spec/store-types';

describe('parseCarrierId', () => {
  it('splits a simple <prefix>-<id> carrier', () => {
    expect(parseCarrierId('decision-covariance_source')).toEqual({
      prefix: 'decision',
      id: 'covariance_source',
    });
  });

  it('preserves the underscore prior_insight prefix (not split on its own _)', () => {
    expect(parseCarrierId('prior_insight-x')).toEqual({
      prefix: 'prior_insight',
      id: 'x',
    });
  });

  it('maps the analysis prefix carrier', () => {
    expect(parseCarrierId('analysis-recon')).toEqual({
      prefix: 'analysis',
      id: 'recon',
    });
  });

  it('keeps ids that themselves contain hyphens intact', () => {
    // Longest-known-prefix wins, and the remainder (with its hyphens) is the id.
    expect(parseCarrierId('output-bao-table-v2')).toEqual({
      prefix: 'output',
      id: 'bao-table-v2',
    });
    expect(parseCarrierId('prior_insight-desi-y1-2024')).toEqual({
      prefix: 'prior_insight',
      id: 'desi-y1-2024',
    });
  });

  it('falls back to first-hyphen split for an unknown but conforming prefix', () => {
    // Not in PREFIX_TO_TABLE, but still <prefix>-<id> shaped.
    expect(parseCarrierId('custom-thing-here')).toEqual({
      prefix: 'custom',
      id: 'thing-here',
    });
  });

  it('returns undefined for non-conforming ids', () => {
    expect(parseCarrierId(undefined)).toBeUndefined();
    expect(parseCarrierId('')).toBeUndefined();
    expect(parseCarrierId('nohyphen')).toBeUndefined();
    // Leading hyphen → dash index 0 → rejected.
    expect(parseCarrierId('-leading')).toBeUndefined();
  });
});

describe('PREFIX_TO_TABLE', () => {
  it('maps each block prefix to its store table, including the subtleties', () => {
    expect(PREFIX_TO_TABLE).toMatchObject({
      decision: 'decisions',
      output: 'outputs',
      finding: 'findings',
      // class prior-insight ↔ identifier prior_insight- ↔ table prior_insights
      prior_insight: 'prior_insights',
      // class subanalysis ↔ identifier analysis- ↔ table subanalyses
      analysis: 'subanalyses',
      input: 'inputs',
    });
  });
});

describe('KIND_TO_TABLE', () => {
  it('maps each carded inline kind to its table, with value→outputs projection', () => {
    expect(KIND_TO_TABLE).toEqual({
      decision: 'decisions',
      output: 'outputs',
      finding: 'findings',
      prior_insight: 'prior_insights',
      analysis: 'subanalyses',
      input: 'inputs',
      // a value is one cell pulled from an output product
      value: 'outputs',
    });
    // option / evidence / universe refs have no store table: absent by design.
    expect(KIND_TO_TABLE.option).toBeUndefined();
    expect(KIND_TO_TABLE.evidence).toBeUndefined();
    expect(KIND_TO_TABLE.universe).toBeUndefined();
  });
});
