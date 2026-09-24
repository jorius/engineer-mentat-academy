// packages
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// engine
import { formatJsValue } from '../../engine/format';
import type { TestCase } from '../../engine/question';
import type { RunResult, TestOutcome } from '../../engine/runner/execute';

// components
import { Button } from '../primitives/Button';

type Props = { run: RunResult | null; tests: readonly TestCase[]; open: boolean; onToggle: () => void; onClear: () => void };

function outcomeDetail(outcome: TestOutcome, tests: readonly TestCase[]): string {
  if (outcome.error !== undefined) {
    return outcome.error;
  }
  const expected = tests.find((test) => test.name === outcome.name)?.expected;
  return `expected ${formatJsValue(expected)}, got ${formatJsValue(outcome.actual)}`;
}

function lineCount(run: RunResult | null): number {
  if (run === null) {
    return 0;
  }
  return run.logs.length + run.tests.length + (run.status !== 'ok' ? 1 : 0);
}

/**
 * The debug console of a code exercise: what the latest Run or Submit printed, one line per hidden
 * test, then the runtime error or timeout. The caller owns `run` and whether the panel is open.
 */
export function ConsolePanel({ run, tests, open, onToggle, onClear }: Props): JSX.Element {
  const { t } = useTranslation();
  const bodyId = useId();
  const count = lineCount(run);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
          className="inline-flex items-center gap-1 rounded-md text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:hover:text-zinc-300"
        >
          <span aria-hidden="true">{open ? '▾' : '▸'}</span>
          {t('console.title')}
        </button>
        {count > 0 && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{t('console.lines', { count })}</span>
        )}
        {run !== null && (
          <Button variant="ghost" className="ml-auto px-2 py-0.5 text-xs" onClick={onClear}>
            {t('console.clear')}
          </Button>
        )}
      </div>
      <pre
        id={bodyId}
        hidden={!open}
        className="max-h-64 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-[family-name:var(--editor-font,ui-monospace,monospace)] text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      >
        {count === 0 ? (
          <span className="text-zinc-500">{t('console.empty')}</span>
        ) : (
          <>
            {run?.logs.map((line, index) => (
              <div key={`log-${index}`} data-console-line>
                {line}
              </div>
            ))}
            {run?.tests.map((outcome) => (
              <div key={`test-${outcome.name}`} data-console-line className={outcome.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                <span aria-hidden="true">{outcome.passed ? '✓' : '✗'}</span> <span className="sr-only">{outcome.passed ? t('console.passed') : t('console.failed')}: </span>
                {outcome.passed ? outcome.name : `${outcome.name} — ${outcomeDetail(outcome, tests)}`}
              </div>
            ))}
            {run !== null && run.status !== 'ok' && (
              <div data-console-line className="text-red-600 dark:text-red-400">
                {run.error ?? run.status}
              </div>
            )}
          </>
        )}
      </pre>
    </div>
  );
}
