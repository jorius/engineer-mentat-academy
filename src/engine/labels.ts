// engine
import type { Kind, Level } from './question';

// English defaults; the UI reads the same copy from `src/i18n/locales/*.json` through
// `kindLabel` / `levelLabel`, and a test keeps these in sync with `en.json`.

export const KIND_LABELS: Record<Kind, { label: string; hint: string }> = {
  single: { label: 'Single choice', hint: 'Pick the one correct option' },
  multi: { label: 'Multiple choice', hint: 'Select every correct option' },
  predict: { label: 'Predict output', hint: 'Type what the program prints' },
  code: { label: 'Write code', hint: 'Implement solution to pass the hidden tests' },
  fix: { label: 'Fix the code', hint: 'Repair the starter until the tests pass' },
  sql: { label: 'SQL query', hint: 'Write a query against the seeded database' },
  open: { label: 'Explain', hint: 'Answer out loud, then self-score against the rubric' },
};

export const LEVEL_LABELS: Record<Level, { label: string; hint: string }> = {
  junior: { label: 'Junior', hint: 'Fundamentals interviewers expect from an entry-level hire' },
  mid: { label: 'Mid', hint: 'Practical depth expected after a few years on the job' },
  senior: { label: 'Senior', hint: 'Trade-offs and edge cases expected from a senior engineer' },
};

/** Any translate function that maps a locale key to text, such as i18next's `t`. */
export type Translate = (key: string) => string;

/** Localized label and hint for a question kind; the locale keys live under `kinds.<kind>`. */
export function kindLabel(kind: Kind, t: Translate): { label: string; hint: string } {
  return { label: t(`kinds.${kind}.label`), hint: t(`kinds.${kind}.hint`) };
}

/** Localized label and hint for a level; the locale keys live under `levels.<level>`. */
export function levelLabel(level: Level, t: Translate): { label: string; hint: string } {
  return { label: t(`levels.${level}.label`), hint: t(`levels.${level}.hint`) };
}
