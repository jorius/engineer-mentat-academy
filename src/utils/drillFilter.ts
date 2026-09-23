// engine
import { KINDS, LEVELS } from '../engine/question';
import type { Kind, Level } from '../engine/question';
import type { QuestionFilter } from '../engine/registry';

export type DrillFilter = QuestionFilter & { unseen: boolean };

function list<T extends string>(raw: string | null, allowed: readonly T[]): T[] | undefined {
  if (raw === null) {
    return undefined;
  }
  const values = raw.split(',').filter((v): v is T => (allowed as readonly string[]).includes(v));
  return values.length === 0 ? undefined : values;
}

export function parseDrillFilter(params: URLSearchParams): DrillFilter {
  const filter: DrillFilter = { unseen: params.get('unseen') === '1' };
  const domain = params.get('domain');
  const subject = params.get('subject');
  const topic = params.get('topic');
  const levels = list<Level>(params.get('level'), LEVELS);
  const kinds = list<Kind>(params.get('kind'), KINDS);
  if (domain !== null) filter.domain = domain;
  if (subject !== null) filter.subject = subject;
  if (topic !== null) filter.topic = topic;
  if (levels !== undefined) filter.levels = levels;
  if (kinds !== undefined) filter.kinds = kinds;
  return filter;
}
