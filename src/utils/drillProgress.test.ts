// packages
import { describe, expect, it } from 'vitest';

// engine
import type { SavedDrill } from '../engine/drills';
import type { ProgressMap, QuestionProgress } from '../engine/progress';

// utils
import { describeDrill, drillStatus } from './drillProgress';

// i18n
import i18n from '../i18n';

const STARTED = '2026-09-23T12:00:00.000Z';

function drill(extra: Partial<SavedDrill> = {}): SavedDrill {
  return { id: 'd1', query: '', questionIds: ['q1', 'q2', 'q3', 'q4'], createdAt: STARTED, startedAt: STARTED, ...extra };
}

function entry(lastAt: string, extra: Partial<QuestionProgress> = {}): QuestionProgress {
  return { attempts: 1, lastScore: 1, lastAt, flagged: false, notes: '', ...extra };
}

describe('drillStatus', () => {
  it('is fresh when nothing was recorded', () => {
    expect(drillStatus(drill(), {})).toEqual({ done: 0, total: 4, nextIndex: 0, finished: false });
  });

  it('counts only progress recorded at or after startedAt', () => {
    const progress: ProgressMap = {
      q1: entry(STARTED),
      q2: entry('2026-09-23T11:59:59.999Z'),
      q3: entry('2026-09-23T12:05:00.000Z'),
      q4: entry('', { attempts: 0, flagged: true }),
    };
    expect(drillStatus(drill(), progress)).toEqual({ done: 2, total: 4, nextIndex: 1, finished: false });
  });

  it('points nextIndex at the first question not done, even with later ones done', () => {
    const progress: ProgressMap = { q1: entry(STARTED), q2: entry(STARTED), q4: entry(STARTED) };
    expect(drillStatus(drill(), progress)).toMatchObject({ done: 3, nextIndex: 2, finished: false });
  });

  it('is finished with nextIndex = total when every question is done', () => {
    const progress: ProgressMap = { q1: entry(STARTED), q2: entry(STARTED), q3: entry(STARTED), q4: entry(STARTED) };
    expect(drillStatus(drill(), progress)).toEqual({ done: 4, total: 4, nextIndex: 4, finished: true });
  });

  it('treats a restart as fresh because older progress no longer counts', () => {
    const progress: ProgressMap = { q1: entry(STARTED), q2: entry(STARTED) };
    expect(drillStatus(drill({ startedAt: '2026-09-24T00:00:00.000Z' }), progress)).toMatchObject({ done: 0, nextIndex: 0 });
  });

  it('skips ids missing from the bank and does not count them', () => {
    const progress: ProgressMap = { q1: entry(STARTED), q2: entry(STARTED) };
    const known = new Set(['q1', 'q3', 'q4']);
    expect(drillStatus(drill(), progress, (id) => known.has(id))).toEqual({ done: 1, total: 3, nextIndex: 1, finished: false });
  });

  it('is not finished when the drill has no questions left', () => {
    expect(drillStatus(drill({ questionIds: [] }), {})).toEqual({ done: 0, total: 0, nextIndex: 0, finished: false });
  });
});

describe('describeDrill', () => {
  const en = i18n.getFixedT('en');
  const es = i18n.getFixedT('es');

  it('describes a subject with levels, kinds and nothing else', () => {
    expect(describeDrill('domain=languages&subject=typescript&kind=single,code', en, 'en')).toBe('TypeScript · all levels · Single choice, Write code');
    expect(describeDrill('domain=languages&subject=typescript&level=junior,senior', en, 'en')).toBe('TypeScript · Junior, Senior · all kinds');
  });

  it('describes an empty query and the Home unseen link', () => {
    expect(describeDrill('', en, 'en')).toBe('All subjects · all levels · all kinds');
    expect(describeDrill('level=junior,mid,senior', en, 'en')).toBe('All subjects · all levels · all kinds');
    expect(describeDrill('kind=single,multi,predict,code,fix,sql,open&level=mid', en, 'en')).toBe('All subjects · Mid · all kinds');
    expect(describeDrill('unseen=1', en, 'en')).toBe('All subjects · all levels · all kinds · Unseen');
    expect(describeDrill('only=marked', en, 'en')).toBe('All subjects · all levels · all kinds · Marked for review');
    expect(describeDrill('only=missed', en, 'en')).toBe('All subjects · all levels · all kinds · Missed');
  });

  it('uses the domain when there is no subject and adds the topic when set', () => {
    expect(describeDrill('domain=languages', en, 'en')).toBe('Languages · all levels · all kinds');
    expect(describeDrill('domain=languages&subject=javascript&topic=closures', en, 'en')).toBe('JavaScript · Closures · all levels · all kinds');
  });

  it('falls back to All subjects for ids missing from the taxonomy', () => {
    expect(describeDrill('domain=nope&subject=nada&topic=zip', en, 'en')).toBe('All subjects · all levels · all kinds');
  });

  it('describes in Spanish', () => {
    expect(describeDrill('', es, 'es')).toBe('Todos los temas · todos los niveles · todos los tipos');
    expect(describeDrill('domain=languages', es, 'es')).toBe('Lenguajes · todos los niveles · todos los tipos');
    expect(describeDrill('domain=languages&subject=javascript&topic=closures&only=missed', es, 'es')).toBe(
      'JavaScript · Closures (clausuras) · todos los niveles · todos los tipos · Falladas',
    );
    expect(describeDrill('domain=languages&subject=typescript&level=mid&kind=code&unseen=1', es, 'es')).toBe(
      `TypeScript · ${es('levels.mid.label')} · ${es('kinds.code.label')} · Sin ver`,
    );
  });
});
