// packages
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// engine
import type { GradeResult } from '../../engine/grader';

const tone: Record<GradeResult['verdict'], string> = {
  pass: 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20',
  fail: 'border-red-500/50 bg-red-50 dark:bg-red-900/20',
  self: 'border-sky-500/50 bg-sky-50 dark:bg-sky-900/20',
};

const retryTone = 'border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/40';

// The grader's feedback lines are English-only for now; only the headline is localized. `retry` is the
// neutral "try again" panel shown while attempts remain; the caller strips lines that reveal the key.
export function Feedback({ result, retry = false }: { result: GradeResult; retry?: boolean }): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className={`rounded-md border p-3 text-sm ${retry ? retryTone : tone[result.verdict]}`} role="status">
      <p className="font-semibold">
        {retry ? t('question.tryAgain') : `${t(`feedback.${result.verdict}`)} · ${Math.round(result.score * 100)}%`}
      </p>
      {result.feedback.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {result.feedback.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {result.sql !== undefined && result.sql.status === 'ok' && result.sql.rows.length > 0 && (
        <table className="mt-2 text-xs">
          <thead>
            <tr>{result.sql.columns.map((c) => <th key={c} className="border px-2 py-1 text-left">{c}</th>)}</tr>
          </thead>
          <tbody>
            {result.sql.rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j} className="border px-2 py-1">{String(cell)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
