// packages
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

// components
import { routes } from './App';

// contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { GraderProvider } from './contexts/GraderContext';

// hooks
import { PreferencesProvider } from './hooks/usePreferences';
import { ProgressProvider } from './hooks/useProgress';
import { DrillsProvider } from './hooks/useDrills';

function renderAt(path: string): void {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <PreferencesProvider>
      <ThemeProvider>
        <ProgressProvider>
          <DrillsProvider>
            <GraderProvider>
              <RouterProvider router={router} />
            </GraderProvider>
          </DrillsProvider>
        </ProgressProvider>
      </ThemeProvider>
    </PreferencesProvider>,
  );
}

describe('routes', () => {
  // The default DrillsProvider and ProgressProvider persist to localStorage; start every test clean.
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the navigation and the home page', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Browse' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('switches the interface language from the header and remembers it', async () => {
    const user = userEvent.setup();
    renderAt('/');
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveValue('en');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'es');
    expect(screen.getByRole('link', { name: 'Explorar' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Idioma' })).toHaveValue('es');
    expect(localStorage.getItem('ema:lang')).toBe('es');
    expect(document.documentElement.lang).toBe('es');
  });
});
