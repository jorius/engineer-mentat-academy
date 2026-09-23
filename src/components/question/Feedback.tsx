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

// The grader's feedback lines are English-only for now; only the headline is localized.
export function Feedback({ result }: { result: GradeResult }): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className={`rounded-md border p-3 text-sm ${tone[result.verdict]}`} role="status">
      <p className="font-semibold">
        {t(`feedback.${result.verdict}`)} · {Math.round(result.score * 100)}%
      </p>
      {result.feedback.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {result.feedback.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {result.run !== undefined && result.run.logs.length > 0 && (
        <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-2 font-mono text-xs text-zinc-100">{result.run.logs.join('\n')}</pre>
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
