// packages
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

// components
import { routes } from './App';

// contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { GraderProvider } from './contexts/GraderContext';

// hooks
import { PreferencesProvider } from './hooks/usePreferences';
import { ProgressProvider } from './hooks/useProgress';

function renderAt(path: string): void {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <PreferencesProvider>
      <ThemeProvider>
        <ProgressProvider>
          <GraderProvider>
            <RouterProvider router={router} />
          </GraderProvider>
        </ProgressProvider>
      </ThemeProvider>
    </PreferencesProvider>,
  );
}

describe('routes', () => {
  it('renders the navigation and the home page', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Browse' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
