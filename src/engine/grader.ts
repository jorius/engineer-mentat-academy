// engine
import type { Answer, Question } from './question';
import type { RunRequest, RunResult } from './runner/execute';
import type { SqlResult } from './sql/runSql';

export type Verdict = 'pass' | 'fail' | 'self';

export type GradeResult = {
  score: number;
  verdict: Verdict;
  feedback: string[];
  run?: RunResult;
  sql?: SqlResult;
};

export interface Grader {
  grade(question: Question, answer: Answer): Promise<GradeResult>;
  /** Runs code against hidden tests without grading; the same runner `grade` uses for code and fix. */
  run?(request: RunRequest): Promise<RunResult>;
}
