// engine
import type { GradeResult } from './grader';
import type { MaxAttempts } from './preferences';
import type { Kind } from './question';

export type AttemptPhase = 'answering' | 'checking' | 'wrong' | 'resolved';

export type AttemptOutcome = 'solved' | 'exhausted' | 'shown' | 'self';

export type AttemptState = {
  phase: AttemptPhase;
  attemptsUsed: number;
  outcome?: AttemptOutcome;
  lastResult?: GradeResult;
  lockedOptionIds: string[];
};

export type AttemptEvent =
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_RESULT'; result: GradeResult; kind: Kind; submittedOptionId?: string }
  | { type: 'SHOW_ANSWER' }
  | { type: 'RESET' }
  | { type: 'NEW_QUESTION' };

export const initialAttemptState: AttemptState = {
  phase: 'answering',
  attemptsUsed: 0,
  lockedOptionIds: [],
};

/** True when at least one more attempt is available after the current one is used. */
export function attemptsRemain(state: AttemptState, maxAttempts: MaxAttempts): boolean {
  return maxAttempts === 'unlimited' || state.attemptsUsed + 1 < maxAttempts;
}

function canRestart(phase: AttemptPhase): boolean {
  return phase === 'answering' || phase === 'wrong';
}

function submitResult(
  state: AttemptState,
  event: { type: 'SUBMIT_RESULT'; result: GradeResult; kind: Kind; submittedOptionId?: string },
  maxAttempts: MaxAttempts,
): AttemptState {
  if (state.phase !== 'checking') {
    return state;
  }
  const { result, kind, submittedOptionId } = event;
  if (result.verdict === 'self') {
    return { ...state, phase: 'resolved', outcome: 'self', lastResult: result };
  }
  if (result.verdict === 'pass') {
    return { ...state, phase: 'resolved', outcome: 'solved', lastResult: result };
  }
  const attemptsUsed = state.attemptsUsed + 1;
  const lockedOptionIds =
    kind === 'single' && submittedOptionId !== undefined
      ? [...state.lockedOptionIds, submittedOptionId]
      : state.lockedOptionIds;
  if (attemptsRemain(state, maxAttempts)) {
    return { ...state, phase: 'wrong', attemptsUsed, lastResult: result, lockedOptionIds };
  }
  return { ...state, phase: 'resolved', outcome: 'exhausted', attemptsUsed, lastResult: result, lockedOptionIds };
}

export function attemptReducer(state: AttemptState, event: AttemptEvent, maxAttempts: MaxAttempts): AttemptState {
  switch (event.type) {
    case 'SUBMIT_START':
      return canRestart(state.phase) ? { ...state, phase: 'checking' } : state;
    case 'SUBMIT_RESULT':
      return submitResult(state, event, maxAttempts);
    case 'SHOW_ANSWER':
      return canRestart(state.phase) ? { ...state, phase: 'resolved', outcome: 'shown' } : state;
    case 'RESET':
      return canRestart(state.phase) && state.phase === 'wrong' ? { ...state, phase: 'answering' } : state;
    case 'NEW_QUESTION':
      return initialAttemptState;
    default:
      return state;
  }
}

/** True exactly on the transition into 'resolved'. */
export function shouldRecord(prev: AttemptState, next: AttemptState): boolean {
  return prev.phase !== 'resolved' && next.phase === 'resolved';
}

/** Score to record on entering 'resolved': 1 solved, 0 exhausted/shown, the rubric fraction for self. */
export function recordedScore(state: AttemptState): number {
  if (state.outcome === 'solved') {
    return 1;
  }
  if (state.outcome === 'self') {
    return state.lastResult?.score ?? 0;
  }
  return 0;
}
