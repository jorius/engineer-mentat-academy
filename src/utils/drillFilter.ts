// engine
import { KINDS, LEVELS } from '../engine/question';
import type { Kind, Level } from '../engine/question';
import type { QuestionProgress } from '../engine/progress';
import type { QuestionFilter } from '../engine/registry';

/** Progress-based filters: unseen = never attempted, marked = flagged for review, missed = last score below 100%. */
export const ONLY_VALUES = ['unseen', 'marked', 'missed'] as const;
export type Only = (typeof ONLY_VALUES)[number];

/** `unseen=1` keeps its own parameter (the Home link uses it); `only` carries the other two. */
export type DrillFilter = QuestionFilter & { unseen: boolean; only?: Exclude<Only, 'unseen'> };

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
  const only = params.get('only');
  if (domain !== null) filter.domain = domain;
  if (subject !== null) filter.subject = subject;
  if (topic !== null) filter.topic = topic;
  if (levels !== undefined) filter.levels = levels;
  if (kinds !== undefined) filter.kinds = kinds;
  if (only === 'marked' || only === 'missed') filter.only = only;
  return filter;
}

/** Whether a question with this progress entry passes the `only` filter. */
export function matchesOnly(entry: QuestionProgress | undefined, only: Only): boolean {
  switch (only) {
    case 'unseen':
      return entry === undefined || entry.attempts === 0;
    case 'marked':
      return entry?.flagged === true;
    case 'missed':
      return entry !== undefined && entry.attempts > 0 && entry.lastScore < 1;
  }
}

/** The part of `selected` that is present in `available` (chips outside the scope cannot be seen or cleared). */
export function inScope<T>(selected: readonly T[], available: readonly T[]): T[] {
  return selected.filter((value) => available.includes(value));
}

/** The selection as a filter: `undefined` when it does not narrow `available` (nothing or everything picked). */
export function narrowing<T>(selected: readonly T[], available: readonly T[]): T[] | undefined {
  const picked = inScope(selected, available);
  return picked.length === 0 || picked.length === available.length ? undefined : picked;
}

export type DrillQuery = { domain?: string; subject?: string; topic?: string; levels?: Level[]; kinds?: Kind[]; only?: Only | null };

/** The `/drill` search parameters for a query; `unseen` maps to `unseen=1`, the other `only` values to `only=`. */
export function drillQuery({ domain, subject, topic, levels, kinds, only }: DrillQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (domain !== undefined) params.set('domain', domain);
  if (subject !== undefined) params.set('subject', subject);
  if (topic !== undefined) params.set('topic', topic);
  if (levels !== undefined && levels.length > 0) params.set('level', levels.join(','));
  if (kinds !== undefined && kinds.length > 0) params.set('kind', kinds.join(','));
  if (only === 'unseen') params.set('unseen', '1');
  else if (only !== undefined && only !== null) params.set('only', only);
  return params;
}
