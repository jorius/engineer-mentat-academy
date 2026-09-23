// packages
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';

// components
import { PredictOutput } from './PredictOutput';
import { CodeExercise } from './CodeExercise';
import { SqlExercise } from './SqlExercise';
import { SchemaDrawer } from './SchemaDrawer';
import { OpenAnswer } from './OpenAnswer';

// contexts
import { ThemeProvider } from '../../contexts/ThemeContext';

// hooks
import { PreferencesProvider } from '../../hooks/usePreferences';

// engine
import type { CodeQuestion, OpenQuestion, PredictQuestion, SqlQuestion } from '../../engine/question';

function withEditor(children: JSX.Element): JSX.Element {
  return (
    <PreferencesProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </PreferencesProvider>
  );
}

const predictQuestion: PredictQuestion = {
  id: 'predict-question',
  domain: 'languages',
  subject: 'javascript',
  topic: 'closures',
  level: 'junior',
  kind: 'predict',
  prompt: 'What prints?',
  language: 'javascript',
  code: 'console.log(1);',
  answer: '1',
  tags: [],
  source: 'notion',
  explanation: 'Because 1.',
};

const codeQuestion: CodeQuestion = {
  id: 'code-question',
  domain: 'languages',
  subject: 'javascript',
  topic: 'functions',
  level: 'junior',
  kind: 'code',
  prompt: 'Return 1',
  language: 'javascript',
  starter: 'export function solution() { return 0; }',
  tests: [{ name: 'one', args: [], expected: 1 }],
  solution: 'export function solution() { return 1; }',
  tags: [],
  source: 'notion',
  explanation: 'Return 1.',
};

const sqlQuestion: SqlQuestion = {
  id: 'sql-question',
  domain: 'databases',
  subject: 'sql',
  topic: 'select',
  level: 'junior',
  kind: 'sql',
  prompt: 'Select everything',
  schema: 'CREATE TABLE t (id INTEGER);',
  answer: 'SELECT * FROM t;',
  expectedRows: [[1]],
  tags: [],
  source: 'notion',
  explanation: 'Select all rows.',
};

const openQuestion: OpenQuestion = {
  id: 'open-question',
  domain: 'languages',
  subject: 'javascript',
  topic: 'closures',
  level: 'junior',
  kind: 'open',
  prompt: 'Explain closures',
  modelAnswer: 'A closure captures its surrounding scope.',
  rubric: ['Mentions scope', 'Gives an example'],
  tags: [],
  source: 'notion',
  explanation: 'Closures capture bindings.',
};

describe('PredictOutput', () => {
  it('round-trips a controlled value through onChange and external updates', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      withEditor(<PredictOutput question={predictQuestion} disabled={false} onSubmit={onSubmit} value="" onChange={onChange} />),
    );
    const textarea = screen.getByLabelText(/expected output/i);
    await user.type(textarea, '1');
    expect(onChange).toHaveBeenCalledWith('1');

    rerender(withEditor(<PredictOutput question={predictQuestion} disabled={false} onSubmit={onSubmit} value="42" onChange={onChange} />));
    expect(screen.getByLabelText(/expected output/i)).toHaveValue('42');
  });

  it('disables the textarea when readOnly', () => {
    render(withEditor(<PredictOutput question={predictQuestion} disabled={false} onSubmit={vi.fn()} value="42" readOnly />));
    expect(screen.getByLabelText(/expected output/i)).toBeDisabled();
  });

  it('hides the submit button when submitLabelHidden', () => {
    render(withEditor(<PredictOutput question={predictQuestion} disabled={false} onSubmit={vi.fn()} value="1" submitLabelHidden />));
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();
  });

  it('behaves as an uncontrolled input without the new props', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(withEditor(<PredictOutput question={predictQuestion} disabled={false} onSubmit={onSubmit} />));
    await user.type(screen.getByLabelText(/expected output/i), '1');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: 'predict', text: '1' });
  });
});

describe('CodeExercise', () => {
  it('round-trips a controlled value: Reset notifies onChange and external updates reach the editor', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      withEditor(<CodeExercise question={codeQuestion} disabled={false} onSubmit={onSubmit} value="export function solution() { return 2; }" onChange={onChange} />),
    );
    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(onChange).toHaveBeenCalledWith(codeQuestion.starter);

    rerender(
      withEditor(<CodeExercise question={codeQuestion} disabled={false} onSubmit={onSubmit} value="export function solution() { return 3; }" onChange={onChange} />),
    );
    expect(screen.getByLabelText('Solution')).toHaveTextContent('return 3;');
  });

  it('keeps the tests list but hides Reset when readOnly', () => {
    render(withEditor(<CodeExercise question={codeQuestion} disabled={false} onSubmit={vi.fn()} value={codeQuestion.solution} readOnly />));
    expect(screen.getByLabelText('Solution').getAttribute('aria-readonly')).toBe('true');
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
    expect(screen.getByText(/test: one/i)).toBeInTheDocument();
  });

  it('hides the submit button when submitLabelHidden', () => {
    render(withEditor(<CodeExercise question={codeQuestion} disabled={false} onSubmit={vi.fn()} value={codeQuestion.starter} submitLabelHidden />));
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('behaves as an uncontrolled input without the new props', () => {
    render(withEditor(<CodeExercise question={codeQuestion} disabled={false} onSubmit={vi.fn()} />));
    expect(screen.getByLabelText('Solution')).toHaveTextContent(codeQuestion.starter);
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });
});

describe('SchemaDrawer', () => {
  it('renders the schema text inside a details/summary drawer', () => {
    render(<SchemaDrawer schema="  CREATE TABLE t (id INTEGER);  " />);
    expect(screen.getByText(/schema/i)).toBeInTheDocument();
    expect(screen.getByText('CREATE TABLE t (id INTEGER);')).toBeInTheDocument();
  });
});

describe('SqlExercise', () => {
  it('round-trips a controlled value through external updates', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      withEditor(<SqlExercise question={sqlQuestion} disabled={false} onSubmit={onSubmit} value="SELECT 1;" onChange={onChange} />),
    );
    expect(screen.getByLabelText('Query')).toHaveTextContent('SELECT 1;');

    rerender(withEditor(<SqlExercise question={sqlQuestion} disabled={false} onSubmit={onSubmit} value={sqlQuestion.answer} onChange={onChange} />));
    expect(screen.getByLabelText('Query')).toHaveTextContent(sqlQuestion.answer);
  });

  it('disables the editor when readOnly and hides the submit button when submitLabelHidden', () => {
    render(
      withEditor(
        <SqlExercise question={sqlQuestion} disabled={false} onSubmit={vi.fn()} value={sqlQuestion.answer} readOnly submitLabelHidden />,
      ),
    );
    expect(screen.getByLabelText('Query').getAttribute('aria-readonly')).toBe('true');
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();
  });

  it('renders the schema drawer by default but not when hideSchema is set', () => {
    const { rerender } = render(withEditor(<SqlExercise question={sqlQuestion} disabled={false} onSubmit={vi.fn()} />));
    expect(screen.getByText(/schema/i)).toBeInTheDocument();

    rerender(withEditor(<SqlExercise question={sqlQuestion} disabled={false} onSubmit={vi.fn()} hideSchema />));
    expect(screen.queryByText(/schema/i)).not.toBeInTheDocument();
  });

  it('behaves as an uncontrolled input without the new props', () => {
    render(withEditor(<SqlExercise question={sqlQuestion} disabled={false} onSubmit={vi.fn()} />));
    expect(screen.getByLabelText('Query')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
  });
});

describe('OpenAnswer', () => {
  it('round-trips a controlled draft value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<OpenAnswer question={openQuestion} disabled={false} onSubmit={vi.fn()} value="" onChange={onChange} />);
    await user.type(screen.getByPlaceholderText(/say it out loud/i), 'x');
    expect(onChange).toHaveBeenCalledWith('x');

    rerender(<OpenAnswer question={openQuestion} disabled={false} onSubmit={vi.fn()} value="a full draft" onChange={onChange} />);
    expect(screen.getByPlaceholderText(/say it out loud/i)).toHaveValue('a full draft');
  });

  it('supports a controlled reveal: calls onReveal and can be driven externally', async () => {
    const user = userEvent.setup();
    const onReveal = vi.fn();
    const { rerender } = render(<OpenAnswer question={openQuestion} disabled={false} onSubmit={vi.fn()} revealed={false} onReveal={onReveal} />);
    expect(screen.queryByText(openQuestion.modelAnswer)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /reveal model answer/i }));
    expect(onReveal).toHaveBeenCalledTimes(1);
    // The parent controls `revealed`; the component doesn't flip it on its own.
    expect(screen.queryByText(openQuestion.modelAnswer)).not.toBeInTheDocument();

    rerender(<OpenAnswer question={openQuestion} disabled={false} onSubmit={vi.fn()} revealed onReveal={onReveal} />);
    expect(screen.getByText(openQuestion.modelAnswer)).toBeInTheDocument();
  });

  it('supports a controlled rubric via checked/onCheckedChange', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { rerender } = render(
      <OpenAnswer question={openQuestion} disabled={false} onSubmit={vi.fn()} revealed checked={[false, false]} onCheckedChange={onCheckedChange} />,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Mentions scope' }));
    expect(onCheckedChange).toHaveBeenCalledWith([true, false]);

    rerender(
      <OpenAnswer question={openQuestion} disabled={false} onSubmit={vi.fn()} revealed checked={[true, false]} onCheckedChange={onCheckedChange} />,
    );
    expect(screen.getByRole('checkbox', { name: 'Mentions scope' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Gives an example' })).not.toBeChecked();
  });

  it('disables the textarea when readOnly, even before it is revealed', () => {
    render(<OpenAnswer question={openQuestion} disabled={false} onSubmit={vi.fn()} revealed={false} readOnly />);
    expect(screen.getByPlaceholderText(/say it out loud/i)).toBeDisabled();
  });

  it('disables the rubric checkboxes when readOnly', () => {
    render(<OpenAnswer question={openQuestion} disabled={false} onSubmit={vi.fn()} revealed checked={[false, false]} readOnly />);
    expect(screen.getByRole('checkbox', { name: 'Mentions scope' })).toBeDisabled();
  });

  it('hides the self-score submit button when submitLabelHidden', () => {
    render(<OpenAnswer question={openQuestion} disabled={false} onSubmit={vi.fn()} revealed submitLabelHidden />);
    expect(screen.queryByRole('button', { name: /submit self-score/i })).not.toBeInTheDocument();
  });

  it('behaves as an uncontrolled input without the new props', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<OpenAnswer question={openQuestion} disabled={false} onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText(/say it out loud/i), 'my answer');
    await user.click(screen.getByRole('button', { name: /reveal model answer/i }));
    await user.click(screen.getByRole('checkbox', { name: 'Mentions scope' }));
    await user.click(screen.getByRole('button', { name: /submit self-score/i }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: 'open', checked: [true, false], text: 'my answer' });
  });
});
