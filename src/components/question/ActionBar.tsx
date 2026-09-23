// packages
import { useTranslation } from 'react-i18next';
import type { JSX, ReactNode } from 'react';

// components
import { Button } from '../primitives/Button';

type Props = {
  pill: ReactNode;
  resolved: boolean;
  busy: boolean;
  onReset?: () => void;
  onShowAnswer: () => void;
  showAnswerDisabled: boolean;
  submitLabel: string;
  onSubmit: () => void;
  submitDisabled: boolean;
  onNext?: () => void;
};

/**
 * The workbench's single row of actions, pinned to the bottom of the card. Order: Reset (only when
 * the caller passes `onReset`), Show answer, Submit (primary until resolved), Next (primary once
 * resolved; hidden without `onNext`).
 */
export function ActionBar({ pill, resolved, busy, onReset, onShowAnswer, showAnswerDisabled, submitLabel, onSubmit, submitDisabled, onNext }: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t('question.actions')}
      className="sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-wrap items-center justify-between gap-2 rounded-b-xl border-t border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95"
    >
      <div className="empty:hidden">{pill}</div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        {onReset !== undefined && (
          <Button variant="ghost" className="disabled:opacity-40" onClick={onReset} disabled={resolved || busy}>
            {t('question.reset')}
          </Button>
        )}
        <Button variant="ghost" className="disabled:opacity-40" onClick={onShowAnswer} disabled={showAnswerDisabled}>
          {t('question.showAnswer')}
        </Button>
        <Button variant={resolved ? 'ghost' : 'primary'} className="disabled:opacity-40" onClick={onSubmit} disabled={submitDisabled}>
          {submitLabel}
        </Button>
        {onNext !== undefined && (
          <Button variant={resolved ? 'primary' : 'ghost'} className="disabled:opacity-40" onClick={onNext} disabled={!resolved}>
            {t('question.next')}
          </Button>
        )}
      </div>
    </div>
  );
}
