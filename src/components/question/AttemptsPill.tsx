// packages
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { JSX } from 'react';

// engine
import type { AttemptState } from '../../engine/attempts';
import type { MaxAttempts } from '../../engine/preferences';
import type { Kind } from '../../engine/question';

type Props = { kind: Kind; state: AttemptState; maxAttempts: MaxAttempts };

function pillLabel({ kind, state, maxAttempts }: Props, t: TFunction): string | null {
  const attempt = state.attemptsUsed + 1;
  if (kind === 'open') {
    return state.outcome === 'self' ? t('question.selfScored') : null;
  }
  switch (state.outcome) {
    case 'solved':
      return maxAttempts === 'unlimited' ? t('question.solvedAttemptUnlimited', { attempt }) : t('question.solvedAttempt', { attempt, max: maxAttempts });
    case 'shown':
      return t('question.answerShown');
    case 'exhausted':
      return t('question.outOfAttempts');
    default:
      break;
  }
  if (maxAttempts === 'unlimited') {
    return t('question.unlimitedAttempts');
  }
  return state.attemptsUsed === 0 ? t('question.attemptsLeft', { count: maxAttempts }) : t('question.attemptOf', { attempt, max: maxAttempts });
}

/** The action bar's left-hand status: attempts left, the current attempt, or how the question was resolved. */
export function AttemptsPill(props: Props): JSX.Element | null {
  const { t } = useTranslation();
  const label = pillLabel(props, t);
  if (label === null) {
    return null;
  }
  return (
    <span className="rounded-full border border-accent-500/40 bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600 dark:bg-accent-500/10 dark:text-accent-400">
      {label}
    </span>
  );
}
