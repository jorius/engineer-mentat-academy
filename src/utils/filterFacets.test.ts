// packages
import { describe, expect, it } from 'vitest';

// engine
import type { Level, Question } from '../engine/question';

// utils
import { facets } from './filterFacets';

function q(id: string, level: Level, kind: 'single' | 'sql'): Question {
  const base = { id, domain: 'databases', subject: 'sql', topic: 'joins', level, prompt: 'p', tags: [], source: 'notion' as const, explanation: 'e' };
  return kind === 'sql'
    ? { ...base, kind, schema: 'create table t (x int);', answer: 'select 1', expectedRows: [] }
    : { ...base, kind, options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], answer: 'a' };
}

const scope: Question[] = [
  q('a', 'junior', 'single'),
  q('b', 'junior', 'sql'),
  q('c', 'mid', 'sql'),
  q('d', 'mid', 'sql'),
  q('e', 'senior', 'single'),
];

describe('facets', () => {
  it('lists only the values present in the scope, in canonical order, with their counts', () => {
    const result = facets(scope, { levels: [], kinds: [] });
    expect(result.levels).toEqual([
      { value: 'junior', count: 2 },
      { value: 'mid', count: 2 },
      { value: 'senior', count: 1 },
    ]);
    expect(result.kinds).toEqual([
      { value: 'single', count: 2 },
      { value: 'sql', count: 3 },
    ]);
  });

  it('counts each group with the other group selection applied', () => {
    const result = facets(scope, { levels: ['mid'], kinds: ['single'] });
    expect(result.levels).toEqual([
      { value: 'junior', count: 1 },
      { value: 'mid', count: 0 },
      { value: 'senior', count: 1 },
    ]);
    expect(result.kinds).toEqual([
      { value: 'single', count: 0 },
      { value: 'sql', count: 2 },
    ]);
  });

  it('never lists a kind that the unfiltered scope does not have', () => {
    const result = facets([q('x', 'junior', 'single')], { levels: [], kinds: ['sql'] });
    expect(result.kinds.map((facet) => facet.value)).toEqual(['single']);
  });

  it('returns empty groups for an empty scope', () => {
    expect(facets([], { levels: [], kinds: [] })).toEqual({ levels: [], kinds: [] });
  });
});
