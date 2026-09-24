// packages
import type { HTMLAttributes, JSX } from 'react';

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`} {...rest} />;
}
