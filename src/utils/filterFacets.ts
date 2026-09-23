// engine
import { KINDS, LEVELS } from '../engine/question';
import type { Kind, Level, Question } from '../engine/question';

export type Facet<T> = { value: T; count: number };

/**
 * Chip options for the level and kind groups of `questions` (the unfiltered scope). A value is listed
 * only when the scope has at least one question of it, so a kind such as "SQL query" never shows up
 * outside the subjects that have one. Each count applies the *other* group's selection (empty = all),
 * which is how many questions picking that chip would add.
 */
export function facets(questions: Question[], selected: { levels: Level[]; kinds: Kind[] }): { levels: Facet<Level>[]; kinds: Facet<Kind>[] } {
  const levelOk = (level: Level): boolean => selected.levels.length === 0 || selected.levels.includes(level);
  const kindOk = (kind: Kind): boolean => selected.kinds.length === 0 || selected.kinds.includes(kind);
  const levels = LEVELS.filter((level) => questions.some((q) => q.level === level)).map((level) => ({
    value: level,
    count: questions.filter((q) => q.level === level && kindOk(q.kind)).length,
  }));
  const kinds = KINDS.filter((kind) => questions.some((q) => q.kind === kind)).map((kind) => ({
    value: kind,
    count: questions.filter((q) => q.kind === kind && levelOk(q.level)).length,
  }));
  return { levels, kinds };
}
