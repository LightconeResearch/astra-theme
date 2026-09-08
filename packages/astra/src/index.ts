/**
 * @astra-spec/theme-astra — barrel for the ASTRA overlay.
 *
 * The themes merge the renderer map in `app/root.tsx` and mount the publication
 * provider around article content. The provider opts the existing document
 * root into the brand tokens; shared UI portals repeat that scope explicitly.
 */
export { ASTRA_RENDERERS } from './renderers';
export {
  AstraPublicationProvider,
  useAstraPublication,
} from './publication/AstraPublicationProvider';
export type { AstraPublication } from './publication/AstraPublicationProvider';
export { AstraThemeScope, useAstraColorScheme } from './themeScope';
export type { AstraColorScheme, AstraThemeScopeProps } from './themeScope';

export { PreviewReload } from './viewerTransport';
