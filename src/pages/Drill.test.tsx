// packages
import { StrictMode } from 'react';
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
import { DRILLS_KEY, createDrillsStore } from '../engine/drills';
import type { DrillsStore, SavedDrill } from '../engine/drills';
import { createProgressStore } from '../engine/progress';
import type { ProgressStore, QuestionProgress } from '../engine/progress';
import { loadQuestions } from '../engine/registry';

// hooks
import { PreferencesProvider } from '../hooks/usePreferences';
import { ProgressProvider } from '../hooks/useProgress';
import { DrillsProvider } from '../hooks/useDrills';

// utils
import { parseDrillFilter } from '../utils/drillFilter';

type Router = ReturnType<typeof createMemoryRouter>;

const STARTED = '2026-01-01T00:00:00.000Z';
const EARLIER = '2025-12-01T00:00:00.000Z';
const LATER = '2026-02-01T00:00:00.000Z';

// Three single-choice questions from the bank, so Show answer resolves each one without the grader.
const IDS = loadQuestions()
  .filter((q) => q.kind === 'single')
  .slice(0, 3)
  .map((q) => q.id);

function renderAt(path: string, options?: { progress?: ProgressStore; drills?: DrillsStore; strict?: boolean }): { router: Router; drills: DrillsStore } {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const drills = options?.drills ?? createDrillsStore(null);
  const tree = (
    <PreferencesProvider>
      <ThemeProvider>
        <ProgressProvider store={options?.progress}>
          <DrillsProvider store={drills}>
            <GraderProvider>
              <RouterProvider router={router} />
            </GraderProvider>
          </DrillsProvider>
        </ProgressProvider>
      </ThemeProvider>
    </PreferencesProvider>
  );
  render(options?.strict === true ? <StrictMode>{tree}</StrictMode> : tree);
  return { router, drills };
}

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length(): number {
      return map.size;
    },
    clear: (): void => map.clear(),
    getItem: (key: string): string | null => map.get(key) ?? null,
    key: (index: number): string | null => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string): void => {
      map.delete(key);
    },
    setItem: (key: string, value: string): void => {
      map.set(key, value);
    },
  };
}

/** A drills store holding one drill started at `STARTED`, so progress timestamps decide what is done. */
function seededDrills(questionIds: string[] = IDS): { drills: DrillsStore; drill: SavedDrill } {
  const drill: SavedDrill = { id: 'saved-1', query: 'subject=javascript', questionIds, createdAt: STARTED, startedAt: STARTED };
  const storage = memoryStorage();
  storage.setItem(DRILLS_KEY, JSON.stringify([drill]));
  return { drills: createDrillsStore(storage), drill };
}

/** A progress store where each id was last recorded at the given time. */
function progressAt(entries: Record<string, string>): ProgressStore {
  const store = createProgressStore(null);
  const map: Record<string, QuestionProgress> = {};
  for (const [id, lastAt] of Object.entries(entries)) {
    map[id] = { attempts: 1, lastScore: 1, lastAt, flagged: false, notes: '' };
  }
  store.importJson(JSON.stringify(map));
  return store;
}

function currentQuestionId(): string | undefined {
  return screen.getByRole('link', { name: 'Copy link to this question' }).getAttribute('href')?.replace('/q/', '');
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

describe('Drill creator', () => {
  it('creates exactly one drill and redirects to it', async () => {
    const { router, drills } = renderAt('/drill?domain=languages&subject=typescript', { strict: true });
    expect(await screen.findByText(/1 \/ \d+/)).toBeInTheDocument();
    const all = drills.all();
    expect(all).toHaveLength(1);
    const drill = all[0];
    expect(drill?.query).toBe('domain=languages&subject=typescript');
    expect(drill?.questionIds.length).toBeGreaterThan(1);
    expect(router.state.location.pathname).toBe(`/drill/${drill?.id ?? ''}`);
    expect(router.state.location.search).toBe('');
    expect(screen.getByRole('button', { name: /submit|reveal model answer/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('explains when nothing matches and creates nothing', () => {
    const { router, drills } = renderAt('/drill?subject=nothing');
    expect(screen.getByText(/no questions match/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Drill' })).toBeInTheDocument();
    expect(drills.all()).toEqual([]);
    expect(router.state.location.search).toBe('?subject=nothing');
  });

  it('keeps unseen=1 working as unseen only', async () => {
    const progress = progressAt({ 'javascript-closure-counter-independence': EARLIER });
    const { drills } = renderAt('/drill?unseen=1', { progress });
    expect(await screen.findByText(/1 \/ \d+/)).toBeInTheDocument();
    expect(drills.all()[0]?.questionIds).not.toContain('javascript-closure-counter-independence');
  });

  it('drills only the questions marked for review with only=marked', async () => {
    const progress = createProgressStore(null);
    progress.setFlag('javascript-closure-counter-independence', true);
    const { drills } = renderAt('/drill?only=marked', { progress });
    expect(await screen.findByText('1 / 1')).toBeInTheDocument();
    expect(drills.all()[0]?.questionIds).toEqual(['javascript-closure-counter-independence']);
  });

  it('drills only the missed questions with only=missed', async () => {
    const progress = createProgressStore(null);
    progress.importJson(
      JSON.stringify({
        'javascript-closure-counter-independence': { attempts: 1, lastScore: 0.5, lastAt: EARLIER, flagged: false, notes: '' },
        'javascript-shallow-copy-nested': { attempts: 1, lastScore: 1, lastAt: EARLIER, flagged: false, notes: '' },
      }),
    );
    const { drills } = renderAt('/drill?only=missed', { progress });
    expect(await screen.findByText('1 / 1')).toBeInTheDocument();
    expect(drills.all()[0]?.questionIds).toEqual(['javascript-closure-counter-independence']);
  });
});

describe('Saved drill', () => {
  it('resumes at the first question not answered since the drill started', () => {
    const { drills, drill } = seededDrills();
    renderAt(`/drill/${drill.id}`, { drills, progress: progressAt({ [IDS[0] ?? '']: LATER, [IDS[2] ?? '']: EARLIER }) });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(currentQuestionId()).toBe(IDS[1]);
  });

  it('keeps the answered question on screen until Next, then moves on', async () => {
    const user = userEvent.setup();
    const { drills, drill } = seededDrills();
    const progress = createProgressStore(null);
    renderAt(`/drill/${drill.id}`, { drills, progress });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(progress.get(IDS[0] ?? '')).toBeDefined();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(currentQuestionId()).toBe(IDS[0]);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(currentQuestionId()).toBe(IDS[1]);
  });

  it('shows the completion screen when every question is done, and Restart starts over', async () => {
    const user = userEvent.setup();
    const { drills, drill } = seededDrills();
    renderAt(`/drill/${drill.id}`, { drills, progress: progressAt(Object.fromEntries(IDS.map((id) => [id, LATER]))) });
    expect(screen.getByRole('heading', { level: 1, name: 'Drill complete' })).toBeInTheDocument();
    expect(screen.getByText('You went through 3 questions.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My drills' })).toHaveAttribute('href', '/drill');
    expect(screen.getByRole('link', { name: 'Review misses' })).toHaveAttribute('href', '/review');
    await user.click(screen.getByRole('button', { name: 'Restart' }));
    expect(drills.get(drill.id)?.startedAt).not.toBe(STARTED);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(currentQuestionId()).toBe(IDS[0]);
  });

  it('shows the completion screen after Next on the last question', async () => {
    const user = userEvent.setup();
    const { drills, drill } = seededDrills();
    renderAt(`/drill/${drill.id}`, { drills, progress: progressAt({ [IDS[0] ?? '']: LATER, [IDS[1] ?? '']: LATER }) });
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(screen.queryByRole('heading', { name: 'Drill complete' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Drill complete' })).toBeInTheDocument();
  });

  it('says the drill no longer exists for an unknown id', () => {
    renderAt('/drill/nope');
    expect(screen.getByText('This drill no longer exists.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My drills' })).toHaveAttribute('href', '/drill');
  });

  it('skips ids that are no longer in the bank and says so when none remain', () => {
    const { drills, drill } = seededDrills(['gone-1', 'gone-2']);
    renderAt(`/drill/${drill.id}`, { drills });
    expect(screen.getByText('This drill no longer exists.')).toBeInTheDocument();
  });

  it('does not count a removed question', () => {
    const { drills, drill } = seededDrills([IDS[0] ?? '', 'gone-1', IDS[1] ?? '']);
    renderAt(`/drill/${drill.id}`, { drills });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('rotates a skipped question to the end of the drill', async () => {
    const user = userEvent.setup();
    const { drills, drill } = seededDrills();
    renderAt(`/drill/${drill.id}`, { drills, progress: progressAt({ [IDS[0] ?? '']: LATER }) });
    expect(currentQuestionId()).toBe(IDS[1]);
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(drills.get(drill.id)?.questionIds).toEqual([IDS[0], IDS[2], IDS[1]]);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(currentQuestionId()).toBe(IDS[2]);
  });

  it('hides Skip when only one unanswered question remains', () => {
    const { drills, drill } = seededDrills();
    renderAt(`/drill/${drill.id}`, { drills, progress: progressAt({ [IDS[0] ?? '']: LATER, [IDS[1] ?? '']: LATER }) });
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();
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
    const { drills } = renderAt('/drill');
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

    expect(await screen.findByText(/1 \/ \d+/)).toBeInTheDocument();
    expect(Object.fromEntries(new URLSearchParams(drills.all()[0]?.query))).toEqual({
      domain: 'databases',
      subject: 'sql',
      level: 'senior',
      kind: 'sql',
      unseen: '1',
    });
  });

  it('spells out every level when starting with nothing narrowed', async () => {
    const user = userEvent.setup();
    const { router, drills } = renderAt('/drill');
    await user.click(screen.getByRole('button', { name: 'Start drill' }));
    expect(await screen.findByText(/1 \/ \d+/)).toBeInTheDocument();
    expect(drills.all()).toHaveLength(1);
    expect(drills.all()[0]?.query).toBe('level=junior%2Cmid%2Csenior');
    expect(router.state.location.pathname).toBe(`/drill/${drills.all()[0]?.id ?? ''}`);
  });
});
