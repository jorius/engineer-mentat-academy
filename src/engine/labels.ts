// engine
import type { Kind, Level } from './question';

export const KIND_LABELS: Record<Kind, { label: string; hint: string }> = {
  single: { label: 'Single choice', hint: 'Pick the one correct option' },
  multi: { label: 'Multiple choice', hint: 'Select every correct option' },
  predict: { label: 'Predict output', hint: 'Type what the program prints' },
  code: { label: 'Write code', hint: 'Implement `solution` to pass the hidden tests' },
  fix: { label: 'Fix the code', hint: 'Repair the starter until the tests pass' },
  sql: { label: 'SQL query', hint: 'Write a query against the seeded database' },
  open: { label: 'Explain', hint: 'Answer out loud, then self-score against the rubric' },
};

export const LEVEL_LABELS: Record<Level, { label: string; hint: string }> = {
  junior: { label: 'Junior', hint: 'Fundamentals interviewers expect from an entry-level hire' },
  mid: { label: 'Mid', hint: 'Practical depth expected after a few years on the job' },
  senior: { label: 'Senior', hint: 'Trade-offs and edge cases expected from a senior engineer' },
};
