// packages
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiHelpCircle } from 'react-icons/fi';
import type { JSX } from 'react';

// components
import { Markdown } from '../common/Markdown';

/** A revealed hint: a muted note in the question pane that names what to think about, never the answer. */
export function HintPanel({ hint }: { hint: string }): JSX.Element {
  const { t } = useTranslation();
  const panel = useRef<HTMLDivElement>(null);
  // The Hint button unmounts on reveal, so the panel takes the focus it would otherwise drop.
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <div ref={panel} role="note" tabIndex={-1} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <FiHelpCircle aria-hidden="true" />
        {t('question.hintLabel')}
      </p>
      <Markdown text={hint} />
    </div>
  );
}
