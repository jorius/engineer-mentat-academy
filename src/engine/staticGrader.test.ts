// packages
import { describe, expect, it } from 'vitest';

// engine
import { createStaticGrader, normalizeOutput } from './staticGrader';
import { executeSource } from './runner/execute';
import { createSqlRunner } from './sql/runSql';
import { loadSqlInNode } from './sql/nodeLoader';
import type { Question } from './question';

const base = {
  domain: 'languages',
  subject: 'javascript',
  topic: 'closures',
  level: 'mid',
  prompt: 'p',
  tags: [] as string[],
  source: 'notion',
  explanation: 'e',
} as const;

const grader = createStaticGrader({
  runJs: (request) => executeSource(request.source, request.tests, request.language),
  runSql: createSqlRunner(loadSqlInNode),
});

describe('normalizeOutput', () => {
  it('trims lines, collapses inner whitespace and drops blank lines', () => {
    expect(normalizeOutput('  a   b \n\n c\r\n')).toBe('a b\nc');
  });
});

describe('createStaticGrader', () => {
  it('grades single choice', async () => {
    const q: Question = { ...base, id: 's', kind: 'single', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], answer: 'b' };
    expect(await grader.grade(q, { kind: 'single', optionId: 'b' })).toMatchObject({ score: 1, verdict: 'pass' });
    expect(await grader.grade(q, { kind: 'single', optionId: 'a' })).toMatchObject({ score: 0, verdict: 'fail', feedback: ['Correct answer: B'] });
  });

  it('grades multi choice as set equality', async () => {
    const q: Question = { ...base, id: 'm', kind: 'multi', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }], answer: ['a', 'c'] };
    expect((await grader.grade(q, { kind: 'multi', optionIds: ['c', 'a'] })).verdict).toBe('pass');
    const partial = await grader.grade(q, { kind: 'multi', optionIds: ['a'] });
    expect(partial.verdict).toBe('fail');
    expect(partial.feedback).toEqual(['Missing: C']);
    const extra = await grader.grade(q, { kind: 'multi', optionIds: ['a', 'b', 'c'] });
    expect(extra.feedback).toEqual(['Should not be selected: B']);
  });

  it('grades predict with normalized comparison', async () => {
    const q: Question = { ...base, id: 'p', kind: 'predict', language: 'javascript', code: 'x', answer: '1\n4\n3\n2' };
    expect((await grader.grade(q, { kind: 'predict', text: ' 1 \n4\n\n3\n2\n' })).verdict).toBe('pass');
    const wrong = await grader.grade(q, { kind: 'predict', text: '1\n3\n4\n2' });
    expect(wrong.verdict).toBe('fail');
    expect(wrong.feedback[0]).toMatch(/line 2/i);
  });

  it('accepts console-style spacing and quotes for arrays and objects in predict', async () => {
    const array: Question = { ...base, id: 'pa', kind: 'predict', language: 'javascript', code: 'x', answer: '[5,4]' };
    expect((await grader.grade(array, { kind: 'predict', text: '[ 5, 4 ]' })).verdict).toBe('pass');
    const object: Question = { ...base, id: 'po', kind: 'predict', language: 'javascript', code: 'x', answer: '{"value":1}' };
    expect((await grader.grade(object, { kind: 'predict', text: '{ value: 1 }' })).verdict).toBe('pass');
    expect((await grader.grade(object, { kind: 'predict', text: '{ "value": 1 }' })).verdict).toBe('pass');
    const strings: Question = { ...base, id: 'ps', kind: 'predict', language: 'javascript', code: 'x', answer: '["x"]' };
    expect((await grader.grade(strings, { kind: 'predict', text: "[ 'x' ]" })).verdict).toBe('pass');
    const different = await grader.grade(array, { kind: 'predict', text: '[ 5, 3 ]' });
    expect(different.verdict).toBe('fail');
    expect(different.feedback).toEqual(['Line 1: expected "[5,4]", got "[ 5, 3 ]"']);
  });

  it('keeps space-separated values distinct while still loosening array and object lines', async () => {
    const twoValues: Question = { ...base, id: 'pv', kind: 'predict', language: 'javascript', code: 'x', answer: '4 0' };
    const collapsed = await grader.grade(twoValues, { kind: 'predict', text: '40' });
    expect(collapsed.verdict).toBe('fail');
    expect(collapsed.feedback).toEqual(['Line 1: expected "4 0", got "40"']);
    expect((await grader.grade(twoValues, { kind: 'predict', text: '4 0' })).verdict).toBe('pass');
  });

  it('accepts Node-style object and array output for JSON-style keys', async () => {
    const nodeStyle: Question = { ...base, id: 'po', kind: 'predict', language: 'javascript', code: 'x', answer: '{"value":1}\n10 x [40,50]\n["a","b"]' };
    expect((await grader.grade(nodeStyle, { kind: 'predict', text: "{ value: 1 }\n10 x [ 40, 50 ]\n[ 'a', 'b' ]" })).verdict).toBe('pass');
    expect((await grader.grade(nodeStyle, { kind: 'predict', text: '{value:1}\n10 x [40, 50]\n[a, b]' })).verdict).toBe('pass');
    expect((await grader.grade(nodeStyle, { kind: 'predict', text: "{ value: 2 }\n10 x [ 40, 50 ]\n[ 'a', 'b' ]" })).verdict).not.toBe('pass');

    const array: Question = { ...base, id: 'pv2', kind: 'predict', language: 'javascript', code: 'x', answer: '[5,4]' };
    expect((await grader.grade(array, { kind: 'predict', text: '[ 5, 4 ]' })).verdict).toBe('pass');

    const object: Question = { ...base, id: 'pv3', kind: 'predict', language: 'javascript', code: 'x', answer: '{"a":1}' };
    expect((await grader.grade(object, { kind: 'predict', text: "{ 'a': 1 }" })).verdict).toBe('pass');
  });

  it('grades code by running tests', async () => {
    const q: Question = {
      ...base,
      id: 'c',
      kind: 'code',
      language: 'typescript',
      starter: '',
      tests: [{ name: 'adds', args: [1, 2], expected: 3 }, { name: 'adds big', args: [10, 20], expected: 30 }],
      solution: 'export function solution(a: number, b: number): number { return a + b; }',
    };
    const good = await grader.grade(q, { kind: 'code', source: q.solution });
    expect(good).toMatchObject({ score: 1, verdict: 'pass' });
    const half = await grader.grade(q, { kind: 'code', source: 'export function solution(a: number, b: number): number { return 3; }' });
    expect(half.score).toBe(0.5);
    expect(half.verdict).toBe('fail');
    expect(half.feedback).toEqual(['adds big: solution(10, 20) expected 30, got 3']);
    const broken = await grader.grade(q, { kind: 'code', source: 'nope(' });
    expect(broken).toMatchObject({ score: 0, verdict: 'fail' });
    expect(broken.feedback[0]).toMatch(/SyntaxError/);
  });

  it('grades sql as a multiset unless ordered', async () => {
    const q: Question = {
      ...base,
      id: 'q',
      kind: 'sql',
      schema: 'CREATE TABLE t(a INT); INSERT INTO t VALUES (2),(1);',
      answer: 'SELECT a FROM t',
      expectedRows: [[1], [2]],
    };
    expect((await grader.grade(q, { kind: 'sql', query: 'SELECT a FROM t' })).verdict).toBe('pass');
    const ordered: Question = { ...q, ordered: true };
    expect((await grader.grade(ordered, { kind: 'sql', query: 'SELECT a FROM t' })).verdict).toBe('fail');
    expect((await grader.grade(ordered, { kind: 'sql', query: 'SELECT a FROM t ORDER BY a' })).verdict).toBe('pass');
    const bad = await grader.grade(q, { kind: 'sql', query: 'SELECT b FROM t' });
    expect(bad.feedback[0]).toMatch(/no such column/);
  });

  it('returns self verdict for open questions using the rubric', async () => {
    const q: Question = { ...base, id: 'o', kind: 'open', modelAnswer: 'm', rubric: ['one', 'two', 'three', 'four'] };
    const result = await grader.grade(q, { kind: 'open', checked: [true, false, true, true], text: 'my answer' });
    expect(result).toEqual({ score: 0.75, verdict: 'self', feedback: ['Self-scored 3 of 4 rubric points'] });
    const blank = await grader.grade(q, { kind: 'open', checked: [true, false, true, true], text: '' });
    expect(blank).toEqual(result);
  });

  it('rejects a mismatched answer kind', async () => {
    const q: Question = { ...base, id: 's2', kind: 'single', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], answer: 'b' };
    await expect(grader.grade(q, { kind: 'predict', text: 'x' })).rejects.toThrow(/kind/);
  });
});
