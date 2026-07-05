/**
 * app/astra — barrel for the ASTRA overlay.
 *
 * The only ASTRA-aware surface of the theme: `app/root.tsx` merges in the
 * renderers map and `ArticlePage` mounts the store provider. Renderer
 * components import their hooks/helpers directly from `./store/*`.
 */
export { ASTRA_RENDERERS } from './renderers';
export { AstraStoreProvider } from './store/AstraStoreProvider';
