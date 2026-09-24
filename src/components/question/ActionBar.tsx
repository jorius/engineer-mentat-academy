// packages
import { useTranslation } from 'react-i18next';
import type { JSX, ReactNode, Ref } from 'react';

// components
import { Button } from '../primitives/Button';

type Props = {
  pill: ReactNode;
  resolved: boolean;
  busy: boolean;
  // Run appears only with `onRun` (code and fix); it never spends an attempt.
  onRun?: () => void;
  runDisabled?: boolean;
  running?: boolean;
  onSkip?: () => void;
  onReset?: () => void;
  onShowAnswer?: () => void;
  showAnswerDisabled: boolean;
  submitLabel: string;
  onSubmit: () => void;
  submitDisabled: boolean;
  onNext?: () => void;
  // Lets the workbench move focus to Next once the question resolves.
  nextRef?: Ref<HTMLButtonElement>;
};

/**
 * The workbench's single row of actions, pinned to the bottom of the card. Order: Run (only with
 * `onRun`, also once resolved), Skip (only with
 * `onSkip`, until resolved), Reset (only when the caller passes `onReset`), Show answer (only with
 * `onShowAnswer`), Submit (primary until resolved), Next (primary once resolved; hidden without `onNext`).
 */
export function ActionBar({ pill, resolved, busy, onRun, runDisabled = false, running = false, onSkip, onReset, onShowAnswer, showAnswerDisabled, submitLabel, onSubmit, submitDisabled, onNext, nextRef }: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t('question.actions')}
      className="sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-wrap items-center justify-between gap-2 rounded-b-xl border-t border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95"
    >
      <div className="empty:hidden">{pill}</div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        {onRun !== undefined && (
          <Button variant="ghost" className="disabled:opacity-40" onClick={onRun} disabled={runDisabled || running} title={t('question.runHint')}>
            {running ? t('question.running') : t('question.run')}
          </Button>
        )}
        {onSkip !== undefined && !resolved && (
          <Button variant="ghost" className="disabled:opacity-40" onClick={onSkip} disabled={busy} title={t('question.skipHint')}>
            {t('question.skip')}
          </Button>
        )}
        {onReset !== undefined && (
          <Button variant="ghost" className="disabled:opacity-40" onClick={onReset} disabled={resolved || busy}>
            {t('question.reset')}
          </Button>
        )}
        {onShowAnswer !== undefined && (
          <Button variant="ghost" className="disabled:opacity-40" onClick={onShowAnswer} disabled={showAnswerDisabled}>
            {t('question.showAnswer')}
          </Button>
        )}
        <Button variant={resolved ? 'ghost' : 'primary'} className="disabled:opacity-40" onClick={onSubmit} disabled={submitDisabled}>
          {submitLabel}
        </Button>
        {onNext !== undefined && (
          <Button ref={nextRef} variant={resolved ? 'primary' : 'ghost'} className="disabled:opacity-40" onClick={onNext} disabled={!resolved}>
            {t('question.next')} <span aria-hidden="true">→</span>
          </Button>
        )}
      </div>
    </div>
  );
}
