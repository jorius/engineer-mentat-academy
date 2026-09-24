// packages
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
import { createDrillsStore } from '../engine/drills';
import { createProgressStore } from '../engine/progress';
import type { ProgressStore } from '../engine/progress';

// hooks
import { PreferencesProvider } from '../hooks/usePreferences';
import { ProgressProvider } from '../hooks/useProgress';
import { DrillsProvider } from '../hooks/useDrills';

function renderAt(path: string, store?: ProgressStore): void {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <PreferencesProvider>
      <ThemeProvider>
        <ProgressProvider store={store}>
          <DrillsProvider store={createDrillsStore(null)}>
            <GraderProvider>
              <RouterProvider router={router} />
            </GraderProvider>
          </DrillsProvider>
        </ProgressProvider>
      </ThemeProvider>
    </PreferencesProvider>,
  );
}

describe('browse pages', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

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

  it('shows only the level and kind chips present in the subject', () => {
    renderAt('/browse/languages/javascript');
    const kinds = screen.getByRole('group', { name: 'Kind' });
    expect(within(kinds).queryByRole('button', { name: /sql query/i })).not.toBeInTheDocument();
    expect(within(kinds).getByRole('button', { name: /single choice/i })).toHaveAttribute('aria-pressed', 'false');
    expect(within(screen.getByRole('group', { name: 'Level' })).getByRole('button', { name: /junior/i })).toBeInTheDocument();
    cleanup();
    renderAt('/browse/databases/sql');
    expect(within(screen.getByRole('group', { name: 'Kind' })).getByRole('button', { name: /sql query/i })).toBeInTheDocument();
  });

  it('gives each topic a drill link for its questions', () => {
    renderAt('/browse/languages/javascript');
    const closures = filterQuestions(loadQuestions(), { subject: 'javascript', topic: 'closures' }).length;
    const link = screen.getAllByRole('link', { name: `Drill · ${closures}` }).find((a) => a.getAttribute('href')?.includes('topic=closures'));
    expect(link).toHaveAttribute('href', '/drill?domain=languages&subject=javascript&topic=closures');
  });

  it('carries only the narrowing chips into the drill links', async () => {
    const user = userEvent.setup();
    renderAt('/browse/languages/javascript');
    const levels = screen.getByRole('group', { name: 'Level' });
    await user.click(within(levels).getByRole('button', { name: /senior/i }));
    const senior = filterQuestions(loadQuestions(), { subject: 'javascript', levels: ['senior'] }).length;
    const drillThese = screen.getByRole('link', { name: new RegExp(`drill (this|these) ${senior}$`, 'i') });
    expect(drillThese).toHaveAttribute('href', '/drill?domain=languages&subject=javascript&level=senior');
    await user.click(within(levels).getByRole('button', { name: 'All' }));
    expect(screen.getByRole('link', { name: /drill (this|these) \d+$/i })).toHaveAttribute('href', '/drill?domain=languages&subject=javascript');
  });

  it('filters the list by the Only chips', async () => {
    const user = userEvent.setup();
    const store = createProgressStore(null);
    store.setFlag('javascript-closure-counter-independence', true);
    renderAt('/browse/languages/javascript', store);
    await user.click(within(screen.getByRole('group', { name: 'Only' })).getByRole('button', { name: 'Marked for review' }));
    expect(screen.getByRole('link', { name: 'Drill this 1' })).toHaveAttribute('href', '/drill?domain=languages&subject=javascript&only=marked');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
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
    expect(
      screen.getAllByRole('link', { name: '¿Qué imprime esto, un valor por línea?' }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: 'Closures (clausuras)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lenguajes' })).toBeInTheDocument();
  });

  it('shows the English prompt again after switching back from Spanish', async () => {
    await i18n.changeLanguage('es');
    renderAt('/browse/languages/javascript');
    expect(
      screen.queryByRole('link', { name: /Which of these produce a deep copy/ }),
    ).not.toBeInTheDocument();
    cleanup();

    await i18n.changeLanguage('en');
    renderAt('/browse/languages/javascript');
    expect(screen.getByRole('link', { name: /Which of these produce a deep copy/ })).toBeInTheDocument();
  });
});
