// packages
import { describe, expect, it } from 'vitest';

// utils
import { orderOptions } from './optionOrder';

const four = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

function ids(options: { id: string }[]): string[] {
  return options.map((option) => option.id);
}

describe('orderOptions', () => {
  it('produces known orders for fixed seeds', () => {
    expect(ids(orderOptions(four, 'seed-1'))).toEqual(['a', 'c', 'b', 'd']);
    expect(ids(orderOptions(four, 'seed-2'))).toEqual(['c', 'b', 'a', 'd']);
    expect(ids(orderOptions(four, 'javascript-test-single'))).toEqual(['a', 'c', 'd', 'b']);
  });

  it('gives different orders for different seeds', () => {
    expect(ids(orderOptions(four, 'seed-1'))).not.toEqual(ids(orderOptions(four, 'seed-2')));
  });

  it('returns the same order every time for the same seed', () => {
    expect(orderOptions(four, 'dotnet-gc-generations')).toEqual(orderOptions(four, 'dotnet-gc-generations'));
  });

  it('keeps every option object and never mutates the input', () => {
    const options = [
      { id: 'a', text: 'Alpha' },
      { id: 'b', text: 'Beta' },
      { id: 'c', text: 'Gamma' },
      { id: 'd', text: 'Delta' },
    ];
    const snapshot = [...options];
    const ordered = orderOptions(options, 'seed-2');
    expect(options).toEqual(snapshot);
    expect(ordered).not.toBe(options);
    expect([...ordered].sort((x, y) => x.id.localeCompare(y.id))).toEqual(options);
    ordered.forEach((option) => expect(options).toContain(option));
  });

  it('returns empty and single-item lists unchanged', () => {
    expect(orderOptions([], 'seed-1')).toEqual([]);
    expect(orderOptions([{ id: 'a' }], 'seed-1')).toEqual([{ id: 'a' }]);
  });
});
