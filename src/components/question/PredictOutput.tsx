// packages
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// engine
import type { Answer, PredictQuestion } from '../../engine/question';

// components
import { CodeEditor } from '../common/CodeEditor';
import { Button } from '../primitives/Button';

type Props = {
  question: PredictQuestion;
  disabled: boolean;
  onSubmit: (answer: Answer) => void;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  submitLabelHidden?: boolean;
  // The workbench shows the program in the question pane, so it asks this input to leave it out.
  hideCode?: boolean;
};

export function PredictOutput({ question, disabled, onSubmit, value, onChange, readOnly = false, submitLabelHidden = false, hideCode = false }: Props): JSX.Element {
  const { t } = useTranslation();
  const [internalText, setInternalText] = useState('');
  const text = value ?? internalText;
  const setText = (next: string): void => {
    onChange?.(next);
    if (value === undefined) {
      setInternalText(next);
    }
  };
  return (
    <div className="space-y-3">
      {!hideCode && (
        <CodeEditor value={question.code} onChange={(): void => undefined} language={question.language} readOnly ariaLabel={t('question.program')} />
      )}
      <label className="block text-sm">
        {t('question.expectedOutput')}
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
          rows={5}
          value={text}
          disabled={disabled && !readOnly}
          readOnly={readOnly}
          onChange={(event): void => setText(event.target.value)}
        />
      </label>
      {!submitLabelHidden && (
        <Button disabled={disabled || text.trim().length === 0} onClick={(): void => onSubmit({ kind: 'predict', text })}>{t('question.submit')}</Button>
      )}
    </div>
  );
}
