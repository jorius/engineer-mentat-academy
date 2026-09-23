// packages
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

type Props = { id: string; open: boolean; notes: string; onSave: (notes: string) => void };

/** Private per-question notes, collapsed until the header's My notes button opens it; saved on blur. */
export function NotesDrawer({ id, open, notes, onSave }: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <div id={id} hidden={!open} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {t('question.notes')}
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm font-normal normal-case tracking-normal text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          rows={3}
          defaultValue={notes}
          onBlur={(event): void => onSave(event.target.value)}
        />
      </label>
      <p className="mt-1 text-xs text-zinc-400">{t('question.notesHint')}</p>
    </div>
  );
}
