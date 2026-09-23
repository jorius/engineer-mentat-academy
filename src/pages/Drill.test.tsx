// packages
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

// components
import { routes } from '../App';

// contexts
import { ThemeProvider } from '../contexts/ThemeContext';
import { GraderProvider } from '../contexts/GraderContext';

// engine
import { createProgressStore } from '../engine/progress';
import type { ProgressStore } from '../engine/progress';

// hooks
import { PreferencesProvider } from '../hooks/usePreferences';
import { ProgressProvider } from '../hooks/useProgress';

// utils
import { parseDrillFilter } from '../utils/drillFilter';

type Router = ReturnType<typeof createMemoryRouter>;

function renderAt(path: string, store?: ProgressStore): Router {
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
  return router;
}

describe('parseDrillFilter', () => {
  it('reads domain, subject, topic, comma lists and unseen', () => {
    const params = new URLSearchParams('domain=languages&subject=javascript&topic=closures&level=mid,senior&kind=code,fix&unseen=1');
    expect(parseDrillFilter(params)).toEqual({ domain: 'languages', subject: 'javascript', topic: 'closures', levels: ['mid', 'senior'], kinds: ['code', 'fix'], unseen: true });
  });

  it('ignores unknown levels and kinds', () => {
    expect(parseDrillFilter(new URLSearchParams('level=god&kind=essay'))).toEqual({ unseen: false });
  });

  it('reads only=marked and only=missed and ignores other only values', () => {
    expect(parseDrillFilter(new URLSearchParams('only=marked'))).toEqual({ unseen: false, only: 'marked' });
    expect(parseDrillFilter(new URLSearchParams('only=missed'))).toEqual({ unseen: false, only: 'missed' });
    expect(parseDrillFilter(new URLSearchParams('only=unseen'))).toEqual({ unseen: false });
  });
});

describe('Drill page', () => {
  it('shows the first question and the position', () => {
    renderAt('/drill?subject=javascript');
    expect(screen.getByText(/1 \/ \d+/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit|reveal model answer/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('explains when nothing matches', () => {
    renderAt('/drill?subject=nothing');
    expect(screen.getByText(/no questions match/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Drill' })).toBeInTheDocument();
  });

  it('keeps unseen=1 working as unseen only', () => {
    const store = createProgressStore(null);
    store.record('javascript-closure-counter-independence', 1);
    renderAt('/drill?unseen=1', store);
    expect(screen.getByText(/1 \/ \d+/)).toBeInTheDocument();
  });

  it('drills only the questions marked for review with only=marked', () => {
    const store = createProgressStore(null);
    store.setFlag('javascript-closure-counter-independence', true);
    renderAt('/drill?only=marked', store);
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  it('drills only the missed questions with only=missed', () => {
    const store = createProgressStore(null);
    store.record('javascript-closure-counter-independence', 0.5);
    store.record('javascript-shallow-copy-nested', 1);
    renderAt('/drill?only=missed', store);
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });
});

describe('Drill setup card', () => {
  it('shows the setup card with the page heading when the URL has no filter', () => {
    renderAt('/drill');
    expect(screen.getByRole('heading', { level: 1, name: 'Drill' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Build a drill' })).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeDisabled();
    expect(screen.getByLabelText('Topic')).toBeDisabled();
    expect(screen.getByText(/\d+ questions match/)).toBeInTheDocument();
  });

  it('narrows the kind chips to the chosen scope and navigates with the built query', async () => {
    const user = userEvent.setup();
    const router = renderAt('/drill');
    const kinds = screen.getByRole('group', { name: 'Kind' });
    expect(within(kinds).getByRole('button', { name: /sql query/i })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Domain'), 'languages');
    expect(within(kinds).queryByRole('button', { name: /sql query/i })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Domain'), 'databases');
    await user.selectOptions(screen.getByLabelText('Subject'), 'sql');
    await user.click(within(screen.getByRole('group', { name: 'Kind' })).getByRole('button', { name: /sql query/i }));
    await user.click(within(screen.getByRole('group', { name: 'Level' })).getByRole('button', { name: /senior/i }));
    await user.click(within(screen.getByRole('group', { name: 'Only' })).getByRole('button', { name: 'Unseen' }));
    await user.click(screen.getByRole('button', { name: 'Start drill' }));

    expect(Object.fromEntries(new URLSearchParams(router.state.location.search))).toEqual({
      domain: 'databases',
      subject: 'sql',
      level: 'senior',
      kind: 'sql',
      unseen: '1',
    });
    expect(screen.getByText(/1 \/ \d+/)).toBeInTheDocument();
  });

  it('spells out every level when starting with nothing narrowed', async () => {
    const user = userEvent.setup();
    const router = renderAt('/drill');
    await user.click(screen.getByRole('button', { name: 'Start drill' }));
    expect(router.state.location.search).toBe('?level=junior%2Cmid%2Csenior');
    expect(screen.getByText(/1 \/ \d+/)).toBeInTheDocument();
  });
});
