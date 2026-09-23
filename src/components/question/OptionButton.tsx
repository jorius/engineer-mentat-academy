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
      ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10'
      : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900';

  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      aria-disabled={inactive}
      aria-label={text}
      onClick={handleClick}
      className={`flex w-full items-start gap-2 rounded-md border p-2 text-left transition ${stateClasses} ${
        locked ? 'line-through opacity-50' : ''
      } ${disabled && !locked ? 'opacity-60 cursor-not-allowed' : ''} ${inactive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className="mr-2 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded border border-zinc-300 px-1 font-mono text-xs text-zinc-500 dark:border-zinc-700">
        {id})
      </span>
      <span className="flex-1">
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
