import {
  GridSystemProvider,
  TabStateProvider,
  UiStateProvider,
  useThemeSwitcher,
} from '@myst-theme/providers';
import { ThemeButton } from '@myst-theme/site';

export function ArticlePageAndNavigation({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeSwitcher();
  return (
    <UiStateProvider>
      <TabStateProvider>
        <GridSystemProvider gridSystem="article-left-grid">
          <div className="fixed top-4 right-4 z-50">
            <ThemeButton />
          </div>
          {/* The brand scope lives on the page wrapper so the header band,
              article, and footer all resolve lightcone-brand tokens. */}
          <main
            id="main"
            data-name="article-page-and-navigation-main"
            data-astra-color-scheme={theme ?? undefined}
            suppressHydrationWarning
            className="lightcone-brand article-left-grid subgrid-gap"
          >
            {children}
          </main>
        </GridSystemProvider>
      </TabStateProvider>
    </UiStateProvider>
  );
}
