// packages
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange(next: number): void;
  hint?: string;
};

const STEP_BUTTON = 'h-8 w-8 rounded-md border border-zinc-300 text-base leading-none hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800';

/**
 * A labelled number control with -/+ buttons. Every value it reports is clamped to `min`..`max`; while
 * the input has focus it keeps the text as typed (so clearing it to type a new number works) and it
 * shows the committed value again on blur.
 */
export function Stepper({ label, value, min, max, step = 1, onChange, hint }: Props): JSX.Element {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (next: number): number => Math.min(max, Math.max(min, next));
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="w-20 font-medium">{label}</span>
      <button type="button" className={STEP_BUTTON} aria-label={t('common.decrease', { label })} disabled={value <= min} onClick={(): void => onChange(clamp(value - step))}>
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(e): void => {
          setDraft(e.target.value);
          const next = Number(e.target.value);
          if (e.target.value.trim() !== '' && Number.isFinite(next)) {
            onChange(clamp(next));
          }
        }}
        onBlur={(): void => setDraft(null)}
        className="w-16 rounded-md border border-zinc-300 bg-white px-2 py-1 text-center dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button type="button" className={STEP_BUTTON} aria-label={t('common.increase', { label })} disabled={value >= max} onClick={(): void => onChange(clamp(value + step))}>
        +
      </button>
      {hint === undefined ? null : <span className="text-xs text-zinc-500">{hint}</span>}
    </div>
  );
}
