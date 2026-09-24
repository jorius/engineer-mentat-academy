// packages
import { useMemo } from 'react';

// engine
import { indexById, isTranslationLocale, loadQuestions, loadTranslations, localizeQuestion } from '../engine/registry';
import type { Question } from '../engine/question';

// hooks
import { useLocale } from './useLocale';

type QuestionBank = { list: Question[]; byId: Map<string, Question> };

const canonicalList = loadQuestions();
const canonical: QuestionBank = { list: canonicalList, byId: indexById(canonicalList) };
const translations = loadTranslations();
const banks = new Map<string, QuestionBank>([['en', canonical]]);

function bankFor(locale: string): QuestionBank {
  const key = isTranslationLocale(locale) ? locale : 'en';
  const cached = banks.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const list = canonicalList.map((question) => localizeQuestion(question, key, translations));
  const bank = { list, byId: indexById(list) };
  banks.set(key, bank);
  return bank;
}

/** The question bank with reader-facing text in the active UI language (English fallback per field). */
export function useQuestionBank(): QuestionBank {
  const locale = useLocale();
  return useMemo((): QuestionBank => bankFor(locale), [locale]);
}

/** The canonical (English) question for `id`; grading runs on this so answer keys never depend on locale. */
export function useCanonicalQuestion(id: string): Question | undefined {
  return canonical.byId.get(id);
}
