// engine
import { filterQuestions } from './registry';
import type { Level, Question } from './question';

export type MockOptions = { count: number; levels: Level[]; domains: string[] };

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = a;
  }
  return copy;
}

export function pickMock(list: Question[], options: MockOptions, random: () => number = Math.random): Question[] {
  const byLevel = filterQuestions(list, { levels: options.levels });
  const pool = options.domains.length === 0 ? byLevel : byLevel.filter((question) => options.domains.includes(question.domain));
  return shuffle(pool, random).slice(0, options.count);
}
