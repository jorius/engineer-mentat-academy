// packages
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// pages
import { Review } from './Review';

// contexts
import { ThemeProvider } from '../contexts/ThemeContext';
import { GraderProvider } from '../contexts/GraderContext';

// hooks
import { PreferencesProvider } from '../hooks/usePreferences';
import { ProgressProvider } from '../hooks/useProgress';

// engine
import { createProgressStore } from '../engine/progress';
import type { ProgressStore } from '../engine/progress';
import { loadQuestions } from '../engine/registry';

function setup(store: ProgressStore): void {
  render(
    <MemoryRouter>
      <PreferencesProvider>
        <ThemeProvider>
          <ProgressProvider store={store}>
            <GraderProvider>
              <Review />
            </GraderProvider>
          </ProgressProvider>
        </ThemeProvider>
      </PreferencesProvider>
    </MemoryRouter>,
  );
}

describe('Review', () => {
  it('skips through the queue without recording anything, so every question stays in Review', async () => {
    const user = userEvent.setup();
    const store = createProgressStore(null);
    const missed = loadQuestions().filter((q) => q.kind === 'single').slice(0, 2);
    missed.forEach((q) => store.record(q.id, 0));
    const before = store.all();
    setup(store);

    await user.click(screen.getByRole('button', { name: 'Drill all 2' }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    const skip = (): HTMLElement => within(screen.getByRole('group', { name: /answer actions/i })).getByRole('button', { name: 'Skip' });
    await user.click(skip());
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    await user.click(skip());

    expect(screen.getByRole('heading', { name: 'Review complete' })).toBeInTheDocument();
    expect(store.all()).toEqual(before);
    await user.click(screen.getByRole('button', { name: 'Back to the list' }));
    expect(screen.getByRole('button', { name: 'Drill all 2' })).toBeEnabled();
  });
});
