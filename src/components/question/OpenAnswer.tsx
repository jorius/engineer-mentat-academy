// packages
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// engine
import type { Answer, OpenQuestion } from '../../engine/question';

// components
import { Markdown } from '../common/Markdown';
import { Button } from '../primitives/Button';

type Props = { question: OpenQuestion; disabled: boolean; onSubmit: (answer: Answer) => void };

export function OpenAnswer({ question, disabled, onSubmit }: Props): JSX.Element {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(question.rubric.map(() => false));

  return (
    <div className="space-y-3">
      <textarea
        className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        rows={6}
        placeholder={t('question.openPlaceholder')}
        value={draft}
        disabled={revealed}
        onChange={(event): void => setDraft(event.target.value)}
      />
      {!revealed ? (
        <Button onClick={(): void => setRevealed(true)}>{t('question.reveal')}</Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-md border border-accent-500/40 bg-accent-50/40 p-3 dark:bg-accent-500/10">
            <Markdown text={question.modelAnswer} />
          </div>
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">{t('question.rubricLegend')}</legend>
            {question.rubric.map((item, i) => (
              <label key={item} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={checked[i] ?? false} disabled={disabled} onChange={(): void => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))} />
                <span>{item}</span>
              </label>
            ))}
          </fieldset>
          <Button disabled={disabled} onClick={(): void => onSubmit({ kind: 'open', checked, text: draft })}>{t('question.submitSelfScore')}</Button>
        </div>
      )}
    </div>
  );
}
