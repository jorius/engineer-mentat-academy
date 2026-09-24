// packages
import { describe, expect, it } from 'vitest';

// engine
import type { ProgressMap, QuestionProgress } from '../engine/progress';
import type { Question } from '../engine/question';

// utils
import { isInReviewQueue, reviewQueueCount } from './reviewQueue';

function entry(extra: Partial<QuestionProgress> = {}): QuestionProgress {
  return { attempts: 0, lastScore: 0, lastAt: '', flagged: false, notes: '', ...extra };
}

function q(id: string): Question {
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
    rubric: ['a'],
  } as Question;
}

describe('isInReviewQueue', () => {
  it('is false for no progress entry', () => {
    expect(isInReviewQueue(undefined)).toBe(false);
  });

  it('is false for an unattempted, unmarked entry', () => {
    expect(isInReviewQueue(entry())).toBe(false);
  });

  it('is false once solved and not marked', () => {
    expect(isInReviewQueue(entry({ attempts: 1, lastScore: 1 }))).toBe(false);
  });

  it('is true after a missed attempt', () => {
    expect(isInReviewQueue(entry({ attempts: 1, lastScore: 0.5 }))).toBe(true);
  });

  it('is true when marked, even with a perfect score', () => {
    expect(isInReviewQueue(entry({ attempts: 1, lastScore: 1, flagged: true }))).toBe(true);
  });

  it('is true when marked and never attempted', () => {
    expect(isInReviewQueue(entry({ flagged: true }))).toBe(true);
  });
});

describe('reviewQueueCount', () => {
  it('counts only missed-or-marked questions', () => {
    const list = [q('a'), q('b'), q('c'), q('d')];
    const progress: ProgressMap = {
      a: entry({ attempts: 1, lastScore: 0 }), // missed
      b: entry({ attempts: 1, lastScore: 1 }), // solved, not marked
      c: entry({ attempts: 1, lastScore: 1, flagged: true }), // solved but marked
      // d: no entry at all
    };
    expect(reviewQueueCount(list, progress)).toBe(2);
  });

  it('is 0 for an empty list', () => {
    expect(reviewQueueCount([], {})).toBe(0);
  });
});
