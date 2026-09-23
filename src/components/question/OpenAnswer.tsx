// packages
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// engine
import type { Answer, OpenQuestion } from '../../engine/question';

// components
import { Markdown } from '../common/Markdown';
import { Button } from '../primitives/Button';

type Props = {
  question: OpenQuestion;
  disabled: boolean;
  onSubmit: (answer: Answer) => void;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  submitLabelHidden?: boolean;
  revealed?: boolean;
  onReveal?: () => void;
  checked?: boolean[];
  onCheckedChange?: (checked: boolean[]) => void;
};

export function OpenAnswer({
  question,
  disabled,
  onSubmit,
  value,
  onChange,
  readOnly = false,
  submitLabelHidden = false,
  revealed: revealedProp,
  onReveal,
  checked: checkedProp,
  onCheckedChange,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const [internalDraft, setInternalDraft] = useState('');
  const [internalRevealed, setInternalRevealed] = useState(false);
  const [internalChecked, setInternalChecked] = useState<boolean[]>(question.rubric.map(() => false));

  const draft = value ?? internalDraft;
  const setDraft = (next: string): void => {
    onChange?.(next);
    if (value === undefined) {
      setInternalDraft(next);
    }
  };

  const revealed = revealedProp ?? internalRevealed;
  const reveal = (): void => {
    onReveal?.();
    if (revealedProp === undefined) {
      setInternalRevealed(true);
    }
  };

  const checked = checkedProp ?? internalChecked;
  const toggleChecked = (index: number): void => {
    const next = checked.map((v, j) => (j === index ? !v : v));
    onCheckedChange?.(next);
    if (checkedProp === undefined) {
      setInternalChecked(next);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        rows={6}
        placeholder={t('question.openPlaceholder')}
        value={draft}
        disabled={revealed || readOnly}
        onChange={(event): void => setDraft(event.target.value)}
      />
      {!revealed ? (
        <Button onClick={reveal}>{t('question.reveal')}</Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-md border border-accent-500/40 bg-accent-50/40 p-3 dark:bg-accent-500/10">
            <Markdown text={question.modelAnswer} />
          </div>
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">{t('question.rubricLegend')}</legend>
            {question.rubric.map((item, i) => (
              <label key={item} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={checked[i] ?? false} disabled={disabled || readOnly} onChange={(): void => toggleChecked(i)} />
                <span>{item}</span>
              </label>
            ))}
          </fieldset>
          {!submitLabelHidden && (
            <Button disabled={disabled} onClick={(): void => onSubmit({ kind: 'open', checked, text: draft })}>{t('question.submitSelfScore')}</Button>
          )}
        </div>
      )}
    </div>
  );
}
