// packages
import type { JSX, KeyboardEvent } from 'react';

// components
import { Markdown } from '../common/Markdown';

// utils
import { optionAccessibleName } from '../../utils/questionSummary';

type Props = {
  id: string;
  letter: string;
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
 * MultiChoice (role="checkbox"). It is a focusable <div>, not a <button>, because option text
 * may hold a fenced code block and <pre> is not allowed inside <button>; Space and Enter toggle
 * it like a native button would. A locked option (previously picked wrong) cannot be toggled
 * and leaves the tab order; a correct option gets the success style and a decorative check
 * mark once the question is resolved. The badge shows `letter` (the display position); `id`
 * is what toggling reports.
 */
export function OptionButton({
  id,
  letter,
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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    // A focusable descendant (an overflowing code block scrolls with Space) keeps its own keys.
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key !== ' ' && event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    handleClick();
  };

  const stateClasses = correct
    ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20'
    : selected
      ? 'border-zinc-900 bg-zinc-100 ring-1 ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:ring-zinc-100'
      : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900';

  return (
    <div
      role={multi ? 'checkbox' : 'radio'}
      tabIndex={inactive ? -1 : 0}
      aria-checked={selected}
      aria-disabled={inactive}
      aria-label={optionAccessibleName(text)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left leading-snug transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${stateClasses} ${
        locked ? 'line-through opacity-50' : ''
      } ${disabled && !locked ? 'opacity-60 cursor-not-allowed' : ''} ${inactive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-sm font-semibold uppercase ${
          correct ? 'bg-emerald-600 text-white' : selected ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
        }`}
      >
        {letter}
      </span>
      <span className="option-md min-w-0 flex-1 [&_.md>p]:my-0">
        <Markdown text={text} />
      </span>
      {correct && (
        <span aria-hidden="true" className="ml-2 shrink-0 text-emerald-600 dark:text-emerald-400">
          ✓
        </span>
      )}
    </div>
  );
}
