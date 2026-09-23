// packages
import type { JSX } from 'react';

export function ProgressBar({ value, label }: { value: number; label?: string }): JSX.Element {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="w-full" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Mastery'}>
      <div className="h-2 w-full rounded bg-zinc-200 dark:bg-zinc-800">
        <div className="h-2 rounded bg-spice-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
