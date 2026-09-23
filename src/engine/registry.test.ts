// packages
import { describe, expect, it } from 'vitest';

// engine
import { countBy, filterQuestions, indexById, isTranslationLocale, loadQuestions, loadTranslations, localizeQuestion, summarize } from './registry';
import type { TranslationTable } from './registry';
import type { Question } from './question';

function q(id: string, extra: Partial<Question> = {}): Question {
  return {
    id,
    domain: 'languages',
    subject: 'javascript',
    topic: 'closures',
    level: 'mid',
    kind: 'open',
    prompt: 'p',
    tags: [],
    source: 'notion',
    explanation: 'e',
    modelAnswer: 'm',
    rubric: ['a', 'b'],
    ...extra,
  } as Question;
}

const bank = [q('a'), q('b', { level: 'senior', subject: 'typescript', topic: 'generics' }), q('c', { domain: 'cloud', subject: 'aws', topic: 's3', level: 'junior' })];

describe('registry helpers', () => {
  it('indexes by id', () => {
    expect(indexById(bank).get('b')?.subject).toBe('typescript');
  });

  it('filters by domain, subject, topic, level, kind and ids', () => {
    expect(filterQuestions(bank, { domain: 'languages' }).map((x) => x.id)).toEqual(['a', 'b']);
    expect(filterQuestions(bank, { subject: 'typescript' }).map((x) => x.id)).toEqual(['b']);
    expect(filterQuestions(bank, { topic: 's3' }).map((x) => x.id)).toEqual(['c']);
    expect(filterQuestions(bank, { levels: ['junior', 'senior'] }).map((x) => x.id)).toEqual(['b', 'c']);
    expect(filterQuestions(bank, { kinds: ['code'] })).toEqual([]);
    expect(filterQuestions(bank, { ids: ['c', 'a'] }).map((x) => x.id)).toEqual(['a', 'c']);
  });

  it('summarizes mastery from progress', () => {
    const summary = summarize(bank, { a: { attempts: 1, lastScore: 1, lastAt: '', flagged: false, notes: '' }, b: { attempts: 2, lastScore: 0.5, lastAt: '', flagged: true, notes: '' } });
    expect(summary).toEqual({ total: 3, attempted: 2, unattempted: 1, mastery: 0.75, progress: 2 / 3, flagged: 1 });
  });

  it('summarizes an untouched bank with zero mastery and zero progress', () => {
    expect(summarize(bank, {})).toEqual({ total: 3, attempted: 0, unattempted: 3, mastery: 0, progress: 0, flagged: 0 });
  });

  it('reports zero progress for an empty question list', () => {
    expect(summarize([], {})).toEqual({ total: 0, attempted: 0, unattempted: 0, mastery: 0, progress: 0, flagged: 0 });
  });

  it('counts by a key', () => {
    expect(countBy(bank, 'level')).toEqual({ mid: 1, senior: 1, junior: 1 });
  });
});

const single = q('s', {
  kind: 'single',
  prompt: 'Pick one',
  explanation: 'Because',
  options: [{ id: 'a', text: 'Apple' }, { id: 'b', text: 'Banana' }],
  answer: 'b',
} as Partial<Question>);

const sql = q('sql', {
  kind: 'sql',
  prompt: 'Count rows',
  explanation: 'COUNT(*) counts rows',
  schema: 'CREATE TABLE t (x INT);',
  answer: 'SELECT COUNT(*) FROM t;',
  expectedRows: [[0]],
} as Partial<Question>);

const table: TranslationTable = {
  es: {
    a: { prompt: 'pregunta', explanation: 'explicación', modelAnswer: 'respuesta', rubric: ['uno'] },
    s: { prompt: 'Elige una', explanation: 'Porque', options: { a: 'Manzana' } },
    sql: { prompt: 'Cuenta filas', explanation: 'COUNT(*) cuenta filas' },
  },
};

describe('localizeQuestion', () => {
  it('returns the canonical question for English, unknown locales and untranslated ids', () => {
    expect(localizeQuestion(bank[0], 'en', table)).toBe(bank[0]);
    expect(localizeQuestion(bank[0], 'fr', table)).toBe(bank[0]);
    expect(localizeQuestion(bank[1], 'es', table)).toBe(bank[1]);
  });

  it('merges open-question prose with per-line rubric fallback', () => {
    const localized = localizeQuestion(bank[0], 'es', table);
    expect(localized).toMatchObject({ prompt: 'pregunta', explanation: 'explicación', modelAnswer: 'respuesta', rubric: ['uno', 'b'] });
    expect(bank[0]).toMatchObject({ prompt: 'p', rubric: ['a', 'b'] });
  });

  it('keeps the English model answer when the translation omits it', () => {
    const localized = localizeQuestion(bank[0], 'es', { es: { a: { prompt: 'p2', explanation: 'e2' } } });
    expect(localized).toMatchObject({ modelAnswer: 'm', rubric: ['a', 'b'] });
  });

  it('translates option text by id and never touches ids or the answer key', () => {
    const localized = localizeQuestion(single, 'es', table);
    expect(localized).toMatchObject({
      prompt: 'Elige una',
      explanation: 'Porque',
      options: [{ id: 'a', text: 'Manzana' }, { id: 'b', text: 'Banana' }],
      answer: 'b',
    });
  });

  it('only translates prose for other kinds', () => {
    const localized = localizeQuestion(sql, 'es', table);
    expect(localized).toEqual({ ...sql, prompt: 'Cuenta filas', explanation: 'COUNT(*) cuenta filas' });
  });

  it('recognizes translation locales', () => {
    expect(isTranslationLocale('es')).toBe(true);
    expect(isTranslationLocale('en')).toBe(false);
  });

  it('loads the seeded Spanish translations and keeps them out of the question list', () => {
    const translations = loadTranslations();
    expect(translations.es['javascript-event-loop-order-basic']?.prompt).toContain('¿Qué imprime');
    expect(loadQuestions().every((question) => typeof question.id === 'string')).toBe(true);
  });
});
