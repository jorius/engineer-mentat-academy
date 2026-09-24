// packages
import { describe, expect, it } from 'vitest';

// engine
import { mockPool, pickMock, shuffle } from './session';
import type { Question } from './question';

function q(id: string, level: Question['level'], domain = 'languages', kind: 'open' | 'single' = 'open'): Question {
  const base = { id, domain, subject: 's', topic: 't', level, prompt: 'p', tags: [], source: 'notion' as const, explanation: 'e' };
  return kind === 'open'
    ? { ...base, kind, modelAnswer: 'm', rubric: ['a', 'b'] }
    : { ...base, kind, options: [{ id: 'x', text: 'x' }, { id: 'y', text: 'y' }], answer: 'x' };
}

function fixedRandom(sequence: number[]): () => number {
  let i = 0;
  return (): number => sequence[i++ % sequence.length] ?? 0;
}

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4];
    const out = shuffle(input, fixedRandom([0.1, 0.5, 0.9]));
    expect(out).toHaveLength(4);
    expect([...out].sort()).toEqual([1, 2, 3, 4]);
    expect(input).toEqual([1, 2, 3, 4]);
  });
});

const bank = [q('a', 'junior'), q('b', 'mid'), q('c', 'senior'), q('d', 'senior', 'cloud'), q('e', 'mid', 'cloud', 'single'), q('f', 'junior', 'cloud', 'single')];

describe('mockPool', () => {
  it('treats empty levels, domains and kinds as all', () => {
    expect(mockPool(bank, { levels: [], domains: [], kinds: [] }).map((x) => x.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('keeps only questions matching every non-empty selection', () => {
    expect(mockPool(bank, { levels: ['mid', 'junior'], domains: ['cloud'], kinds: ['single'] }).map((x) => x.id)).toEqual(['e', 'f']);
    expect(mockPool(bank, { levels: [], domains: [], kinds: ['open'] }).map((x) => x.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('pickMock', () => {
  it('picks count questions matching levels and domains', () => {
    const picked = pickMock(bank, { count: 2, levels: ['senior', 'mid'], domains: ['cloud'], kinds: [] }, fixedRandom([0]));
    expect(picked.map((x) => x.id).sort()).toEqual(['d', 'e']);
  });

  it('filters by kinds', () => {
    const picked = pickMock(bank, { count: 10, levels: [], domains: [], kinds: ['single'] }, fixedRandom([0]));
    expect(picked.map((x) => x.id).sort()).toEqual(['e', 'f']);
  });

  it('caps at the available pool', () => {
    expect(pickMock(bank, { count: 10, levels: ['junior'], domains: [], kinds: [] }, fixedRandom([0]))).toHaveLength(2);
  });
});
