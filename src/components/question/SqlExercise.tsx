// packages
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// engine
import type { Answer, SqlQuestion } from '../../engine/question';

// components
import { CodeEditor } from '../common/CodeEditor';
import { Button } from '../primitives/Button';
import { SchemaDrawer } from './SchemaDrawer';

type Props = {
  question: SqlQuestion;
  disabled: boolean;
  onSubmit: (answer: Answer) => void;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  submitLabelHidden?: boolean;
  hideSchema?: boolean;
};

export function SqlExercise({ question, disabled, onSubmit, value, onChange, readOnly = false, submitLabelHidden = false, hideSchema = false }: Props): JSX.Element {
  const { t } = useTranslation();
  const [internalQuery, setInternalQuery] = useState('');
  const query = value ?? internalQuery;
  const setQuery = (next: string): void => {
    onChange?.(next);
    if (value === undefined) {
      setInternalQuery(next);
    }
  };
  return (
    <div className="space-y-3">
      {!hideSchema && <SchemaDrawer schema={question.schema} />}
      <CodeEditor value={query} onChange={setQuery} language="sql" ariaLabel={t('question.query')} readOnly={readOnly} minLines={12} />
      {!submitLabelHidden && (
        <Button disabled={disabled || query.trim().length === 0} onClick={(): void => onSubmit({ kind: 'sql', query })}>{t('question.submit')}</Button>
      )}
    </div>
  );
}
