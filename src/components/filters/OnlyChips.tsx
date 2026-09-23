// packages
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

// components
import { Chip } from './Chip';

// utils
import { ONLY_VALUES } from '../../utils/drillFilter';
import type { Only } from '../../utils/drillFilter';

type Props = {
  value: Only | null;
  onChange(next: Only | null): void;
};

/** Single-select progress filter: unseen, marked for review or missed; pressing the active chip clears it. */
export function OnlyChips({ value, onChange }: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{t('filters.only')}</legend>
      {ONLY_VALUES.map((only) => (
        <Chip key={only} pressed={value === only} onClick={(): void => onChange(value === only ? null : only)}>
          {t(`filters.${only}`)}
        </Chip>
      ))}
    </fieldset>
  );
}
