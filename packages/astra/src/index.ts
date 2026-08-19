/**
 * @astra-spec/theme-astra — barrel for the ASTRA overlay.
 *
 * The only ASTRA-aware surface of the themes: each theme's `app/root.tsx`
 * merges in the renderers map and its article component mounts the store
 * provider. Renderer components import their hooks/helpers directly from
 * `./store/*`.
 */
export { ASTRA_RENDERERS } from './renderers';
export { AstraStoreProvider } from './store/AstraStoreProvider';
export {
  AstraPublicationProvider,
  createStaticViewerHost,
  findAstraPublication,
  postReferenceToParent,
  usePublicationOpenReference,
} from './publication/AstraPublicationProvider';
export type {
  AstraPublicationBundleV1,
  AstraPublicationData,
  AstraPublicationResourceV1,
} from './publication/AstraPublicationProvider';
export { useTemplateOptions } from './useTemplateOptions';
