// packages
import { describe, expect, it } from 'vitest';

// engine
import { executeSource } from './execute';

describe('executeSource', () => {
  it('runs a TypeScript solution against tests', async () => {
    const result = await executeSource(
      'export function solution(a: number, b: number): number { return a + b; }',
      [
        { name: 'adds', args: [2, 3], expected: 5 },
        { name: 'wrong', args: [2, 2], expected: 5 },
      ],
      'typescript',
    );
    expect(result.status).toBe('ok');
    expect(result.tests).toEqual([
      { name: 'adds', passed: true, actual: 5 },
      { name: 'wrong', passed: false, actual: 4 },
    ]);
  });

  it('captures console output in order', async () => {
    const result = await executeSource(
      'console.log("a", 1); console.warn({ x: [1] }); export function solution() { return 0; }',
      [{ name: 'zero', args: [], expected: 0 }],
      'javascript',
    );
    expect(result.logs).toEqual(['a 1', '{"x":[1]}']);
  });

  it('captures setTimeout output when asked to settle', async () => {
    const result = await executeSource(
      'setTimeout(() => console.log("late"), 0); console.log("early"); export function solution() { return 0; }',
      [],
      'javascript',
      50,
    );
    expect(result.logs).toEqual(['early', 'late']);
    const unsettled = await executeSource('setTimeout(() => console.log("late"), 0); export function solution() { return 0; }', [], 'javascript');
    expect(unsettled.logs).toEqual([]);
  });

  it('awaits an async solution', async () => {
    const result = await executeSource(
      'export async function solution(x) { return x * 2; }',
      [{ name: 'doubles', args: [4], expected: 8 }],
      'javascript',
    );
    expect(result.tests[0]?.passed).toBe(true);
  });

  it('reports a missing solution export', async () => {
    const result = await executeSource('const x = 1;', [{ name: 't', args: [], expected: 1 }], 'javascript');
    expect(result.status).toBe('error');
    expect(result.error).toMatch(/solution/);
  });

  it('reports a syntax error without throwing', async () => {
    const result = await executeSource('export function solution( {', [], 'javascript');
    expect(result.status).toBe('error');
    expect(result.error).toBeTruthy();
  });

  it('records a thrown error per test and keeps going', async () => {
    const result = await executeSource(
      'export function solution(x) { if (x < 0) throw new RangeError("neg"); return x; }',
      [
        { name: 'neg', args: [-1], expected: -1 },
        { name: 'pos', args: [1], expected: 1 },
      ],
      'javascript',
    );
    expect(result.tests[0]).toEqual({ name: 'neg', passed: false, error: 'RangeError: neg' });
    expect(result.tests[1]?.passed).toBe(true);
  });
});
