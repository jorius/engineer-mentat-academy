// packages
import { useState } from 'react';
import type { JSX } from 'react';

// engine
import type { Answer, SqlQuestion } from '../../engine/question';

// components
import { CodeEditor } from '../common/CodeEditor';
import { Button } from '../primitives/Button';

type Props = { question: SqlQuestion; disabled: boolean; onSubmit: (answer: Answer) => void };

export function SqlExercise({ question, disabled, onSubmit }: Props): JSX.Element {
  const [query, setQuery] = useState('');
  return (
    <div className="space-y-3">
      <details className="rounded-md border border-zinc-200 p-2 text-sm dark:border-zinc-800">
        <summary className="cursor-pointer">Schema and seed data</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs">{question.schema.trim()}</pre>
      </details>
      <CodeEditor value={query} onChange={setQuery} language="sql" ariaLabel="Query" />
      <Button disabled={disabled || query.trim().length === 0} onClick={(): void => onSubmit({ kind: 'sql', query })}>Submit</Button>
    </div>
  );
}
