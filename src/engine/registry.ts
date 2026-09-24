// engine
import type { Kind, Level, Question, QuestionTranslation } from './question';
import type { ProgressMap } from './progress';

export type QuestionFilter = {
  domain?: string;
  subject?: string;
  topic?: string;
  levels?: Level[];
  kinds?: Kind[];
  ids?: string[];
};

export type Summary = { total: number; attempted: number; unattempted: number; mastery: number; progress: number; flagged: number };

type ContentModule = { questions: Question[] };
type TranslationModule = { translations: Record<string, QuestionTranslation> };

/** Locales that have per-question translation files (`<subject>.<locale>.ts`); English is canonical. */
export const TRANSLATION_LOCALES = ['es'] as const;
export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number];
export type TranslationTable = Record<TranslationLocale, Record<string, QuestionTranslation>>;

export function isTranslationLocale(locale: string): locale is TranslationLocale {
  return (TRANSLATION_LOCALES as readonly string[]).includes(locale);
}

export function loadQuestions(): Question[] {
  const modules = import.meta.glob<ContentModule>(['../content/*/*.ts', '!../content/*/*.es.ts'], { eager: true });
  return Object.values(modules).flatMap((m) => m.questions);
}

export function loadTranslations(): TranslationTable {
  const modules = import.meta.glob<TranslationModule>('../content/*/*.es.ts', { eager: true });
  const es: Record<string, QuestionTranslation> = {};
  for (const module of Object.values(modules)) {
    Object.assign(es, module.translations);
  }
  return { es };
}

/**
 * Returns `question` with its reader-facing text in `locale`. Each field falls back to English on its
 * own: a missing option, model answer or rubric line keeps the canonical text. Ids, code, tests,
 * schemas and answer keys are never touched, so grading is locale-independent.
 */
export function localizeQuestion(question: Question, locale: string, translations: TranslationTable): Question {
  const translation = isTranslationLocale(locale) ? translations[locale][question.id] : undefined;
  if (translation === undefined) {
    return question;
  }
  const prose = { prompt: translation.prompt, explanation: translation.explanation, ...(translation.hint === undefined ? {} : { hint: translation.hint }) };
  switch (question.kind) {
    case 'single':
    case 'multi':
      return {
        ...question,
        ...prose,
        options: question.options.map((option) => ({ ...option, text: translation.options?.[option.id] ?? option.text })),
      };
    case 'open':
      return {
        ...question,
        ...prose,
        modelAnswer: translation.modelAnswer ?? question.modelAnswer,
        rubric: question.rubric.map((line, index) => translation.rubric?.[index] ?? line),
      };
    default:
      return { ...question, ...prose };
  }
}

export function indexById(list: Question[]): Map<string, Question> {
  return new Map(list.map((question) => [question.id, question]));
}

export function filterQuestions(list: Question[], filter: QuestionFilter): Question[] {
  const ids = filter.ids === undefined ? null : new Set(filter.ids);
  return list.filter(
    (question) =>
      (filter.domain === undefined || question.domain === filter.domain) &&
      (filter.subject === undefined || question.subject === filter.subject) &&
      (filter.topic === undefined || question.topic === filter.topic) &&
      (filter.levels === undefined || filter.levels.includes(question.level)) &&
      (filter.kinds === undefined || filter.kinds.includes(question.kind)) &&
      (ids === null || ids.has(question.id)),
  );
}

export function summarize(list: Question[], progress: ProgressMap): Summary {
  const entries = list.map((question) => progress[question.id]).filter((p) => p !== undefined);
  const attempted = entries.filter((p) => p.attempts > 0);
  const mastery = attempted.length === 0 ? 0 : attempted.reduce((sum, p) => sum + p.lastScore, 0) / attempted.length;
  const progressRatio = list.length === 0 ? 0 : attempted.length / list.length;
  return {
    total: list.length,
    attempted: attempted.length,
    unattempted: list.length - attempted.length,
    mastery,
    progress: progressRatio,
    flagged: entries.filter((p) => p.flagged).length,
  };
}

export function countBy(list: Question[], key: 'domain' | 'subject' | 'topic' | 'level' | 'kind'): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const question of list) {
    const value = question[key];
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}
