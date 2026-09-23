// packages
import type { JSX } from 'react';

// components
import { Markdown } from '../common/Markdown';

type Props = {
  id: string;
  text: string;
  selected: boolean;
  locked?: boolean;
  correct?: boolean;
  multi?: boolean;
  disabled?: boolean;
  onToggle: (id: string) => void;
};

/**
 * A full-width, button-style choice option shared by SingleChoice (role="radio") and
 * MultiChoice (role="checkbox"). Keyboard activation (Space/Enter) comes for free from the
 * native <button>. A locked option (previously picked wrong) cannot be toggled; a correct
 * option gets the success style and a decorative check mark once the question is resolved.
 */
export function OptionButton({
  id,
  text,
  selected,
  locked = false,
  correct = false,
  multi = false,
  disabled = false,
  onToggle,
}: Props): JSX.Element {
  const inactive = locked || disabled;

  const handleClick = (): void => {
    if (inactive) {
      return;
    }
    onToggle(id);
  };

  const stateClasses = correct
    ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20'
    : selected
      ? 'border-zinc-900 bg-zinc-100 ring-1 ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:ring-zinc-100'
      : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900';

  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      aria-disabled={inactive}
      aria-label={text}
      onClick={handleClick}
      className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left leading-snug transition ${stateClasses} ${
        locked ? 'line-through opacity-50' : ''
      } ${disabled && !locked ? 'opacity-60 cursor-not-allowed' : ''} ${inactive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-sm font-semibold uppercase ${
          correct ? 'bg-emerald-600 text-white' : selected ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
        }`}
      >
        {id}
      </span>
      <span className="min-w-0 flex-1 [&_.md>p]:my-0">
        <Markdown text={text} />
      </span>
      {correct && (
        <span aria-hidden="true" className="ml-2 shrink-0 text-emerald-600 dark:text-emerald-400">
          ✓
        </span>
      )}
    </button>
  );
}
