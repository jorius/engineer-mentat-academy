// packages
import { describe, expect, it } from 'vitest';

// engine
import { questionSchema } from './question';

const base = {
  id: 'javascript-closure-counter',
  domain: 'languages',
  subject: 'javascript',
  topic: 'closures',
  level: 'mid',
  prompt: 'What does the counter return?',
  tags: ['closures'],
  source: 'notion',
  explanation: 'The inner function keeps a reference to `counter`.',
} as const;

describe('questionSchema', () => {
  it('accepts a single-choice question', () => {
    const result = questionSchema.safeParse({
      ...base,
      kind: 'single',
      options: [
        { id: 'a', text: '1 then 2' },
        { id: 'b', text: '1 then 1' },
      ],
      answer: 'a',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a code question with tests', () => {
    const result = questionSchema.safeParse({
      ...base,
      kind: 'code',
      language: 'typescript',
      starter: 'export function solution(a: number, b: number): number {\n  return 0;\n}',
      tests: [{ name: 'adds', args: [2, 3], expected: 5 }],
      solution: 'export function solution(a: number, b: number): number {\n  return a + b;\n}',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown kind', () => {
    const result = questionSchema.safeParse({ ...base, kind: 'essay' });
    expect(result.success).toBe(false);
  });

  it('rejects an id with uppercase or spaces', () => {
    const result = questionSchema.safeParse({
      ...base,
      id: 'Bad Id',
      kind: 'open',
      modelAnswer: 'x',
      rubric: ['a', 'b'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an open question with fewer than two rubric items', () => {
    const result = questionSchema.safeParse({
      ...base,
      kind: 'open',
      modelAnswer: 'x',
      rubric: ['only one'],
    });
    expect(result.success).toBe(false);
  });
});
