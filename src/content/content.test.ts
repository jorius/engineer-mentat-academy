// packages
import { describe, expect, it } from 'vitest';

// engine
import { questionSchema, questionTranslationSchema } from '../engine/question';
import type { Question, QuestionTranslation } from '../engine/question';
import { indexById, loadQuestions, loadTranslations } from '../engine/registry';
import { executeSource } from '../engine/runner/execute';
import { createSqlRunner } from '../engine/sql/runSql';
import { loadSqlInNode } from '../engine/sql/nodeLoader';

// content
import { findSubject, findTopic } from './taxonomy';

const bank = loadQuestions();
const runSql = createSqlRunner(loadSqlInNode);

describe('question bank', () => {
  it('is not empty', () => {
    expect(bank.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = bank.map((q) => q.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it.each(bank.map((q) => [q.id, q] as const))('%s is valid', async (_id, question) => {
    const parsed = questionSchema.safeParse(question);
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
    expect(findTopic(question.domain, question.subject, question.topic), `unknown taxonomy path ${question.domain}/${question.subject}/${question.topic}`).toBeDefined();
    expect(question.id.startsWith(`${question.subject}-`), 'id must start with the subject').toBe(true);
    if (question.level === 'senior') {
      expect(question.explanation, 'senior questions need a Say this out loud line').toContain('**Say this out loud:**');
    }

    if (question.kind === 'single') {
      expect(question.options.map((o) => o.id)).toContain(question.answer);
    }
    if (question.kind === 'multi') {
      const ids = question.options.map((o) => o.id);
      question.answer.forEach((a) => expect(ids).toContain(a));
    }
    if (question.kind === 'code' || question.kind === 'fix') {
      const result = await executeSource(question.solution, question.tests, question.language);
      expect(result.status, result.error).toBe('ok');
      expect(result.tests.filter((t) => !t.passed).map((t) => t.name)).toEqual([]);
      const starterRun = await executeSource(question.starter, question.tests, question.language);
      const starterPasses = starterRun.status === 'ok' && starterRun.tests.every((t) => t.passed);
      expect(starterPasses, 'starter must not already pass').toBe(false);
    }
    if (question.kind === 'sql') {
      const result = await runSql(question.schema, question.answer);
      expect(result.status, result.error).toBe('ok');
      const expected = question.expectedRows.map((r) => JSON.stringify(r));
      const actual = result.rows.map((r) => JSON.stringify(r));
      if (question.ordered === true) {
        expect(actual).toEqual(expected);
      } else {
        expect([...actual].sort()).toEqual([...expected].sort());
      }
    }
    if (question.kind === 'predict') {
      const run = await executeSource(`${question.code}\nexport function solution() {}`, [], question.language, 50);
      expect(run.status, run.error).toBe('ok');
      expect(run.logs.join('\n')).toBe(question.answer);
    }
  });
});

type TranslationModule = { translations?: Record<string, QuestionTranslation> };

const translationFiles = Object.entries(import.meta.glob<TranslationModule>('./*/*.es.ts', { eager: true }));
const byId = indexById(bank);

function translationCases(): (readonly [string, string, unknown])[] {
  return translationFiles.flatMap(([path, module]) =>
    Object.entries(module.translations ?? {}).map(([id, translation]) => [path, id, translation] as const),
  );
}

describe('question translations', () => {
  it('keeps translation files out of the question bank', () => {
    expect(bank.every((question) => typeof question.id === 'string')).toBe(true);
  });

  it.each(translationFiles.map(([path, module]) => [path, module] as const))('%s sits beside a subject and exports translations', (path, module) => {
    const match = /^\.\/([a-z0-9-]+)\/([a-z0-9-]+)\.es\.ts$/.exec(path);
    expect(match, 'file must be named <domain>/<subject>.es.ts').not.toBeNull();
    expect(findSubject(match?.[1] ?? '', match?.[2] ?? ''), `unknown subject for ${path}`).toBeDefined();
    expect(module.translations, 'file must export `translations`').toBeTypeOf('object');
  });

  it('merges every file into the loaded table', () => {
    expect(Object.keys(loadTranslations().es).sort()).toEqual(translationCases().map(([, id]) => id).sort());
  });

  it.each(translationCases())('%s → %s is valid', (path, id, translation) => {
    const question: Question | undefined = byId.get(id);
    expect(question, `no question with id ${id}`).toBeDefined();
    if (question === undefined) {
      return;
    }
    expect(path, 'translation must live in its question subject file').toBe(`./${question.domain}/${question.subject}.es.ts`);

    const parsed = questionTranslationSchema.safeParse(translation);
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
    if (!parsed.success) {
      return;
    }
    const text = parsed.data;

    if (question.level === 'senior') {
      expect(text.explanation, 'senior translations keep the Say this out loud line').toContain('**Dilo en voz alta:**');
    }
    if (text.options !== undefined) {
      expect(question.kind === 'single' || question.kind === 'multi', 'only single and multi questions have options').toBe(true);
      const optionIds = question.kind === 'single' || question.kind === 'multi' ? question.options.map((o) => o.id) : [];
      Object.keys(text.options).forEach((optionId) => expect(optionIds, `unknown option id ${optionId}`).toContain(optionId));
    }
    if (text.modelAnswer !== undefined || text.rubric !== undefined) {
      expect(question.kind, 'only open questions have a model answer and rubric').toBe('open');
    }
    if (text.rubric !== undefined && question.kind === 'open') {
      expect(text.rubric.length, 'rubric must match the original line for line').toBe(question.rubric.length);
    }
  });
});
