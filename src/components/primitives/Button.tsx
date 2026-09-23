// packages
import type { ButtonHTMLAttributes, JSX } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' };

const styles: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-accent-500 text-white hover:bg-accent-600 disabled:bg-zinc-400',
  ghost: 'border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export function Button({ variant = 'primary', className = '', ...rest }: Props): JSX.Element {
  return (
    <button
      type="button"
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}
