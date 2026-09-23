// packages
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// engine
import type { Answer, SingleQuestion } from '../../engine/question';

// components
import { Markdown } from '../common/Markdown';
import { Button } from '../primitives/Button';

type Props = { question: SingleQuestion; disabled: boolean; onSubmit: (answer: Answer) => void };

export function SingleChoice({ question, disabled, onSubmit }: Props): JSX.Element {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <form
      className="space-y-2"
      onSubmit={(event): void => {
        event.preventDefault();
        if (selected !== null) {
          onSubmit({ kind: 'single', optionId: selected });
        }
      }}
    >
      {question.options.map((option) => (
        <label key={option.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
          <input type="radio" name={question.id} value={option.id} disabled={disabled} checked={selected === option.id} onChange={(): void => setSelected(option.id)} aria-label={option.text} className="mt-1" />
          <span className="mr-2 font-mono text-xs text-zinc-500">{option.id})</span>
          <Markdown text={option.text} />
        </label>
      ))}
      <Button type="submit" disabled={disabled || selected === null}>{t('question.submit')}</Button>
    </form>
  );
}
