// packages
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// pages
import { Settings } from './Settings';

// hooks
import { ProgressProvider } from '../hooks/useProgress';

// engine
import { createProgressStore } from '../engine/progress';

describe('Settings', () => {
  it('imports a progress file', async () => {
    const user = userEvent.setup();
    const store = createProgressStore(null);
    render(
      <MemoryRouter>
        <ProgressProvider store={store}>
          <Settings />
        </ProgressProvider>
      </MemoryRouter>,
    );
    const file = new File([JSON.stringify({ q1: { attempts: 1, lastScore: 1, lastAt: '', flagged: false, notes: '' } })], 'progress.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText(/import progress/i), file);
    expect(await screen.findByText(/imported 1/i)).toBeInTheDocument();
    expect(store.get('q1')?.attempts).toBe(1);
  });

  it('reports an invalid import', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProgressProvider store={createProgressStore(null)}>
          <Settings />
        </ProgressProvider>
      </MemoryRouter>,
    );
    await user.upload(screen.getByLabelText(/import progress/i), new File(['[1]'], 'bad.json', { type: 'application/json' }));
    expect(await screen.findByText(/not a progress map/i)).toBeInTheDocument();
  });

  it('shows the AI grader as coming later', () => {
    render(
      <MemoryRouter>
        <ProgressProvider store={createProgressStore(null)}>
          <Settings />
        </ProgressProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('checkbox', { name: /claude grader/i })).toBeDisabled();
  });
});
