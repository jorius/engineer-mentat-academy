// packages
import { describe, expect, it } from 'vitest';

// engine
import { KIND_LABELS, LEVEL_LABELS, kindLabel, levelLabel } from './labels';
import { KINDS, LEVELS } from './question';

// locales
import en from '../i18n/locales/en.json';

function lookup(key: string): string {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], en);
  return typeof value === 'string' ? value : key;
}

describe('KIND_LABELS', () => {
  it.each(KINDS)('has a non-empty label and hint for %s', (kind) => {
    expect(KIND_LABELS[kind].label.length).toBeGreaterThan(0);
    expect(KIND_LABELS[kind].hint.length).toBeGreaterThan(0);
  });

  it.each(KINDS)('matches the English locale for %s', (kind) => {
    expect(kindLabel(kind, lookup)).toEqual(KIND_LABELS[kind]);
  });
});

describe('LEVEL_LABELS', () => {
  it.each(LEVELS)('has a non-empty label and hint for %s', (level) => {
    expect(LEVEL_LABELS[level].label.length).toBeGreaterThan(0);
    expect(LEVEL_LABELS[level].hint.length).toBeGreaterThan(0);
  });

  it.each(LEVELS)('matches the English locale for %s', (level) => {
    expect(levelLabel(level, lookup)).toEqual(LEVEL_LABELS[level]);
  });
});
