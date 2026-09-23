// engine
import type { Kind, Level, Question } from './question';
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

export function loadQuestions(): Question[] {
  const modules = import.meta.glob<ContentModule>('../content/*/*.ts', { eager: true });
  return Object.values(modules).flatMap((m) => m.questions);
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
