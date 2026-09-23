// packages
import type { JSX } from 'react';

type Tone = 'junior' | 'mid' | 'senior' | 'neutral';

const tones: Record<Tone, string> = {
  junior: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  mid: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  senior: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  neutral: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: string }): JSX.Element {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
