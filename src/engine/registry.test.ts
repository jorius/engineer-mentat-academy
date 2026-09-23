// packages
import { describe, expect, it } from 'vitest';

// engine
import { countBy, filterQuestions, indexById, summarize } from './registry';
import type { Question } from './question';

function q(id: string, extra: Partial<Question> = {}): Question {
  return {
    id,
    domain: 'languages',
    subject: 'javascript',
    topic: 'closures',
    level: 'mid',
    kind: 'open',
    prompt: 'p',
    tags: [],
    source: 'notion',
    explanation: 'e',
    modelAnswer: 'm',
    rubric: ['a', 'b'],
    ...extra,
  } as Question;
}

const bank = [q('a'), q('b', { level: 'senior', subject: 'typescript', topic: 'generics' }), q('c', { domain: 'cloud', subject: 'aws', topic: 's3', level: 'junior' })];

describe('registry helpers', () => {
  it('indexes by id', () => {
    expect(indexById(bank).get('b')?.subject).toBe('typescript');
  });

  it('filters by domain, subject, topic, level, kind and ids', () => {
    expect(filterQuestions(bank, { domain: 'languages' }).map((x) => x.id)).toEqual(['a', 'b']);
    expect(filterQuestions(bank, { subject: 'typescript' }).map((x) => x.id)).toEqual(['b']);
    expect(filterQuestions(bank, { topic: 's3' }).map((x) => x.id)).toEqual(['c']);
    expect(filterQuestions(bank, { levels: ['junior', 'senior'] }).map((x) => x.id)).toEqual(['b', 'c']);
    expect(filterQuestions(bank, { kinds: ['code'] })).toEqual([]);
    expect(filterQuestions(bank, { ids: ['c', 'a'] }).map((x) => x.id)).toEqual(['a', 'c']);
  });

  it('summarizes mastery from progress', () => {
    const summary = summarize(bank, { a: { attempts: 1, lastScore: 1, lastAt: '', flagged: false, notes: '' }, b: { attempts: 2, lastScore: 0.5, lastAt: '', flagged: true, notes: '' } });
    expect(summary).toEqual({ total: 3, attempted: 2, unattempted: 1, mastery: 0.75, flagged: 1 });
  });

  it('summarizes an untouched bank with zero mastery', () => {
    expect(summarize(bank, {})).toEqual({ total: 3, attempted: 0, unattempted: 3, mastery: 0, flagged: 0 });
  });

  it('counts by a key', () => {
    expect(countBy(bank, 'level')).toEqual({ mid: 1, senior: 1, junior: 1 });
  });
});
