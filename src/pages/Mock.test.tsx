// packages
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// pages
import { Mock } from './Mock';

// contexts
import { ThemeProvider } from '../contexts/ThemeContext';
import { GraderProvider } from '../contexts/GraderContext';

// hooks
import { ProgressProvider } from '../hooks/useProgress';

// engine
import { createProgressStore } from '../engine/progress';

function setup(): void {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <ProgressProvider store={createProgressStore(null)}>
          <GraderProvider>
            <Mock />
          </GraderProvider>
        </ProgressProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('Mock', () => {
  it('starts a session with the chosen count and shows a timer', async () => {
    const user = userEvent.setup();
    setup();
    await user.clear(screen.getByLabelText(/questions/i));
    await user.type(screen.getByLabelText(/questions/i), '2');
    await user.click(screen.getByRole('button', { name: /start/i }));
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();
    expect(screen.getByText(/\d+:\d\d/)).toBeInTheDocument();
  });

  it('refuses to start with no level selected', async () => {
    const user = userEvent.setup();
    setup();
    for (const level of ['junior', 'mid', 'senior']) {
      await user.click(screen.getByLabelText(level));
    }
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled();
  });
});
