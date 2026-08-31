import * as React from 'react';
import { useThemeSwitcher } from '@myst-theme/providers';

export type AstraColorScheme = 'light' | 'dark';

const AstraColorSchemeContext = React.createContext<AstraColorScheme>('light');

interface BrandRootState {
  owners: Map<symbol, AstraColorScheme>;
  hadBrandClass: boolean;
  lightconeScheme: string | null;
  astraScheme: string | null;
}

const brandRoots = new WeakMap<HTMLElement, BrandRootState>();

function activeScheme(state: BrandRootState): AstraColorScheme {
  return Array.from(state.owners.values()).at(-1) ?? 'light';
}

function synchronizeBrandRoot(root: HTMLElement, state: BrandRootState): void {
  const scheme = activeScheme(state);
  root.classList.add('lightcone-brand');
  root.setAttribute('data-lightcone-color-scheme', scheme);
  root.setAttribute('data-astra-color-scheme', scheme);
}

function acquireBrandRoot(
  root: HTMLElement,
  owner: symbol,
  scheme: AstraColorScheme,
): void {
  let state = brandRoots.get(root);
  if (!state) {
    state = {
      owners: new Map(),
      hadBrandClass: root.classList.contains('lightcone-brand'),
      lightconeScheme: root.getAttribute('data-lightcone-color-scheme'),
      astraScheme: root.getAttribute('data-astra-color-scheme'),
    };
    brandRoots.set(root, state);
  }
  state.owners.set(owner, scheme);
  synchronizeBrandRoot(root, state);
}

function updateBrandRoot(
  root: HTMLElement,
  owner: symbol,
  scheme: AstraColorScheme,
): void {
  const state = brandRoots.get(root);
  if (!state?.owners.has(owner)) return;
  // Reinsert so the most recently synchronized host owns the global scheme.
  state.owners.delete(owner);
  state.owners.set(owner, scheme);
  synchronizeBrandRoot(root, state);
}

function releaseBrandRoot(root: HTMLElement, owner: symbol): void {
  const state = brandRoots.get(root);
  if (!state) return;
  state.owners.delete(owner);
  if (state.owners.size > 0) {
    synchronizeBrandRoot(root, state);
    return;
  }

  if (!state.hadBrandClass) root.classList.remove('lightcone-brand');
  if (state.lightconeScheme === null) {
    root.removeAttribute('data-lightcone-color-scheme');
  } else {
    root.setAttribute('data-lightcone-color-scheme', state.lightconeScheme);
  }
  if (state.astraScheme === null) {
    root.removeAttribute('data-astra-color-scheme');
  } else {
    root.setAttribute('data-astra-color-scheme', state.astraScheme);
  }
  brandRoots.delete(root);
}

/**
 * Resolve the MyST theme, including static builds whose initial theme is null.
 * In that case the document class is the browser-side source of truth.
 */
function useObservedColorScheme(): AstraColorScheme {
  const { theme, isDark } = useThemeSwitcher();
  const [scheme, setScheme] = React.useState<AstraColorScheme>(() => {
    if (isDark) return 'dark';
    if (
      theme == null &&
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark')
    ) {
      return 'dark';
    }
    return 'light';
  });

  React.useEffect(() => {
    if (theme != null) {
      setScheme(isDark ? 'dark' : 'light');
      return undefined;
    }
    if (typeof document === 'undefined') return undefined;

    const root = document.documentElement;
    const synchronize = () => {
      setScheme(root.classList.contains('dark') ? 'dark' : 'light');
    };
    synchronize();

    const observer = new MutationObserver(synchronize);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme, isDark]);

  return scheme;
}

/** The synchronized colour scheme used by portaled ASTRA UI. */
export function useAstraColorScheme(): AstraColorScheme {
  return React.useContext(AstraColorSchemeContext);
}

export interface AstraThemeScopeProps {
  children: React.ReactNode;
}

/**
 * Opt the existing document root into the brand foundations without inserting
 * a DOM node. MyST's grids rely on direct-child selectors, so even a
 * `display: contents` wrapper would change their selector topology.
 */
export function AstraThemeScope({ children }: AstraThemeScopeProps) {
  const scheme = useObservedColorScheme();
  const owner = React.useRef(Symbol('astra-theme-scope'));
  const root = React.useRef<HTMLElement | undefined>(undefined);

  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    root.current = document.documentElement;
    acquireBrandRoot(root.current, owner.current, scheme);

    return () => {
      if (root.current) releaseBrandRoot(root.current, owner.current);
      root.current = undefined;
    };
    // Ownership follows this component's mount, while the next effect updates
    // its scheme without briefly releasing the root during a theme change.
  }, []);

  React.useEffect(() => {
    if (root.current) updateBrandRoot(root.current, owner.current, scheme);
  }, [scheme]);

  return (
    <AstraColorSchemeContext.Provider value={scheme}>
      {children}
    </AstraColorSchemeContext.Provider>
  );
}
