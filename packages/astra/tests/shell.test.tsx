import { render, screen, waitFor } from '@testing-library/react';
import { Theme, ThemeProvider } from '@myst-theme/providers';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import {
  AnalysisArticleBody,
  AnalysisArticleHeader,
  AnalysisDocumentOutline,
  AnalysisPageFrame,
} from '../src/shell';

class IntersectionObserverStub implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
  unobserve() {}
}

beforeAll(() => {
  Object.defineProperty(window, 'IntersectionObserver', {
    configurable: true,
    value: IntersectionObserverStub,
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }),
  });
});

test('uses the MyST article frame, header, grid, and document outline together', async () => {
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <ThemeProvider theme={Theme.light} setTheme={() => {}} top={0}>
          <AnalysisPageFrame>
            <AnalysisArticleHeader frontmatter={{ title: 'Analysis title' }} />
            <AnalysisArticleBody isIndex>
              <AnalysisDocumentOutline title="In this article" maxdepth={2} />
              <div>
                <h2 id="overview"><span className="heading-text">Overview</span></h2>
                <h2 id="outputs"><span className="heading-text">Outputs</span></h2>
              </div>
            </AnalysisArticleBody>
          </AnalysisPageFrame>
        </ThemeProvider>
      ),
    },
  ]);

  const { container } = render(<RouterProvider router={router} />);

  expect(container.querySelector('main.article-left-grid')).toBeInTheDocument();
  expect(container.querySelector('header.myst-article-header')).toBeInTheDocument();
  expect(container.querySelector('article.myst-article.article.article-left-grid')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('In this article')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Open Contents' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(screen.queryByText('CONTENTS')).not.toBeInTheDocument();
  expect(container.querySelector('.myst-outline')).toHaveClass('astra-numbered-outline');
  expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '#overview');
});
