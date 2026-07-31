import type { GenericNode } from 'myst-common';
import type { InventorySnapshot } from './types';
/**
 * Extract MySTRA's project snapshot from index.md and rejoin image URLs that
 * MyST rewrote through its asset pipeline. The small normalization here keeps
 * MySTRA's snapshot contract separate from the original inventory view model.
 */
export declare function findInventorySnapshot(mdast: GenericNode | GenericNode[] | undefined | null): InventorySnapshot | undefined;
export declare function hasInventorySnapshot(mdast: GenericNode | GenericNode[] | undefined | null): boolean;
