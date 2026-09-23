// packages
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

// components
import { routes } from '../App';

// contexts
import { ThemeProvider } from '../contexts/ThemeContext';
import { GraderProvider } from '../contexts/GraderContext';

// hooks
import { ProgressProvider } from '../hooks/useProgress';

// utils
import { parseDrillFilter } from '../utils/drillFilter';

function renderAt(path: string): void {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <ThemeProvider>
      <ProgressProvider>
        <GraderProvider>
          <RouterProvider router={router} />
        </GraderProvider>
      </ProgressProvider>
    </ThemeProvider>,
  );
}

describe('parseDrillFilter', () => {
  it('reads domain, subject, topic, comma lists and unseen', () => {
    const params = new URLSearchParams('domain=languages&subject=javascript&topic=closures&level=mid,senior&kind=code,fix&unseen=1');
    expect(parseDrillFilter(params)).toEqual({ domain: 'languages', subject: 'javascript', topic: 'closures', levels: ['mid', 'senior'], kinds: ['code', 'fix'], unseen: true });
  });

  it('ignores unknown levels and kinds', () => {
    expect(parseDrillFilter(new URLSearchParams('level=god&kind=essay'))).toEqual({ unseen: false });
  });
});

describe('Drill page', () => {
  it('shows the first question and the position', () => {
    renderAt('/drill?subject=javascript');
    expect(screen.getByText(/1 \/ \d+/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit|reveal model answer/i })).toBeInTheDocument();
  });

  it('explains when nothing matches', () => {
    renderAt('/drill?subject=nothing');
    expect(screen.getByText(/no questions match/i)).toBeInTheDocument();
  });
});
