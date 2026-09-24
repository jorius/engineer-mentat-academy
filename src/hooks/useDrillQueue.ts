// packages
import { useCallback, useState } from 'react';

// engine
import type { Question } from '../engine/question';

export function useDrillQueue(questions: Question[]): { current: Question | undefined; index: number; total: number; next: () => void; done: boolean } {
  const key = questions.map((q) => q.id).join('|');
  const [state, setState] = useState({ key, index: 0 });
  if (state.key !== key) {
    setState({ key, index: 0 });
  }
  const index = state.key === key ? state.index : 0;
  const next = useCallback((): void => setState((s) => ({ ...s, index: s.index + 1 })), []);
  return { current: questions[index], index, total: questions.length, next, done: questions.length > 0 && index >= questions.length };
}
