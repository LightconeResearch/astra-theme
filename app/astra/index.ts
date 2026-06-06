/**
 * app/astra — barrel for the ASTRA overlay.
 *
 * The only ASTRA-aware surface of the theme. `app/root.tsx` imports the
 * renderers map and the store provider from here; renderer components import the
 * hooks/helpers directly from `./store/*` (see the import conventions in the
 * file map).
 */
export { ASTRA_RENDERERS, default as default } from './renderers';
export {
  AstraStoreProvider,
  AstraStoreContext,
  findAstraStore,
} from './store/AstraStoreProvider';
export type { AstraStoreProviderProps } from './store/AstraStoreProvider';
export {
  useAstraStore,
  useAstraEntry,
  useEntryByIdentifier,
  parseCarrierId,
  PREFIX_TO_TABLE,
  KIND_TO_TABLE,
} from './store/useAstraStore';
export type { AstraEntry } from './store/useAstraStore';
export {
  AstraCite,
  useCiteNodeForDoi,
  buildDoiCiteIndex,
  normalizeDoi,
  doiHref,
} from './cite';
