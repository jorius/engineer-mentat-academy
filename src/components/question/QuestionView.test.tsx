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
});
