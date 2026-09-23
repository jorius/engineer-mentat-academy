// packages
import { describe, expect, it } from 'vitest';

// engine
import { questionSchema } from '../engine/question';
import { loadQuestions } from '../engine/registry';
import { executeSource } from '../engine/runner/execute';
import { createSqlRunner } from '../engine/sql/runSql';
import { loadSqlInNode } from '../engine/sql/nodeLoader';

// content
import { findTopic } from './taxonomy';

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
