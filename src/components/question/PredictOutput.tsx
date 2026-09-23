// packages
import { useState } from 'react';
import type { JSX } from 'react';

// engine
import type { Answer, PredictQuestion } from '../../engine/question';

// components
import { CodeEditor } from '../common/CodeEditor';
import { Button } from '../primitives/Button';

type Props = { question: PredictQuestion; disabled: boolean; onSubmit: (answer: Answer) => void };

export function PredictOutput({ question, disabled, onSubmit }: Props): JSX.Element {
  const [text, setText] = useState('');
  return (
    <div className="space-y-3">
      <CodeEditor value={question.code} onChange={(): void => undefined} language={question.language} readOnly ariaLabel="Program" />
      <label className="block text-sm">
        Expected output, one value per line
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
          rows={5}
          value={text}
          disabled={disabled}
          onChange={(event): void => setText(event.target.value)}
        />
      </label>
      <Button disabled={disabled || text.trim().length === 0} onClick={(): void => onSubmit({ kind: 'predict', text })}>Submit</Button>
    </div>
  );
}
