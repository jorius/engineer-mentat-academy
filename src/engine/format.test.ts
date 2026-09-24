// packages
import { describe, expect, it } from 'vitest';

// engine
import { formatCall, formatJsValue, formatTestBlock, formatValue } from './format';

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
    expect(formatCall([['a', 'b', 'c']])).toBe("solution(['a', 'b', 'c'])");
    expect(formatCall([])).toBe('solution()');
    expect(formatCall([1, { k: true }])).toBe('solution(1, { k: true })');
  });
});

describe('formatJsValue', () => {
  it('writes objects, arrays and strings the JavaScript way', () => {
    expect(formatJsValue({ total: 5, priority: false, 'two words': null })).toBe("{ total: 5, priority: false, 'two words': null }");
    expect(formatJsValue([{ a: [1, 'x'] }, undefined])).toBe("[{ a: [1, 'x'] }, undefined]");
    expect(formatJsValue("it's")).toBe("'it\\'s'");
    expect(formatJsValue({})).toBe('{}');
  });

  it('keeps special numbers, bigints and non-plain objects readable', () => {
    expect(formatJsValue([NaN, Infinity, -Infinity, -0, 1.5])).toBe('[NaN, Infinity, -Infinity, -0, 1.5]');
    expect(formatJsValue(10n)).toBe('10n');
    expect(formatJsValue(new Date(0))).toBe(new Date(0).toString());
    expect(formatJsValue(Object.create(null))).toBe('{}');
  });
});

describe('formatTestBlock', () => {
  it('renders every test as a labelled call with its expected value in a fenced block', () => {
    const block = formatTestBlock(
      [{ name: 'sums', args: [[1, 2]], expected: 3 }, { name: 'empty', args: [[]], expected: 0 }],
      'typescript',
      (name) => `Test: ${name}`,
    );
    expect(block).toBe('```ts\n// Test: sums\nsolution([1, 2]) // → 3\n// Test: empty\nsolution([]) // → 0\n```');
  });
});
