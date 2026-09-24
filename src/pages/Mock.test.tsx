// packages
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// pages
import { Mock } from './Mock';

// contexts
import { ThemeProvider } from '../contexts/ThemeContext';
import { GraderProvider } from '../contexts/GraderContext';

// hooks
import { PreferencesProvider } from '../hooks/usePreferences';
import { ProgressProvider } from '../hooks/useProgress';

// engine
import { createProgressStore } from '../engine/progress';
import type { ProgressStore } from '../engine/progress';

function setup(store: ProgressStore = createProgressStore(null)): void {
  render(
    <MemoryRouter>
      <PreferencesProvider>
        <ThemeProvider>
          <ProgressProvider store={store}>
            <GraderProvider>
              <Mock />
            </GraderProvider>
          </ProgressProvider>
        </ThemeProvider>
      </PreferencesProvider>
    </MemoryRouter>,
  );
}

describe('Mock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a session with the chosen count and shows a timer', async () => {
    const user = userEvent.setup();
    setup();
    const questions = screen.getByRole('spinbutton', { name: 'Questions' });
    await user.clear(questions);
    await user.type(questions, '2');
    await user.click(screen.getByRole('button', { name: /start/i }));
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent(/^\d+:\d\d$/);
  });

  it('runs an untimed session without a clock', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('radio', { name: 'Untimed' }));
    expect(screen.getByRole('radio', { name: 'Untimed' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Timed' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(/^10 questions, untimed, from all domains · all levels · \d+ available$/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /start/i }));
    expect(screen.getByText(/1 \/ 10/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Time remaining')).not.toBeInTheDocument();
  });

  it('steps the format and shows the time per question', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByText('3 min each')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Increase Questions' }));
    await user.click(screen.getByRole('button', { name: 'Increase Questions' }));
    expect(screen.getByText('2.5 min each')).toBeInTheDocument();
    expect(screen.getByText(/^12 questions in 30 min from all domains · all levels · \d+ available$/)).toBeInTheDocument();
  });

  it('treats no level selected as every level and names the chosen scope', async () => {
    const user = userEvent.setup();
    setup();
    const start = screen.getByRole('button', { name: /start/i });
    for (const level of ['junior', 'mid', 'senior']) {
      await user.click(screen.getByRole('button', { name: new RegExp(`^${level}`, 'i') }));
    }
    expect(screen.getByText(/from all domains · all levels/)).toBeInTheDocument();
    for (const level of ['junior', 'mid', 'senior']) {
      await user.click(screen.getByRole('button', { name: new RegExp(`^${level}`, 'i') }));
    }
    expect(start).toBeEnabled();
    await user.click(screen.getByRole('button', { name: /^runtimes/i }));
    await user.click(screen.getByRole('button', { name: /^senior/i }));
    expect(screen.getByText(/from Runtimes · Senior · \d+ available$/)).toBeInTheDocument();
    expect(start).toBeEnabled();
  });

  it('disables Start when nothing matches the scope', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /^runtimes/i }));
    await user.click(screen.getByRole('button', { name: /^junior/i }));
    await user.click(screen.getByRole('button', { name: /^write code/i }));
    expect(screen.getByText(/· 0 available$/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled();
  });

  it('skips a question without recording it, and the results list it as skipped with no score', async () => {
    const user = userEvent.setup();
    const store = createProgressStore(null);
    setup(store);
    const questions = screen.getByRole('spinbutton', { name: 'Questions' });
    await user.clear(questions);
    await user.type(questions, '2');
    await user.click(screen.getByRole('radio', { name: 'Untimed' }));
    await user.click(screen.getByRole('button', { name: /^single choice/i }));
    await user.click(screen.getByRole('button', { name: /start/i }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    const actions = (): ReturnType<typeof within> => within(screen.getByRole('group', { name: /answer actions/i }));
    await user.click(actions().getByRole('button', { name: 'Skip' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(store.all()).toEqual({});

    await user.click(actions().getByRole('button', { name: /show answer/i }));
    await user.click(actions().getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /see results/i }));

    expect(screen.getByText('1 of 2 answered · average 0%')).toBeInTheDocument();
    const skipped = screen.getByText('skipped').closest('div');
    const shown = screen.getByText('0%').closest('div');
    if (skipped === null || shown === null) {
      throw new Error('result rows missing');
    }
    const idOf = (row: HTMLElement): string => within(row).getByRole('link').getAttribute('href')?.replace('/q/', '') ?? '';
    expect(store.get(idOf(skipped))).toBeUndefined();
    expect(store.get(idOf(shown))).toMatchObject({ attempts: 1, lastScore: 0 });
    expect(Object.keys(store.all())).toEqual([idOf(shown)]);
  });

  it('ignores progress recorded before the session started', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const user = userEvent.setup();
    const store = createProgressStore(null);
    store.record('javascript-closure-counter-independence', 1);
    setup(store);

    const questions = screen.getByRole('spinbutton', { name: 'Questions' });
    await user.clear(questions);
    await user.type(questions, '999');
    const minutes = screen.getByRole('spinbutton', { name: 'Minutes' });
    await user.clear(minutes);
    await user.type(minutes, '5');
    await user.click(screen.getByRole('button', { name: /start/i }));

    await act(async () => {
      vi.advanceTimersByTime(301_000);
    });

    expect(screen.getByText('Time is up.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /see results/i }));
    expect(screen.getByText(/0 of 50 answered/)).toBeInTheDocument();
  });
});
