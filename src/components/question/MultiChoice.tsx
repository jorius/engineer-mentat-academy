// packages
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// engine
import type { Answer, MultiQuestion } from '../../engine/question';

// components
import { Button } from '../primitives/Button';
import { OptionButton } from './OptionButton';

type Props = {
  question: MultiQuestion;
  disabled: boolean;
  onSubmit: (answer: Answer) => void;
  // Controlled mode (used by the future workbench action bar): passing `value`/`onChange`
  // hands selection state to the parent. Without them the component keeps its own state and
  // its own Submit button, exactly as before.
  value?: string[];
  onChange?: (value: string[]) => void;
  lockedOptionIds?: string[];
  correctOptionIds?: string[];
  submitLabelHidden?: boolean;
};

export function MultiChoice({
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
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const controlled = value !== undefined;
  const selected = controlled ? value : internalSelected;
  const lockedOptions = new Set(lockedOptionIds ?? []);
  const correctOptions = new Set(correctOptionIds ?? []);

  const toggle = (id: string): void => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    if (controlled) {
      onChange?.(next);
    } else {
      setInternalSelected(next);
    }
  };

  return (
    <form
      className="space-y-2"
      onSubmit={(event): void => {
        event.preventDefault();
        onSubmit({ kind: 'multi', optionIds: selected });
      }}
    >
      {question.options.map((option) => (
        <OptionButton
          key={option.id}
          id={option.id}
          text={option.text}
          selected={selected.includes(option.id)}
          locked={lockedOptions.has(option.id)}
          correct={correctOptions.has(option.id)}
          multi
          disabled={disabled}
          onToggle={toggle}
        />
      ))}
      {!submitLabelHidden && (
        <Button type="submit" disabled={disabled || selected.length === 0}>
          {t('question.submit')}
        </Button>
      )}
    </form>
  );
}
