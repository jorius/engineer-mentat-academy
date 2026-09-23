// packages
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

// components
import { routes } from '../../App';

// contexts
import { ThemeProvider } from '../../contexts/ThemeContext';
import { GraderProvider } from '../../contexts/GraderContext';

// hooks
import { PreferencesProvider } from '../../hooks/usePreferences';
import { ProgressProvider } from '../../hooks/useProgress';

// i18n
import i18n from '../../i18n';

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

describe('Layout top bar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists the supported languages by their native names', () => {
    renderAt('/');
    const select = screen.getByRole('combobox', { name: 'Language' });
    expect(select).toHaveValue('en');
    expect(screen.getByRole('option', { name: 'English' })).toHaveAttribute('value', 'en');
    expect(screen.getByRole('option', { name: 'Español' })).toHaveAttribute('value', 'es');
  });

  it('changes the interface language from the select', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'es');
    expect(i18n.resolvedLanguage).toBe('es');
    const select = screen.getByRole('combobox', { name: 'Idioma' });
    expect(select).toHaveValue('es');
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Español' })).toBeInTheDocument();
    await user.selectOptions(select, 'en');
    expect(i18n.resolvedLanguage).toBe('en');
  });

  it('names the theme button after the theme it switches to', async () => {
    const user = userEvent.setup();
    renderAt('/');
    expect(document.documentElement).toHaveClass('dark');
    const button = screen.getByRole('button', { name: 'Switch to light mode' });
    expect(button).toHaveAttribute('title', 'Switch to light mode');
    await user.click(button);
    expect(document.documentElement).not.toHaveClass('dark');
    expect(button).toHaveAccessibleName('Switch to dark mode');
    expect(button).toHaveAttribute('title', 'Switch to dark mode');
    await user.click(button);
    expect(button).toHaveAccessibleName('Switch to light mode');
  });
});
