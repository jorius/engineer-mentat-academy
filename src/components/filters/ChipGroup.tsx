// packages
import { useTranslation } from 'react-i18next';
import type { JSX, ReactNode } from 'react';

// components
import { Chip } from './Chip';

export type ChipOption<T extends string = string> = { value: T; label: string; hint?: string; count?: number; glyph?: ReactNode };

type Props<T extends string> = {
  label: string;
  options: ChipOption<T>[];
  selected: T[];
  onChange(next: T[]): void;
};

/**
 * A labelled group of multi-select chips. An empty selection renders every chip unpressed and means
 * "all" to the pages; the "All" button selects every option explicitly.
 */
export function ChipGroup<T extends string>({ label, options, selected, onChange }: Props<T>): JSX.Element {
  const { t } = useTranslation();
  const toggle = (value: T): void =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</legend>
      {options.map((option) => (
        <Chip key={option.value} pressed={selected.includes(option.value)} title={option.hint} onClick={(): void => toggle(option.value)}>
          {option.glyph}
          {option.label}
          {option.count !== undefined ? <span className="text-zinc-400">{option.count}</span> : null}
        </Chip>
      ))}
      <button type="button" onClick={(): void => onChange(options.map((option) => option.value))} className="text-xs text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-100">
        {t('filters.all')}
      </button>
    </fieldset>
  );
}
