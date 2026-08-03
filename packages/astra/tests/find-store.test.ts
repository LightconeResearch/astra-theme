/**
 * findAstraStore — depth-first search for the `.astra-store` carrier's
 * data.astra in a page mdast. Tolerates any tree shape; undefined when absent.
 */
import { describe, it, expect } from 'vitest';
import { findAstraStore } from '../src/store/AstraStoreProvider';
import type { GenericNode } from 'myst-common';
import { emptyStore } from './helpers/store';

const store = emptyStore();

function tree(carrier?: GenericNode): GenericNode {
  return {
    type: 'root',
    children: [
      { type: 'heading', children: [{ type: 'text', value: 'Title' }] },
      {
        type: 'block',
        children: [
          { type: 'paragraph', children: [{ type: 'text', value: 'hi' }] },
          ...(carrier ? [carrier] : []),
        ],
      },
    ],
  };
}

describe('findAstraStore', () => {
  it('finds the carrier deep in the tree and returns data.astra', () => {
    const carrier: GenericNode = {
      type: 'div',
      identifier: 'astra-store-index',
      class: 'astra-store',
      data: { astra: store },
    };
    expect(findAstraStore(tree(carrier))).toBe(store);
  });

  it('accepts an array of roots', () => {
    const carrier: GenericNode = {
      type: 'div',
      identifier: 'astra-store-index',
      class: 'astra-store',
      data: { astra: store },
    };
    expect(findAstraStore([{ type: 'paragraph' }, carrier])).toBe(store);
  });

  it('returns undefined when no carrier is present', () => {
    expect(findAstraStore(tree())).toBeUndefined();
  });

  it('returns undefined for null / undefined / empty input', () => {
    expect(findAstraStore(undefined)).toBeUndefined();
    expect(findAstraStore(null)).toBeUndefined();
    expect(findAstraStore([])).toBeUndefined();
  });

  it('ignores a node with the right class but no data.astra', () => {
    const carrier: GenericNode = {
      type: 'div',
      identifier: 'astra-store-index',
      class: 'astra-store',
      data: {},
    };
    expect(findAstraStore(tree(carrier))).toBeUndefined();
  });

  it('joins astra-assets image urls back onto output resolved_path', () => {
    const withOutput = {
      ...emptyStore(),
      outputs: {
        plot: {
          id: 'plot',
          type: 'figure',
          resolved_path: 'results/baseline/plot/plot.png',
        },
      },
    };
    const carrier: GenericNode = {
      type: 'div',
      identifier: 'astra-store-index',
      class: 'astra-store',
      data: { astra: withOutput },
    };
    const assets: GenericNode = {
      type: 'div',
      class: 'astra-assets',
      children: [
        {
          type: 'image',
          url: '/myst_assets_folder/plot-abc123.png',
          data: { astraAsset: 'plot' },
        },
        // unknown ids are ignored, not invented
        { type: 'image', url: '/x.png', data: { astraAsset: 'missing' } },
      ],
    };
    const found = findAstraStore([tree(carrier), assets]);
    expect(found?.outputs.plot.resolved_path).toBe(
      '/myst_assets_folder/plot-abc123.png',
    );
    // copy-on-write: the carrier-held store object is untouched
    expect(withOutput.outputs.plot.resolved_path).toBe(
      'results/baseline/plot/plot.png',
    );
  });

  it('continues to read legacy identifier-only carriers', () => {
    const carrier: GenericNode = {
      type: 'div',
      identifier: 'astra-store',
      data: { astra: store },
    };
    expect(findAstraStore(tree(carrier))).toBe(store);
  });
});
