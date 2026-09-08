import * as React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider } from '@myst-theme/providers';
import { afterEach, describe, expect, it } from 'vitest';
import { AstraInventoryButton, AstraPublicationProvider, type AstraPublication } from '../src/publication/AstraPublicationProvider';
import { makePublication } from './helpers/publication';

function Host({ publication }: { publication?: AstraPublication }) {
  return (
    <ThemeProvider theme={null} setTheme={() => undefined}>
      <AstraPublicationProvider publication={publication}>
        <AstraInventoryButton />
        <input aria-label="Reading notes" defaultValue="Keep my place" />
      </AstraPublicationProvider>
    </ThemeProvider>
  );
}

function navigate(url: string) {
  act(() => {
    window.history.pushState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('publication inventory', () => {
  it('has no entry or inventory when the page has no publication', () => {
    navigate('/#astra-inventory');
    render(<Host />);
    expect(screen.queryByRole('link', { name: 'Inventory' })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the inventory and restores reading from the header icon', async () => {
    navigate('/reports/demo?lang=en#methods');
    render(<Host publication={makePublication()} />);
    const notes = screen.getByRole('textbox');
    fireEvent.change(notes, { target: { value: 'Still reading' } });
    const opener = screen.getByRole('link', { name: 'Inventory' });
    opener.focus();
    fireEvent.click(opener);
    const inventory = await screen.findByRole('dialog', { name: 'Demo' });
    expect(within(inventory).getByRole('heading', { name: 'Outputs' })).toBeVisible();
    expect(within(inventory).getByRole('img', { name: 'Shear correlation plot' })).toHaveAttribute(
      'src', '/myst-assets/shear_plot.png',
    );
    fireEvent.click(within(inventory).getByRole('button', { name: 'Close inventory' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(window.location.pathname + window.location.search + window.location.hash)
      .toBe('/reports/demo?lang=en#methods');
    expect(screen.getByRole('textbox')).toBe(notes);
    expect(notes).toHaveValue('Still reading');
    expect(opener).toHaveFocus();
  });

  it('opens a direct section link and follows browser navigation', async () => {
    navigate('/#astra-inventory-decisions');
    render(<Host publication={makePublication()} />);
    expect(screen.getByRole('dialog', { name: 'Demo' })).toBeVisible();
    navigate('/#introduction');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    navigate('/#astra-inventory');
    expect(screen.getByRole('dialog', { name: 'Demo' })).toBeVisible();
  });

  it('keeps the inventory open when a record detail is dismissed', async () => {
    navigate('/#astra-inventory');
    render(<Host publication={makePublication()} />);
    const inventory = screen.getByRole('dialog', { name: 'Demo' });
    fireEvent.click(within(inventory).getByRole('button', { name: /Covariance source/ }));
    const detail = await screen.findByRole('dialog', { name: 'Covariance source' });
    fireEvent(detail, new Event('cancel', { cancelable: true }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Covariance source' })).toBeNull());
    expect(inventory).toBeVisible();
    fireEvent(inventory, new Event('cancel', { cancelable: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('shows the active analysis and clears old details on a page change', async () => {
    navigate('/#astra-inventory');
    const publication = makePublication();
    const { rerender } = render(<Host publication={publication} />);
    fireEvent.click(screen.getByRole('button', { name: /Covariance source/ }));
    await screen.findByRole('dialog', { name: 'Covariance source' });
    rerender(<Host publication={{ ...publication, activeAnalysis: publication.document.analysis.analyses[0]! }} />);
    expect(screen.getByRole('dialog', { name: 'Calibration' })).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Covariance source' })).toBeNull());
    expect(screen.queryByRole('button', { name: /Covariance source/ })).toBeNull();
  });
});
