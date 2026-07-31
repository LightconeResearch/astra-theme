/**
 * A deliberately small prose renderer for inventory metadata strings.
 *
 * The normal ASTRA report keeps using StoreProse and MyST's renderer registry.
 * The inventory snapshot carries plain strings rather than parsed MyST nodes,
 * so this renders the inline code and math forms used by ASTRA metadata without
 * mounting a second document pipeline.
 */
import * as React from 'react';
import type { GenericNode } from 'myst-common';
export declare function parseInventoryProse(text: string): GenericNode[];
export declare const InventoryProse: React.FC<{
    text?: string;
}>;
export default InventoryProse;
