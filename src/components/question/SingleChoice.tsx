// packages
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// engine
import type { Answer, SingleQuestion } from '../../engine/question';

// components
import { Button } from '../primitives/Button';
import { OptionButton } from './OptionButton';

type Props = {
  question: SingleQuestion;
  disabled: boolean;
  onSubmit: (answer: Answer) => void;
  // Controlled mode (used by the future workbench action bar): passing `value`/`onChange`
  // hands selection state to the parent. Without them the component keeps its own state and
  // its own Submit button, exactly as before.
  value?: string | null;
  onChange?: (value: string) => void;
  lockedOptionIds?: string[];
  correctOptionIds?: string[];
  submitLabelHidden?: boolean;
};

export function SingleChoice({
  question,
  disabled,
  onSubmit,
  value,
  onChange,
  lockedOptionIds,
  correctOptionIds,
  submitLabelHidden = false,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const controlled = value !== undefined;
  const selected = controlled ? value : internalSelected;
  const lockedOptions = new Set(lockedOptionIds ?? []);
  const correctOptions = new Set(correctOptionIds ?? []);

  const select = (id: string): void => {
    if (controlled) {
      onChange?.(id);
    } else {
      setInternalSelected(id);
    }
  };

  return (
    <form
      className="space-y-2"
      onSubmit={(event): void => {
        event.preventDefault();
        if (selected !== null && selected !== undefined) {
          onSubmit({ kind: 'single', optionId: selected });
        }
      }}
    >
      {question.options.map((option) => (
        <OptionButton
          key={option.id}
          id={option.id}
          text={option.text}
          selected={selected === option.id}
          locked={lockedOptions.has(option.id)}
          correct={correctOptions.has(option.id)}
          disabled={disabled}
          onToggle={select}
        />
      ))}
      {!submitLabelHidden && (
        <Button type="submit" disabled={disabled || selected === null || selected === undefined}>
          {t('question.submit')}
        </Button>
      )}
    </form>
  );
}
