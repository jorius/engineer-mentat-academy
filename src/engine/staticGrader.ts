// engine
import type { Grader, GradeResult } from './grader';
import type { Answer, CodeQuestion, FixQuestion, MultiQuestion, OpenQuestion, PredictQuestion, Question, SingleQuestion, SqlQuestion } from './question';
import type { RunRequest, RunResult } from './runner/execute';
import type { SqlRunner } from './sql/runSql';

export type StaticGraderDeps = {
  runJs: (request: RunRequest) => Promise<RunResult>;
  runSql: SqlRunner;
};

export function normalizeOutput(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter((line) => line.length > 0)
    .join('\n');
}

function looseLine(line: string): string {
  return line.replace(/\s+/g, '').replace(/'/g, '"');
}

function linesMatch(expected: string | undefined, actual: string | undefined): boolean {
  if (expected === undefined || actual === undefined) {
    return expected === actual;
  }
  return expected === actual || looseLine(expected) === looseLine(actual);
}

function optionText(question: SingleQuestion | MultiQuestion, id: string): string {
  return question.options.find((o) => o.id === id)?.text ?? id;
}

function formatValue(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

function wrongKind(question: Question, answer: Answer): Error {
  return new Error(`Answer kind "${answer.kind}" does not match question kind "${question.kind}"`);
}

function gradeSingle(question: SingleQuestion, answer: Answer): GradeResult {
  if (answer.kind !== 'single') {
    throw wrongKind(question, answer);
  }
  const pass = answer.optionId === question.answer;
  return { score: pass ? 1 : 0, verdict: pass ? 'pass' : 'fail', feedback: pass ? [] : [`Correct answer: ${optionText(question, question.answer)}`] };
}

function gradeMulti(question: MultiQuestion, answer: Answer): GradeResult {
  if (answer.kind !== 'multi') {
    throw wrongKind(question, answer);
  }
  const expected = new Set(question.answer);
  const chosen = new Set(answer.optionIds);
  const missing = question.answer.filter((id) => !chosen.has(id));
  const extra = answer.optionIds.filter((id) => !expected.has(id));
  const pass = missing.length === 0 && extra.length === 0;
  const feedback: string[] = [];
  if (missing.length > 0) {
    feedback.push(`Missing: ${missing.map((id) => optionText(question, id)).join(', ')}`);
  }
  if (extra.length > 0) {
    feedback.push(`Should not be selected: ${extra.map((id) => optionText(question, id)).join(', ')}`);
  }
  return { score: pass ? 1 : 0, verdict: pass ? 'pass' : 'fail', feedback };
}

function gradePredict(question: PredictQuestion, answer: Answer): GradeResult {
  if (answer.kind !== 'predict') {
    throw wrongKind(question, answer);
  }
  const expectedLines = normalizeOutput(question.answer).split('\n');
  const actualLines = normalizeOutput(answer.text).split('\n');
  const feedback: string[] = [];
  const max = Math.max(expectedLines.length, actualLines.length);
  for (let i = 0; i < max; i += 1) {
    if (!linesMatch(expectedLines[i], actualLines[i])) {
      feedback.push(`Line ${i + 1}: expected "${expectedLines[i] ?? ''}", got "${actualLines[i] ?? ''}"`);
    }
  }
  const pass = feedback.length === 0;
  return { score: pass ? 1 : 0, verdict: pass ? 'pass' : 'fail', feedback };
}

async function gradeCode(question: CodeQuestion | FixQuestion, answer: Answer, runJs: StaticGraderDeps['runJs']): Promise<GradeResult> {
  if (answer.kind !== 'code') {
    throw wrongKind(question, answer);
  }
  const run = await runJs({ source: answer.source, tests: question.tests, language: question.language });
  if (run.status !== 'ok') {
    return { score: 0, verdict: 'fail', feedback: [run.error ?? run.status], run };
  }
  const passed = run.tests.filter((t) => t.passed).length;
  const feedback = run.tests
    .filter((t) => !t.passed)
    .map((t) => {
      const expected = question.tests.find((c) => c.name === t.name)?.expected;
      return t.error !== undefined ? `${t.name}: ${t.error}` : `${t.name}: expected ${formatValue(expected)}, got ${formatValue(t.actual)}`;
    });
  const score = run.tests.length === 0 ? 0 : passed / run.tests.length;
  return { score, verdict: score === 1 ? 'pass' : 'fail', feedback, run };
}

function rowKey(row: unknown[]): string {
  return JSON.stringify(row);
}

async function gradeSql(question: SqlQuestion, answer: Answer, runSql: SqlRunner): Promise<GradeResult> {
  if (answer.kind !== 'sql') {
    throw wrongKind(question, answer);
  }
  const sql = await runSql(question.schema, answer.query);
  if (sql.status !== 'ok') {
    return { score: 0, verdict: 'fail', feedback: [sql.error ?? 'SQL error'], sql };
  }
  const expected = question.expectedRows.map(rowKey);
  const actual = sql.rows.map(rowKey);
  const sortedExpected = [...expected].sort();
  const sortedActual = [...actual].sort();
  const pass = expected.length === actual.length && (question.ordered === true
    ? expected.every((row, i) => row === actual[i])
    : sortedExpected.every((row, i) => row === sortedActual[i]));
  const feedback = pass ? [] : [`Expected ${expected.length} row(s), got ${actual.length}${question.ordered === true ? ' (order matters)' : ''}`];
  return { score: pass ? 1 : 0, verdict: pass ? 'pass' : 'fail', feedback, sql };
}

function gradeOpen(question: OpenQuestion, answer: Answer): GradeResult {
  if (answer.kind !== 'open') {
    throw wrongKind(question, answer);
  }
  const total = question.rubric.length;
  const checked = answer.checked.slice(0, total).filter(Boolean).length;
  return { score: total === 0 ? 0 : checked / total, verdict: 'self', feedback: [`Self-scored ${checked} of ${total} rubric points`] };
}

export function createStaticGrader(deps: StaticGraderDeps): Grader {
  return {
    grade: async (question: Question, answer: Answer): Promise<GradeResult> => {
      switch (question.kind) {
        case 'single':
          return gradeSingle(question, answer);
        case 'multi':
          return gradeMulti(question, answer);
        case 'predict':
          return gradePredict(question, answer);
        case 'code':
        case 'fix':
          return gradeCode(question, answer, deps.runJs);
        case 'sql':
          return gradeSql(question, answer, deps.runSql);
        case 'open':
          return gradeOpen(question, answer);
      }
    },
  };
}
