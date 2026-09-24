// packages
import { describe, expect, it } from 'vitest';

// engine
import type { Question } from '../engine/question';

// utils
import { questionSummary } from './questionSummary';

function q(extra: Partial<Question> = {}): Question {
  return {
    id: 'q-1',
    domain: 'languages',
    subject: 'javascript',
    topic: 'closures',
    level: 'mid',
    kind: 'open',
    prompt: 'p',
    tags: [],
    source: 'notion',
    explanation: 'e',
    modelAnswer: 'm',
    rubric: ['a', 'b'],
    ...extra,
  } as Question;
}

describe('questionSummary', () => {
  it('drops a leading fenced code block and uses the following line', () => {
    const question = q({ prompt: '```js\nconsole.log(1);\n```\nWhat is logged?' });
    expect(questionSummary(question)).toBe('What is logged?');
  });

  it('strips inline backticks and bold markers', () => {
    const question = q({ prompt: 'Explain what `useEffect` does when **dependencies** change.' });
    expect(questionSummary(question)).toBe('Explain what useEffect does when dependencies change.');
  });

  it('reduces a Markdown link to its link text', () => {
    const question = q({ prompt: 'See the [React docs](https://react.dev) for details.' });
    expect(questionSummary(question)).toBe('See the React docs for details.');
  });

  it('truncates on a word boundary and adds an ellipsis at max', () => {
    const question = q({
      prompt: 'Which of the following statements about the JavaScript event loop accurately describes execution order?',
    });
    const summary = questionSummary(question, { max: 40 });
    expect(summary.length).toBeLessThanOrEqual(40);
    expect(summary.endsWith('…')).toBe(true);
    expect(summary).toBe('Which of the following statements about…');
  });

  it('falls back to the kind label and topic name when the prompt is only code', () => {
    const question = q({
      kind: 'predict',
      domain: 'languages',
      subject: 'javascript',
      topic: 'closures',
      language: 'javascript',
      code: 'console.log(1);',
      answer: '1',
      prompt: '```js\nconsole.log(1);\n```',
    });
    expect(questionSummary(question)).toBe('Predict output: Closures');
  });

  it('falls back to the kind label and raw topic id when the topic is unknown', () => {
    const question = q({
      kind: 'fix',
      domain: 'languages',
      subject: 'javascript',
      topic: 'not-a-real-topic',
      language: 'javascript',
      starter: 's',
      tests: [{ name: 't', args: [], expected: 1 }],
      solution: 's',
      prompt: '```js\n// nothing but code\n```',
    });
    expect(questionSummary(question)).toBe('Fix the code: not-a-real-topic');
  });

  it('falls back to the kind label and topic name when a code fence is never closed', () => {
    const question = q({
      kind: 'code',
      domain: 'languages',
      subject: 'javascript',
      topic: 'closures',
      language: 'javascript',
      starter: 's',
      tests: [{ name: 't', args: [], expected: 1 }],
      solution: 's',
      prompt: '```js\nconst a = 1;',
    });
    expect(questionSummary(question)).toBe('Write code: Closures');
  });

  it('keeps the text before an unterminated fence and drops the rest', () => {
    const question = q({ prompt: 'Intro line\n```js\nconst a = 1;' });
    expect(questionSummary(question)).toBe('Intro line');
  });

  it('collapses runs of spaces, tabs and newlines to a single space', () => {
    const question = q({ prompt: 'What   does\tthis\n  print?' });
    expect(questionSummary(question)).toBe('What does this print?');
  });

  it('does not mangle dunder identifiers when stripping underscore italics', () => {
    const question = q({ prompt: 'Explain `__proto__` and `Object.create`' });
    expect(questionSummary(question)).toBe('Explain __proto__ and Object.create');
  });

  it('localizes the fallback topic name and kind label', () => {
    const question = q({
      kind: 'predict',
      domain: 'languages',
      subject: 'javascript',
      topic: 'closures',
      language: 'javascript',
      code: 'console.log(1);',
      answer: '1',
      prompt: '```js\nconsole.log(1);\n```',
    });
    const t = (key: string): string => (key === 'kinds.predict.label' ? 'Predecir la salida' : key);
    expect(questionSummary(question, { locale: 'es', t })).toBe('Predecir la salida: Closures (clausuras)');
  });
});
