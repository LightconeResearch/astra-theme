import type { NodeRenderers } from '@myst-theme/providers';

import { AstraInlineRef } from './renderers/AstraInlineRef';

/**
 * The only renderer override the publication integration needs. MySTRA's block
 * carriers already contain readable MyST fallbacks, so they deliberately stay
 * on upstream renderers. Inline references alone become shared-UI triggers.
 *
 * There is no `base`: merging this map after upstream preserves the stock span
 * renderer for every non-ASTRA node.
 */
export const ASTRA_RENDERERS: NodeRenderers = {
  span: {
    'span[class*="astra-ref"]': AstraInlineRef,
  },
};

export default ASTRA_RENDERERS;
