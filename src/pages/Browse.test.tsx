// packages
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

// components
import { routes } from '../App';

// contexts
import { ThemeProvider } from '../contexts/ThemeContext';
import { GraderProvider } from '../contexts/GraderContext';

// engine
import { filterQuestions, loadQuestions } from '../engine/registry';

// i18n
import i18n from '../i18n';
import { createProgressStore } from '../engine/progress';
import type { ProgressStore } from '../engine/progress';

// hooks
import { PreferencesProvider } from '../hooks/usePreferences';
import { ProgressProvider } from '../hooks/useProgress';

function renderAt(path: string, store?: ProgressStore): void {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <PreferencesProvider>
      <ThemeProvider>
        <ProgressProvider store={store}>
          <GraderProvider>
            <RouterProvider router={router} />
          </GraderProvider>
        </ProgressProvider>
      </ThemeProvider>
    </PreferencesProvider>,
  );
}

describe('browse pages', () => {
  it('lists every domain with a count', () => {
    renderAt('/browse');
    expect(screen.getByRole('link', { name: /languages/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /databases/i })).toBeInTheDocument();
  });

  it('lists the subjects of a domain', () => {
    renderAt('/browse/languages');
    expect(screen.getByRole('link', { name: /javascript/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /typescript/i })).toBeInTheDocument();
  });

  it('lists the questions of a subject with a drill link', () => {
    renderAt('/browse/languages/javascript');
    expect(screen.getAllByRole('link', { name: /drill/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /event loop/i })).toBeInTheDocument();
  });

  it('shows not found for an unknown domain', () => {
    renderAt('/browse/nope');
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  it('shows attempted progress, not mastery, on the domain bar', () => {
    const store = createProgressStore(null);
    store.record('javascript-closure-counter-independence', 1);
    renderAt('/browse', store);
    const languagesTotal = filterQuestions(loadQuestions(), { domain: 'languages' }).length;
    const expectedPercent = Math.round((1 / languagesTotal) * 100);
    const bar = screen.getByRole('progressbar', { name: /languages/i });
    expect(bar).toHaveAttribute('aria-valuenow', String(expectedPercent));
    const card = bar.closest('a');
    expect(card?.textContent).toContain('mastery 100%');
  });

  it('shows translated prompts and taxonomy names in Spanish', async () => {
    await i18n.changeLanguage('es');
    renderAt('/browse/languages/javascript');
    expect(screen.getByRole('link', { name: '¿Qué imprime esto, un valor por línea?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Closures (clausuras)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lenguajes' })).toBeInTheDocument();
  });

  it('falls back to English prompts for untranslated questions in Spanish', async () => {
    await i18n.changeLanguage('es');
    renderAt('/browse/languages/javascript');
    expect(screen.getByRole('link', { name: /Which of these produce a deep copy/ })).toBeInTheDocument();
  });
});
