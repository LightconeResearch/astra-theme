import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import { Theme, ThemeProvider } from '@myst-theme/providers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AstraThemeScope, useAstraColorScheme } from '../src/themeScope';

function CurrentScheme() {
  return <span data-testid="scheme">{useAstraColorScheme()}</span>;
}

afterEach(() => {
  document.documentElement.classList.remove('dark', 'lightcone-brand');
  document.documentElement.removeAttribute('data-lightcone-color-scheme');
  document.documentElement.removeAttribute('data-astra-color-scheme');
  document.body.classList.remove('lightcone-brand');
  document.body.removeAttribute('data-lightcone-color-scheme');
  document.body.removeAttribute('data-astra-color-scheme');
  vi.unstubAllGlobals();
});

describe('AstraThemeScope', () => {
  it('provides the host scheme without changing child DOM topology', () => {
    const { container, unmount } = render(
      <ThemeProvider theme={Theme.light} setTheme={() => undefined}>
        <AstraThemeScope>
          <CurrentScheme />
        </AstraThemeScope>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('scheme')).toHaveTextContent('light');
    expect(container.firstElementChild).toBe(screen.getByTestId('scheme'));
    expect(document.documentElement).toHaveClass('lightcone-brand');
    expect(document.documentElement).toHaveAttribute(
      'data-lightcone-color-scheme',
      'light',
    );
    expect(document.documentElement).toHaveAttribute(
      'data-astra-color-scheme',
      'light',
    );
    expect(document.body).not.toHaveClass('lightcone-brand');
    expect(document.body).not.toHaveClass('astra-ui');
    expect(document.body).not.toHaveAttribute('data-lightcone-color-scheme');
    expect(document.body).not.toHaveAttribute('data-astra-color-scheme');

    unmount();
    expect(document.documentElement).not.toHaveClass('lightcone-brand');
    expect(document.documentElement).not.toHaveAttribute(
      'data-lightcone-color-scheme',
    );
    expect(document.documentElement).not.toHaveAttribute(
      'data-astra-color-scheme',
    );
  });

  it('observes html.dark when the static-build theme starts null', () => {
    let notify: MutationCallback | undefined;
    class TestMutationObserver {
      constructor(callback: MutationCallback) {
        notify = callback;
      }
      observe() {}
      disconnect() {}
      takeRecords(): MutationRecord[] {
        return [];
      }
    }
    vi.stubGlobal('MutationObserver', TestMutationObserver);
    render(
      <ThemeProvider theme={null} setTheme={() => undefined}>
        <AstraThemeScope>
          <CurrentScheme />
        </AstraThemeScope>
      </ThemeProvider>,
    );
    act(() => {
      document.documentElement.classList.add('dark');
      notify?.([], {} as MutationObserver);
    });
    expect(screen.getByTestId('scheme')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveAttribute(
      'data-lightcone-color-scheme',
      'dark',
    );
    expect(document.documentElement).toHaveAttribute(
      'data-astra-color-scheme',
      'dark',
    );
  });

  it('keeps the document branded until the last overlapping scope unmounts', () => {
    function OverlappingScopes({ first, second }: { first: boolean; second: boolean }) {
      return (
        <ThemeProvider theme={Theme.light} setTheme={() => undefined}>
          {first ? (
            <AstraThemeScope>
              <span>first</span>
            </AstraThemeScope>
          ) : null}
          {second ? (
            <AstraThemeScope>
              <span>second</span>
            </AstraThemeScope>
          ) : null}
        </ThemeProvider>
      );
    }

    const { rerender } = render(<OverlappingScopes first second />);
    expect(document.documentElement).toHaveClass('lightcone-brand');

    rerender(<OverlappingScopes first={false} second />);
    expect(document.documentElement).toHaveClass('lightcone-brand');
    expect(document.documentElement).toHaveAttribute(
      'data-lightcone-color-scheme',
      'light',
    );

    rerender(<OverlappingScopes first={false} second={false} />);
    expect(document.documentElement).not.toHaveClass('lightcone-brand');
    expect(document.documentElement).not.toHaveAttribute(
      'data-lightcone-color-scheme',
    );
    expect(document.documentElement).not.toHaveAttribute(
      'data-astra-color-scheme',
    );
  });
});
