// content
import { domainName, findDomain, findSubject, findTopic, subjectName, topicName } from '../content/taxonomy';

// engine
import { kindLabel, levelLabel } from '../engine/labels';
import type { Translate } from '../engine/labels';
import type { SavedDrill } from '../engine/drills';
import type { ProgressMap } from '../engine/progress';

// utils
import { parseDrillFilter } from './drillFilter';

export type DrillStatus = { done: number; total: number; nextIndex: number; finished: boolean };

/**
 * Where a drill stands, derived from progress: a question is done when it was last recorded at or
 * after the drill's `startedAt`. Ids for which `exists` is false (removed from the bank) are skipped,
 * so `total` and `nextIndex` refer to the remaining questions in their frozen order.
 */
export function drillStatus(drill: SavedDrill, progress: ProgressMap, exists: (id: string) => boolean = (): boolean => true): DrillStatus {
  const ids = drill.questionIds.filter(exists);
  const isDone = ids.map((id) => {
    const lastAt = progress[id]?.lastAt ?? '';
    return lastAt !== '' && lastAt >= drill.startedAt;
  });
  const done = isDone.filter(Boolean).length;
  const firstOpen = isDone.indexOf(false);
  const nextIndex = firstOpen === -1 ? ids.length : firstOpen;
  return { done, total: ids.length, nextIndex, finished: ids.length > 0 && done === ids.length };
}

/** A readable name for a drill's query: scope · topic · levels · kinds · only, e.g. "TypeScript · all levels · Single choice, Write code". */
export function describeDrill(query: string, t: Translate, locale: string): string {
  const filter = parseDrillFilter(new URLSearchParams(query));
  const domain = filter.domain === undefined ? undefined : findDomain(filter.domain);
  const subject = domain === undefined || filter.subject === undefined ? undefined : findSubject(domain.id, filter.subject);
  const topic = subject === undefined || domain === undefined || filter.topic === undefined ? undefined : findTopic(domain.id, subject.id, filter.topic);

  const parts: string[] = [];
  if (subject !== undefined) {
    parts.push(subjectName(subject, locale));
  } else if (domain !== undefined) {
    parts.push(domainName(domain, locale));
  } else {
    parts.push(t('drill.allSubjects'));
  }
  if (topic !== undefined) {
    parts.push(topicName(topic, locale));
  }
  parts.push(filter.levels === undefined ? t('drill.allLevels') : filter.levels.map((level) => levelLabel(level, t).label).join(', '));
  parts.push(filter.kinds === undefined ? t('drill.allKinds') : filter.kinds.map((kind) => kindLabel(kind, t).label).join(', '));
  if (filter.unseen) {
    parts.push(t('filters.unseen'));
  } else if (filter.only !== undefined) {
    parts.push(t(`filters.${filter.only}`));
  }
  return parts.join(' · ');
}
