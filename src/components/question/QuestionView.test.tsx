// packages
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { JSX } from 'react';

// components
import { QuestionView } from './QuestionView';

// contexts
import { ThemeProvider } from '../../contexts/ThemeContext';
import { GraderProvider } from '../../contexts/GraderContext';

// hooks
import { PreferencesProvider } from '../../hooks/usePreferences';
import { ProgressProvider } from '../../hooks/useProgress';

// engine
import { createPreferencesStore } from '../../engine/preferences';
import type { MaxAttempts } from '../../engine/preferences';
import { createProgressStore } from '../../engine/progress';
import type { ProgressStore } from '../../engine/progress';
import { createStaticGrader } from '../../engine/staticGrader';
import { executeSource } from '../../engine/runner/execute';
import type { Question, SingleQuestion } from '../../engine/question';
import type { Grader } from '../../engine/grader';
import { indexById, loadQuestions } from '../../engine/registry';

// utils
import { orderOptions } from '../../utils/optionOrder';

// i18n
import i18n from '../../i18n';

const single: SingleQuestion = {
  id: 'javascript-test-single',
  domain: 'languages',
  subject: 'javascript',
  topic: 'closures',
  level: 'junior',
  kind: 'single',
  prompt: 'Pick **B**',
  options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }],
  answer: 'b',
  tags: [],
  source: 'notion',
  explanation: 'Because B.',
};

const single2: Question = { ...single, id: 'javascript-test-single-2' };

const multi: Question = {
  ...single,
  id: 'javascript-test-multi',
  kind: 'multi',
  prompt: 'Pick A and B',
  answer: ['a', 'b'],
};

const predict: Question = {
  ...single,
  id: 'javascript-test-predict',
  kind: 'predict',
  prompt: 'What prints?',
  language: 'javascript',
  code: 'console.log(1);',
  answer: '1',
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

const open: Question = { ...single, id: 'javascript-test-open', kind: 'open', modelAnswer: 'Model.', rubric: ['one', 'two'] };

type SetupOptions = { maxAttempts?: MaxAttempts; onNext?: (() => void) | null; grader?: Grader; store?: ProgressStore };

function staticGrader(): Grader {
  return createStaticGrader({
    runJs: (r) => executeSource(r.source, r.tests, r.language),
    runSql: async () => ({ status: 'error', columns: [], rows: [], error: 'not in test' }),
  });
}

function tree(question: Question, options: SetupOptions, store: ProgressStore, onNext: (() => void) | undefined): JSX.Element {
  const preferences = createPreferencesStore(null);
  preferences.set({ maxAttempts: options.maxAttempts ?? 3 });
  return (
    <MemoryRouter>
      <PreferencesProvider store={preferences}>
        <ThemeProvider>
          <ProgressProvider store={store}>
            <GraderProvider grader={options.grader ?? staticGrader()}>
              <QuestionView question={question} onNext={onNext} />
            </GraderProvider>
          </ProgressProvider>
        </ThemeProvider>
      </PreferencesProvider>
    </MemoryRouter>
  );
}

function setup(question: Question, options: SetupOptions = {}): { store: ProgressStore; onNext: ReturnType<typeof vi.fn>; container: HTMLElement } {
  const store = options.store ?? createProgressStore(null);
  const onNext = vi.fn();
  const { container } = render(tree(question, options, store, options.onNext === null ? undefined : (options.onNext ?? onNext)));
  return { store, onNext, container };
}

function actionBar(): HTMLElement {
  return screen.getByRole('group', { name: /answer actions/i });
}

function button(name: RegExp): HTMLElement {
  return within(actionBar()).getByRole('button', { name });
}

describe('QuestionView', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('lays out the panes in a two-column grid over a sticky action bar', () => {
    const { container } = setup(single);
    expect(container.querySelector('.grid.md\\:grid-cols-2')).not.toBeNull();
    expect(actionBar()).toHaveClass('sticky', 'bottom-0');
    expect(within(actionBar()).getAllByRole('button').map((b) => b.textContent)).toEqual(['Show answer', 'Submit', 'Next →']);
    expect(within(actionBar()).getByText('3 attempts left')).toBeInTheDocument();
    expect(button(/next/i)).toHaveAccessibleName('Next');
  });

  it('shows domain, subject and topic as a breadcrumb', () => {
    setup(single);
    const breadcrumb = within(screen.getByRole('navigation', { name: 'Where this question belongs' }));
    expect(breadcrumb.getByRole('link', { name: 'Languages' })).toHaveAttribute('href', '/browse/languages');
    expect(breadcrumb.getByRole('link', { name: 'JavaScript' })).toHaveAttribute('href', '/browse/languages/javascript');
    expect(breadcrumb.getByText('Closures')).toBeInTheDocument();
  });

  it('gives the answer pane the wider column for typing kinds', () => {
    const { container } = setup(code);
    expect(container.querySelector('.grid.md\\:grid-cols-\\[2fr_3fr\\]')).not.toBeNull();
    expect(container.querySelector('.grid.md\\:grid-cols-2')).toBeNull();
  });

  it('hides Next when the caller passes no onNext and offers Reset only for editable answers', () => {
    setup(code, { onNext: null });
    expect(within(actionBar()).getAllByRole('button').map((b) => b.textContent)).toEqual(['Reset', 'Show answer', 'Submit']);
  });

  it('shows the position letter before each option in the stable shuffled order', () => {
    const named: SingleQuestion = {
      ...single,
      options: [{ id: 'a', text: 'Alpha' }, { id: 'b', text: 'Beta' }, { id: 'c', text: 'Gamma' }],
    };
    setup(named);
    const ordered = orderOptions(named.options, named.id);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual(ordered.map((option) => option.text));
    radios.forEach((radio, index) => expect(within(radio).getByText(String.fromCharCode(65 + index))).toBeVisible());
  });

  it('locks a wrong pick without revealing the key, then records 1 once when solved on a retry', async () => {
    const user = userEvent.setup();
    const { store, onNext } = setup(single);
    await user.click(screen.getByRole('radio', { name: 'A' }));
    await user.click(button(/submit/i));

    expect(await screen.findByText('Not yet. Try again, or show the answer.')).toBeInTheDocument();
    expect(screen.queryByText(/correct answer/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Because B.')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'A' })).toHaveAttribute('aria-disabled', 'true');
    expect(within(actionBar()).getByText('Attempt 2 of 3')).toBeInTheDocument();
    expect(button(/next/i)).toBeDisabled();
    expect(store.get(single.id)).toBeUndefined();

    await user.click(screen.getByRole('radio', { name: 'B' }));
    await user.click(button(/submit/i));
    expect(await screen.findByText('Because B.')).toBeInTheDocument();
    expect(screen.getByText(/correct · 100%/i)).toBeInTheDocument();
    expect(within(actionBar()).getByText('Solved · attempt 2 of 3')).toBeInTheDocument();
    expect(store.get(single.id)).toMatchObject({ attempts: 1, lastScore: 1 });
    expect(button(/submit/i)).toBeDisabled();

    await user.click(button(/next/i));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(store.get(single.id)?.attempts).toBe(1);
  });

  it('marks a question solved after a wrong attempt for review and says so', async () => {
    const user = userEvent.setup();
    const { store } = setup(single);
    await user.click(screen.getByRole('radio', { name: 'A' }));
    await user.click(button(/submit/i));
    await screen.findByText('Not yet. Try again, or show the answer.');
    await user.click(screen.getByRole('radio', { name: 'B' }));
    await user.click(button(/submit/i));
    expect(await screen.findByText("Solved after a retry, so it's marked for review")).toBeInTheDocument();
    expect(store.get(single.id)).toMatchObject({ attempts: 1, lastScore: 1, flagged: true });
  });

  it('does not mark a question solved on the first attempt', async () => {
    const user = userEvent.setup();
    const { store } = setup(single);
    await user.click(screen.getByRole('radio', { name: 'B' }));
    await user.click(button(/submit/i));
    await screen.findByText('Because B.');
    expect(store.get(single.id)).toMatchObject({ attempts: 1, lastScore: 1, flagged: false });
    expect(screen.queryByText(/solved after a retry/i)).not.toBeInTheDocument();
  });

  it('moves focus to the first unlocked option after a wrong single-choice submit', async () => {
    const user = userEvent.setup();
    setup(single);
    await user.click(screen.getByRole('radio', { name: 'A' }));
    await user.click(button(/submit/i));
    await screen.findByText('Not yet. Try again, or show the answer.');
    const firstUnlocked = orderOptions(single.options, single.id).find((option) => option.id !== 'a');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: firstUnlocked?.text }));
  });

  it('moves focus to Next when the question resolves', async () => {
    const user = userEvent.setup();
    setup(single);
    await user.click(screen.getByRole('radio', { name: 'B' }));
    await user.click(button(/submit/i));
    await screen.findByText('Because B.');
    expect(document.activeElement).toBe(button(/next/i));
  });

  it('moves focus to the feedback panel when the question resolves without Next', async () => {
    const user = userEvent.setup();
    setup(single, { onNext: null });
    await user.click(screen.getByRole('radio', { name: 'B' }));
    await user.click(button(/submit/i));
    const explanation = await screen.findByText('Because B.');
    const panel = document.activeElement;
    expect(panel).toHaveAttribute('tabindex', '-1');
    expect(panel).toContainElement(explanation);
    expect(panel).toHaveTextContent(/correct · 100%/i);
  });

  it('records 0 once and reveals the correct option when attempts run out', async () => {
    const user = userEvent.setup();
    const { store } = setup(single, { maxAttempts: 2 });
    await user.click(screen.getByRole('radio', { name: 'A' }));
    await user.click(button(/submit/i));
    await screen.findByText('Not yet. Try again, or show the answer.');
    await user.click(screen.getByRole('radio', { name: 'C' }));
    await user.click(button(/submit/i));

    expect(await screen.findByText('Correct answer: B')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'B' })).toHaveTextContent('✓');
    expect(screen.getByText('Because B.')).toBeInTheDocument();
    expect(within(actionBar()).getByText('Out of attempts')).toBeInTheDocument();
    expect(store.get(single.id)).toMatchObject({ attempts: 1, lastScore: 0 });
  });

  it('show answer records 0, reveals the correct option and opens the explanation', async () => {
    const user = userEvent.setup();
    const { store } = setup(single);
    await user.click(button(/show answer/i));
    expect(screen.getByRole('radio', { name: 'B' })).toHaveTextContent('✓');
    expect(screen.getByText('Because B.')).toBeInTheDocument();
    expect(within(actionBar()).getByText('Answer shown')).toBeInTheDocument();
    expect(button(/show answer/i)).toBeDisabled();
    expect(button(/next/i)).toBeEnabled();
    expect(store.get(single.id)).toMatchObject({ attempts: 1, lastScore: 0 });
  });

  it('highlights the correct option after Show answer even when it is not listed first', async () => {
    const user = userEvent.setup();
    setup(single);
    const ordered = orderOptions(single.options, single.id);
    const position = ordered.findIndex((option) => option.id === 'b');
    expect(position).toBeGreaterThan(0);
    await user.click(button(/show answer/i));
    const radios = screen.getAllByRole('radio');
    expect(radios[position]).toHaveAccessibleName('B');
    expect(radios[position]).toHaveClass('border-emerald-500/50');
    expect(radios[position]).toHaveTextContent('✓');
    expect(radios.filter((radio) => radio.textContent?.includes('✓'))).toHaveLength(1);
  });

  it('keeps multi-choice selections editable after a wrong submit without naming the missing options', async () => {
    const user = userEvent.setup();
    const { store } = setup(multi);
    await user.click(screen.getByRole('checkbox', { name: 'A' }));
    await user.click(button(/submit/i));
    expect(await screen.findByText('Not yet. Try again, or show the answer.')).toBeInTheDocument();
    expect(screen.queryByText(/missing/i)).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'A' })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('checkbox', { name: 'B' }));
    await user.click(button(/submit/i));
    expect(await screen.findByText('Because B.')).toBeInTheDocument();
    expect(store.get(multi.id)?.lastScore).toBe(1);
  });

  it('shows the failing tests of a wrong code submit and keeps the attempt open', async () => {
    const user = userEvent.setup();
    const { store } = setup(code);
    await user.click(button(/submit/i));
    expect(await screen.findByText(/one: solution\(\) expected 1, got 0/)).toBeInTheDocument();
    expect(screen.getByText('Not yet. Try again, or show the answer.')).toBeInTheDocument();
    expect(store.get(code.id)).toBeUndefined();
  });

  it('show answer fills the code editor with the reference solution, read-only', async () => {
    const user = userEvent.setup();
    const { store } = setup(code);
    await user.click(button(/show answer/i));
    const editor = screen.getByLabelText('Solution');
    expect(editor).toHaveTextContent('return 1;');
    expect(editor.getAttribute('aria-readonly')).toBe('true');
    expect(button(/reset/i)).toBeDisabled();
    expect(store.get(code.id)?.lastScore).toBe(0);
  });

  it('shows the reference solution read-only when a code question runs out of attempts', async () => {
    const user = userEvent.setup();
    const { store } = setup(code, { maxAttempts: 1 });
    await user.click(button(/submit/i));
    expect(await screen.findByText('Because B.')).toBeInTheDocument();
    const editor = screen.getByLabelText('Solution');
    expect(editor).toHaveTextContent('return 1;');
    expect(editor.getAttribute('aria-readonly')).toBe('true');
    expect(within(actionBar()).getByText('Out of attempts')).toBeInTheDocument();
    expect(store.get(code.id)).toMatchObject({ attempts: 1, lastScore: 0 });
  });

  it('reset clears a predict answer and keeps the attempts used', async () => {
    const user = userEvent.setup();
    setup(predict);
    expect(screen.getByLabelText('Program')).toHaveTextContent('console.log(1);');
    await user.type(screen.getByLabelText(/expected output/i), '2');
    await user.click(button(/submit/i));
    expect(await screen.findByText('Line 1: got "2"')).toBeInTheDocument();
    await user.click(button(/reset/i));
    expect(screen.getByLabelText(/expected output/i)).toHaveValue('');
    expect(within(actionBar()).getByText('Attempt 2 of 3')).toBeInTheDocument();
    expect(screen.queryByText('Not yet. Try again, or show the answer.')).not.toBeInTheDocument();
  });

  it('hides the expected predict output while attempts remain and shows it once resolved', async () => {
    const user = userEvent.setup();
    setup(predict, { maxAttempts: 2 });
    await user.type(screen.getByLabelText(/expected output/i), '2');
    await user.click(button(/submit/i));
    expect(await screen.findByText('Line 1: got "2"')).toBeInTheDocument();
    expect(screen.queryByText(/expected "1"/)).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText(/expected output/i));
    await user.type(screen.getByLabelText(/expected output/i), '3');
    await user.click(button(/submit/i));
    expect(await screen.findByText('Line 1: expected "1", got "3"')).toBeInTheDocument();
    expect(within(actionBar()).getByText('Out of attempts')).toBeInTheDocument();
  });

  it('shows the predict reference read-only under a Reference answer caption', async () => {
    const user = userEvent.setup();
    setup(predict);
    expect(screen.queryByText('Reference answer')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/expected output/i), '2');
    await user.click(button(/show answer/i));
    expect(screen.getByText('Reference answer')).toBeInTheDocument();
    const output = screen.getByLabelText(/expected output/i);
    expect(output).toHaveValue('1');
    expect(output).toHaveAttribute('readonly');
    expect(output).toBeEnabled();
  });

  it('submits with Ctrl+Enter from inside the answer textarea', async () => {
    const user = userEvent.setup();
    const { store } = setup(predict);
    await user.type(screen.getByLabelText(/expected output/i), '1');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(await screen.findByText('Because B.')).toBeInTheDocument();
    expect(store.get(predict.id)?.lastScore).toBe(1);
  });

  it('N moves on only once resolved, and letters typed into an answer never trigger shortcuts', async () => {
    const user = userEvent.setup();
    const { store, onNext } = setup(predict);
    await user.type(screen.getByLabelText(/expected output/i), 'nm');
    expect(store.get(predict.id)?.flagged).toBeUndefined();
    await user.click(screen.getByText('What prints?'));
    await user.keyboard('n');
    expect(onNext).not.toHaveBeenCalled();
    await user.click(button(/show answer/i));
    await user.keyboard('n');
    expect(onNext).toHaveBeenCalledTimes(1);
    await user.keyboard('{Control>}n{/Control}');
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('M and the header button toggle Mark for review', async () => {
    const user = userEvent.setup();
    const { store } = setup(single);
    const mark = screen.getByRole('button', { name: /mark for review/i });
    expect(mark).toHaveAttribute('aria-pressed', 'false');
    expect(mark).toHaveAttribute('title', expect.stringMatching(/show up in review/i));
    expect(mark.querySelector('svg')).toHaveAttribute('fill', 'none');
    await user.click(mark);
    expect(store.get(single.id)?.flagged).toBe(true);
    expect(mark).toHaveAccessibleName('Mark for review');
    expect(mark).toHaveAttribute('aria-pressed', 'true');
    expect(mark.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
    await user.keyboard('m');
    expect(store.get(single.id)?.flagged).toBe(false);
    expect(mark).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles the notes drawer, persists notes on blur and closes with Esc', async () => {
    const user = userEvent.setup();
    const { store } = setup(single);
    const toggle = screen.getByRole('button', { name: /my notes/i });
    expect(screen.queryByRole('textbox', { name: /my notes/i })).not.toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.type(screen.getByRole('textbox', { name: /my notes/i }), 'check phase');
    await user.click(screen.getByText('Pick'));
    expect(store.get(single.id)?.notes).toBe('check phase');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('textbox', { name: /my notes/i })).not.toBeInTheDocument();
    await user.click(toggle);
    expect(screen.getByRole('textbox', { name: /my notes/i })).toHaveValue('check phase');
  });

  it('never submits with Ctrl+Enter from inside My notes', async () => {
    const user = userEvent.setup();
    const grade = vi.fn<Grader['grade']>(async () => ({ score: 1, verdict: 'pass', feedback: [] }));
    const { store } = setup(predict, { grader: { grade } });
    await user.type(screen.getByLabelText(/expected output/i), '1');
    await user.click(screen.getByRole('button', { name: /my notes/i }));
    await user.type(screen.getByRole('textbox', { name: /my notes/i }), 'remember the newline');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(grade).not.toHaveBeenCalled();
    expect(screen.queryByText('Because B.')).not.toBeInTheDocument();
    expect(within(actionBar()).getByText('3 attempts left')).toBeInTheDocument();
    expect(store.get(predict.id)?.attempts).toBeUndefined();
  });

  it('closes My notes with Esc from inside the drawer and returns focus to the header button', async () => {
    const user = userEvent.setup();
    const { store } = setup(single);
    const toggle = screen.getByRole('button', { name: /my notes/i });
    await user.click(toggle);
    await user.type(screen.getByRole('textbox', { name: /my notes/i }), 'draft');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('textbox', { name: /my notes/i })).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(toggle);
    expect(store.get(single.id)?.notes).toBe('draft');
  });

  it('opens the notes drawer with saved notes on a revisit and marks the notes button', () => {
    const store = createProgressStore(null);
    store.setNotes(single.id, 'check phase, after poll');
    setup(single, { store });
    const toggle = screen.getByRole('button', { name: /my notes/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle.querySelector('.rounded-full')).not.toBeNull();
    expect(screen.getByRole('textbox', { name: /my notes/i })).toHaveValue('check phase, after poll');
  });

  it('copies the permalink and shows a Link copied toast', async () => {
    const user = userEvent.setup();
    setup(single);
    const link = screen.getByRole('link', { name: 'Copy link to this question' });
    expect(link).toHaveAttribute('href', '/q/javascript-test-single');
    expect(link).toHaveAttribute('title', 'Copy link to this question');
    await user.click(link);
    expect(await screen.findByText('Link copied')).toHaveAttribute('role', 'status');
    expect(await navigator.clipboard.readText()).toMatch(/\/q\/javascript-test-single$/);
  });

  it('resets answer state when the question changes', async () => {
    const user = userEvent.setup();
    const store = createProgressStore(null);
    const { rerender } = render(tree(single, {}, store, undefined));
    await user.click(screen.getByRole('radio', { name: 'A' }));
    await user.click(button(/submit/i));
    await screen.findByText('Not yet. Try again, or show the answer.');
    await user.click(screen.getByRole('radio', { name: 'B' }));
    rerender(tree(single2, {}, store, undefined));
    expect(screen.getAllByRole('radio').every((radio) => radio.getAttribute('aria-checked') === 'false' && radio.getAttribute('aria-disabled') === 'false')).toBe(true);
    expect(within(actionBar()).getByText('3 attempts left')).toBeInTheDocument();
    expect(button(/submit/i)).toBeDisabled();
  });

  it('runs an open answer through reveal and self-score, with no attempts pill', async () => {
    const user = userEvent.setup();
    const grade = vi.fn<Grader['grade']>(async () => ({ score: 0.5, verdict: 'self', feedback: [] }));
    const { store } = setup(open, { grader: { grade } });
    expect(within(actionBar()).queryByText(/attempt/i)).not.toBeInTheDocument();
    expect(within(actionBar()).queryByRole('button', { name: /show answer/i })).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/say it out loud/i), 'Closures capture bindings');
    await user.click(button(/reveal model answer/i));
    expect(screen.getByText('Model.')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'one' }));
    await user.click(button(/submit self-score/i));
    expect(grade).toHaveBeenCalledWith(open, { kind: 'open', checked: [true, false], text: 'Closures capture bindings' });
    expect(await within(actionBar()).findByText('Self-scored')).toBeInTheDocument();
    expect(screen.getByText('Because B.')).toBeInTheDocument();
    expect(store.get(open.id)).toMatchObject({ attempts: 1, lastScore: 0.5 });
  });

  it('shows an error when grading fails and leaves the attempt untouched', async () => {
    const user = userEvent.setup();
    const grader: Grader = { grade: async () => Promise.reject(new Error('worker died')) };
    const { store } = setup(single, { grader });
    await user.click(screen.getByRole('radio', { name: 'B' }));
    await user.click(button(/submit/i));
    expect(await screen.findByRole('alert')).toHaveTextContent(/worker died/);
    expect(store.get(single.id)).toBeUndefined();
    expect(within(actionBar()).getByText('3 attempts left')).toBeInTheDocument();
    expect(button(/submit/i)).toBeEnabled();
  });

  it('shows the active language but grades the canonical English question', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('es');
    const canonical = indexById(loadQuestions()).get('javascript-closure-counter-independence');
    if (canonical === undefined) {
      throw new Error('seed question missing');
    }
    const grade = vi.fn<Grader['grade']>(async () => ({ score: 1, verdict: 'pass', feedback: [] }));
    setup(canonical, { grader: { grade } });
    expect(screen.getByText('¿Qué se imprime?')).toBeInTheDocument();
    const breadcrumb = within(screen.getByRole('navigation', { name: 'A qué pertenece esta pregunta' }));
    expect(breadcrumb.getByRole('link', { name: 'Lenguajes' })).toHaveAttribute('href', '/browse/languages');
    expect(breadcrumb.getByRole('link', { name: 'JavaScript' })).toHaveAttribute('href', '/browse/languages/javascript');
    expect(breadcrumb.getByText('Closures (clausuras)')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '1' }));
    await user.click(within(screen.getByRole('group', { name: /acciones de respuesta/i })).getByRole('button', { name: /enviar/i }));
    expect(grade).toHaveBeenCalledWith(canonical, { kind: 'single', optionId: 'a' });
  });
});
