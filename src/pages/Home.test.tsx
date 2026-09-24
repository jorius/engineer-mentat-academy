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
import { createDrillsStore } from '../engine/drills';
import type { DrillsStore } from '../engine/drills';
import { createProgressStore } from '../engine/progress';
import type { ProgressStore } from '../engine/progress';
import { loadQuestions } from '../engine/registry';

// hooks
import { PreferencesProvider } from '../hooks/usePreferences';
import { ProgressProvider } from '../hooks/useProgress';
import { DrillsProvider } from '../hooks/useDrills';

const IDS = loadQuestions()
  .slice(0, 3)
  .map((q) => q.id);
const OTHER = loadQuestions()[3]?.id ?? '';

function renderHome(drills: DrillsStore, progress: ProgressStore): void {
  const router = createMemoryRouter(routes, { initialEntries: ['/'] });
  render(
    <PreferencesProvider>
      <ThemeProvider>
        <ProgressProvider store={progress}>
          <DrillsProvider store={drills}>
            <GraderProvider>
              <RouterProvider router={router} />
            </GraderProvider>
          </DrillsProvider>
        </ProgressProvider>
      </ThemeProvider>
    </PreferencesProvider>,
  );
}

describe('Home', () => {
  it('links to the unfinished drill with its name and progress', () => {
    const drills = createDrillsStore(null);
    const progress = createProgressStore(null);
    const drill = drills.create({ query: 'domain=languages&subject=typescript', questionIds: IDS });
    progress.record(IDS[0] ?? '', 1);
    renderHome(drills, progress);
    expect(screen.getByRole('link', { name: 'Continue: TypeScript · all levels · all kinds · 1 / 3' })).toHaveAttribute('href', `/drill/${drill.id}`);
  });

  it('continues the most recent drill that is not finished, by its custom name', () => {
    const drills = createDrillsStore(null);
    const progress = createProgressStore(null);
    const open = drills.create({ query: 'domain=languages&subject=typescript', questionIds: IDS });
    drills.rename(open.id, 'Warm-up');
    progress.record(IDS[0] ?? '', 1);
    progress.record(IDS[1] ?? '', 1);
    const finished = drills.create({ query: 'domain=databases&subject=sql', questionIds: [OTHER] });
    progress.record(OTHER, 1);
    expect(drills.all()[0]?.id).toBe(finished.id);
    renderHome(drills, progress);
    expect(screen.getByRole('link', { name: 'Continue: Warm-up · 2 / 3' })).toHaveAttribute('href', `/drill/${open.id}`);
  });

  it('shows no continue link without saved drills', () => {
    renderHome(createDrillsStore(null), createProgressStore(null));
    expect(screen.getByRole('link', { name: 'Drill unseen' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Continue:/ })).not.toBeInTheDocument();
  });

  it('shows no continue link when every drill is finished', () => {
    const drills = createDrillsStore(null);
    const progress = createProgressStore(null);
    drills.create({ query: 'domain=languages&subject=typescript', questionIds: IDS });
    IDS.forEach((id) => progress.record(id, 1));
    renderHome(drills, progress);
    expect(screen.queryByRole('link', { name: /^Continue:/ })).not.toBeInTheDocument();
  });
});
