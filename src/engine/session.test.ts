// packages
import { describe, expect, it } from 'vitest';

// engine
import { pickMock, shuffle } from './session';
import type { Question } from './question';

function q(id: string, level: Question['level'], domain = 'languages'): Question {
  return { id, domain, subject: 's', topic: 't', level, kind: 'open', prompt: 'p', tags: [], source: 'notion', explanation: 'e', modelAnswer: 'm', rubric: ['a', 'b'] };
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

describe('pickMock', () => {
  const bank = [q('a', 'junior'), q('b', 'mid'), q('c', 'senior'), q('d', 'senior', 'cloud'), q('e', 'mid', 'cloud')];

  it('picks count questions matching levels and domains', () => {
    const picked = pickMock(bank, { count: 2, levels: ['senior', 'mid'], domains: ['cloud'] }, fixedRandom([0]));
    expect(picked.map((x) => x.id).sort()).toEqual(['d', 'e']);
  });

  it('caps at the available pool', () => {
    expect(pickMock(bank, { count: 10, levels: ['junior'], domains: [] }, fixedRandom([0]))).toHaveLength(1);
  });
});
