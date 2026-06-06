/**
 * findAstraStore — depth-first search for the [identifier=astra-store] carrier's
 * data.astra in a page mdast. Tolerates any tree shape; undefined when absent.
 */
import { describe, it, expect } from 'vitest';
import { findAstraStore } from '~/astra/store/AstraStoreProvider';
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
      identifier: 'astra-store',
      data: { astra: store },
    };
    expect(findAstraStore(tree(carrier))).toBe(store);
  });

  it('accepts an array of roots', () => {
    const carrier: GenericNode = {
      type: 'div',
      identifier: 'astra-store',
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

  it('ignores a node with the right identifier but no data.astra', () => {
    const carrier: GenericNode = {
      type: 'div',
      identifier: 'astra-store',
      data: {},
    };
    expect(findAstraStore(tree(carrier))).toBeUndefined();
  });
});
