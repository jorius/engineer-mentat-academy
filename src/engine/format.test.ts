// packages
import { describe, expect, it } from 'vitest';

// engine
import { formatCall, formatValue } from './format';

describe('formatValue', () => {
  it('renders JSON for plain values and falls back to String', () => {
    expect(formatValue([1, 'a'])).toBe('[1,"a"]');
    expect(formatValue({ a: 1 })).toBe('{"a":1}');
    expect(formatValue(undefined)).toBe('undefined');
    expect(formatValue(10n)).toBe('10');
  });
});

describe('formatCall', () => {
  it('shows the arguments a test passes to solution', () => {
    expect(formatCall([['a', 'b', 'c']])).toBe('solution(["a","b","c"])');
    expect(formatCall([])).toBe('solution()');
    expect(formatCall([1, { k: true }])).toBe('solution(1, {"k":true})');
  });
});
