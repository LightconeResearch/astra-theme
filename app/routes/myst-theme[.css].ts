import { type LoaderFunction } from '@remix-run/node';
import { type ThemeCssOptions, themeCSS, cssResponse } from '@myst-theme/site';
import { getConfig, getCustomStyleSheet } from '~/utils/loaders.server';

export const loader: LoaderFunction = async (): Promise<Response> => {
  // Independent fetches (getCustomStyleSheet needs an un-rewritten config of
  // its own) — run them in parallel; this stylesheet blocks first paint.
  const [site, css] = await Promise.all([getConfig(), getCustomStyleSheet()]);
  return cssResponse(themeCSS(site?.options as ThemeCssOptions, css));
};
