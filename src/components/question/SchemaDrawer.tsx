// packages
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

type Props = { schema: string };

export function SchemaDrawer({ schema }: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <details className="rounded-md border border-zinc-200 p-2 text-sm dark:border-zinc-800">
      <summary className="cursor-pointer">{t('question.schema')}</summary>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs">{schema.trim()}</pre>
    </details>
  );
}
