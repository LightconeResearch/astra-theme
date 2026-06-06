/**
 * Test harness: mount an ASTRA renderer in isolation with the two contexts it
 * needs at runtime —
 *   1. the MyST node-renderers context (so nested <MyST/> can resolve renderers)
 *      supplied by @myst-theme/providers' ThemeProvider via its `renderers` prop,
 *   2. the AstraStoreProvider (passed an explicit `store`, no mdast scanning).
 *
 * The renderers map is DEFAULT_RENDERERS merged with ASTRA_RENDERERS, matching
 * how app/root.tsx wires the theme.
 */
import * as React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, mergeRenderers } from '@myst-theme/providers';
import { DEFAULT_RENDERERS } from 'myst-to-react';
import type { ResolvedStore } from '@astra-spec/store-types';
import { ASTRA_RENDERERS } from '~/astra/renderers';
import { AstraStoreProvider } from '~/astra/store/AstraStoreProvider';

const RENDERERS = mergeRenderers([DEFAULT_RENDERERS, ASTRA_RENDERERS]);

export function renderWithProviders(
  ui: React.ReactElement,
  store?: ResolvedStore,
) {
  return render(
    <ThemeProvider theme={null} setTheme={() => undefined} renderers={RENDERERS}>
      <AstraStoreProvider store={store}>{ui}</AstraStoreProvider>
    </ThemeProvider>,
  );
}
