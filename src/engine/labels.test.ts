// packages
import { describe, expect, it } from 'vitest';

// engine
import { KIND_LABELS, LEVEL_LABELS } from './labels';
import { KINDS, LEVELS } from './question';

describe('KIND_LABELS', () => {
  it.each(KINDS)('has a non-empty label and hint for %s', (kind) => {
    expect(KIND_LABELS[kind].label.length).toBeGreaterThan(0);
    expect(KIND_LABELS[kind].hint.length).toBeGreaterThan(0);
  });
});

describe('LEVEL_LABELS', () => {
  it.each(LEVELS)('has a non-empty label and hint for %s', (level) => {
    expect(LEVEL_LABELS[level].label.length).toBeGreaterThan(0);
    expect(LEVEL_LABELS[level].hint.length).toBeGreaterThan(0);
  });
});
