// packages
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// engine
import type { Answer, CodeQuestion, FixQuestion } from '../../engine/question';

// components
import { CodeEditor } from '../common/CodeEditor';
import { Button } from '../primitives/Button';

type Props = { question: CodeQuestion | FixQuestion; disabled: boolean; onSubmit: (answer: Answer) => void };

export function CodeExercise({ question, disabled, onSubmit }: Props): JSX.Element {
  const { t } = useTranslation();
  const [source, setSource] = useState(question.starter);
  return (
    <div className="space-y-3">
      <CodeEditor value={source} onChange={setSource} language={question.language} ariaLabel={t('question.solution')} />
      <ul className="text-sm text-zinc-600 dark:text-zinc-400">
        {question.tests.map((test) => (
          <li key={test.name}>{t('question.test', { name: test.name })}</li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button disabled={disabled} onClick={(): void => onSubmit({ kind: 'code', source })}>{t('question.submit')}</Button>
        <Button variant="ghost" disabled={disabled} onClick={(): void => setSource(question.starter)}>{t('common.reset')}</Button>
      </div>
    </div>
  );
}
