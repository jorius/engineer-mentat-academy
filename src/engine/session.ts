// engine
import { filterQuestions } from './registry';
import type { Kind, Level, Question } from './question';

/** A mock's settings; an empty `levels`, `domains` or `kinds` list means all of them. */
export type MockOptions = { count: number; levels: Level[]; domains: string[]; kinds: Kind[] };

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

function allWhenEmpty<T>(values: T[]): T[] | undefined {
  return values.length === 0 ? undefined : values;
}

/** Every question a mock with these options can draw from; the setup's "available" count is its length. */
export function mockPool(list: Question[], options: Omit<MockOptions, 'count'>): Question[] {
  const matched = filterQuestions(list, { levels: allWhenEmpty(options.levels), kinds: allWhenEmpty(options.kinds) });
  return options.domains.length === 0 ? matched : matched.filter((question) => options.domains.includes(question.domain));
}

export function pickMock(list: Question[], options: MockOptions, random: () => number = Math.random): Question[] {
  return shuffle(mockPool(list, options), random).slice(0, options.count);
}
