// packages
import { transform } from 'sucrase';

// engine
import { deepEqual } from '../deepEqual';
import type { CodeLanguage, TestCase } from '../question';

export type TestOutcome = { name: string; passed: boolean; actual?: unknown; error?: string };

export type RunResult = {
  status: 'ok' | 'error' | 'timeout';
  logs: string[];
  tests: TestOutcome[];
  error?: string;
};

export type RunRequest = { source: string; tests: TestCase[]; language: CodeLanguage; settleMs?: number };

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

type Exports = Record<string, unknown>;

function compile(source: string, language: CodeLanguage): string {
  const transforms = language === 'typescript' ? (['typescript', 'imports'] as const) : (['imports'] as const);
  return transform(source, { transforms: [...transforms] }).code;
}

export async function executeSource(source: string, tests: TestCase[], language: CodeLanguage, settleMs = 0): Promise<RunResult> {
  const logs: string[] = [];
  const fakeConsole = {
    log: (...args: unknown[]): void => {
      logs.push(args.map(formatValue).join(' '));
    },
    warn: (...args: unknown[]): void => {
      logs.push(args.map(formatValue).join(' '));
    },
    error: (...args: unknown[]): void => {
      logs.push(args.map(formatValue).join(' '));
    },
    info: (...args: unknown[]): void => {
      logs.push(args.map(formatValue).join(' '));
    },
  };

  let exportsObject: Exports = {};
  try {
    const code = compile(source, language);
    const module = { exports: exportsObject };
    // The runner intentionally evaluates user code; it runs inside a Web Worker in the browser.
    const factory = new Function('exports', 'module', 'console', 'require', code);
    const require = (name: string): never => {
      throw new Error(`Imports are not available in the scratchpad (tried "${name}")`);
    };
    factory(exportsObject, module, fakeConsole, require);
    exportsObject = module.exports;
  } catch (error) {
    return { status: 'error', logs, tests: [], error: describeError(error) };
  }

  const solution = exportsObject.solution;
  if (typeof solution !== 'function') {
    return { status: 'error', logs, tests: [], error: 'Export a function named "solution"' };
  }

  const outcomes: TestOutcome[] = [];
  for (const test of tests) {
    try {
      const actual: unknown = await solution(...test.args);
      outcomes.push({ name: test.name, passed: deepEqual(actual, test.expected), actual });
    } catch (error) {
      outcomes.push({ name: test.name, passed: false, error: describeError(error) });
    }
  }
  if (settleMs > 0) {
    // Let queued macrotasks (setTimeout 0) run so their console output is captured.
    await new Promise<void>((resolve) => setTimeout(resolve, settleMs));
  }
  return { status: 'ok', logs, tests: outcomes };
}
