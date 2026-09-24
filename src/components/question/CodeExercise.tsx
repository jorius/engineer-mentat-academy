// packages
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// engine
import type { Answer, CodeQuestion, FixQuestion } from '../../engine/question';
import { formatTestBlock } from '../../engine/format';

// components
import { CodeEditor } from '../common/CodeEditor';
import { Markdown } from '../common/Markdown';
import { Button } from '../primitives/Button';

type Props = {
  question: CodeQuestion | FixQuestion;
  disabled: boolean;
  onSubmit: (answer: Answer) => void;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  submitLabelHidden?: boolean;
  // The workbench action bar owns Reset, so it asks this input to leave its own out.
  hideReset?: boolean;
};

export function CodeExercise({ question, disabled, onSubmit, value, onChange, readOnly = false, submitLabelHidden = false, hideReset = false }: Props): JSX.Element {
  const { t } = useTranslation();
  const [internalSource, setInternalSource] = useState(question.starter);
  const source = value ?? internalSource;
  const setSource = (next: string): void => {
    onChange?.(next);
    if (value === undefined) {
      setInternalSource(next);
    }
  };
  return (
    <div className="space-y-3">
      <CodeEditor value={source} onChange={setSource} language={question.language} ariaLabel={t('question.solution')} readOnly={readOnly} minLines={18} />
      <div aria-label={t('question.hiddenTests')} className="text-sm">
        <Markdown text={formatTestBlock(question.tests, question.language, (name): string => t('question.test', { name }))} />
      </div>
      <div className="flex gap-2">
        {!submitLabelHidden && (
          <Button disabled={disabled} onClick={(): void => onSubmit({ kind: 'code', source })}>{t('question.submit')}</Button>
        )}
        {!readOnly && !hideReset && (
          <Button variant="ghost" disabled={disabled} onClick={(): void => setSource(question.starter)}>{t('common.reset')}</Button>
        )}
      </div>
    </div>
  );
}
