// packages
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// components
import { QuestionView } from './QuestionView';

// contexts
import { ThemeProvider } from '../../contexts/ThemeContext';
import { GraderProvider } from '../../contexts/GraderContext';

// hooks
import { ProgressProvider } from '../../hooks/useProgress';

// engine
import { createProgressStore } from '../../engine/progress';
import { createStaticGrader } from '../../engine/staticGrader';
import { executeSource } from '../../engine/runner/execute';
import type { Question } from '../../engine/question';
import type { Grader } from '../../engine/grader';

const single: Question = {
  id: 'javascript-test-single',
  domain: 'languages',
  subject: 'javascript',
  topic: 'closures',
  level: 'junior',
  kind: 'single',
  prompt: 'Pick **B**',
  options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
  answer: 'b',
  tags: [],
  source: 'notion',
  explanation: 'Because B.',
};

const code: Question = {
  ...single,
  id: 'javascript-test-code',
  kind: 'code',
  language: 'javascript',
  prompt: 'Return 1',
  starter: 'export function solution() { return 0; }',
  tests: [{ name: 'one', args: [], expected: 1 }],
  solution: 'export function solution() { return 1; }',
};

const single2: Question = { ...single, id: 'javascript-test-single-2' };

function setup(question: Question, onNext = vi.fn()): { store: ReturnType<typeof createProgressStore>; onNext: typeof onNext } {
  const store = createProgressStore(null);
  const grader = createStaticGrader({
    runJs: (r) => executeSource(r.source, r.tests, r.language),
    runSql: async () => ({ status: 'error', columns: [], rows: [], error: 'not in test' }),
  });
  render(
    <MemoryRouter>
      <ThemeProvider>
        <ProgressProvider store={store}>
          <GraderProvider grader={grader}>
            <QuestionView question={question} onNext={onNext} />
          </GraderProvider>
        </ProgressProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
  return { store, onNext };
}

describe('QuestionView', () => {
  it('grades a single choice, shows the explanation and records progress', async () => {
    const user = userEvent.setup();
    const { store } = setup(single);
    await user.click(screen.getByRole('radio', { name: 'B' }));
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/correct/i)).toBeInTheDocument();
    expect(screen.getByText('Because B.')).toBeInTheDocument();
    expect(store.get('javascript-test-single')).toMatchObject({ attempts: 1, lastScore: 1 });
  });

  it('shows the option letter before each option', () => {
    setup(single);
    expect(screen.getByText('a)')).toBeVisible();
    expect(screen.getByText('b)')).toBeVisible();
  });

  it('shows feedback for a wrong answer and lets the user continue', async () => {
    const user = userEvent.setup();
    const { onNext } = setup(single);
    await user.click(screen.getByRole('radio', { name: 'A' }));
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText('Correct answer: B')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('toggles the flag', async () => {
    const user = userEvent.setup();
    const { store } = setup(single);
    await user.click(screen.getByRole('button', { name: /flag/i }));
    expect(store.get('javascript-test-single')?.flagged).toBe(true);
  });

  it('runs a code exercise through the grader', async () => {
    const user = userEvent.setup();
    const { store } = setup(code);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/one: expected 1, got 0/)).toBeInTheDocument();
    expect(store.get('javascript-test-code')?.lastScore).toBe(0);
  });

  it('resets answer state when the question changes', async () => {
    const user = userEvent.setup();
    const store = createProgressStore(null);
    const grader = createStaticGrader({
      runJs: (r) => executeSource(r.source, r.tests, r.language),
      runSql: async () => ({ status: 'error', columns: [], rows: [], error: 'not in test' }),
    });
    const { rerender } = render(
      <MemoryRouter>
        <ThemeProvider>
          <ProgressProvider store={store}>
            <GraderProvider grader={grader}>
              <QuestionView question={single} />
            </GraderProvider>
          </ProgressProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('radio', { name: 'B' }));
    rerender(
      <MemoryRouter>
        <ThemeProvider>
          <ProgressProvider store={store}>
            <GraderProvider grader={grader}>
              <QuestionView question={single2} />
            </GraderProvider>
          </ProgressProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });

  it('submits the typed text with an open answer', async () => {
    const user = userEvent.setup();
    const store = createProgressStore(null);
    const grade = vi.fn<Grader['grade']>(async () => ({ score: 1, verdict: 'self', feedback: [] }));
    const open: Question = { ...single, id: 'javascript-test-open', kind: 'open', modelAnswer: 'Model.', rubric: ['one', 'two'] };
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ProgressProvider store={store}>
            <GraderProvider grader={{ grade }}>
              <QuestionView question={open} />
            </GraderProvider>
          </ProgressProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
    await user.type(screen.getByPlaceholderText(/say it out loud/i), 'Closures capture bindings');
    await user.click(screen.getByRole('button', { name: /reveal model answer/i }));
    await user.click(screen.getByRole('checkbox', { name: 'one' }));
    await user.click(screen.getByRole('button', { name: /submit self-score/i }));
    expect(grade).toHaveBeenCalledWith(open, { kind: 'open', checked: [true, false], text: 'Closures capture bindings' });
  });

  it('shows an error when grading fails', async () => {
    const user = userEvent.setup();
    const store = createProgressStore(null);
    const grader: Grader = { grade: async () => Promise.reject(new Error('worker died')) };
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ProgressProvider store={store}>
            <GraderProvider grader={grader}>
              <QuestionView question={single} />
            </GraderProvider>
          </ProgressProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('radio', { name: 'B' }));
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/worker died/);
    expect(store.get(single.id)).toBeUndefined();
  });
});
