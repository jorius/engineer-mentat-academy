// packages
import { useMemo } from 'react';

// engine
import { indexById, loadQuestions } from '../engine/registry';
import type { Question } from '../engine/question';

const list = loadQuestions();
const cache: { list: Question[]; byId: Map<string, Question> } = { list, byId: indexById(list) };

export function useQuestionBank(): { list: Question[]; byId: Map<string, Question> } {
  return useMemo((): { list: Question[]; byId: Map<string, Question> } => cache, []);
}
