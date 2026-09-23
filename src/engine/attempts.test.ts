// packages
import { describe, expect, it } from 'vitest';

// engine
import {
  attemptReducer,
  attemptsRemain,
  initialAttemptState,
  recordedScore,
  shouldRecord,
  type AttemptState,
} from './attempts';
import type { GradeResult } from './grader';

function grade(overrides: Partial<GradeResult> = {}): GradeResult {
  return { score: 0, verdict: 'fail', feedback: [], ...overrides };
}

describe('initialAttemptState', () => {
  it('starts answering with no attempts used and nothing locked', () => {
    expect(initialAttemptState).toEqual({
      phase: 'answering',
      attemptsUsed: 0,
      lockedOptionIds: [],
    });
  });
});

describe('attemptsRemain', () => {
  it('is always true when unlimited', () => {
    expect(attemptsRemain({ ...initialAttemptState, attemptsUsed: 99 }, 'unlimited')).toBe(true);
  });

  it('is true while attemptsUsed + 1 is below maxAttempts', () => {
    expect(attemptsRemain({ ...initialAttemptState, attemptsUsed: 0 }, 3)).toBe(true);
    expect(attemptsRemain({ ...initialAttemptState, attemptsUsed: 1 }, 3)).toBe(true);
  });

  it('is false once attemptsUsed + 1 reaches maxAttempts', () => {
    expect(attemptsRemain({ ...initialAttemptState, attemptsUsed: 2 }, 3)).toBe(false);
    expect(attemptsRemain({ ...initialAttemptState, attemptsUsed: 0 }, 1)).toBe(false);
  });
});

describe('attemptReducer', () => {
  it('SUBMIT_START moves answering to checking', () => {
    const next = attemptReducer(initialAttemptState, { type: 'SUBMIT_START' }, 3);
    expect(next.phase).toBe('checking');
  });

  it('SUBMIT_START moves wrong to checking', () => {
    const wrong: AttemptState = { ...initialAttemptState, phase: 'wrong', attemptsUsed: 1 };
    const next = attemptReducer(wrong, { type: 'SUBMIT_START' }, 3);
    expect(next.phase).toBe('checking');
  });

  it('SUBMIT_RESULT pass from checking resolves solved', () => {
    const checking: AttemptState = { ...initialAttemptState, phase: 'checking' };
    const result = grade({ score: 1, verdict: 'pass' });
    const next = attemptReducer(checking, { type: 'SUBMIT_RESULT', result, kind: 'single', submittedOptionId: 'b' }, 3);
    expect(next.phase).toBe('resolved');
    expect(next.outcome).toBe('solved');
    expect(next.lastResult).toBe(result);
  });

  it('SUBMIT_RESULT fail with attempts remaining goes to wrong and increments attemptsUsed', () => {
    const checking: AttemptState = { ...initialAttemptState, phase: 'checking' };
    const result = grade({ verdict: 'fail' });
    const next = attemptReducer(checking, { type: 'SUBMIT_RESULT', result, kind: 'code' }, 3);
    expect(next.phase).toBe('wrong');
    expect(next.attemptsUsed).toBe(1);
    expect(next.lastResult).toBe(result);
  });

  it('SUBMIT_RESULT fail for kind single appends the submitted option to lockedOptionIds', () => {
    const checking: AttemptState = { ...initialAttemptState, phase: 'checking' };
    const result = grade({ verdict: 'fail' });
    const next = attemptReducer(
      checking,
      { type: 'SUBMIT_RESULT', result, kind: 'single', submittedOptionId: 'a' },
      3,
    );
    expect(next.lockedOptionIds).toEqual(['a']);
  });

  it('SUBMIT_RESULT fail for a non-single kind does not touch lockedOptionIds', () => {
    const checking: AttemptState = { ...initialAttemptState, phase: 'checking' };
    const result = grade({ verdict: 'fail' });
    const next = attemptReducer(
      checking,
      { type: 'SUBMIT_RESULT', result, kind: 'multi', submittedOptionId: 'a' },
      3,
    );
    expect(next.lockedOptionIds).toEqual([]);
  });

  it('SUBMIT_RESULT fail with no attempts remaining resolves exhausted and still locks the option', () => {
    const checking: AttemptState = { ...initialAttemptState, phase: 'checking', attemptsUsed: 2, lockedOptionIds: ['x', 'y'] };
    const result = grade({ verdict: 'fail' });
    const next = attemptReducer(checking, { type: 'SUBMIT_RESULT', result, kind: 'single', submittedOptionId: 'a' }, 3);
    expect(next.phase).toBe('resolved');
    expect(next.outcome).toBe('exhausted');
    expect(next.attemptsUsed).toBe(3);
    expect(next.lockedOptionIds).toEqual(['x', 'y', 'a']);
  });

  it('SUBMIT_RESULT fail with maxAttempts 1 exhausts on the first attempt and locks that option', () => {
    const checking: AttemptState = { ...initialAttemptState, phase: 'checking' };
    const result = grade({ verdict: 'fail' });
    const next = attemptReducer(checking, { type: 'SUBMIT_RESULT', result, kind: 'single', submittedOptionId: 'a' }, 1);
    expect(next.phase).toBe('resolved');
    expect(next.outcome).toBe('exhausted');
    expect(next.lockedOptionIds).toEqual(['a']);
  });

  it('SUBMIT_RESULT fail with maxAttempts 2 locks both wrong options in order before exhausting', () => {
    const first = attemptReducer(
      { ...initialAttemptState, phase: 'checking' },
      { type: 'SUBMIT_RESULT', result: grade({ verdict: 'fail' }), kind: 'single', submittedOptionId: 'a' },
      2,
    );
    expect(first.phase).toBe('wrong');
    expect(first.lockedOptionIds).toEqual(['a']);

    const second = attemptReducer(
      { ...first, phase: 'checking' },
      { type: 'SUBMIT_RESULT', result: grade({ verdict: 'fail' }), kind: 'single', submittedOptionId: 'b' },
      2,
    );
    expect(second.phase).toBe('resolved');
    expect(second.outcome).toBe('exhausted');
    expect(second.lockedOptionIds).toEqual(['a', 'b']);
  });

  it('SUBMIT_RESULT fail is never exhausted when maxAttempts is unlimited', () => {
    const checking: AttemptState = { ...initialAttemptState, phase: 'checking', attemptsUsed: 50 };
    const result = grade({ verdict: 'fail' });
    const next = attemptReducer(checking, { type: 'SUBMIT_RESULT', result, kind: 'code' }, 'unlimited');
    expect(next.phase).toBe('wrong');
    expect(next.attemptsUsed).toBe(51);
  });

  it('SUBMIT_RESULT for open (verdict self) resolves with outcome self', () => {
    const checking: AttemptState = { ...initialAttemptState, phase: 'checking' };
    const result = grade({ verdict: 'self', score: 0.5 });
    const next = attemptReducer(checking, { type: 'SUBMIT_RESULT', result, kind: 'open' }, 3);
    expect(next.phase).toBe('resolved');
    expect(next.outcome).toBe('self');
    expect(next.lastResult).toBe(result);
  });

  it('SUBMIT_RESULT arriving outside checking is a no-op', () => {
    const result = grade({ verdict: 'pass' });
    const next = attemptReducer(initialAttemptState, { type: 'SUBMIT_RESULT', result, kind: 'single' }, 3);
    expect(next).toBe(initialAttemptState);
  });

  it('SHOW_ANSWER from answering resolves shown', () => {
    const next = attemptReducer(initialAttemptState, { type: 'SHOW_ANSWER' }, 3);
    expect(next.phase).toBe('resolved');
    expect(next.outcome).toBe('shown');
  });

  it('SHOW_ANSWER from wrong resolves shown', () => {
    const wrong: AttemptState = { ...initialAttemptState, phase: 'wrong', attemptsUsed: 1 };
    const next = attemptReducer(wrong, { type: 'SHOW_ANSWER' }, 3);
    expect(next.phase).toBe('resolved');
    expect(next.outcome).toBe('shown');
  });

  it('SHOW_ANSWER from checking or resolved is a no-op', () => {
    const checking: AttemptState = { ...initialAttemptState, phase: 'checking' };
    expect(attemptReducer(checking, { type: 'SHOW_ANSWER' }, 3)).toBe(checking);

    const resolved: AttemptState = { ...initialAttemptState, phase: 'resolved', outcome: 'solved' };
    expect(attemptReducer(resolved, { type: 'SHOW_ANSWER' }, 3)).toBe(resolved);
  });

  it('RESET from wrong goes back to answering with attempts unchanged', () => {
    const wrong: AttemptState = { ...initialAttemptState, phase: 'wrong', attemptsUsed: 1, lockedOptionIds: ['a'] };
    const next = attemptReducer(wrong, { type: 'RESET' }, 3);
    expect(next.phase).toBe('answering');
    expect(next.attemptsUsed).toBe(1);
  });

  it('RESET from answering, checking or resolved is a no-op', () => {
    expect(attemptReducer(initialAttemptState, { type: 'RESET' }, 3)).toBe(initialAttemptState);

    const checking: AttemptState = { ...initialAttemptState, phase: 'checking' };
    expect(attemptReducer(checking, { type: 'RESET' }, 3)).toBe(checking);

    const resolved: AttemptState = { ...initialAttemptState, phase: 'resolved', outcome: 'solved' };
    expect(attemptReducer(resolved, { type: 'RESET' }, 3)).toBe(resolved);
  });

  it('NEW_QUESTION returns to the initial state from any phase', () => {
    const resolved: AttemptState = {
      phase: 'resolved',
      outcome: 'exhausted',
      attemptsUsed: 3,
      lockedOptionIds: ['a', 'b'],
      lastResult: grade(),
    };
    expect(attemptReducer(resolved, { type: 'NEW_QUESTION' }, 3)).toEqual(initialAttemptState);

    const wrong: AttemptState = { ...initialAttemptState, phase: 'wrong', attemptsUsed: 1 };
    expect(attemptReducer(wrong, { type: 'NEW_QUESTION' }, 3)).toEqual(initialAttemptState);
  });
});

describe('shouldRecord', () => {
  it('is true exactly on the transition into resolved', () => {
    const wrong: AttemptState = { ...initialAttemptState, phase: 'wrong', attemptsUsed: 1 };
    const resolved: AttemptState = { ...wrong, phase: 'resolved', outcome: 'exhausted' };
    expect(shouldRecord(wrong, resolved)).toBe(true);
  });

  it('is false when already resolved (no re-record)', () => {
    const resolved: AttemptState = { ...initialAttemptState, phase: 'resolved', outcome: 'solved' };
    expect(shouldRecord(resolved, resolved)).toBe(false);
  });

  it('is false for transitions that do not land on resolved', () => {
    const answering = initialAttemptState;
    const checking: AttemptState = { ...initialAttemptState, phase: 'checking' };
    expect(shouldRecord(answering, checking)).toBe(false);

    const wrong: AttemptState = { ...initialAttemptState, phase: 'wrong', attemptsUsed: 1 };
    expect(shouldRecord(checking, wrong)).toBe(false);
  });
});

describe('recordedScore', () => {
  it('is 1 for solved', () => {
    const state: AttemptState = { ...initialAttemptState, phase: 'resolved', outcome: 'solved' };
    expect(recordedScore(state)).toBe(1);
  });

  it('is 0 for exhausted', () => {
    const state: AttemptState = { ...initialAttemptState, phase: 'resolved', outcome: 'exhausted' };
    expect(recordedScore(state)).toBe(0);
  });

  it('is 0 for shown', () => {
    const state: AttemptState = { ...initialAttemptState, phase: 'resolved', outcome: 'shown' };
    expect(recordedScore(state)).toBe(0);
  });

  it('is the rubric fraction from lastResult.score for self', () => {
    const state: AttemptState = {
      ...initialAttemptState,
      phase: 'resolved',
      outcome: 'self',
      lastResult: grade({ verdict: 'self', score: 0.75 }),
    };
    expect(recordedScore(state)).toBe(0.75);
  });
});
