// packages
import { describe, expect, it } from 'vitest';

// locales
import en from './locales/en.json';
import es from './locales/es.json';

type Leaf = { key: string; value: unknown };

function leaves(node: unknown, prefix = ''): Leaf[] {
  if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
    return Object.entries(node).flatMap(([key, child]) => leaves(child, prefix === '' ? key : `${prefix}.${key}`));
  }
  return [{ key: prefix, value: node }];
}

const locales = { en, es };

describe('locale files', () => {
  it('have identical nested key sets', () => {
    const enKeys = leaves(en).map((leaf) => leaf.key).sort();
    const esKeys = leaves(es).map((leaf) => leaf.key).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it.each(Object.entries(locales))('%s has only non-empty string values', (_name, locale) => {
    const bad = leaves(locale).filter((leaf) => typeof leaf.value !== 'string' || leaf.value.trim().length === 0);
    expect(bad).toEqual([]);
  });

  it.each(Object.entries(locales))('%s uses the same interpolation variables as English', (_name, locale) => {
    const variables = (value: unknown): string[] => (String(value).match(/{{\s*\w+\s*}}/g) ?? []).sort();
    const reference = new Map(leaves(en).map((leaf) => [leaf.key, variables(leaf.value)]));
    const mismatched = leaves(locale).filter((leaf) => JSON.stringify(variables(leaf.value)) !== JSON.stringify(reference.get(leaf.key)));
    expect(mismatched).toEqual([]);
  });
});
