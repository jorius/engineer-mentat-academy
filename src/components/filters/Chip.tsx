// packages
import type { JSX, ReactNode } from 'react';

type Props = {
  pressed: boolean;
  onClick: () => void;
  title?: string;
  children: ReactNode;
};

/** A toggle chip: a native button carrying `aria-pressed`, shared by ChipGroup and OnlyChips. */
export function Chip({ pressed, onClick, title, children }: Props): JSX.Element {
  const state = pressed
    ? 'border-accent-500 bg-accent-500/10 text-zinc-900 ring-1 ring-accent-500 dark:text-zinc-50'
    : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800';
  return (
    <button type="button" aria-pressed={pressed} title={title} onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${state}`}>
      {children}
    </button>
  );
}
