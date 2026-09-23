// packages
import { describe, expect, it } from 'vitest';

// engine
import { deepEqual } from './deepEqual';

describe('deepEqual', () => {
  it('compares primitives strictly', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual(1, '1')).toBe(false);
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it('compares arrays by element and length', () => {
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('compares objects by keys regardless of order', () => {
    expect(deepEqual({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
  });

  it('treats arrays and objects as different', () => {
    expect(deepEqual([], {})).toBe(false);
  });
});
