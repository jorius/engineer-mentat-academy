// packages
import { useState } from 'react';
import type { JSX } from 'react';

// engine
import type { Answer, MultiQuestion } from '../../engine/question';

// components
import { Markdown } from '../common/Markdown';
import { Button } from '../primitives/Button';

type Props = { question: MultiQuestion; disabled: boolean; onSubmit: (answer: Answer) => void };

export function MultiChoice({ question, disabled, onSubmit }: Props): JSX.Element {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string): void => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <form
      className="space-y-2"
      onSubmit={(event): void => {
        event.preventDefault();
        onSubmit({ kind: 'multi', optionIds: selected });
      }}
    >
      {question.options.map((option) => (
        <label key={option.id} className="flex cursor-pointer items-start gap-2 rounded-md border border-zinc-200 p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
          <input type="checkbox" value={option.id} disabled={disabled} checked={selected.includes(option.id)} onChange={(): void => toggle(option.id)} aria-label={option.text} className="mt-1" />
          <Markdown text={option.text} />
        </label>
      ))}
      <Button type="submit" disabled={disabled || selected.length === 0}>Submit</Button>
    </form>
  );
}
