import { renderToStaticMarkup } from 'react-dom/server';
import { BlockingThemeLoader } from '@myst-theme/site';
import { afterEach, describe, expect, it, vi } from 'vitest';

const attributes = ['data-lightcone-color-scheme', 'data-astra-color-scheme'];
afterEach(() => {
  document.documentElement.className = '';
  for (const attribute of attributes) document.documentElement.removeAttribute(attribute);
  vi.unstubAllGlobals();
});

describe('branded document before hydration', () => {
  it.each(['light', 'dark'])('synchronizes both brand attributes for an initial %s theme', scheme => {
    document.documentElement.className = 'lightcone-brand';
    vi.stubGlobal('matchMedia', () => ({ matches: scheme === 'light' }));
    const markup = renderToStaticMarkup(<BlockingThemeLoader useLocalStorage={false} themeAttributes={attributes} />);
    const script = document.createElement('div');
    script.innerHTML = markup;
    new Function(script.querySelector('script')!.textContent!)();
    expect(document.documentElement).toHaveClass('lightcone-brand', scheme);
    for (const attribute of attributes) expect(document.documentElement).toHaveAttribute(attribute, scheme);
  });

  it('retains a server-selected scheme when the OS preference differs', () => {
    document.documentElement.className = 'lightcone-brand dark';
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const markup = renderToStaticMarkup(<BlockingThemeLoader useLocalStorage={false} themeAttributes={attributes} />);
    const script = document.createElement('div');
    script.innerHTML = markup;
    new Function(script.querySelector('script')!.textContent!)();
    expect(document.documentElement).toHaveAttribute('data-astra-color-scheme', 'dark');
  });
});
