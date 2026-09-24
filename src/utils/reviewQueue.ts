// engine
import type { ProgressMap, QuestionProgress } from '../engine/progress';
import type { Question } from '../engine/question';

/**
 * True when a progress entry belongs in the review queue: the question was marked for review, or
 * the last attempt was wrong. An unattempted, unmarked question never qualifies. Review and Home
 * both use this so "marked for review" means the same thing everywhere.
 */
export function isInReviewQueue(entry: QuestionProgress | undefined): boolean {
  return entry !== undefined && (entry.flagged || (entry.attempts > 0 && entry.lastScore < 1));
}

/** Counts how many questions in `list` currently belong in the review queue. */
export function reviewQueueCount(list: Question[], progress: ProgressMap): number {
  return list.reduce((count, question) => count + (isInReviewQueue(progress[question.id]) ? 1 : 0), 0);
}
